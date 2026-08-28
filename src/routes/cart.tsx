import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Minus,
  Plus,
  Trash2,
  Heart,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { settingsQuery } from "@/lib/queries";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Cart" },
      {
        name: "description",
        content: "Review your grocery basket before checkout at Arun Gopal Traders, Maharajganj.",
      },
      { property: "og:title", content: "Arun Gopal Traders | Cart" },
      {
        property: "og:description",
        content: "Review items, quantities and totals before placing your order.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const {
    items,
    savedItems,
    subtotal,
    savings,
    setQty,
    remove,
    saveForLater,
    moveToCart,
    removeSaved,
    hydrated,
  } = useCart();
  const { data: s } = useQuery(settingsQuery);
  const { lang, t, getProductName, getVariantLabel } = useLanguage();

  const freeAt = Number(s?.free_delivery_threshold ?? 499);
  const fee = subtotal >= freeAt || subtotal === 0 ? 0 : Number(s?.delivery_fee ?? 30);
  const diffToFree = Math.max(0, freeAt - subtotal);

  if (hydrated && items.length === 0 && savedItems.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#FAF8F2] text-[#0F4A38] border border-[#E5E0D5]">
          <ShoppingBag className="size-8 text-[#145A45]" />
        </div>
        <h1 className="mt-4 font-sans text-2xl font-bold text-[#16201A]">{t.emptyCartTitle}</h1>
        <p className="mt-1 text-xs sm:text-sm text-[#5A655F]">{t.emptyCartSub}</p>
        <Button
          asChild
          className="mt-6 rounded-lg bg-[#145A45] px-8 text-xs font-bold text-white shadow-xs hover:bg-[#0A3628]"
        >
          <Link to="/shop">
            {lang === "hi" ? "किराना खरीदारी शुरू करें →" : "Start Shopping →"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-10 pb-28 lg:pb-10">
      <div className="flex items-baseline justify-between border-b border-[#E5E0D5] pb-3">
        <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#16201A]">{t.yourCart}</h1>
        <span className="text-xs font-semibold text-[#5A655F]">
          {items.length} {lang === "hi" ? "सामान" : "item(s)"}
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Items List Column */}
        <div className="space-y-4">
          {/* Free Delivery Bar */}
          {subtotal < freeAt && subtotal > 0 ? (
            <div className="card-base bg-[#FAF8F2] border border-[#E5E0D5] p-3.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#0F4A38] font-semibold">
                <Truck className="size-4 text-[#145A45]" />
                {lang === "hi"
                  ? `फ्री लोकल डिलीवरी के लिए ${inr(diffToFree)} का सामान और जोड़ें!`
                  : `Add ${inr(diffToFree)} more for FREE local delivery!`}
              </span>
              <Link to="/shop" className="text-xs font-bold text-[#145A45] hover:underline">
                {lang === "hi" ? "सामान जोड़ें →" : "Add Items →"}
              </Link>
            </div>
          ) : subtotal >= freeAt ? (
            <div className="card-base bg-[#E6EFE8] border border-[#145A45]/30 p-3.5 flex items-center gap-2 text-xs font-bold text-[#0F4A38]">
              <Truck className="size-4 text-[#145A45]" />
              {lang === "hi"
                ? "बधाई हो! आपको महाराजगंज में फ्री होम डिलीवरी मिल रही है।"
                : "You've unlocked FREE Home Delivery in Maharajganj!"}
            </div>
          ) : null}

          {/* Cart Item Cards */}
          <div className="space-y-3">
            {items.map((i) => {
              const displayName = getProductName(i.name, i.slug);
              const displayVariant = getVariantLabel(i.variantLabel);

              return (
                <div key={i.variantId} className="card-base flex items-center gap-4 p-4 bg-white border border-[#E5E0D5]">
                  <Link
                    to="/product/$slug"
                    params={{ slug: i.slug }}
                    className="size-20 shrink-0 overflow-hidden rounded-xl bg-white p-1 border border-[#E5E0D5] flex items-center justify-center shadow-2xs"
                    style={{ isolation: "isolate" }}
                  >
                    <img
                      src={getProductImage({ slug: i.slug, name: i.name, image_url: i.imageUrl })}
                      alt={displayName}
                      className="size-full object-contain object-center"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.slug }}
                      className="font-sans text-sm font-semibold text-[#16201A] hover:text-[#145A45] line-clamp-1"
                    >
                      {displayName}
                    </Link>
                    <p className="text-xs text-[#5A655F] mt-0.5">{displayVariant}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#16201A]">{inr(i.price)}</span>
                      {i.mrp > i.price && (
                        <span className="text-xs text-[#5A655F] line-through">{inr(i.mrp)}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex h-8 items-center rounded-lg border border-[#145A45] bg-[#E6EFE8] px-1">
                    <button
                      type="button"
                      onClick={() => setQty(i.variantId, i.qty - 1)}
                      className="flex size-6 items-center justify-center rounded text-[#0F4A38] hover:bg-white transition-colors"
                      aria-label="Decrease"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#0F4A38]">
                      {i.qty}
                    </span>
                    <button
                      type="button"
                      disabled={i.qty >= i.stock}
                      onClick={() => setQty(i.variantId, i.qty + 1)}
                      className="flex size-6 items-center justify-center rounded text-[#0F4A38] hover:bg-white transition-colors disabled:opacity-40"
                      aria-label="Increase"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Remove / Save */}
                  <div className="flex flex-col gap-1 text-right">
                    <button
                      type="button"
                      onClick={() => remove(i.variantId)}
                      className="flex size-7 items-center justify-center rounded-lg text-[#5A655F] hover:bg-[#FAF8F2] hover:text-red-600 transition-colors"
                      title={lang === "hi" ? "हटाएं" : "Remove"}
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => saveForLater(i.variantId)}
                      className="text-[10px] font-semibold text-[#5A655F] hover:text-[#145A45]"
                    >
                      {lang === "hi" ? "बाद के लिए" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Saved For Later Items */}
          {savedItems.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-[#E5E0D5] pt-6">
              <h2 className="font-sans text-base font-bold text-[#16201A]">
                {lang === "hi" ? "बाद के लिए सहेजे गए सामान" : "Saved for Later"} (
                {savedItems.length})
              </h2>
              {savedItems.map((i) => (
                <div
                  key={i.variantId}
                  className="card-base flex items-center justify-between p-3.5 bg-white border border-[#E5E0D5]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage({ slug: i.slug, name: i.name, image_url: i.imageUrl })}
                      alt={i.name}
                      className="size-12 rounded-lg object-contain bg-white p-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#16201A]">
                        {getProductName(i.name, i.slug)}
                      </p>
                      <p className="text-[11px] text-[#5A655F]">
                        {getVariantLabel(i.variantLabel)} · {inr(i.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveToCart(i.variantId)}
                      className="rounded-lg text-xs font-bold border-[#E5E0D5] text-[#0F4A38]"
                    >
                      {lang === "hi" ? "कार्ट में लाएं" : "Move to Cart"}
                    </Button>
                    <button
                      onClick={() => removeSaved(i.variantId)}
                      className="text-xs text-[#5A655F] hover:text-red-600"
                    >
                      {lang === "hi" ? "हटाएं" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary Column */}
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4 bg-white border border-[#E5E0D5]">
            <h2 className="font-sans text-base font-bold text-[#16201A]">
              {lang === "hi" ? "ऑर्डर का विवरण" : "Order Summary"}
            </h2>

            <div className="space-y-2.5 text-xs text-[#5A655F] border-b border-[#E5E0D5] pb-4">
              <div className="flex justify-between">
                <span>{t.itemSubtotal}</span>
                <span className="font-semibold text-[#16201A]">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.deliveryFee}</span>
                <span className="font-semibold text-[#145A45]">
                  {fee === 0 ? t.free : inr(fee)}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-[#15803D] font-bold">
                  <span>{t.savings}</span>
                  <span>- {inr(savings)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-base font-extrabold text-[#16201A]">
              <span>{t.totalAmount}</span>
              <span>{inr(subtotal + fee)}</span>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full rounded-lg bg-[#145A45] text-xs font-bold text-white shadow-xs hover:bg-[#0A3628]"
            >
              <Link to="/checkout">{t.proceedToCheckout} →</Link>
            </Button>
          </div>

          <div className="card-base p-4 text-xs text-[#5A655F] space-y-2 bg-white border border-[#E5E0D5]">
            <p className="flex items-center gap-2 font-bold text-[#0F4A38]">
              <ShieldCheck className="size-4 text-[#145A45]" /> {t.purityTagline} ({t.puritySub})
            </p>
            <p className="text-[11px]">
              {lang === "hi"
                ? "महाराजगंज में कैश ऑन डिलीवरी (COD), दुकान पर भुगतान अथवा यूपीआई उपलब्ध है।"
                : "Cash on Delivery (COD), Store Pickup and UPI payment options available in Maharajganj."}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-[#E5E0D5] bg-white/95 backdrop-blur-md p-3 lg:hidden shadow-lg">
          <div className="container-page flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-[#5A655F] uppercase font-bold">{t.totalAmount}</p>
              <p className="text-base font-extrabold text-[#16201A]">{inr(subtotal + fee)}</p>
            </div>
            <Button
              asChild
              className="flex-1 rounded-lg bg-[#145A45] text-xs font-bold text-white shadow-xs hover:bg-[#0A3628] active:scale-95 transition-all"
            >
              <Link to="/checkout">{t.proceedToCheckout} →</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
