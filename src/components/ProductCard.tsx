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
      className="group relative flex flex-col justify-between w-full h-full min-h-[295px] sm:min-h-[325px] bg-white rounded-2xl border border-[#E4DFD5] p-2.5 sm:p-3 pb-3 sm:pb-3.5 shadow-[0_2px_8px_-2px_rgba(15,74,56,0.06),0_1px_2px_rgba(15,74,56,0.03),inset_0_1px_0_0_rgba(255,255,255,1)] hover:shadow-[0_12px_28px_-4px_rgba(15,74,56,0.14),0_4px_10px_-2px_rgba(15,74,56,0.04),inset_0_1px_0_0_rgba(255,255,255,1)] hover:border-[#145A45]/40 hover:-translate-y-1 transition-all duration-300"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* 1. Image Canvas Tile (Slightly taller aspect ratio for elegant grocery presentation) */}
      <div className="relative w-full aspect-[1/1.08] rounded-xl bg-gradient-to-b from-[#FBFDFA] via-[#F8FAF9] to-[#F1F6F3] border border-[#E7EFEA] p-2 sm:p-2.5 flex items-center justify-center overflow-hidden shadow-[inset_0_1px_2px_rgba(20,90,69,0.03)] group-hover:border-[#145A45]/25 transition-all">
        {/* Top Floating Discount Badge */}
        <div className="absolute top-1.5 left-1.5 z-10">
          {off > 0 ? (
            <span className="inline-flex items-center rounded-md bg-gradient-to-r from-[#D97706] to-[#B45309] px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-white tracking-tight shadow-[0_2px_6px_rgba(217,119,6,0.25)] border border-amber-300/35 glint-effect">
              {off}% {t.off}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-[#E6EFE8] border border-[#D4E2D8] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#0F4A38] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              {t.freshBadge}
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-white/95 backdrop-blur-xs border border-[#E2DDD3] text-[#5A655F] hover:text-[#DC2626] hover:border-[#DC2626]/40 shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all active:scale-90 cursor-pointer"
        >
          <Heart
            className={`size-3.5 sm:size-4 transition-transform active:scale-125 ${
              isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
            }`}
          />
        </button>

        {/* Product Image Link */}
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
            className="size-full object-contain mx-auto transition-transform duration-500 ease-out group-hover:scale-108 drop-shadow-xs select-none"
          />
        </Link>

        {/* Store Available Tag */}
        {stock > 0 && (
          <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/95 border border-[#E2DDD3] px-2 py-0.5 text-[8.5px] sm:text-[9px] font-bold text-[#145A45] shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Zap className="size-2.5 fill-[#145A45] text-[#145A45]" />
              <span>{lang === "hi" ? "उपलब्ध" : "In Stock"}</span>
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-2xs rounded-xl z-20">
            <span className="rounded-md bg-white border border-[#E0DACF] px-2.5 py-1 text-[10px] font-bold text-[#5A655F] shadow-xs">
              {t.outOfStock}
            </span>
          </div>
        )}
      </div>

      {/* 2. Product Details Section */}
      <div className="flex flex-1 flex-col min-w-0 w-full pt-2">
        {/* Brand / Category Micro-Tag */}
        <span className="text-[9px] sm:text-[10px] font-bold text-[#5A655F] tracking-wider uppercase truncate w-full">
          {product.brand || (lang === "hi" ? "दैनिक राशन" : "Fresh Staples")}
        </span>

        {/* Product Name Title */}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 mt-0.5 min-h-[2.5rem] sm:min-h-[2.8rem] text-xs sm:text-[13px] font-bold text-[#16201A] group-hover:text-[#145A45] transition-colors leading-snug break-words w-full"
          title={localizedProductName}
        >
          {localizedProductName}
        </Link>

        {/* Variant Chips / Weight Unit Badge */}
        {variants.length > 1 ? (
          <div className="mt-1.5 flex flex-wrap gap-1 min-w-0 w-full">
            {variants.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-md border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition-all max-w-full truncate cursor-pointer ${
                  v.id === activeVariant?.id
                    ? "border-[#145A45] bg-[#145A45] text-white shadow-[0_2px_6px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]"
                    : "border-[#E4DFD5] bg-white text-[#5A655F] hover:border-[#145A45] hover:text-[#145A45] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                }`}
              >
                {getVariantLabel(v)}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-1.5">
            <span className="inline-flex items-center rounded-md bg-[#F0F5F2] px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-[#145A45] border border-[#D1E2D6] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] max-w-full truncate">
              {activeVariant?.label ? getVariantLabel(activeVariant) : t.singlePackLabel}
            </span>
          </div>
        )}

        {/* 3. Price & Add to Cart Row */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-1.5 w-full min-w-0">
          {/* Price Stack */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-black text-[#0F4A38] leading-tight tracking-tight">
              {inr(activeVariant?.price ?? 0)}
            </span>
            {off > 0 && activeVariant?.mrp ? (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] sm:text-[10.5px] text-[#8A958F] line-through font-medium leading-none">
                  {inr(activeVariant.mrp)}
                </span>
                {saveAmount > 0 && (
                  <span className="rounded px-1.5 py-0.2 text-[8.5px] sm:text-[9px] font-black text-[#0F4A38] bg-[#E6EFE8] border border-[#D4E6D9] leading-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    {lang === "hi" ? `बचत ₹${saveAmount}` : `Save ₹${saveAmount}`}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Action Button: Blinkit / Zepto Style with Tactile Jewel Polish */}
          <div className="shrink-0">
            {inCart ? (
              <div className="flex h-8 sm:h-8.5 items-center rounded-xl bg-gradient-to-b from-[#145A45] to-[#0D4433] text-white px-1 shadow-[0_2px_8px_rgba(20,90,69,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#0D4433]">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-6 items-center justify-center rounded-lg text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3 stroke-[2.5]" />
                </button>
                <span className="text-xs font-black text-white px-2 text-center min-w-5 select-none">
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
                className="flex h-8 sm:h-8.5 items-center justify-center gap-1 rounded-xl border border-[#145A45]/30 bg-white px-3 sm:px-3.5 text-xs font-black text-[#145A45] hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 transition-all shadow-[0_2px_6px_rgba(20,90,69,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_4px_12px_rgba(20,90,69,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
      className="group relative flex flex-col justify-between w-full h-full min-h-[295px] sm:min-h-[325px] bg-white rounded-2xl border border-[#E4DFD5] p-2.5 sm:p-3 pb-3 sm:pb-3.5 shadow-[0_2px_8px_-2px_rgba(15,74,56,0.04),inset_0_1px_0_0_rgba(255,255,255,1)]"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Skeleton className="w-full aspect-[1/1.08] rounded-xl bg-gradient-to-b from-[#FBFDFA] to-[#F1F6F3] border border-[#E7EFEA]" />
      <div className="flex flex-1 flex-col min-w-0 w-full pt-2 space-y-1.5">
        <Skeleton className="h-3 w-14 bg-[#FAF8F2]" />
        <Skeleton className="h-4 w-full bg-[#FAF8F2]" />
        <Skeleton className="h-4 w-3/4 bg-[#FAF8F2]" />
        <Skeleton className="h-5 w-16 rounded-md bg-[#FAF8F2]" />
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 w-full">
          <Skeleton className="h-5 w-16 bg-[#FAF8F2]" />
          <Skeleton className="h-8 w-16 rounded-xl bg-[#E6EFE8]/70" />
        </div>
      </div>
    </div>
  );
}
