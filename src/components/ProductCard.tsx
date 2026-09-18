import { Link } from "@tanstack/react-router";
import { Plus, Minus, Heart, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { type Product } from "@/lib/queries";
import { discountPercent, inr } from "@/lib/format";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCard({ product }: { product: Product }) {
  const { items, add, setQty } = useCart();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlist();
  const { t, getProductName, getVariantLabel } = useLanguage();

  const variants = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? "");
  const [imgLoaded, setImgLoaded] = useState(false);

  const activeVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const inCart = items.find((i) => i.variantId === activeVariant?.id);
  const stock = activeVariant?.stock ?? 0;
  const off = activeVariant
    ? discountPercent(Number(activeVariant.mrp), Number(activeVariant.price))
    : 0;
  const isWishlisted = inWishlist(product.id);
  const localizedProductName = getProductName(product);

  return (
    <div
      className="group relative flex flex-col justify-between w-full h-full bg-white rounded-[8px] border border-[#CCD3CE] hover:border-[#145A45]/60 p-2.5 sm:p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_8px_20px_-4px_rgba(20,90,69,0.12),0_2px_6px_-2px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 overflow-hidden"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* 1. Discount Ribbon (% OFF Flag with soft scalloped bottom) */}
      {off > 0 && (
        <div className="absolute top-0 left-2 sm:left-2.5 z-10 select-none drop-shadow-[0_2px_4px_rgba(37,111,239,0.25)]">
          <div className="relative flex flex-col items-center justify-center px-1.5 pt-1 pb-2 min-w-[28px] sm:min-w-[32px] leading-none">
            {/* SVG Background Tag with soft curved scallops */}
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
            <span className="relative z-10 text-[10px] sm:text-[10.5px] font-bold text-white tracking-tight">
              {off}%
            </span>
            <span className="relative z-10 text-[7px] sm:text-[7.5px] font-bold text-white uppercase tracking-wider mt-0.5">
              OFF
            </span>
          </div>
        </div>
      )}

      {/* 2. Wishlist Heart Button (Top-Right Subtle) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product);
        }}
        aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        className={`absolute top-1.5 right-1.5 z-10 flex size-6.5 items-center justify-center rounded-full bg-white/85 hover:bg-white text-[#9CA3AF] hover:text-[#DC2626] transition-all cursor-pointer shadow-2xs ${
          isWishlisted ? "opacity-100 bg-white" : "opacity-70 group-hover:opacity-100"
        }`}
      >
        <Heart
          className={`size-3.5 transition-transform active:scale-125 ${
            isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
          }`}
          strokeWidth={1.8}
        />
      </button>

      {/* 3. Product Image Area (Clean White Canvas with Progressive Shimmer) */}
      <div className="relative w-full">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="relative w-full aspect-square flex items-center justify-center overflow-hidden py-1 px-1.5 rounded-[6px]"
        >
          {!imgLoaded && (
            <div className="absolute inset-2 rounded-[6px] img-loading-shimmer pointer-events-none" />
          )}
          <img
            src={getProductImage(product)}
            alt={localizedProductName}
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgLoaded(true);
              e.currentTarget.src = "/images/packaged.jpg";
            }}
            className={`size-full max-h-[140px] sm:max-h-[160px] object-contain mx-auto transition-[transform,opacity] duration-300 ease-out group-hover:scale-105 select-none ${
              imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />

          {/* Out of Stock Overlay */}
          {stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-[6px] z-20">
              <span className="rounded-md bg-white border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-bold text-[#6B7280] shadow-xs">
                {t.outOfStock}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 4. Product Details Section */}
      <div className="flex flex-1 flex-col min-w-0 w-full pt-1">
        {/* Product Name Title */}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-xs sm:text-[13.5px] font-semibold text-[#18221D] group-hover:text-[#145A45] transition-colors leading-[1.38] mt-0.5 break-words min-h-[2.4rem] sm:min-h-[2.7rem]"
          title={localizedProductName}
        >
          {localizedProductName}
        </Link>

        {/* Pack Size / Unit / Variant Picker */}
        {variants.length > 1 ? (
          <div className="mt-0.5 flex items-center">
            <select
              value={activeVariant?.id}
              onChange={(e) => {
                e.stopPropagation();
                setSelectedVariantId(e.target.value);
              }}
              className="text-[11px] sm:text-xs text-[#5A655F] hover:text-[#18221D] font-medium bg-transparent border-0 p-0 pr-3 focus:ring-0 cursor-pointer underline decoration-dotted underline-offset-2"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {getVariantLabel(v)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-[11px] sm:text-xs text-[#5A655F] font-medium truncate mt-0.5">
            {activeVariant?.label ? getVariantLabel(activeVariant) : t.singlePackLabel}
          </div>
        )}

        {/* 5. Bottom Price & ADD Button Row */}
        <div className="mt-auto pt-2.5 flex items-end justify-between gap-2 w-full">
          {/* Price Stack */}
          <div className="flex flex-col leading-none">
            <span className="text-sm sm:text-base font-extrabold text-[#145A45] tracking-tight font-sans price-flipkart">
              {inr(activeVariant?.price ?? 0)}
            </span>
            {off > 0 && activeVariant?.mrp ? (
              <span className="text-[10px] sm:text-[11px] text-[#878787] line-through font-normal mt-0.5 price-flipkart">
                {inr(activeVariant.mrp)}
              </span>
            ) : null}
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            {stock <= 0 ? (
              <div className="h-7 sm:h-8 px-2.5 rounded-[6px] border border-stone-200 bg-stone-50 text-stone-400 text-[10px] sm:text-xs font-bold flex items-center justify-center select-none">
                {t.outOfStock || "Out of Stock"}
              </div>
            ) : inCart ? (
              <div className="flex h-7 sm:h-8 min-w-[68px] sm:min-w-[74px] items-center justify-between rounded-[6px] bg-[#145A45] text-white px-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-5.5 items-center justify-center rounded text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3 stroke-[3]" />
                </button>
                <span className="text-xs font-extrabold text-white px-1 text-center select-none price-flipkart">
                  {inCart.qty}
                </span>
                <button
                  type="button"
                  disabled={inCart.qty >= stock}
                  onClick={() => setQty(inCart.variantId, inCart.qty + 1)}
                  className="flex size-5.5 items-center justify-center rounded text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
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
                className={`h-7 sm:h-8 min-w-[66px] sm:min-w-[74px] px-2.5 rounded-[6px] border-2 border-[#145A45] bg-white hover:bg-[#145A45] text-[#145A45] hover:text-white font-extrabold text-xs sm:text-[13px] tracking-wider uppercase transition-all shadow-2xs active:scale-95 cursor-pointer flex flex-col items-center justify-center leading-tight ${
                  variants.length > 1 ? "py-0.5" : ""
                }`}
              >
                <span>{t.add || "ADD"}</span>
                {variants.length > 1 && (
                  <span className="text-[8.5px] font-semibold text-current opacity-80 lowercase -mt-0.5">
                    {variants.length} options
                  </span>
                )}
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
      className="flex flex-col justify-between w-full h-full bg-white rounded-[8px] border border-[#CCD3CE] p-2.5 sm:p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* Product Image & Discount Ribbon Skeleton */}
      <div className="relative w-full aspect-square rounded-[6px] overflow-hidden bg-[#F2EFE9]/40 border border-[#EAE6DC]/50">
        <Skeleton className="size-full rounded-[6px]" />
        {/* Soft Discount Ribbon Skeleton in corner */}
        <div className="absolute top-0 left-2 z-10 w-7 h-8 rounded-b-[4px] overflow-hidden bg-blue-100/50 shadow-2xs">
          <Skeleton className="size-full" />
        </div>
      </div>

      {/* Product Information Skeleton */}
      <div className="flex flex-col flex-1 justify-between pt-2.5 space-y-2">
        <div className="space-y-1.5">
          {/* Title line 1 */}
          <Skeleton className="w-full h-3.5 sm:h-4 rounded-md" />
          {/* Title line 2 */}
          <Skeleton className="w-3/4 h-3.5 sm:h-4 rounded-md" />
          {/* Pack size / unit */}
          <Skeleton className="w-16 h-3 rounded-sm mt-1" />
        </div>

        {/* Price & Add Button Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE6]">
          <div className="space-y-1">
            <Skeleton className="w-14 sm:w-16 h-4 sm:h-5 rounded-md" />
            <Skeleton className="w-10 h-2.5 rounded-xs" />
          </div>
          <Skeleton className="w-16 sm:w-18 h-7 sm:h-8 rounded-[6px]" />
        </div>
      </div>
    </div>
  );
}
