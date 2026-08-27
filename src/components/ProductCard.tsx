import { Link } from "@tanstack/react-router";
import { Plus, Minus, Heart, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { type Product } from "@/lib/queries";
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
      className={`card-base group relative flex flex-col justify-between overflow-hidden bg-white p-2.5 sm:p-3.5 transition-all duration-300 w-full max-w-full min-w-0 ${
        inCart ? "border-[#18483B]/30 ring-1 ring-[#18483B]/10 shadow-xs" : ""
      }`}
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* Top Header: Floating Discount Tag & Wishlist */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        {off > 0 ? (
          <span className="rounded-full bg-gradient-to-r from-[#18483B] to-[#15803D] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-2xs shrink-0">
            {off}% {t.off}
          </span>
        ) : (
          <span className="rounded-full bg-[#FAF8F5] px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#676D68] shrink-0">
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
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#676D68] hover:bg-[#F4F1EB] hover:text-[#DC2626] transition-colors"
        >
          <Heart
            className={`size-3.5 sm:size-4 transition-transform active:scale-125 ${isWishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""}`}
          />
        </button>
      </div>

      {/* Product Image Box - Contained, clean supermarket showcase */}
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative my-2 flex w-full min-w-0 max-w-full items-center justify-center overflow-hidden rounded-xl bg-white border border-[#EFECE6] p-1.5 sm:p-2 transition-all duration-200 group-hover:border-[#18483B]/30 group-hover:shadow-xs shrink-0"
        style={{
          height: "130px",
          maxHeight: "130px",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <img
          src={getProductImage(product)}
          alt={localizedProductName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/images/products/aashirvaad-atta.jpg";
          }}
          className="max-h-[115px] max-w-full w-auto h-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
          style={{
            maxHeight: "115px",
            maxWidth: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            margin: "0 auto",
            display: "block",
          }}
        />
        {stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-2xs">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[#676D68] shadow-2xs">
              {t.outOfStock}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0 w-full max-w-full">
        <span className="text-[9px] sm:text-[10px] font-semibold text-[#676D68] tracking-wide uppercase truncate w-full">
          {product.brand || (lang === "hi" ? "दैनिक राशन" : "Fresh Staples")}
        </span>

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 mt-0.5 min-h-[2.1rem] sm:min-h-[2.4rem] text-xs sm:text-sm font-bold text-[#191C1B] hover:text-[#18483B] transition-colors leading-snug break-words w-full"
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
                className={`rounded-full border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition-all max-w-full truncate ${
                  v.id === activeVariant?.id
                    ? "border-[#18483B] bg-[#18483B] text-white"
                    : "border-[#EAE6DF] bg-[#FAF8F5] text-[#676D68] hover:border-[#18483B]"
                }`}
              >
                {getVariantLabel(v.label)}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[10px] sm:text-[11px] text-[#676D68] truncate w-full">
            {activeVariant?.label
              ? getVariantLabel(activeVariant.label)
              : lang === "hi"
                ? "1 पैकेट"
                : "1 pack"}
          </div>
        )}

        {/* Price & Action Row */}
        <div className="mt-auto pt-2 flex flex-col gap-1.5 w-full min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5 w-full min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-[#191C1B]">
                {inr(activeVariant?.price ?? 0)}
              </span>
              {off > 0 && activeVariant?.mrp ? (
                <span className="text-[10px] text-[#676D68] line-through font-medium">
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

          {/* Wide 40-44px Touch-Friendly Add / Stepper Button */}
          <div className="w-full min-w-0">
            {inCart ? (
              <div className="flex h-9 sm:h-10 w-full min-w-0 items-center justify-between rounded-full border border-[#18483B] bg-[#EBF4F0] px-1 sm:px-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#18483B] hover:bg-white active:scale-95 transition-all"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="text-[10px] sm:text-xs font-black text-[#18483B] truncate px-0.5 text-center flex-1">
                  {inCart.qty} {lang === "hi" ? "जोड़ा" : "in cart"}
                </span>
                <button
                  type="button"
                  disabled={inCart.qty >= stock}
                  onClick={() => setQty(inCart.variantId, inCart.qty + 1)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#18483B] hover:bg-white active:scale-95 transition-all disabled:opacity-40"
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
                    icon: <Check className="size-4 text-[#18483B]" />,
                  });
                }}
                className="flex h-9 sm:h-10 w-full min-w-0 items-center justify-center gap-1 rounded-full border border-[#18483B] bg-white px-2 text-xs font-extrabold text-[#18483B] hover:bg-[#18483B] hover:text-white active:scale-95 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
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
