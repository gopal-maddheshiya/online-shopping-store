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
  Heart,
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
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/i18n";
import { getProductImage, getProductImages, getOpenGraphProductImage } from "@/lib/product-images";
import { productQuery, productsQuery, settingsQuery, type Variant } from "@/lib/queries";
import { productReviewsQuery, computeReviewStats } from "@/lib/reviews";
import { discountPercent, inr } from "@/lib/format";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    void context.queryClient.ensureQueryData(productsQuery());
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
      : `https://arungopaltraders.com${resolvedImg.startsWith("/") ? "" : "/"}${resolvedImg}`;
    const pageUrl = `https://arungopaltraders.com/product/${params.slug}`;

    const defaultVariant = p?.product_variants?.[0];
    const priceAmount = defaultVariant?.price ? String(Math.round(Number(defaultVariant.price))) : undefined;

    return {
      meta: [
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
                "@type": "Product",
                name: p.name,
                image: absoluteImg,
                description: desc,
                brand: {
                  "@type": "Brand",
                  name: p.brand || "Arun Gopal Traders",
                },
                offers: {
                  "@type": "Offer",
                  url: pageUrl,
                  priceCurrency: "INR",
                  price: priceAmount || "0",
                  itemCondition: "https://schema.org/NewCondition",
                  availability:
                    defaultVariant && defaultVariant.stock > 0
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                },
              }),
            },
          ]
        : [],
    };
  },
  errorComponent: ({ reset }) => (
    <div className="container-page py-20 text-center">
      <h1 className="font-sans text-2xl font-bold text-[#16201A]">Unable to load product</h1>
      <p className="mt-1 text-xs text-[#5A655F]">Please try again or return to the shop.</p>
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
      <p className="mt-1 text-xs text-[#5A655F]">
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
  const { add, items } = useCart();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist();
  const { lang, t, getProductName, getProductDescription, getVariantLabel } = useLanguage();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

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

  const isWishlisted = inWishlist(product.id);
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
      qty,
    );
    toast.success(`${qty}x ${localizedName} ${t.added.toLowerCase()}`, {
      icon: <Check className="size-4 text-[#145A45]" />,
    });
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
    const baseUrl = isLocal ? "https://arungopaltraders.com" : (typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://arungopaltraders.com");
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
    <div className="container-page py-3 sm:py-5 pb-24 md:pb-10 space-y-5 sm:space-y-6">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B7280] flex-wrap">
        <Link to="/" className="hover:text-[#065F46] font-medium transition-colors flex items-center gap-1">
          <Home className="size-3 text-[#059669]" />
          <span>{t.home}</span>
        </Link>
        <ChevronRight className="size-3 text-[#9CA3AF]" />
        <Link to="/shop" className="hover:text-[#065F46] font-medium transition-colors">
          {t.allGroceries}
        </Link>
        <ChevronRight className="size-3 text-[#9CA3AF]" />
        <span className="font-bold text-[#111827] truncate max-w-[200px] sm:max-w-none">
          {localizedName}
        </span>
      </nav>

      {/* 2. MAIN DETAILS SHOWCASE (COMPACT 12-COLUMN BALANCED LAYOUT) */}
      <div className="grid gap-5 lg:gap-8 md:grid-cols-12 items-start">
        {/* LEFT: Multi-Image Gallery (Sticky on Laptop/Desktop, Compact max-w-[420px]) */}
        <div className="w-full md:col-span-5 lg:col-span-5 md:sticky md:top-24 self-start">
          <ProductImageGallery
            images={productImages}
            productName={localizedName}
            badge={
              off > 0 ? (
                <div className="select-none drop-shadow-[0_2px_4px_rgba(37,111,239,0.25)]">
                  <div className="relative flex flex-col items-center justify-center px-1.5 pt-1 pb-2 min-w-[30px] sm:min-w-[34px] leading-none">
                    <svg
                      className="absolute inset-0 size-full pointer-events-none"
                      viewBox="0 0 32 34"
                      preserveAspectRatio="none"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M 0 0 H 32 V 31.5 Q 28 35.5, 24 31.5 Q 20 35.5, 16 31.5 Q 12 35.5, 8 31.5 Q 4 35.5, 0 31.5 Z"
                        fill="#256FEF"
                      />
                    </svg>
                    <span className="relative z-10 text-[10.5px] sm:text-[11.5px] font-bold text-white tracking-tight">
                      {off}%
                    </span>
                    <span className="relative z-10 text-[7px] sm:text-[7.5px] font-bold text-white uppercase tracking-wider mt-0.5">
                      OFF
                    </span>
                  </div>
                </div>
              ) : null
            }
          />
        </div>

        {/* RIGHT: Product Information & Buying Center */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col space-y-3.5">
          {/* Brand, Title & Top Controls */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-[#065F46] uppercase tracking-wider">
                <ShieldCheck className="size-3 text-[#059669]" />
                <span>{product.brand || (lang === "hi" ? "दुकान प्रमाणित" : "Store Certified")}</span>
              </span>

              {/* Sleek, Compact Action Buttons (Wishlist, WhatsApp, Share) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="flex size-8 items-center justify-center rounded-full bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#DC2626] hover:border-red-200 hover:bg-red-50/60 shadow-2xs transition-all cursor-pointer active:scale-92"
                  title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                >
                  <Heart
                    className={`size-3.5 transition-colors ${
                      isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex size-8 items-center justify-center rounded-full bg-[#E8F8EE] border border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366] hover:text-white shadow-2xs transition-all cursor-pointer active:scale-92"
                  title={lang === "hi" ? "व्हाट्सएप पर शेयर करें" : "Share on WhatsApp"}
                >
                  <MessageCircle className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex size-8 items-center justify-center rounded-full bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#065F46] hover:border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-92"
                  title="Share product"
                >
                  <Share2 className="size-3.5" />
                </button>
              </div>
            </div>

            <h1 className="font-sans text-xl sm:text-2xl font-bold text-[#111827] mt-1.5 leading-snug tracking-tight">
              {localizedName}
            </h1>

            {/* Micro Rating & Dynamic Delivery Status Row */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5A655F]">
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-1 font-bold text-[11px] bg-[#047857] text-white px-2 py-0.5 rounded shadow-2xs hover:bg-[#065F46] transition-colors cursor-pointer"
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
              <span className="text-[#D1D5DB]">•</span>
              {/* Delivery Toggle Check: Exactly follows admin toggle */}
              {isDeliveryEnabled ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] border border-emerald-200/80 rounded-full px-2 py-0.5">
                  <Truck className="size-3 text-[#059669]" />
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

          {/* Compact Clean Pricing Card */}
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-3 shadow-2xs space-y-1">
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#065F46] tracking-tight">
                {inr(variant?.price ?? 0)}
              </span>

              {off > 0 && variant?.mrp ? (
                <>
                  <span className="text-sm sm:text-base text-[#9CA3AF] line-through font-semibold">
                    {inr(variant.mrp)}
                  </span>
                  <span className="rounded-md bg-blue-50 text-[#256FEF] border border-blue-200/70 px-1.5 py-0.2 text-[11px] font-bold tracking-tight">
                    {off}% OFF
                  </span>
                </>
              ) : null}

              {saveAmount > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 font-bold text-[11px] text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                  <span>🎉 {lang === "hi" ? `बचत: ${inr(saveAmount)}` : `Save: ${inr(saveAmount)}`}</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#6B7280]">
              {lang === "hi" ? "सभी कर शामिल (Inclusive of all taxes)" : "Inclusive of all taxes"}
            </p>
          </div>

          {/* Pack Size / Variant Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-[#374151]">
                {t.selectPackSizeTitle}
              </label>
              <span className="font-bold text-[#059669]">
                {variant ? getVariantLabel(variant) : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {variants.map((v) => {
                const isSelected = v.id === variant?.id;
                const vOff = discountPercent(Number(v.mrp), Number(v.price));

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`relative flex flex-col p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-2 border-[#059669] bg-[#ECFDF5] shadow-2xs ring-1 ring-[#059669]/20"
                        : "border-[#E5E7EB] bg-white hover:border-[#059669]/40 hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 size-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center">
                        <Check className="size-2 stroke-[3]" />
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#111827] truncate pr-4">
                      {getVariantLabel(v)}
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-[#065F46]">
                        {inr(v.price)}
                      </span>
                      {vOff > 0 && v.mrp && (
                        <span className="text-[10px] text-[#9CA3AF] line-through font-medium">
                          {inr(v.mrp)}
                        </span>
                      )}
                    </div>
                    {vOff > 0 && (
                      <span className="mt-1 text-[9.5px] font-bold text-[#256FEF] bg-blue-50 self-start px-1 py-0.2 rounded">
                        {vOff}% OFF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Availability Indicator */}
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
                <div className="inline-flex items-center gap-1.5 text-[#065F46] text-[11px] font-bold">
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

          {/* Primary Buying Action: Compact Stepper + Add to Cart Button */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center gap-2.5">
              {/* Sleek, Compact Stepper */}
              <div className="flex h-10 items-center justify-between rounded-xl border border-[#D1D5DB] bg-[#F8FAFC] px-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex size-7 items-center justify-center rounded-lg text-[#374151] hover:bg-white active:scale-95 transition-all cursor-pointer"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-[#111827]">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= (variant?.stock ?? 1)}
                  onClick={() => setQty((q) => q + 1)}
                  className="flex size-7 items-center justify-center rounded-lg text-[#374151] hover:bg-white active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Standard Proportional Add to Cart CTA */}
              <Button
                disabled={!variant || variant.stock <= 0}
                onClick={handleAddToCart}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#145A45] to-[#0F4A38] hover:from-[#0F4A38] hover:to-[#0A3628] text-xs sm:text-sm font-bold text-white shadow-2xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="mr-1.5 size-4" />
                <span>
                  {inCartQty > 0
                    ? (lang === "hi" ? `कार्ट में ${inCartQty} है • और जोड़ें (${qty})` : `In Cart (${inCartQty}) • Add +${qty}`)
                    : (lang === "hi" ? `थैले में जोड़ें • ${inr((variant?.price ?? 0) * qty)}` : `Add to Cart • ${inr((variant?.price ?? 0) * qty)}`)}
                </span>
              </Button>
            </div>

            {/* In-Cart Notification Pill */}
            {inCartQty > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs">
                <span className="font-bold text-[#065F46] flex items-center gap-1.5 text-[11px]">
                  <Check className="size-3 text-emerald-600" />
                  <span>{lang === "hi" ? `थैले में ${inCartQty} पैकेट मौजूद है` : `In your cart (${inCartQty} packs)`}</span>
                </span>
                <Link
                  to="/cart"
                  className="font-bold text-[#145A45] hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  <span>{lang === "hi" ? "थैला देखें" : "View Cart"}</span>
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            )}

            {/* Quick Order: Compact WhatsApp & Call Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <a
                href={`https://wa.me/916388354988?text=${encodeURIComponent(
                  `Namaste Arun Gopal Traders, I want to order ${qty}x ${localizedName} (${getVariantLabel(variant?.label ?? "")}) for ${isDeliveryEnabled ? "home delivery" : "store pickup"} in Maharajganj.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-8.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#E8F8EE] hover:bg-[#D4F2DE] text-[#128C7E] border border-[#25D366]/30 text-xs font-bold transition-all active:scale-95"
              >
                <MessageCircle className="size-3.5 text-[#25D366]" />
                <span>{t.whatsappOrderBtn}</span>
              </a>

              <a
                href="tel:+916388354988"
                className="flex-1 h-8.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] text-xs font-bold transition-all active:scale-95"
              >
                <Phone className="size-3.5 text-[#145A45]" />
                <span>{t.callStoreBtn}</span>
              </a>
            </div>
          </div>

          {/* Compact Trust Strip (1 Clean Row, Delivery Toggle Aware) */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <ShieldCheck className="size-3.5 text-[#059669] shrink-0" />
              <span className="text-[11px] font-bold text-[#374151] truncate">100% असली सामान</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              {isDeliveryEnabled ? (
                <>
                  <Truck className="size-3.5 text-[#059669] shrink-0" />
                  <span className="text-[11px] font-bold text-[#374151] truncate">तेज़ होम डिलीवरी</span>
                </>
              ) : (
                <>
                  <Store className="size-3.5 text-[#059669] shrink-0" />
                  <span className="text-[11px] font-bold text-[#374151] truncate">दुकान से पिकअप</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
              <BadgeCheck className="size-3.5 text-[#059669] shrink-0" />
              <span className="text-[11px] font-bold text-[#374151] truncate">उचित दुकान रेट</span>
            </div>
          </div>

          {/* Product Details & Specifications Box (Compact & Clean) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 pb-2 border-b border-[#F3F4F6]">
              <Sparkles className="size-3.5 text-[#059669]" />
              <h3 className="text-xs font-bold text-[#111827]">
                {t.productDetailsAndPurity}
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-[#4B5563]">
              {localizedDescription || (lang === "hi"
                ? "अरुण गोपाल ट्रेडर्स पर उपलब्ध सभी किराना उत्पाद 100% शुद्ध, असली और ताज़ा पैक्ड हैं। रामनगर चौराहा, अड्डा बाजार।"
                : "All grocery products at Arun Gopal Traders are 100% pure, authentic, and freshly packed. Ramnagar Chauraha, Adda Bazar.")}
            </p>

            {/* Compact Structured Specs Strip */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] p-1.5 text-center">
                <span className="text-[9.5px] font-bold text-[#6B7280] block">ब्रांड</span>
                <span className="text-xs font-bold text-[#111827] truncate block">{product.brand || "Arun Gopal"}</span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] p-1.5 text-center">
                <span className="text-[9.5px] font-bold text-[#6B7280] block">पैकिंग</span>
                <span className="text-xs font-bold text-[#111827] truncate block">{variant ? getVariantLabel(variant) : "Standard"}</span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] p-1.5 text-center">
                <span className="text-[9.5px] font-bold text-[#6B7280] block">लोकेशन</span>
                <span className="text-xs font-bold text-[#111827] truncate block">रामनगर, महराजगंज</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. CUSTOMER REVIEWS & STAR RATINGS SECTION */}
      <ProductReviewsSection product={product} localizedName={localizedName} />

      {/* 3. SIMILAR / RELATED ESSENTIALS SECTION */}
      {related.length > 0 && (
        <section className="space-y-5 pt-8 border-t border-[#E4DFD5]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#16201A]">
                {t.similarEssentialsTitle}
              </h2>
              <p className="text-xs text-[#5A655F] mt-0.5">
                {lang === "hi" ? "इस कैटेगरी के अन्य शुद्ध उत्पाद" : "More items from this category"}
              </p>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#145A45] hover:underline flex items-center gap-1"
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

      {/* 4. STICKY MOBILE BOTTOM BUY BAR */}
      <div className="fixed bottom-14 inset-x-0 z-30 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#4B5563] truncate">
                {variant ? getVariantLabel(variant) : ""}
              </span>
              {inCartQty > 0 && (
                <span className="text-[10px] font-black text-[#047857] bg-[#ECFDF5] px-1.5 py-0.2 rounded-full">
                  ✓ {inCartQty}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[#065F46] tracking-tight">
                {inr(variant?.price ?? 0)}
              </span>
              {off > 0 && variant?.mrp && (
                <span className="text-xs text-[#9CA3AF] line-through font-semibold">
                  {inr(variant.mrp)}
                </span>
              )}
            </div>
          </div>

          <Button
            disabled={!variant || variant.stock <= 0}
            onClick={handleAddToCart}
            className="flex-1 max-w-[210px] h-11 rounded-xl bg-gradient-to-r from-[#065F46] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-xs font-black text-white shadow-[0_3px_12px_rgba(6,95,70,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="mr-1.5 size-4" />
            <span>
              {!variant || variant.stock <= 0
                ? t.outOfStock
                : inCartQty > 0
                ? lang === "hi"
                  ? `और जोड़ें (${inCartQty + qty})`
                  : `Add More (${inCartQty + qty})`
                : t.add}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
