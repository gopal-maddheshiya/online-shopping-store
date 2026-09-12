import { Link } from "@tanstack/react-router";
import { Plus, Minus, Heart, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { type Product } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, inr } from "@/lib/format";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const { items, add, setQty } = useCart();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();

  const variants = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? "");

  const activeVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const inCart = items.find((i) => i.variantId === activeVariant?.id);
  const stock = activeVariant?.stock ?? 0;
  const off = activeVariant
    ? discountPercent(Number(activeVariant.mrp), Number(activeVariant.price))
    : 0;
  const saveAmount =
    activeVariant && Number(activeVariant.mrp) > Number(activeVariant.price)
      ? Math.round(Number(activeVariant.mrp) - Number(activeVariant.price))
      : 0;
  const isWishlisted = inWishlist(product.id);
  const localizedProductName = getProductName(product);

  return (
    <div
      className="group relative flex flex-col justify-between w-full h-full min-h-[305px] sm:min-h-[335px] bg-white rounded-2xl border border-black/[0.06] p-3 sm:p-3.5 pb-3.5 sm:pb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.03)] hover:border-[#145A45]/25 hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* 1. Image Canvas Tile (Original full-size aspect ratio & pure white background) */}
      <div className="relative w-full aspect-[1/1.08] rounded-xl bg-white p-1.5 sm:p-2 flex items-center justify-center overflow-hidden transition-all">
        {/* Top Floating Discount Badge (Nudged up to prevent overlapping image) */}
        <div className="absolute top-0.5 left-1 z-10">
          {off > 0 ? (
            <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#D97706] to-[#B45309] px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-white tracking-tight shadow-[0_2px_6px_rgba(217,119,6,0.25)] border border-amber-300/35 glint-effect">
              {off}% {t.off}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-[#E6EFE8] border border-[#D4E2D8] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#0F4A38]">
              {t.freshBadge}
            </span>
          )}
        </div>

        {/* Wishlist Heart Button (Nudged up to prevent overlapping image) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-0.5 right-1 z-10 flex size-7 items-center justify-center rounded-full bg-white/95 border border-[#EDE8E0] text-[#737C76] hover:text-[#DC2626] hover:border-[#DC2626]/30 shadow-xs transition-all active:scale-90 cursor-pointer"
        >
          <Heart
            className={`size-3.5 sm:size-4 transition-transform active:scale-125 ${
              isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
            }`}
            strokeWidth={1.75}
          />
        </button>

        {/* Product Image Link (Full Original Size) */}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="size-full flex items-center justify-center"
        >
          <img
            src={getProductImage(product)}
            alt={localizedProductName}
            loading="lazy"
            decoding="async"
            width={220}
            height={220}
            onError={(e) => {
              e.currentTarget.src = "/images/packaged.jpg";
            }}
            className="size-full object-contain mx-auto transition-transform duration-300 ease-out group-hover:scale-108 select-none"
          />
        </Link>

        {/* Store Available Tag */}
        {stock > 0 && (
          <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/95 border border-[#EDE8E0] px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-semibold text-[#145A45] shadow-xs">
              <Zap className="size-2.5 fill-[#145A45] text-[#145A45]" />
              <span>{lang === "hi" ? "उपलब्ध" : "In Stock"}</span>
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-2xs rounded-xl z-20">
            <span className="rounded-lg bg-white border border-[#EDE8E0] px-2.5 py-1 text-[10px] font-semibold text-[#5A655F] shadow-xs">
              {t.outOfStock}
            </span>
          </div>
        )}
      </div>

      {/* 2. Product Details Section with Generous Breathing Room */}
      <div className="flex flex-1 flex-col min-w-0 w-full pt-2.5 space-y-1">
        {/* Brand Micro-Tag */}
        <span className="text-[10px] font-medium text-[#737C76] tracking-wider uppercase truncate w-full">
          {product.brand || (lang === "hi" ? "दैनिक राशन" : "Fresh Staples")}
        </span>

        {/* Product Name Title - Clean Font & Relaxed Line Height */}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 min-h-[2.4rem] sm:min-h-[2.6rem] text-xs sm:text-[13px] font-semibold text-[#1A1A1A] group-hover:text-[#145A45] transition-colors leading-snug break-words w-full"
          title={localizedProductName}
        >
          {localizedProductName}
        </Link>

        {/* Variant Chips / Weight Unit Badge */}
        {variants.length > 1 ? (
          <div className="pt-0.5 flex flex-wrap gap-1 min-w-0 w-full">
            {variants.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-lg border px-2 py-0.5 text-[9.5px] sm:text-[10px] font-medium transition-all max-w-full truncate cursor-pointer ${
                  v.id === activeVariant?.id
                    ? "border-[#145A45] bg-[#145A45] text-white shadow-xs"
                    : "border-[#EDE8E0] bg-white text-[#5A655F] hover:border-[#145A45]/50 hover:text-[#145A45]"
                }`}
              >
                {getVariantLabel(v)}
              </button>
            ))}
          </div>
        ) : (
          <div className="pt-0.5">
            <span className="inline-flex items-center rounded-lg bg-[#F3F7F4] px-2 py-0.5 text-[9.5px] sm:text-[10px] font-medium text-[#145A45] border border-[#D8E6DC] max-w-full truncate">
              {activeVariant?.label ? getVariantLabel(activeVariant) : t.singlePackLabel}
            </span>
          </div>
        )}

        {/* 3. Price & Add to Cart Row */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2 w-full min-w-0">
          {/* Price Stack */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-bold text-[#145A45] leading-tight tracking-tight">
              {inr(activeVariant?.price ?? 0)}
            </span>
            {off > 0 && activeVariant?.mrp ? (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] text-[#8C948F] line-through font-normal leading-none">
                  {inr(activeVariant.mrp)}
                </span>
                {saveAmount > 0 && (
                  <span className="rounded px-1.5 py-0.2 text-[8.5px] sm:text-[9px] font-semibold text-[#145A45] bg-[#E6EFE8] leading-tight">
                    {lang === "hi" ? `बचत ₹${saveAmount}` : `Save ₹${saveAmount}`}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Action Button: Consistent 12px Radius, Soft Shadow, Tactile Hover */}
          <div className="shrink-0">
            {inCart ? (
              <div className="flex h-8 sm:h-8.5 items-center rounded-xl bg-[#145A45] text-white px-1 shadow-xs border border-[#0F4A38]">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-6 items-center justify-center rounded-lg text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3 stroke-[2.5]" />
                </button>
                <span className="text-xs font-bold text-white px-2 text-center min-w-5 select-none">
                  {inCart.qty}
                </span>
                <button
                  type="button"
                  disabled={inCart.qty >= stock}
                  onClick={() => setQty(inCart.variantId, inCart.qty + 1)}
                  className="flex size-6 items-center justify-center rounded-lg text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!activeVariant || stock <= 0}
                onClick={() => {
                  if (!activeVariant) return;
                  add({
                    variantId: activeVariant.id,
                    productId: product.id,
                    slug: product.slug,
                    name: localizedProductName,
                    name_en: product.name_en || product.name,
                    name_hi: product.name_hi || null,
                    variantLabel: getVariantLabel(activeVariant) || "1 pack",
                    variantLabel_en: activeVariant.label_en || activeVariant.label,
                    variantLabel_hi: activeVariant.label_hi || null,
                    price: Number(activeVariant.price),
                    mrp: Number(activeVariant.mrp),
                    imageUrl: getProductImage(product),
                    stock: activeVariant.stock,
                  });
                  toast.success(`${localizedProductName} ${t.added.toLowerCase()}`, {
                    icon: <Check className="size-4 text-[#145A45]" />,
                  });
                }}
                className="flex h-8 sm:h-8.5 items-center justify-center gap-1 rounded-xl border border-[#145A45]/25 bg-white px-3 sm:px-3.5 text-xs font-bold text-[#145A45] hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="size-3.5 stroke-[2.5] shrink-0" />
                <span>{t.add}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="group relative flex flex-col justify-between w-full h-full min-h-[305px] sm:min-h-[335px] bg-white rounded-2xl border border-black/[0.06] p-3 sm:p-3.5 pb-3.5 sm:pb-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Skeleton className="w-full aspect-square rounded-xl bg-[#FAF8F5]" />
      <div className="flex flex-1 flex-col min-w-0 w-full pt-2.5 space-y-2">
        <Skeleton className="h-3 w-14 bg-[#FAF8F2]" />
        <Skeleton className="h-4 w-full bg-[#FAF8F2]" />
        <Skeleton className="h-4 w-3/4 bg-[#FAF8F2]" />
        <Skeleton className="h-5 w-16 rounded-lg bg-[#FAF8F2]" />
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 w-full">
          <Skeleton className="h-5 w-16 bg-[#FAF8F2]" />
          <Skeleton className="h-8 w-16 rounded-xl bg-[#E6EFE8]/70" />
        </div>
      </div>
    </div>
  );
}
