import { Link } from "@tanstack/react-router";
import { Plus, Minus, Heart, Check, Sparkles } from "lucide-react";
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
  const localizedProductName = getProductName(product.name, product.slug);

  return (
    <div
      className={`card-interactive group relative flex flex-col justify-between overflow-hidden bg-white p-3 sm:p-3.5 w-full max-w-full min-w-0 transition-all duration-200 ${
        inCart ? "border-[#145A45] ring-1 ring-[#145A45]/20 shadow-xs" : "border-[#E5E0D5]"
      }`}
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* Top Bar: Compact Discount Tag & Aligned Wishlist */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        {off > 0 ? (
          <span className="rounded-md bg-[#D97706] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white tracking-tight shrink-0 shadow-2xs">
            {off}% {t.off}
          </span>
        ) : (
          <span className="rounded-md bg-[#E6EFE8] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#0F4A38] shrink-0">
            {lang === "hi" ? "ताज़ा" : "Fresh"}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#DC2626] transition-colors"
        >
          <Heart
            className={`size-3.5 sm:size-4 transition-transform active:scale-125 ${
              isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""
            }`}
          />
        </button>
      </div>

      {/* Product Image Canvas - Native transparent PNG/WebP/SVG cutout support with prominent scale */}
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative my-2 flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden rounded-2xl bg-transparent p-1 transition-all duration-200 shrink-0 select-none"
        style={{
          height: "152px",
          maxHeight: "152px",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          boxSizing: "border-box",
          overflow: "hidden",
          borderRadius: "16px",
        }}
      >
        <img
          src={getProductImage(product)}
          alt={localizedProductName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/images/products/aashirvaad-atta.svg";
          }}
          className="h-[140px] sm:h-[146px] max-h-full max-w-full w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105 select-none"
          style={{
            maxHeight: "146px",
            maxWidth: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            margin: "0 auto",
            display: "block",
          }}
        />
        {stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-2xs rounded-2xl">
            <span className="rounded-md bg-[#FAF8F2] border border-[#E5E0D5] px-2 py-0.5 text-[10px] font-bold text-[#5A655F]">
              {t.outOfStock}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0 w-full max-w-full">
        <span className="text-[9px] sm:text-[10px] font-semibold text-[#5A655F] tracking-wider uppercase truncate w-full">
          {product.brand || (lang === "hi" ? "दैनिक राशन" : "Fresh Staples")}
        </span>

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 mt-0.5 min-h-[2.3rem] sm:min-h-[2.6rem] text-xs sm:text-sm font-bold text-[#16201A] hover:text-[#145A45] transition-colors leading-snug break-words w-full"
          title={localizedProductName}
        >
          {localizedProductName}
        </Link>

        {/* Variant / Pack Selector */}
        {variants.length > 1 ? (
          <div className="mt-1.5 flex flex-wrap gap-1 min-w-0 w-full">
            {variants.slice(0, 3).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-md border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition-all max-w-full truncate ${
                  v.id === activeVariant?.id
                    ? "border-[#145A45] bg-[#145A45] text-white shadow-2xs"
                    : "border-[#E5E0D5] bg-[#FAF8F2] text-[#5A655F] hover:border-[#145A45] hover:text-[#145A45]"
                }`}
              >
                {getVariantLabel(v.label)}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[10px] sm:text-[11px] font-medium text-[#5A655F] truncate w-full">
            {activeVariant?.label
              ? getVariantLabel(activeVariant.label)
              : lang === "hi"
                ? "1 पैकेट"
                : "1 pack"}
          </div>
        )}

        {/* Price & Action Row */}
        <div className="mt-auto pt-2.5 flex flex-col gap-1.5 w-full min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5 w-full min-w-0">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-sm sm:text-base font-black text-[#0F4A38]">
                {inr(activeVariant?.price ?? 0)}
              </span>
              {off > 0 && activeVariant?.mrp ? (
                <span className="text-[10px] sm:text-xs text-[#5A655F] line-through font-medium">
                  {inr(activeVariant.mrp)}
                </span>
              ) : null}
            </div>
            {saveAmount > 0 ? (
              <span className="text-[9px] sm:text-[10px] font-bold text-[#15803D] shrink-0">
                {t.save} ₹{saveAmount}
              </span>
            ) : null}
          </div>

          {/* Add / Stepper Button */}
          <div className="w-full min-w-0">
            {inCart ? (
              <div className="flex h-9 sm:h-9.5 w-full min-w-0 items-center justify-between rounded-lg border border-[#145A45] bg-[#E6EFE8] px-1 sm:px-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#0F4A38] hover:bg-white active:scale-95 transition-all"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="text-[11px] sm:text-xs font-black text-[#0F4A38] truncate px-0.5 text-center flex-1">
                  {inCart.qty} {lang === "hi" ? "कार्ट में" : "in cart"}
                </span>
                <button
                  type="button"
                  disabled={inCart.qty >= stock}
                  onClick={() => setQty(inCart.variantId, inCart.qty + 1)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#0F4A38] hover:bg-white active:scale-95 transition-all disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3.5" />
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
                    variantLabel: getVariantLabel(activeVariant.label),
                    price: Number(activeVariant.price),
                    mrp: Number(activeVariant.mrp),
                    imageUrl: getProductImage(product),
                    stock: activeVariant.stock,
                  });
                  toast.success(`${localizedProductName} ${t.added.toLowerCase()}`, {
                    icon: <Check className="size-4 text-[#145A45]" />,
                  });
                }}
                className="flex h-9 sm:h-9.5 w-full min-w-0 items-center justify-center gap-1 rounded-lg border border-[#145A45] bg-white px-2 text-xs font-bold text-[#145A45] hover:bg-[#145A45] hover:text-white active:scale-95 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
              >
                <Plus className="size-3.5 shrink-0" />
                <span className="truncate">{t.add}</span>
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
      className="card-base flex flex-col justify-between overflow-hidden bg-white p-3 sm:p-3.5 border border-[#E5E0D5] w-full max-w-full min-w-0"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        <Skeleton className="h-4 w-12 rounded-md bg-[#FAF8F2]" />
        <Skeleton className="size-7 rounded-full bg-[#FAF8F2]" />
      </div>

      {/* Image Skeleton Box */}
      <div
        className="relative my-2 flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden p-1 shrink-0"
        style={{
          height: "152px",
          maxHeight: "152px",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        <Skeleton className="size-24 rounded-2xl bg-[#FAF8F2]" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col min-w-0 w-full max-w-full space-y-1.5">
        <Skeleton className="h-3 w-16 bg-[#FAF8F2]" />
        <div className="min-h-[2.3rem] sm:min-h-[2.6rem] space-y-1">
          <Skeleton className="h-3.5 w-full bg-[#FAF8F2]" />
          <Skeleton className="h-3.5 w-3/4 bg-[#FAF8F2]" />
        </div>
        <Skeleton className="h-4 w-14 rounded-md bg-[#FAF8F2]" />

        {/* Price & Button skeleton */}
        <div className="mt-auto pt-2.5 flex flex-col gap-1.5 w-full min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-4 w-16 bg-[#FAF8F2]" />
            <Skeleton className="h-3 w-10 bg-[#FAF8F2]" />
          </div>
          <Skeleton className="h-9 sm:h-9.5 w-full rounded-lg bg-[#E6EFE8]/60" />
        </div>
      </div>
    </div>
  );
}

