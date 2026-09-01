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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/i18n";
import { getProductImage, getProductImages } from "@/lib/product-images";
import { productQuery, productsQuery, type Variant } from "@/lib/queries";
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
    const img = p?.image_url || "/images/packaged.jpg";

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
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
  const { add } = useCart();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist();
  const { lang, t, getProductName, getProductDescription, getVariantLabel } = useLanguage();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="container-page grid gap-8 py-6 sm:py-10 md:grid-cols-2 items-start">
        <div className="w-full aspect-square max-w-[480px] mx-auto rounded-3xl bg-white p-6 flex items-center justify-center border border-[#E8E4DA]">
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

  return (
    <div className="container-page py-4 sm:py-8 pb-28 md:pb-12 space-y-8">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5A655F] flex-wrap">
        <Link to="/" className="hover:text-[#145A45] font-medium transition-colors">
          {t.home}
        </Link>
        <ChevronRight className="size-3 text-[#8C827A]" />
        <Link to="/shop" className="hover:text-[#145A45] font-medium transition-colors">
          {t.allGroceries}
        </Link>
        <ChevronRight className="size-3 text-[#8C827A]" />
        <span className="font-bold text-[#16201A] truncate max-w-[200px] sm:max-w-none">
          {localizedName}
        </span>
      </nav>

      {/* 2. MAIN DETAILS SHOWCASE (2-COLUMN OPEN RESPONSIVE LAYOUT) */}
      <div className="grid gap-8 lg:gap-12 md:grid-cols-2 items-start">
        {/* LEFT: Multi-Image Gallery Component */}
        <div className="w-full">
          <ProductImageGallery
            images={productImages}
            productName={localizedName}
            badge={
              off > 0 ? (
                <span className="rounded-xl bg-[#D97706] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                  {off}% {t.off}
                </span>
              ) : (
                <span className="rounded-xl bg-[#E6EFE8] px-2.5 py-1 text-xs font-bold text-[#0F4A38]">
                  {t.freshBadge}
                </span>
              )
            }
          />
        </div>

        {/* RIGHT: Product Information & Buying Center */}
        <div className="flex flex-col space-y-6">
          {/* Header & Title Block */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#E6EFE8] px-2.5 py-0.5 text-xs font-bold text-[#0F4A38] uppercase tracking-wider">
                {product.brand || (lang === "hi" ? "दैनिक राशन" : "Fresh Staples")}
              </span>

              {/* Wishlist & Share Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="flex size-9 items-center justify-center rounded-full bg-white border border-[#E8E4DA] text-[#5A655F] hover:text-[#DC2626] hover:bg-[#FAF8F2] shadow-2xs transition-all cursor-pointer"
                  title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                >
                  <Heart
                    className={`size-4.5 ${
                      isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex size-9 items-center justify-center rounded-full bg-white border border-[#E8E4DA] text-[#5A655F] hover:text-[#145A45] hover:bg-[#FAF8F2] shadow-2xs transition-all cursor-pointer"
                  title="Share product"
                >
                  <Share2 className="size-4.5" />
                </button>
              </div>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#16201A] mt-2.5 leading-snug">
              {localizedName}
            </h1>

            {/* Micro Rating & Fast Delivery Pill Bar */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[#5A655F]">
              <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                <span>4.9</span>
                <span className="text-[#8C827A] font-normal">(120+)</span>
              </div>
              <span className="text-[#E8E4DA]">•</span>
              <div className="flex items-center gap-1 font-bold text-[#0F4A38]">
                <Truck className="size-3.5 text-[#145A45]" />
                <span>{lang === "hi" ? "30 मिनट डिलीवरी" : "30-Min Delivery"}</span>
              </div>
            </div>
          </div>

          {/* Pricing Banner Box */}
          <div className="rounded-2xl bg-gradient-to-r from-[#FAF8F2] via-white to-[#E6EFE8]/30 p-4 sm:p-5 border border-[#E8E4DA] flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-[#0F4A38]">
                  {inr(variant?.price ?? 0)}
                </span>
                {off > 0 && variant?.mrp ? (
                  <span className="text-base sm:text-lg text-[#5A655F] line-through font-semibold">
                    {inr(variant.mrp)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] font-medium text-[#5A655F]">
                {lang === "hi" ? "सभी कर शामिल (Inclusive of all taxes)" : "Inclusive of all taxes"}
              </p>
            </div>

            {saveAmount > 0 && (
              <div className="rounded-xl bg-[#D97706] text-white px-3 py-1.5 text-xs font-black shadow-2xs">
                {lang === "hi" ? `बचत: ${inr(saveAmount)}` : `Save ${inr(saveAmount)}`}
              </div>
            )}
          </div>

          {/* Pack Size Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#16201A]">
              {t.selectPackSizeTitle}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {variants.map((v) => {
                const isSelected = v.id === variant?.id;
                const vOff = discountPercent(Number(v.mrp), Number(v.price));

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`relative flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-[#145A45] bg-[#145A45] text-white shadow-md ring-2 ring-[#145A45]/20"
                        : "border-[#E8E4DA] bg-white text-[#16201A] hover:border-[#145A45] hover:bg-[#FAF8F2]"
                    }`}
                  >
                    <span>{getVariantLabel(v)}</span>
                    <span className={isSelected ? "text-white/90" : "text-[#0F4A38]"}>
                      {inr(v.price)}
                    </span>
                    {vOff > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          isSelected ? "bg-white/20 text-white" : "bg-[#E6EFE8] text-[#0F4A38]"
                        }`}
                      >
                        {vOff}% OFF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Availability Bar */}
          <div className="text-xs">
            {variant && variant.stock > 0 ? (
              variant.stock <= variant.low_stock_threshold ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 text-amber-800 font-bold">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {lang === "hi"
                      ? `केवल ${variant.stock} पैकेट शेष!`
                      : `Hurry! Only ${variant.stock} left in stock`}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-[#0F4A38] font-bold">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>{t.inStockMaharajganj}</span>
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                <span className="size-2 rounded-full bg-red-500" />
                <span>{t.outOfStock}</span>
              </div>
            )}
          </div>

          {/* Primary Buying Actions (Quantity & Add to Cart) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Stepper */}
              <div className="flex h-12 items-center justify-between sm:justify-start rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2] px-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex size-9 items-center justify-center rounded-xl text-[#16201A] hover:bg-white active:scale-95 transition-all cursor-pointer"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-sm font-black text-[#16201A]">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= (variant?.stock ?? 1)}
                  onClick={() => setQty((q) => q + 1)}
                  className="flex size-9 items-center justify-center rounded-xl text-[#16201A] hover:bg-white active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Add to Cart CTA Button */}
              <Button
                disabled={!variant || variant.stock <= 0}
                onClick={() => {
                  if (!variant) return;
                  for (let i = 0; i < qty; i++) {
                    add({
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
                    });
                  }
                  toast.success(`${qty}x ${localizedName} ${t.added.toLowerCase()}`, {
                    icon: <Check className="size-4 text-[#145A45]" />,
                  });
                }}
                className="flex-1 h-12 rounded-2xl bg-[#145A45] hover:bg-[#0A3628] text-sm font-black text-white shadow-md active:scale-[0.99] transition-all cursor-pointer"
              >
                <ShoppingBag className="mr-2 size-5" />
                <span>{t.add}</span>
              </Button>
            </div>

            {/* Quick Order via WhatsApp & Phone Call */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href={`https://wa.me/916388354988?text=${encodeURIComponent(
                  `Namaste Arun Gopal Traders, I want to order ${qty}x ${localizedName} (${getVariantLabel(variant?.label ?? "")}) for home delivery in Maharajganj.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white px-4 text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                <MessageCircle className="size-4" />
                <span>{t.whatsappOrderBtn}</span>
              </a>

              <a
                href="tel:+916388354988"
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8E4DA] bg-white hover:bg-[#FAF8F2] text-[#0F4A38] px-4 text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                <Phone className="size-4 text-[#145A45]" />
                <span>{t.callStoreBtn}</span>
              </a>
            </div>
          </div>

          {/* Guarantee Badges Strip */}
          <div className="grid grid-cols-3 gap-3 border-t border-[#E8E4DA] pt-4 text-center">
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#FAF8F2]">
              <Truck className="size-4.5 text-[#145A45] mb-1" />
              <span className="text-[10px] font-bold text-[#16201A]">{t.freeDeliveryTitle}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#FAF8F2]">
              <Store className="size-4.5 text-[#145A45] mb-1" />
              <span className="text-[10px] font-bold text-[#16201A]">{t.storePickupTitle}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#FAF8F2]">
              <ShieldCheck className="size-4.5 text-[#145A45] mb-1" />
              <span className="text-[10px] font-bold text-[#16201A]">{t.genuineBrandsTitle}</span>
            </div>
          </div>

          {/* Product Description & Quality Assurance Box */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#16201A] flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#145A45]" />
              <span>{t.productDetailsAndPurity}</span>
            </h3>
            <p className="text-xs leading-relaxed text-[#5A655F]">
              {localizedDescription || (lang === "hi"
                ? "अरुण गोपाल ट्रेडर्स पर उपलब्ध सभी किराना उत्पाद 100% शुद्ध, असली और ताज़ा पैक्ड हैं। महाराजगंज में सबसे भरोसेमंद डिलीवरी।"
                : "All grocery products at Arun Gopal Traders are 100% pure, authentic, and freshly packed. Trusted delivery in Maharajganj.")}
            </p>
          </div>
        </div>
      </div>

      {/* 3. SIMILAR / RELATED ESSENTIALS SECTION */}
      {related.length > 0 && (
        <section className="space-y-5 pt-8 border-t border-[#E8E4DA]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-black text-[#16201A]">
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
      <div className="fixed bottom-14 inset-x-0 z-30 border-t border-[#E8E4DA] bg-white/95 backdrop-blur-md p-3 shadow-xl md:hidden">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#5A655F] truncate">
              {variant ? getVariantLabel(variant) : ""}
            </p>
            <p className="text-base font-black text-[#0F4A38]">{inr(variant?.price ?? 0)}</p>
          </div>
          <Button
            disabled={!variant || variant.stock <= 0}
            onClick={() => {
              if (!variant) return;
              for (let i = 0; i < qty; i++) {
                add({
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
                });
              }
              toast.success(`${qty}x ${localizedName} ${t.added.toLowerCase()}`, {
                icon: <Check className="size-4 text-[#145A45]" />,
              });
            }}
            className="flex-1 max-w-[220px] h-10 rounded-xl bg-[#145A45] text-xs font-black text-white shadow-xs active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="mr-1.5 size-4" />
            <span>{t.add}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
