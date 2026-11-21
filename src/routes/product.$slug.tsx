import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Store,
  Check,
  ShoppingBag,
  Star,
  Phone,
  MessageCircle,
  Share2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Home,
  MapPin,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { ProductReviewsSection } from "@/components/ProductReviewsSection";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage, getProductImages, getOpenGraphProductImage } from "@/lib/product-images";
import { productQuery, productsQuery, settingsQuery, type Variant } from "@/lib/queries";
import { productReviewsQuery, computeReviewStats } from "@/lib/reviews";
import { discountPercent, inr } from "@/lib/format";
import { SITE_URL } from "@/lib/site-config";
import { getProductSchema, getBreadcrumbSchema, LOCAL_GEO_META, PUBLIC_ROBOTS_META } from "@/lib/seo";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    void context.queryClient.ensureQueryData(productsQuery());
    void context.queryClient.ensureQueryData(settingsQuery);
    return { product };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name} — Arun Gopal Traders` : `${params.slug.replace(/-/g, " ")} — Arun Gopal Traders`;
    const desc = p?.description || "Product details, pack sizes, live price and stock at Arun Gopal Traders, Maharajganj.";
    
    // Resolve absolute image URL for WhatsApp / Facebook / Twitter rich preview crawlers
    // NOTE: WhatsApp and Facebook crawlers REJECT .svg images. They strictly require .jpg / .png.
    const resolvedImg = p ? getOpenGraphProductImage(p) : "/agt-og-image.jpg";
    const absoluteImg = resolvedImg.startsWith("http")
      ? resolvedImg
      : `${SITE_URL}${resolvedImg.startsWith("/") ? "" : "/"}${resolvedImg}`;
    const pageUrl = `${SITE_URL}/product/${params.slug}`;

    const defaultVariant = p?.product_variants?.[0];
    const priceAmount = defaultVariant?.price ? String(Math.round(Number(defaultVariant.price))) : undefined;

    return {
      links: [
        { rel: "canonical", href: pageUrl },
      ],
      meta: [
        ...PUBLIC_ROBOTS_META,
        ...LOCAL_GEO_META,
        { title },
        { name: "description", content: desc },
        { property: "og:site_name", content: "अरुण गोपाल ट्रेडर्स महराजगंज" },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: pageUrl },
        { property: "og:image", content: absoluteImg },
        { property: "og:image:secure_url", content: absoluteImg },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "800" },
        ...(priceAmount
          ? [
              { property: "product:price:amount", content: priceAmount },
              { property: "product:price:currency", content: "INR" },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:url", content: pageUrl },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: absoluteImg },
      ],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  getProductSchema({
                    product: p,
                    pageUrl,
                    imageUrl: absoluteImg,
                    variants: p.product_variants || [],
                    categoryName: p.category_id || undefined,
                  }),
                  getBreadcrumbSchema([
                    { name: "Home", url: "/" },
                    { name: "Shop", url: "/shop" },
                    { name: p.name, url: `/product/${params.slug}` },
                  ]),
                ],
              }),
            },
          ]
        : [],
    };
  },
  errorComponent: ({ reset }) => (
    <div className="container-page py-20 text-center">
      <h1 className="font-sans text-2xl font-bold text-[#16201A]">Unable to load product</h1>
      <p className="mt-1 text-xs text-[#3D4C44]">Please try again or return to the shop.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => reset()} className="rounded-full bg-[#145A45] text-white">
          Try Again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/shop">Back to Shop</Link>
        </Button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-sans text-2xl font-bold text-[#16201A]">Product not found</h1>
      <p className="mt-1 text-xs text-[#3D4C44]">
        The requested item is no longer available in the catalogue.
      </p>
      <Button asChild className="mt-6 rounded-full bg-[#145A45] text-white">
        <Link to="/shop">Back to Shop Catalogue</Link>
      </Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: all } = useQuery(productsQuery());
  const { data: settings } = useQuery(settingsQuery);
  const { data: reviews = [] } = useQuery(productReviewsQuery(product?.id));
  const reviewStats = computeReviewStats(reviews);
  const isDeliveryEnabled = Boolean(settings?.delivery_enabled);
  const { add, setQty: setCartQty, remove: removeFromCart, items } = useCart();
  const { lang, t, getProductName, getProductDescription, getVariantLabel } = useLanguage();
  const [variantId, setVariantId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="container-page grid gap-8 py-6 sm:py-10 md:grid-cols-2 items-start">
        <div className="w-full aspect-square max-w-[500px] mx-auto rounded-3xl bg-white p-6 flex items-center justify-center border border-[#EAE6DC]">
          <Skeleton className="size-56 rounded-2xl bg-[#FAF8F2]" />
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-[#FAF8F2]" />
            <Skeleton className="h-8 w-4/5 bg-[#FAF8F2]" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl bg-[#FAF8F2]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-[#FAF8F2]" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl bg-[#FAF8F2]" />
              <Skeleton className="h-10 w-28 rounded-xl bg-[#FAF8F2]" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-2xl bg-[#E6EFE8]/50" />
        </div>
      </div>
    );
  }

  if (!product) throw notFound();

  const localizedName = getProductName(product);
  const localizedDescription = getProductDescription(product);

  const variants: Variant[] = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const off = variant ? discountPercent(Number(variant.mrp), Number(variant.price)) : 0;
  const saveAmount =
    variant && variant.mrp > variant.price
      ? Math.round(Number(variant.mrp) - Number(variant.price))
      : 0;

  const inCartQty = items.find((i) => i.variantId === variant?.id)?.qty ?? 0;

  const handleAddToCart = () => {
    if (!variant || variant.stock <= 0) return;
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: localizedName,
        name_en: product.name_en || product.name,
        name_hi: product.name_hi || null,
        variantLabel: getVariantLabel(variant) || "1 pack",
        variantLabel_en: variant.label_en || variant.label,
        variantLabel_hi: variant.label_hi || null,
        price: Number(variant.price),
        mrp: Number(variant.mrp),
        imageUrl: getProductImage(product),
        stock: variant.stock,
      },
      1,
    );
  };

  const handleIncreaseQty = () => {
    if (!variant || inCartQty >= variant.stock) return;
    setCartQty(variant.id, inCartQty + 1);
  };

  const handleDecreaseQty = () => {
    if (!variant) return;
    if (inCartQty <= 1) {
      removeFromCart(variant.id);
    } else {
      setCartQty(variant.id, inCartQty - 1);
    }
  };

  const related = (all ?? [])
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  const productImages = getProductImages(product);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: localizedName,
          text: `${localizedName} — Arun Gopal Traders`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(lang === "hi" ? "लिंक कॉपी हो गया!" : "Link copied to clipboard!");
    }
  };

  const handleWhatsAppShare = async () => {
    // For WhatsApp web crawler to show rich preview cards, the URL must be a live public URL.
    // If testing on localhost / private wifi IP, we fallback to the live domain so WhatsApp crawler can reach it.
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168."));
    const baseUrl = isLocal ? SITE_URL : (typeof window !== "undefined" && window.location.origin ? window.location.origin : SITE_URL);
    const shareUrl = `${baseUrl}/product/${product.slug}`;
    const priceText = variant
      ? ` (₹${Math.round(Number(variant.price))}${variant.mrp && Number(variant.mrp) > Number(variant.price) ? ` / MRP ₹${Math.round(Number(variant.mrp))}` : ""})`
      : "";
    const text = `🛒 *${localizedName}*${priceText}\nअरुण गोपाल ट्रेडर्स, महराजगंज से ऑनलाइन ऑर्डर करें:\n${shareUrl}`;

    // Mobile devices (Android Chrome / iOS Safari):
    // Try to attach the actual photo directly using navigator.share with files!
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      try {
        const ogImg = getOpenGraphProductImage(product);
        const fetchUrl = ogImg.startsWith("http") ? ogImg : ogImg;
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], `${product.slug}.jpg`, { type: blob.type || "image/jpeg" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: localizedName,
              text,
            });
            return;
          }
        }
      } catch {
        // Fallback to direct WhatsApp Web URL if sharing cancelled or unsupported
      }
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container-page py-3 sm:py-5 pb-40 md:pb-12 space-y-5 sm:space-y-7">
      {/* 1. BREADCRUMB NAVIGATION (Blinkit Clean Style) */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
        <Link to="/" className="hover:text-emerald-800 transition-colors">
          {t.home}
        </Link>
        <span className="text-gray-300">/</span>
        <Link to="/shop" className="hover:text-emerald-800 transition-colors">
          {t.allGroceries}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-900 truncate max-w-[240px] sm:max-w-none">
          {localizedName}
        </span>
      </nav>

      {/* 2. MAIN DETAILS SHOWCASE (Blinkit 2-Column Spacious Layout) */}
      <div className="grid gap-6 lg:gap-10 md:grid-cols-12 items-start">
        {/* LEFT: Product Image Canvas */}
        <div className="w-full md:col-span-5 lg:col-span-5 md:sticky md:top-24 self-start">
          <ProductImageGallery
            images={productImages}
            productName={localizedName}
            badge={
              off > 0 ? (
                <div className="select-none">
                  <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#0C382A] via-[#145A45] to-[#0A3326] text-white px-2 py-0.5 text-[11px] font-black shadow-xs border border-emerald-400/35 leading-tight">
                    <span>{off}%</span>
                    <span className="text-amber-300">{lang === "hi" ? "छूट" : "OFF"}</span>
                  </span>
                </div>
              ) : null
            }
          />
        </div>

        {/* RIGHT: Product Information & Buying Area */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col space-y-4">
          {/* Brand, Title & Micro Controls */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Standard Vegetarian Green Dot Box */}
                <span className="size-4.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 shrink-0" title="Vegetarian">
                  <span className="size-2 rounded-full bg-emerald-600" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded px-2 py-0.5">
                  {product.brand || (lang === "hi" ? "दुकान प्रमाणित" : "Store Certified")}
                </span>
              </div>

              {/* Action Buttons (WhatsApp Share, Web Share) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex size-8 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title={lang === "hi" ? "व्हाट्सएप पर शेयर करें" : "Share on WhatsApp"}
                >
                  <MessageCircle className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex size-8 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-emerald-800 hover:border-emerald-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Share product"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            </div>

            <h1 className="font-sans text-xl sm:text-2xl font-bold text-gray-900 mt-2 leading-snug">
              {localizedName}
            </h1>

            {/* Rating & Delivery Info Line */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-1 font-bold text-[11px] bg-emerald-700 text-white px-2 py-0.5 rounded shadow-2xs hover:bg-emerald-800 transition-colors cursor-pointer"
                title={lang === "hi" ? "ग्राहकों की राय देखें" : "View Customer Reviews"}
              >
                <Star className="size-2.5 fill-white text-white" />
                {reviewStats.count > 0 ? (
                  <>
                    <span>{reviewStats.average.toFixed(1)}</span>
                    <span className="text-white/80 font-medium">({reviewStats.count} {lang === "hi" ? "राय" : "reviews"})</span>
                  </>
                ) : (
                  <span>{lang === "hi" ? "रेटिंग दें" : "Rate"}</span>
                )}
              </a>
              <span className="text-gray-300">•</span>
              {isDeliveryEnabled ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-full px-2 py-0.5">
                  <Truck className="size-3 text-emerald-600" />
                  <span>
                    {settings?.free_delivery_threshold
                      ? (lang === "hi" ? `होम डिलीवरी (₹${settings.free_delivery_threshold}+ पर फ्री)` : `Delivery Free over ₹${settings.free_delivery_threshold}`)
                      : (lang === "hi" ? "होम डिलीवरी उपलब्ध" : "Home Delivery Available")}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-full px-2 py-0.5">
                  <Store className="size-3 text-amber-700" />
                  <span>{lang === "hi" ? "दुकान से पिकअप उपलब्ध (रामनगर चौराहा)" : "Store Pickup Available"}</span>
                </div>
              )}
            </div>
          </div>

          {/* "Select Unit" Pack Size Selector Chips (Blinkit Style) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-gray-800">
                {t.selectPackSizeTitle}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {variants.map((v) => {
                const isSelected = v.id === variant?.id;
                const vOff = discountPercent(Number(v.mrp), Number(v.price));

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`relative flex flex-col items-start px-3.5 pt-3 pb-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-[105px] sm:min-w-[120px] ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/20 shadow-2xs ring-1 ring-emerald-600/30"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                    } ${v.stock <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {/* Perched Discount Pill at Top Border */}
                    {vOff > 0 && (
                      <span className="absolute -top-2 left-2.5 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-[#0C382A] via-[#145A45] to-[#0A3326] text-white border border-emerald-400/40 shadow-2xs leading-tight">
                        <span>{vOff}%</span>
                        <span className="text-amber-300">{lang === "hi" ? "छूट" : "OFF"}</span>
                      </span>
                    )}

                    <span className="text-xs font-semibold text-gray-900 truncate max-w-full">
                      {getVariantLabel(v)}
                    </span>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        {inr(v.price)}
                      </span>
                      {vOff > 0 && v.mrp && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                          {inr(v.mrp)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing & "Add to Cart" Action Row (Blinkit Signature Layout) */}
          <div className="pt-2">
            <span className="text-xs text-gray-500 font-semibold block mb-1">
              {variant ? getVariantLabel(variant) : ""}
            </span>

            <div className="flex items-center justify-between gap-4 py-3 border-y border-gray-100">
              <div>
                <div className="flex items-baseline flex-wrap gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-sans price-flipkart">
                    {inr(variant?.price ?? 0)}
                  </span>
                  {off > 0 && variant?.mrp ? (
                    <>
                      <span className="text-xs sm:text-sm text-gray-400 font-normal line-through price-flipkart">
                        MRP {inr(variant.mrp)}
                      </span>
                      <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 text-[11px] font-bold tracking-tight">
                        {off}% {lang === "hi" ? "छूट" : "OFF"}
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {lang === "hi" ? "सभी कर शामिल (Inclusive of all taxes)" : "(Inclusive of all taxes)"}
                </p>
              </div>

              {/* Action Button: "Add to cart" or Stepper */}
              <div>
                {!variant || variant.stock <= 0 ? (
                  <div className="h-10 px-6 rounded-lg border border-stone-200 bg-stone-50 text-stone-400 text-xs font-semibold flex items-center justify-center select-none">
                    {t.outOfStock}
                  </div>
                ) : inCartQty > 0 ? (
                  <div className="flex h-10 min-w-[120px] sm:min-w-[130px] items-center justify-between rounded-lg bg-[#145A45] text-white px-2 shadow-xs">
                    <button
                      type="button"
                      onClick={handleDecreaseQty}
                      className="flex size-7 items-center justify-center rounded-md text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </button>
                    <span className="text-sm sm:text-base font-bold text-white px-2 text-center select-none price-flipkart">
                      {inCartQty}
                    </span>
                    <button
                      type="button"
                      disabled={inCartQty >= variant.stock}
                      onClick={handleIncreaseQty}
                      className="flex size-7 items-center justify-center rounded-md text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="h-10 px-6 sm:px-8 rounded-lg bg-[#145A45] hover:bg-[#0F4A38] text-white font-bold text-sm tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{lang === "hi" ? "थैले में जोड़ें" : "Add to cart"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stock Availability */}
          <div className="text-xs">
            {variant && variant.stock > 0 ? (
              variant.stock <= variant.low_stock_threshold ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-amber-800 text-[11px] font-bold">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {lang === "hi"
                      ? `केवल ${variant.stock} शेष!`
                      : `Only ${variant.stock} left in stock`}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.inStockMaharajganj}</span>
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-1.5 text-red-600 text-[11px] font-bold">
                <span className="size-1.5 rounded-full bg-red-500" />
                <span>{t.outOfStock}</span>
              </div>
            )}
          </div>

          {/* Quick WhatsApp & Phone Call Actions */}
          <div className="flex items-center gap-2.5 pt-0.5">
            <a
              href={`https://wa.me/916388354988?text=${encodeURIComponent(
                `Namaste Arun Gopal Traders, I want to order ${localizedName} (${getVariantLabel(variant?.label ?? "")}) for ${isDeliveryEnabled ? "home delivery" : "store pickup"} in Maharajganj.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#E8F8EE] hover:bg-[#D4F2DE] text-[#128C7E] border border-[#25D366]/30 text-xs font-bold transition-all active:scale-95"
            >
              <MessageCircle className="size-3.5 text-[#25D366]" />
              <span>{t.whatsappOrderBtn}</span>
            </a>

            <a
              href="tel:+916388354988"
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all active:scale-95"
            >
              <Phone className="size-3.5 text-emerald-800" />
              <span>{t.callStoreBtn}</span>
            </a>
          </div>

          {/* "Why shop from Arun Gopal Traders?" Trust Section (Blinkit Style) */}
          <div className="pt-4 border-t border-gray-100 space-y-3.5">
            <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 tracking-tight">
              {lang === "hi" ? "अरुण गोपाल ट्रेडर्स से क्यों खरीदें?" : "Why shop from Arun Gopal Traders?"}
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                  <Truck className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                    {lang === "hi" ? "तेज़ और भरोसेमंद डिलीवरी" : "Round The Clock & Fast Delivery"}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-normal mt-0.5">
                    {lang === "hi"
                      ? "रामनगर चौराहा व महराजगंज में सीधे आपके दरवाज़े तक सुरक्षित डिलीवरी।"
                      : "Get items delivered safely to your doorstep in Ramnagar & Maharajganj."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                  <BadgeCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                    {lang === "hi" ? "उचित दुकान रेट और बेहतरीन बचत" : "Best Prices & Honest Offers"}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-normal mt-0.5">
                    {lang === "hi"
                      ? "थोक व मंडी के सही भाव पर ताज़ा सामान, हर खरीदारी पर सीधी बचत।"
                      : "Best price destination with honest wholesale rates and direct customer savings."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                    {lang === "hi" ? "100% शुद्ध और असली किराना" : "Wide Assortment & 100% Purity"}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-normal mt-0.5">
                    {lang === "hi"
                      ? "100% शुद्ध आटा, चावल, दाल, कच्ची घानी सरसों तेल, मसाले और रोज़मर्रा का सामान।"
                      : "Choose from unadulterated ration, pure edible oils, spices and kitchen essentials."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details & Specifications Box (Clean Blinkit style card) */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-gray-200/60">
              <Sparkles className="size-3.5 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                {t.productDetailsAndPurity}
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-gray-600">
              {localizedDescription || (lang === "hi"
                ? "अरुण गोपाल ट्रेडर्स पर उपलब्ध सभी किराना उत्पाद 100% शुद्ध, असली और ताज़ा पैक्ड हैं। रामनगर चौराहा, अड्डा बाजार।"
                : "All grocery products at Arun Gopal Traders are 100% pure, authentic, and freshly packed. Ramnagar Chauraha, Adda Bazar.")}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-lg bg-white border border-gray-200/80 p-2 text-center">
                <span className="text-[9.5px] font-bold text-gray-400 uppercase block">ब्रांड</span>
                <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">{product.brand || "Arun Gopal"}</span>
              </div>
              <div className="rounded-lg bg-white border border-gray-200/80 p-2 text-center">
                <span className="text-[9.5px] font-bold text-gray-400 uppercase block">पैकिंग</span>
                <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">{variant ? getVariantLabel(variant) : "Standard"}</span>
              </div>
              <div className="rounded-lg bg-white border border-gray-200/80 p-2 text-center">
                <span className="text-[9.5px] font-bold text-gray-400 uppercase block">लोकेशन</span>
                <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">रामनगर, महराजगंज</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. CUSTOMER REVIEWS & STAR RATINGS SECTION */}
      <ProductReviewsSection product={product} localizedName={localizedName} />

      {/* 3. SIMILAR / RELATED ESSENTIALS SECTION */}
      {related.length > 0 && (
        <section className="space-y-5 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-gray-900">
                {t.similarEssentialsTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === "hi" ? "इस कैटेगरी के अन्य शुद्ध उत्पाद" : "More items from this category"}
              </p>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>{t.viewAll}</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grocery-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 4. STICKY MOBILE BOTTOM BUY BAR (Blinkit Style) */}
      <div className="fixed bottom-[3.75rem] inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-gray-500 truncate block">
              {variant ? getVariantLabel(variant) : ""}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-gray-900 tracking-tight price-flipkart">
                {inr(variant?.price ?? 0)}
              </span>
              {off > 0 && variant?.mrp && (
                <span className="text-xs text-gray-400 line-through font-normal price-flipkart">
                  {inr(variant.mrp)}
                </span>
              )}
            </div>
          </div>

          <div>
            {!variant || variant.stock <= 0 ? (
              <div className="h-10 px-4 rounded-lg border border-stone-200 bg-stone-50 text-stone-400 text-xs font-semibold flex items-center justify-center select-none">
                {t.outOfStock}
              </div>
            ) : inCartQty > 0 ? (
              <div className="flex h-10 min-w-[120px] items-center justify-between rounded-lg bg-[#145A45] text-white px-2 shadow-xs">
                <button
                  type="button"
                  onClick={handleDecreaseQty}
                  className="flex size-7 items-center justify-center rounded-md text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4 stroke-[2.5]" />
                </button>
                <span className="text-sm font-bold text-white px-2 text-center select-none price-flipkart">
                  {inCartQty}
                </span>
                <button
                  type="button"
                  disabled={inCartQty >= variant.stock}
                  onClick={handleIncreaseQty}
                  className="flex size-7 items-center justify-center rounded-md text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className="h-10 px-6 rounded-lg bg-[#145A45] hover:bg-[#0F4A38] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <span>{lang === "hi" ? "थैले में जोड़ें" : "Add to cart"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
