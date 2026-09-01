import { Link } from "@tanstack/react-router";
import { Plus, Minus, Heart, Check } from "lucide-react";
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
    activeVariant && activeVariant.mrp > activeVariant.price
      ? Math.round(Number(activeVariant.mrp) - Number(activeVariant.price))
      : 0;
  const isWishlisted = inWishlist(product.id);
  const localizedProductName = getProductName(product);

  return (
    <div
      className="group relative flex flex-col justify-between w-full max-w-full min-w-0 pb-3 sm:pb-3.5 transition-all duration-200"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* Product Image Canvas on crisp tile */}
      <div className="relative w-full aspect-square rounded-2xl bg-white border border-[#EAE6DC] p-2 flex items-center justify-center overflow-hidden group-hover:border-[#145A45]/40 group-hover:shadow-md transition-all duration-300">
        {/* Top Floating Badge & Wishlist Button */}
        <div className="absolute top-2 left-2 z-10">
          {off > 0 ? (
            <span className="rounded-md bg-[#D97706] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white tracking-tight shadow-xs">
              {off}% {t.off}
            </span>
          ) : (
            <span className="rounded-md bg-[#E6EFE8] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#0F4A38]">
              {t.freshBadge}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-[#5A655F] hover:text-[#DC2626] hover:bg-white shadow-2xs transition-all cursor-pointer"
        >
          <Heart
            className={`size-3.5 sm:size-4 transition-transform active:scale-125 ${
              isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
            }`}
          />
        </button>

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="size-full flex items-center justify-center"
        >
          <img
            src={getProductImage(product)}
            alt={localizedProductName}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/images/packaged.jpg";
            }}
            className="size-full object-contain mx-auto transition-transform duration-300 group-hover:scale-108 drop-shadow-xs select-none"
          />
        </Link>

        {stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-2xs rounded-2xl">
            <span className="rounded-md bg-[#FAF8F2] border border-[#E5E0D5] px-2 py-0.5 text-[10px] font-bold text-[#5A655F]">
              {t.outOfStock}
            </span>
          </div>
        )}
      </div>

      {/* Content Section (Open, Unboxed) */}
      <div className="flex flex-1 flex-col min-w-0 w-full pt-2">
        <span className="text-[9px] sm:text-[10px] font-semibold text-[#5A655F] tracking-wider uppercase truncate w-full">
          {product.brand || (lang === "hi" ? "दैनिक राशन" : "Fresh Staples")}
        </span>

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 mt-0.5 min-h-[2.3rem] sm:min-h-[2.5rem] text-xs sm:text-sm font-bold text-[#16201A] group-hover:text-[#145A45] transition-colors leading-snug break-words w-full"
          title={localizedProductName}
        >
          {localizedProductName}
        </Link>

        {/* Variant Chips */}
        {variants.length > 1 ? (
          <div className="mt-1 flex flex-wrap gap-1 min-w-0 w-full">
            {variants.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-md border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition-all max-w-full truncate cursor-pointer ${
                  v.id === activeVariant?.id
                    ? "border-[#145A45] bg-[#145A45] text-white shadow-2xs"
                    : "border-[#E5E0D5] bg-white text-[#5A655F] hover:border-[#145A45] hover:text-[#145A45]"
                }`}
              >
                {getVariantLabel(v)}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-[#5A655F] truncate w-full">
            {activeVariant?.label ? getVariantLabel(activeVariant) : t.singlePackLabel}
          </div>
        )}

        {/* Price & Add to Cart Action */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-1.5 w-full min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-black text-[#0F4A38] leading-tight">
              {inr(activeVariant?.price ?? 0)}
            </span>
            {off > 0 && activeVariant?.mrp ? (
              <span className="text-[10px] text-[#5A655F] line-through font-medium leading-none">
                {inr(activeVariant.mrp)}
              </span>
            ) : null}
          </div>

          <div className="shrink-0">
            {inCart ? (
              <div className="flex h-8 sm:h-8.5 items-center rounded-xl border border-[#145A45] bg-[#E6EFE8] px-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-6 items-center justify-center rounded-lg text-[#0F4A38] hover:bg-white active:scale-95 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3" />
                </button>
                <span className="text-xs font-black text-[#0F4A38] px-2 text-center">
                  {inCart.qty}
                </span>
                <button
                  type="button"
                  disabled={inCart.qty >= stock}
                  onClick={() => setQty(inCart.variantId, inCart.qty + 1)}
                  className="flex size-6 items-center justify-center rounded-lg text-[#0F4A38] hover:bg-white active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3" />
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
                className="flex h-8 sm:h-8.5 items-center justify-center gap-1 rounded-xl border border-[#145A45] bg-white px-3 sm:px-3.5 text-xs font-black text-[#145A45] hover:bg-[#145A45] hover:text-white active:scale-95 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="size-3.5 shrink-0" />
                <span>{t.add}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Vertical Divider (Between adjacent items) */}
      <div className="absolute top-2 -right-1.5 sm:-right-2 md:-right-2.5 bottom-2 w-px bg-gradient-to-b from-transparent via-[#EAE6DC] to-transparent pointer-events-none" />

      {/* Subtle Bottom Divider */}
      <div className="w-full h-px bg-gradient-to-r from-[#EAE6DC]/20 via-[#EAE6DC] to-[#EAE6DC]/20 mt-3 sm:mt-3.5" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="group relative flex flex-col justify-between w-full max-w-full min-w-0 pb-3 sm:pb-3.5"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Skeleton className="w-full aspect-square rounded-2xl bg-[#FAF8F2]" />
      <div className="flex flex-1 flex-col min-w-0 w-full pt-2 space-y-1.5">
        <Skeleton className="h-3 w-16 bg-[#FAF8F2]" />
        <Skeleton className="h-4 w-full bg-[#FAF8F2]" />
        <Skeleton className="h-4 w-3/4 bg-[#FAF8F2]" />
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 w-full">
          <Skeleton className="h-5 w-16 bg-[#FAF8F2]" />
          <Skeleton className="h-8 w-16 rounded-xl bg-[#E6EFE8]/60" />
        </div>
      </div>
      <div className="absolute top-2 -right-1.5 sm:-right-2 md:-right-2.5 bottom-2 w-px bg-[#EAE6DC]" />
      <div className="w-full h-px bg-[#EAE6DC] mt-3" />
    </div>
  );
}
