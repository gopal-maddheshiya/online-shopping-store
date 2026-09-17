import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ChevronRight,
  Home,
  Store,
  AlertCircle,
  Zap,
  Tag,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { toast } from "sonner";
import { cheapestVariant } from "@/lib/queries";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Wishlist" },
      {
        name: "description",
        content:
          "View your saved grocery favorites and add them to your basket at Arun Gopal Traders.",
      },
      { property: "og:title", content: "Arun Gopal Traders | Wishlist" },
      {
        property: "og:description",
        content: "Review items, quantities and totals before placing your order.",
      },
    ],
  }),
  component: WishlistPage,
});

const POPULAR_SHORTCUTS = [
  { id: "atta", icon: "🌾", label_hi: "आटा व दालें", label_en: "Atta & Dals", slug: "atta-flour" },
  { id: "oil", icon: "🛢️", label_hi: "तेल व घी", label_en: "Oils & Ghee", slug: "oil-ghee" },
  { id: "spices", icon: "🧂", label_hi: "मसाले व नमक", label_en: "Spices & Salt", slug: "spices-masala" },
  { id: "snacks", icon: "🍪", label_hi: "बिस्कुट व नमकीन", label_en: "Biscuits & Snacks", slug: "biscuits" },
  { id: "cleaning", icon: "🧼", label_hi: "सफ़ाई व बर्तन", label_en: "Cleaning Essentials", slug: "household-cleaning" },
];

