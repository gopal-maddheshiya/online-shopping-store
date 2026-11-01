import { Link } from "@tanstack/react-router";
import { Plus, Minus, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { isImageLoaded, markImageLoaded } from "@/lib/image-cache";
import { type Product } from "@/lib/queries";
import { discountPercent, inr } from "@/lib/format";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ProductCard({ product }: { product: Product }) {
  const { items, add, setQty } = useCart();
  const { t, lang, getProductName, getVariantLabel } = useLanguage();

  const variants = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? "");
  const imgSrc = getProductImage(product);
  const [imgLoaded, setImgLoaded] = useState(() => isImageLoaded(imgSrc));

  const activeVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const inCart = items.find((i) => i.variantId === activeVariant?.id);
  const stock = activeVariant?.stock ?? 0;
  const off = activeVariant
    ? discountPercent(Number(activeVariant.mrp), Number(activeVariant.price))
    : 0;
  const localizedProductName = getProductName(product);

  return (
    <div
      className="group relative flex flex-col justify-between w-full h-full bg-white rounded-xl sm:rounded-2xl border border-[#E5EAE6] hover:border-[#145A45]/40 p-2 sm:p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(20,90,69,0.08)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* 1. Top Badges: Premium Quick-Commerce Discount Tag (Left) */}
      {off > 0 && (
        <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none select-none">
          <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] text-white px-2 py-0.5 text-[10px] sm:text-[10.5px] font-black tracking-tight shadow-[0_2px_8px_rgba(29,78,216,0.32)] border border-white/25 leading-none">
            <span className="font-sans font-black">{off}%</span>
            <span className="text-[9px] sm:text-[9.5px] font-bold tracking-normal opacity-95">
              {lang === "hi" ? "छूट" : "OFF"}
            </span>
          </span>
        </div>
      )}

      {/* 2. Product Image Canvas (Restored full 1:1 square canvas so images never look patla/compressed) */}
      <div className="relative w-full">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="relative w-full aspect-square flex items-center justify-center overflow-hidden p-2 rounded-lg sm:rounded-xl bg-[#FAFBF9]"
        >
          {!imgLoaded && (
            <div className="absolute inset-1.5 rounded-lg img-loading-shimmer pointer-events-none" />
          )}
          <img
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0 && !imgLoaded) {
                markImageLoaded(imgSrc);
                setImgLoaded(true);
              }
            }}
            src={imgSrc}
            alt={localizedProductName}
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
            onLoad={() => {
              markImageLoaded(imgSrc);
              setImgLoaded(true);
            }}
            onError={(e) => {
              markImageLoaded(imgSrc);
              setImgLoaded(true);
              e.currentTarget.src = "/images/packaged.jpg";
            }}
            className={`size-full object-contain mx-auto transition-[transform,opacity] duration-200 ease-out group-hover:scale-105 select-none ${
              imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />

          {/* Out of Stock Overlay */}
          {stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-[1px] rounded-lg sm:rounded-xl z-20">
              <span className="rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10.5px] font-medium text-stone-600 shadow-2xs">
                {t.outOfStock}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 3. Product Details Section (Zero unnecessary vertical gap between title & weight) */}
      <div className="flex flex-1 flex-col min-w-0 w-full pt-1.5">
        {/* Product Name Title: natural height with line-clamp-2, no artificial min-h */}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-[13.5px] sm:text-[14.5px] font-semibold text-[#16201A] group-hover:text-[#145A45] transition-colors leading-[1.3] break-words"
          title={localizedProductName}
        >
          {localizedProductName}
        </Link>

        {/* Variant / Pack Size Selector: sits directly below the title */}
        <div className="mt-1 w-full">
          {variants.length > 1 ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group/pill w-full flex items-center justify-between rounded-lg bg-[#F3F7F4] hover:bg-[#E8F2EC] border border-[#CFE1D6] text-[#145A45] text-[11.5px] sm:text-[12px] font-semibold px-2 py-1 transition-all cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-[#145A45] active:scale-98"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Select pack size"
                >
                  <span className="truncate">
                    {activeVariant ? getVariantLabel(activeVariant) : t.singlePackLabel}
                  </span>
                  <ChevronDown className="size-3 text-[#145A45] shrink-0 opacity-70 group-hover/pill:opacity-100 transition-transform duration-200 group-data-[state=open]/pill:rotate-180" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                sideOffset={4}
                collisionPadding={8}
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] p-1 rounded-xl bg-white/98 backdrop-blur-md border border-[#D5E2D9] shadow-lg z-50 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 variant-dropdown-animated"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
                  {variants.map((v) => {
                    const isSelected = v.id === activeVariant?.id;
                    const isOutOfStock = v.stock <= 0;

                    return (
                      <DropdownMenuItem
                        key={v.id}
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) {
                            setSelectedVariantId(v.id);
                          }
                        }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors outline-none ${
                          isSelected
                            ? "bg-[#EBF5EF] text-[#145A45] font-bold"
                            : isOutOfStock
                            ? "text-stone-400 opacity-50 cursor-not-allowed"
                            : "text-[#1F2923] hover:bg-[#F4F7F5] font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isSelected ? (
                            <Check className="size-3 text-[#145A45] stroke-[3] shrink-0" />
                          ) : (
                            <span className="size-3 shrink-0" />
                          )}
                          <span className="truncate">{getVariantLabel(v)}</span>
                        </div>
                        <span className="font-bold price-flipkart text-[#145A45] shrink-0 ml-2">
                          {inr(Number(v.price))}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="text-[11.5px] sm:text-[12px] text-[#526058] font-medium truncate py-0.5">
              {activeVariant?.label ? getVariantLabel(activeVariant) : t.singlePackLabel}
            </div>
          )}
        </div>

        {/* 4. Bottom Price & ADD Action Row */}
        <div className="mt-auto pt-2 flex items-end justify-between gap-1.5 w-full">
          {/* Price Stack */}
          <div className="flex flex-col leading-none">
            <span className="text-[17px] sm:text-[18.5px] font-bold text-[#145A45] tracking-tight font-sans price-flipkart">
              {inr(activeVariant?.price ?? 0)}
            </span>
            {off > 0 && activeVariant?.mrp ? (
              <span className="text-[12px] sm:text-[13px] text-[#7A8880] line-through font-normal mt-0.5 price-flipkart">
                {inr(activeVariant.mrp)}
              </span>
            ) : null}
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            {stock <= 0 ? (
              <div className="h-7.5 sm:h-8 px-2.5 rounded-lg sm:rounded-xl border border-stone-200 bg-stone-50 text-stone-400 text-[11px] sm:text-xs font-medium flex items-center justify-center select-none">
                {t.outOfStock || "Out of Stock"}
              </div>
            ) : inCart ? (
              <div className="flex h-7.5 sm:h-8 min-w-[70px] sm:min-w-[78px] items-center justify-between rounded-lg sm:rounded-xl bg-[#145A45] text-white px-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty(inCart.variantId, inCart.qty - 1)}
                  className="flex size-5.5 sm:size-6 items-center justify-center rounded-md text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3.5 stroke-[2.5]" />
                </button>
                <span className="text-[13px] sm:text-[14px] font-bold text-white px-1 text-center select-none price-flipkart">
                  {inCart.qty}
                </span>
                <button
                  type="button"
                  disabled={inCart.qty >= stock}
                  onClick={() => setQty(inCart.variantId, inCart.qty + 1)}
                  className="flex size-5.5 sm:size-6 items-center justify-center rounded-md text-white hover:bg-white/20 active:scale-90 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
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
                className="h-7.5 sm:h-8 min-w-[64px] sm:min-w-[74px] px-2 sm:px-2.5 rounded-lg sm:rounded-xl border border-[#145A45] bg-[#F2F8F4] hover:bg-[#145A45] text-[#145A45] hover:text-white font-bold text-[12.5px] sm:text-[13.5px] tracking-wide uppercase transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>{t.add || "ADD"}</span>
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
      className="flex flex-col justify-between w-full h-full bg-white rounded-xl sm:rounded-2xl border border-[#E5EAE6] p-2 sm:p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden"
      style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      {/* Product Image Skeleton */}
      <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-[#FAFBF9] p-2 flex items-center justify-center">
        <Skeleton className="size-full rounded-md" />
        {/* Discount Tag skeleton */}
        <div className="absolute top-1.5 left-1.5 z-10 w-11 h-4 rounded-md overflow-hidden bg-blue-100/50 shadow-2xs">
          <Skeleton className="size-full" />
        </div>
      </div>

      {/* Product Information Skeleton */}
      <div className="flex flex-col flex-1 justify-between pt-1.5 space-y-1">
        <div className="space-y-1">
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-3/4 h-3.5 rounded-md" />
          <Skeleton className="w-16 h-4.5 rounded-md mt-1" />
        </div>

        {/* Price & Add Button Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Skeleton className="w-16 sm:w-18 h-5 rounded-md" />
            <Skeleton className="w-11 h-3 rounded-xs" />
          </div>
          <Skeleton className="w-16 sm:w-18 h-7.5 sm:h-8 rounded-lg sm:rounded-xl" />
        </div>
      </div>
    </div>
  );
}