function WishlistPage() {
  const { items, clear } = useWishlist();
  const { add } = useCart();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleMoveAllToCart() {
    if (items.length === 0) return;
    let addedCount = 0;
    let outOfStockCount = 0;

    items.forEach((p) => {
      const v = cheapestVariant(p);
      if (v && v.stock > 0) {
        add({
          variantId: v.id,
          productId: p.id,
          slug: p.slug,
          name: getProductName(p),
          name_en: p.name_en || p.name,
          name_hi: p.name_hi || null,
          variantLabel: getVariantLabel(v) || "1 pack",
          variantLabel_en: v.label_en || v.label,
          variantLabel_hi: v.label_hi || null,
          price: Number(v.price),
          mrp: Number(v.mrp),
          imageUrl: getProductImage(p),
          stock: v.stock,
        });
        addedCount++;
      } else {
        outOfStockCount++;
      }
    });

    if (addedCount > 0) {
      if (outOfStockCount > 0) {
        toast.success(
          lang === "hi"
            ? `${addedCount} सामान थैले में जोड़े गए (${outOfStockCount} आउट ऑफ स्टॉक)`
            : `Added ${addedCount} items to cart (${outOfStockCount} out of stock)`,
        );
      } else {
        toast.success(
          lang === "hi"
            ? `सभी ${addedCount} सामान थैले में सफलतापूर्वक जोड़े गए!`
            : `All ${addedCount} items moved to shopping cart!`,
        );
      }
    } else if (outOfStockCount > 0) {
      toast.error(
        lang === "hi"
          ? "पसंदीदा सूची के सभी सामान वर्तमान में आउट ऑफ स्टॉक हैं।"
          : "All wishlist items are currently out of stock.",
      );
    }
  }

  // --- EMPTY STATE ---
  if (items.length === 0) {
    return (
      <div className="container-page py-5 sm:py-7 pb-28 lg:pb-16 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[#5A655F]">
          <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#145A45]">
            <Home className="size-3.5" />
            <span>{t.home}</span>
          </Link>
          <ChevronRight className="size-3 text-gray-400" />
          <span className="font-semibold text-[#16201A]">{t.myWishlistTitle || t.myWishlist}</span>
        </nav>

        {/* Empty State Box */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-9 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {/* Brand Emerald Green Heart Icon Badge */}
          <div className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-b from-[#EBF3ED] to-[#DCECE0] border border-[#145A45]/25 text-[#145A45] shadow-[0_2px_8px_rgba(20,90,69,0.08)]">
            <Heart className="size-8 fill-[#145A45]/20 text-[#145A45] transition-transform hover:scale-105 duration-200" />
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#145A45] text-[9.5px] font-bold text-white shadow-xs">
              0
            </span>
          </div>

          <h1 className="mt-4 font-sans text-xl sm:text-2xl font-bold tracking-tight text-[#16201A]">
            {lang === "hi" ? "आपकी पसंदीदा सूची अभी खाली है" : (t.emptyWishlistTitle || "Your Wishlist is Empty")}
          </h1>

          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#5A655F]">
            {lang === "hi"
              ? "रोजमर्रा के जरूरी सामानों (आटा, दाल, तेल, मसाले आदि) पर दिल (❤️) आइकन दबाएं ताकि अगली बार 1-क्लिक में थैले में जोड़ सकें।"
              : (t.emptyWishlistSubtitle || "Save your daily staples, spices, and groceries by tapping the heart icon on any product.")}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button
              asChild
              className="h-8.5 rounded-lg bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] px-4 text-xs font-bold text-white shadow-[0_2px_6px_rgba(20,90,69,0.2)] hover:from-[#0F4A38] hover:to-[#07271D] cursor-pointer"
            >
              <Link to="/shop" className="inline-flex items-center gap-1.5">
                <Store className="size-3.5" />
                <span>{lang === "hi" ? "किराना सामान देखें" : (t.browseCatalogueBtn || "Browse Grocery")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Quick Category Discovery Pills */}
          <div className="mt-7 border-t border-[#E5E7EB]/80 pt-5">
            <p className="text-[11px] font-semibold text-[#16201A] uppercase tracking-wider mb-2.5">
              {lang === "hi" ? "किराना श्रेणियां ब्राउज़ करें" : "Explore Popular Grocery Categories"}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {POPULAR_SHORTCUTS.map((cat) => (
                <Link
                  key={cat.id}
                  to="/shop"
                  search={{ category: cat.slug }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-medium text-[#374151] hover:border-[#145A45]/40 hover:bg-[#EBF3ED] hover:text-[#145A45] transition-all shadow-xs"
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span>{lang === "hi" ? cat.label_hi : cat.label_en}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Micro Benefits of Wishlist */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left border-t border-[#E5E7EB]/80 pt-5">
            <div className="rounded-xl border border-[#E5E7EB]/80 bg-[#FAF8F5] p-2.5 flex items-start gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg bg-white border border-[#E5E7EB] text-[#145A45] shrink-0 shadow-xs">
                <Zap className="size-3.5" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-[#16201A]">
                  {lang === "hi" ? "1-क्लिक में ऑर्डर" : "1-Click Order"}
                </h2>
                <p className="text-[10px] text-[#5A655F] mt-0.5 leading-snug">
                  {lang === "hi" ? "सीधे एक साथ थैले में जोड़ें।" : "Move all staples to cart."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB]/80 bg-[#FAF8F5] p-2.5 flex items-start gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg bg-white border border-[#E5E7EB] text-amber-600 shrink-0 shadow-xs">
                <Tag className="size-3.5" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-[#16201A]">
                  {lang === "hi" ? "ताज़ा रेट व छूट" : "Best Rates"}
                </h2>
                <p className="text-[10px] text-[#5A655F] mt-0.5 leading-snug">
                  {lang === "hi" ? "डिस्काउंट सामने दिखेंगे।" : "Updated store discounts."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB]/80 bg-[#FAF8F5] p-2.5 flex items-start gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg bg-white border border-[#E5E7EB] text-blue-600 shrink-0 shadow-xs">
                <ClipboardList className="size-3.5" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-[#16201A]">
                  {lang === "hi" ? "डिजिटल राशन पर्चा" : "Grocery List"}
                </h2>
                <p className="text-[10px] text-[#5A655F] mt-0.5 leading-snug">
                  {lang === "hi" ? "मासिक राशन सुरक्षित रहता है।" : "Monthly list in pocket."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- FILLED STATE ---
  return (
    <div className="container-page py-5 sm:py-7 pb-28 lg:pb-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-3.5 flex items-center gap-1.5 text-xs text-[#5A655F]">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#145A45]">
          <Home className="size-3.5" />
          <span>{t.home}</span>
        </Link>
        <ChevronRight className="size-3 text-gray-400" />
        <span className="font-semibold text-[#16201A]">{t.myWishlistTitle || t.myWishlist}</span>
      </nav>

      {/* Safety Confirmation Dialog for Clearing Wishlist */}
      {showClearConfirm && (
        <div className="mb-3.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 shadow-xs flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              {lang === "hi"
                ? "क्या आप पूरी पसंदीदा सूची खाली करना चाहते हैं? सभी सहेजे गए सामान हट जाएंगे।"
                : "Are you sure you want to clear your entire wishlist? All saved items will be removed."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="h-7 px-2.5 rounded-md border-gray-300 bg-white text-gray-700 text-[11px] hover:bg-gray-100 cursor-pointer"
            >
              {lang === "hi" ? "रद्द करें" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                clear();
                setShowClearConfirm(false);
                toast.info(lang === "hi" ? "पसंदीदा सूची खाली कर दी गई" : "Wishlist cleared");
              }}
              className="h-7 px-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold shadow-xs cursor-pointer"
            >
              <Trash2 className="size-3 mr-1" />
              {lang === "hi" ? "हाँ, खाली करें" : "Clear"}
            </Button>
          </div>
        </div>
      )}

      {/* Wishlist Header & Actions — compact, proportional sizing */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3.5 sm:pb-4">
        <div className="flex items-center gap-2.5">
          {/* Green Heart Badge matching store brand */}
          <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-[#EBF3ED] border border-[#145A45]/20 text-[#145A45] shadow-xs shrink-0">
            <Heart className="size-4.5 fill-[#145A45]/20 text-[#145A45]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-lg sm:text-xl font-bold text-[#16201A]">
                {t.myWishlistTitle || t.myWishlist}
              </h1>
              <span className="inline-flex items-center rounded-full bg-[#EBF3ED] px-2 py-0.5 text-[11px] font-bold text-[#145A45] border border-[#145A45]/20">
                {items.length} {lang === "hi" ? "सामान" : "items"}
              </span>
            </div>
            <p className="text-[11px] text-[#5A655F]">
              {lang === "hi"
                ? "सहेजे गए किराना सामानों को 1-क्लिक में थैले में जोड़ें।"
                : "Move saved grocery favorites into the cart in one click."}
            </p>
          </div>
        </div>

        {/* Properly proportioned, compact buttons (h-8) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Move All to Cart */}
          <Button
            onClick={handleMoveAllToCart}
            className="h-8 rounded-lg bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] gap-1.5 px-3 text-[11px] sm:text-xs font-bold text-white shadow-[0_1px_4px_rgba(20,90,69,0.2)] hover:from-[#0F4A38] hover:to-[#07271D] cursor-pointer"
          >
            <ShoppingBag className="size-3.5" />
            <span>{lang === "hi" ? "सभी थैले में डालें" : (t.moveAllToCartBtn || "Move All")}</span>
          </Button>

          {/* Continue Shopping */}
          <Button
            asChild
            variant="outline"
            className="h-8 rounded-lg border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F3F4F6] hover:text-[#16201A] px-2.5 text-[11px] sm:text-xs font-medium cursor-pointer shadow-xs"
          >
            <Link to="/shop" className="inline-flex items-center gap-1">
              <Store className="size-3.5 text-[#145A45]" />
              <span>{lang === "hi" ? "और सामान देखें" : "Browse More"}</span>
            </Link>
          </Button>

          {/* Clear Wishlist Button */}
          <Button
            onClick={() => setShowClearConfirm((prev) => !prev)}
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-[#E5E7EB] bg-white text-[#6B7280] hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-xs cursor-pointer"
            aria-label="Clear wishlist"
            title={lang === "hi" ? "पसंदीदा सूची खाली करें" : "Clear wishlist"}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="mt-5 grocery-grid">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
