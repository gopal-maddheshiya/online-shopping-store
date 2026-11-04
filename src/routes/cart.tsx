import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Truck,
  Store,
  ShieldCheck,
  ChevronRight,
  Home,
  Bookmark,
  Search,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage, getCategoryThumbnail } from "@/lib/product-images";
import { settingsQuery, productsQuery, categoriesQuery } from "@/lib/queries";
import { inr } from "@/lib/format";
import { NOINDEX_ROBOTS_META } from "@/lib/seo";
import { ProductCard } from "@/components/ProductCard";
import { isImageLoaded, markImageLoaded } from "@/lib/image-cache";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      ...NOINDEX_ROBOTS_META,
      { title: "अरुण गोपाल ट्रेडर्स | थैला — Arun Gopal Traders" },
      {
        name: "description",
        content: "Review your grocery basket before checkout at Arun Gopal Traders, Maharajganj.",
      },
      { property: "og:title", content: "अरुण गोपाल ट्रेडर्स | थैला" },
      {
        property: "og:description",
        content: "Review items, quantities and totals before placing your order.",
      },
    ],
  }),
  component: CartPage,
});

function CategoryTileThumbnail({
  category,
  name,
}: {
  category: { slug?: string; name?: string; image_url?: string | null };
  name: string;
}) {
  const src = getCategoryThumbnail(category);
  const [loaded, setLoaded] = useState(() => isImageLoaded(src));

  return (
    <img
      ref={(el) => {
        if (el && el.complete && el.naturalWidth > 0 && !loaded) {
          markImageLoaded(src);
          setLoaded(true);
        }
      }}
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onLoad={() => {
        markImageLoaded(src);
        setLoaded(true);
      }}
      onError={(e) => {
        e.currentTarget.src = "/agt-icon.png";
      }}
      className={`size-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"
        }`}
    />
  );
}

function EmptyCartView({ handleGoBack }: { handleGoBack: () => void }) {
  const { lang, t, getCategoryName } = useLanguage();
  const { data: allProducts } = useQuery(productsQuery());
  const { data: categories } = useQuery(categoriesQuery);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    void navigate({ to: "/shop", search: { q } });
  };

  const essentialProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const catMap = new Map((categories ?? []).map((c) => [c.id, c.slug]));
    const nonGrocerySlugs = new Set(["plastic-containers", "steel-bartan", "crockery"]);
    return allProducts
      .filter((p) => {
        const catSlug = (p.category_id && catMap.get(p.category_id)) || "";
        return (
          !nonGrocerySlugs.has(catSlug) &&
          (p.product_variants?.some((v) => v.stock > 0) ?? true)
        );
      })
      .slice(0, 8);
  }, [allProducts, categories]);

  const displayCategories = useMemo(() => {
    const list = categories ?? [];
    const parentCats = list.filter((c) => !c.parent_id);
    if (parentCats.length > 0) {
      const preferredSlugs = [
        "atta-flour",
        "oil-ghee",
        "spices-masala",
        "namkeen-snacks",
        "household-cleaning",
        "puja-samagri",
      ];
      const prioritized = parentCats.filter((c) => preferredSlugs.includes(c.slug));
      const remaining = parentCats.filter((c) => !preferredSlugs.includes(c.slug));
      return [...prioritized, ...remaining].slice(0, 6);
    }
    return [];
  }, [categories]);

  return (
    <div className="container-page py-4 sm:py-6 pb-28 lg:pb-16 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#3D4C44]">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#145A45]">
          <Home className="size-3.5" />
          <span>{t.home}</span>
        </Link>
        <ChevronRight className="size-3 text-gray-400" />
        <span className="font-semibold text-[#16201A]">{t.cart || (lang === "hi" ? "थैला" : "Cart")}</span>
      </nav>

      {/* 1. Hero Empty State Card */}
      <div className="rounded-3xl border border-[rgba(20,90,69,0.14)] bg-white p-6 sm:p-8 text-center shadow-[0_4px_24px_-4px_rgba(20,90,69,0.07),inset_0_1px_0_rgba(255,255,255,1)]">
        <div className="relative mx-auto grid size-20 sm:size-22 place-items-center rounded-3xl bg-gradient-to-b from-[#EBF5EE] to-[#DCEDE1] border border-[#145A45]/20 text-[#145A45] shadow-[0_4px_16px_rgba(20,90,69,0.1)]">
          <ShoppingBag className="size-10 sm:size-11 text-[#145A45] transition-transform hover:scale-105 duration-200" />
          <span className="absolute -top-1.5 -right-1.5 flex size-5.5 items-center justify-center rounded-full bg-[#145A45] text-[10.5px] font-black text-white shadow-xs border-2 border-white">
            0
          </span>
        </div>

        <h1 className="mt-4 font-sans text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#16201A]">
          {t.emptyCartTitle}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-[#46544D]">
          {lang === "hi"
            ? "घर के राशन का जरूरी सामान अभी जोड़ें — 30 मिनट में ताज़ा डिलीवरी!"
            : "Add daily essentials to your cart now — Fresh 30-minute delivery!"}
        </p>

        {/* Quick In-Page Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-4 sm:mt-5 max-w-md mx-auto flex items-center rounded-2xl border border-[#E5EAE6] bg-[#FAF8F5] p-1.5 focus-within:border-[#145A45] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#145A45]/15 transition-all shadow-2xs"
        >
          <Search className="size-4 text-[#546059] ml-2.5 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === "hi"
                ? "आटा, तेल, दाल, चीनी या कोई भी सामान खोजें..."
                : "Search flour, oil, dal, sugar..."
            }
            className="w-full bg-transparent px-2.5 py-1 text-xs text-[#16201A] placeholder:text-[#8C9B92] outline-none"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 rounded-xl bg-[#145A45] hover:bg-[#0F4A38] text-xs font-bold text-white px-3.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            {lang === "hi" ? "खोजें" : "Search"}
          </Button>
        </form>

        {/* Primary Action Buttons */}
        <div className="mt-4 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleGoBack}
            aria-label="Go back"
            title={lang === "hi" ? "पीछे जाएं" : "Go Back"}
            className="flex size-9 items-center justify-center rounded-xl border border-[#E5EAE6] bg-white hover:bg-[#EBF5EE] text-[#145A45] transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
          <Button
            asChild
            className="h-9 rounded-xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] px-5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(20,90,69,0.22)] active:scale-95 cursor-pointer transition-all"
          >
            <Link to="/shop" className="inline-flex items-center gap-1.5">
              <Store className="size-4" />
              <span>{lang === "hi" ? "दुकान का पूरा किराना देखें" : "Browse Full Store"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* 2. Visual Popular Category Tiles */}
        {displayCategories.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#E5EAE6]/80 text-left">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-sans text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#16201A] flex items-center gap-1.5">
                <span className="text-sm">📂</span>
                <span>{lang === "hi" ? "किराना श्रेणियां ब्राउज़ करें" : "Popular Grocery Categories"}</span>
              </h2>
              <Link to="/shop" className="text-xs font-bold text-[#145A45] hover:underline">
                {lang === "hi" ? "सभी देखें →" : "View All →"}
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
              {displayCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/shop"
                  search={{ category: cat.slug }}
                  className="group flex flex-col items-center justify-center rounded-2xl bg-[#FAF8F5] hover:bg-white border border-[#E5EAE6] hover:border-[#145A45]/40 p-2 sm:p-2.5 transition-all duration-200 hover:shadow-xs active:scale-95 select-none"
                >
                  <div className="size-13 sm:size-15 rounded-xl bg-white p-1 flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                    <CategoryTileThumbnail category={cat} name={getCategoryName(cat)} />
                  </div>
                  <span className="mt-1.5 text-center text-[11px] sm:text-[11.5px] font-bold text-[#16201A] line-clamp-1 group-hover:text-[#145A45] transition-colors">
                    {getCategoryName(cat)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Daily Essentials Product Shelf (With Instant ADD Button) */}
      {essentialProducts.length > 0 && (
        <section className="mt-8 space-y-3.5 text-left">
          <div className="flex items-center justify-between px-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 mb-1">
                <Flame className="size-3 text-amber-600 fill-amber-500" />
                <span>{lang === "hi" ? "अक्सर खरीदे जाने वाले" : "Frequently Bought"}</span>
              </div>
              <h2 className="font-sans text-base sm:text-lg md:text-xl font-extrabold text-[#16201A]">
                {lang === "hi" ? "रोज़मर्रा का जरूरी सामान" : "Daily Kirana Essentials"}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#546059]">
                {lang === "hi"
                  ? "दैनिक उपयोग का 100% शुद्ध राशन — सीधे थैले में जोड़ें"
                  : "Essential groceries for home — Add directly to cart"}
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#145A45] hover:text-[#0F4A38] bg-[#EBF5EE] hover:bg-[#DCEDE1] px-3 py-1.5 rounded-xl transition-all"
            >
              <span>{lang === "hi" ? "पूरा कैटलॉग" : "See All"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {essentialProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Local Trust Strip */}
      <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl border border-[rgba(20,90,69,0.12)] bg-[#FAF8F5] p-3 sm:p-4 text-center text-xs text-[#3D4C44] shadow-xs">
        <div className="space-y-0.5">
          <p className="font-bold text-[#145A45] text-xs sm:text-sm">⚡ 30 मिनट</p>
          <p className="text-[10.5px] sm:text-[11px] text-[#546059]">
            {lang === "hi" ? "तेज़ होम डिलीवरी" : "Express Delivery"}
          </p>
        </div>
        <div className="space-y-0.5 border-x border-[#E5EAE6]">
          <p className="font-bold text-[#145A45] text-xs sm:text-sm">🌿 100% शुद्ध</p>
          <p className="text-[10.5px] sm:text-[11px] text-[#546059]">
            {lang === "hi" ? "परखा हुआ किराना" : "Pure Quality"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-[#145A45] text-xs sm:text-sm">💵 COD / UPI</p>
          <p className="text-[10.5px] sm:text-[11px] text-[#546059]">
            {lang === "hi" ? "आसान भुगतान" : "Easy Payment"}
          </p>
        </div>
      </div>
    </div>
  );
}

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
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      void navigate({ to: "/shop" });
    }
  };

  const isDeliveryEnabled = Boolean(s?.delivery_enabled);
  const freeAt = Number(s?.free_delivery_threshold ?? 499);
  const fee = !isDeliveryEnabled || subtotal >= freeAt || subtotal === 0 ? 0 : Number(s?.delivery_fee ?? 30);
  const diffToFree = Math.max(0, freeAt - subtotal);
  const progressPercent = freeAt > 0 ? Math.min(100, Math.round((subtotal / freeAt) * 100)) : 100;

  // --- EMPTY STATE ---
  if (hydrated && items.length === 0 && savedItems.length === 0) {
    return <EmptyCartView handleGoBack={handleGoBack} />;
  }

  // --- FILLED STATE ---
  return (
    <div className="container-page py-4 sm:py-6 pb-28 lg:pb-12">
      {/* Top Breadcrumb & Header Bar */}
      <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-xs text-[#3D4C44]">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#145A45]">
          <Home className="size-3.5" />
          <span>{t.home}</span>
        </Link>
        <ChevronRight className="size-3 text-gray-400" />
        <span className="font-semibold text-[#16201A]">{t.cart || (lang === "hi" ? "थैला" : "Cart")}</span>
      </nav>

      <div className="flex items-center justify-between border-b border-[rgba(20,90,69,0.12)] pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleGoBack}
            aria-label="Go back"
            title={lang === "hi" ? "पीछे जाएं" : "Go Back"}
            className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#EBF3ED] text-[#145A45] transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="font-sans text-lg sm:text-xl md:text-2xl font-bold text-[#16201A]">
              {t.yourCart}
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#EBF3ED] px-2 py-0.5 text-[11px] font-bold text-[#145A45] border border-[#145A45]/20">
              {items.length} {t.itemsCountLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#145A45] hover:underline"
          >
            <Store className="size-3.5" />
            <span>{t.continueShoppingBtn}</span>
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_21rem]">
        {/* Items List Column */}
        <div className="space-y-3.5">
          {/* Free Delivery Bar or Store Pickup Bar */}
          {!isDeliveryEnabled ? (
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 flex items-center gap-2 text-xs shadow-xs">
              <Store className="size-4 text-amber-700 shrink-0" />
              <span className="text-amber-900 font-semibold text-[11px] sm:text-xs leading-snug">
                {lang === "hi"
                  ? "🏪 स्टोर पिकअप सेवा चालू है • ऑनलाइन ऑर्डर बुक करें, दुकान पर तैयार मिलेगा (शुल्क: ₹0)!"
                  : "🏪 Store Pickup Active • Book online and collect at store (Fee: ₹0)!"}
              </span>
            </div>
          ) : subtotal < freeAt && subtotal > 0 ? (
            <div className="rounded-xl border border-[rgba(20,90,69,0.12)] bg-white p-3 sm:p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#16201A]">
                  <Truck className="size-4 text-[#145A45]" />
                  {lang === "hi"
                    ? `मुफ़्त डिलीवरी के लिए ${inr(diffToFree)} का सामान और जोड़ें`
                    : `Add ${inr(diffToFree)} more for FREE Delivery`}
                </span>
                <Link to="/shop" className="text-[11px] font-bold text-[#145A45] hover:underline">
                  {t.addItemsBtn}
                </Link>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#145A45] to-[#10B981] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : subtotal >= freeAt ? (
            <div className="rounded-xl bg-emerald-50/90 border border-emerald-200/80 p-3 flex items-center gap-2 text-xs font-bold text-emerald-800 shadow-xs">
              <Truck className="size-4 text-emerald-600" />
              <span>{t.freeDeliveryUnlocked}</span>
            </div>
          ) : null}

          {/* Cart Item Cards */}
          <div className="space-y-2.5">
            {items.map((i) => {
              const displayName = getProductName(i);
              const displayVariant = getVariantLabel(i);

              return (
                <div
                  key={i.variantId}
                  className="rounded-xl border border-[rgba(20,90,69,0.12)] bg-white p-3 sm:p-3.5 shadow-[0_2px_8px_-2px_rgba(20,90,69,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] flex items-center gap-3 sm:gap-4 transition-all hover:border-[#145A45]/35 hover:-translate-y-0.5"
                >
                  <Link
                    to="/product/$slug"
                    params={{ slug: i.slug }}
                    className="size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg bg-[#FAF8F5] p-1 border border-[#E5E7EB] flex items-center justify-center"
                    style={{ isolation: "isolate" }}
                  >
                    <img
                      src={getProductImage({ slug: i.slug, name: i.name, image_url: i.imageUrl })}
                      alt={displayName}
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                      className="size-full object-contain object-center"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.slug }}
                      className="font-sans text-xs sm:text-sm font-semibold text-[#16201A] hover:text-[#145A45] line-clamp-1"
                    >
                      {displayName}
                    </Link>
                    <p className="text-[11px] text-[#3D4C44] mt-0.5">{displayVariant}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-[#16201A]">{inr(i.price)}</span>
                      {i.mrp > i.price && (
                        <>
                          <span className="text-[11px] text-[#9CA3AF] line-through">{inr(i.mrp)}</span>
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                            {Math.round(((i.mrp - i.price) / i.mrp) * 100)}% छूट
                          </span>
                        </>
                      )}
                    </div>
                    {i.stock !== undefined && i.stock <= 0 && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                        {lang === "hi" ? "आउट ऑफ स्टॉक" : "Out of stock"}
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper (Compact h-7.5) */}
                  <div className="flex h-7.5 items-center rounded-lg border border-[#145A45]/25 bg-[#EBF3ED] shadow-xs px-0.5">
                    <button
                      type="button"
                      onClick={() => setQty(i.variantId, i.qty - 1)}
                      className="flex size-6 items-center justify-center rounded text-[#145A45] hover:bg-white transition-colors cursor-pointer"
                      aria-label="Decrease"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-5 sm:w-6 text-center text-xs font-bold text-[#145A45]">
                      {i.qty}
                    </span>
                    <button
                      type="button"
                      disabled={i.qty >= i.stock}
                      onClick={() => setQty(i.variantId, i.qty + 1)}
                      className="flex size-6 items-center justify-center rounded text-[#145A45] hover:bg-white transition-colors disabled:opacity-30 cursor-pointer"
                      aria-label="Increase"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Actions (Delete & Save for later) */}
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => remove(i.variantId)}
                      className="flex size-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title={t.removeBtn}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => saveForLater(i.variantId)}
                      className="text-[10px] font-medium text-[#3D4C44] hover:text-[#145A45] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      {t.saveForLaterBtn}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Saved For Later Items */}
          {savedItems.length > 0 && (
            <div className="mt-6 space-y-2.5 border-t border-[#E5E7EB] pt-4">
              <div className="flex items-center gap-2">
                <Bookmark className="size-4 text-[#145A45]" />
                <h2 className="font-sans text-sm font-bold text-[#16201A]">
                  {t.savedForLaterTitle} ({savedItems.length})
                </h2>
              </div>
              {savedItems.map((i) => (
                <div
                  key={i.variantId}
                  className="rounded-xl border border-[rgba(20,90,69,0.12)] bg-white p-3 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage({ slug: i.slug, name: i.name, image_url: i.imageUrl })}
                      alt={i.name}
                      loading="lazy"
                      decoding="async"
                      width={44}
                      height={44}
                      className="size-11 rounded-lg object-contain bg-[#FAF8F5] p-0.5 border border-[#E5E7EB]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#16201A] line-clamp-1">
                        {getProductName(i)}
                      </p>
                      <p className="text-[11px] text-[#3D4C44]">
                        {getVariantLabel(i)} · {inr(i.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveToCart(i.variantId)}
                      className="h-7.5 px-2.5 rounded-lg text-xs font-bold border-[#E5E7EB] text-[#145A45] bg-white hover:bg-[#EBF3ED] shadow-xs cursor-pointer"
                    >
                      {t.moveToCartBtn}
                    </Button>
                    <button
                      onClick={() => removeSaved(i.variantId)}
                      className="size-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title={t.removeBtn}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

                {/* Order Summary Column */}
        <div className="space-y-3.5">
          <div className="rounded-2xl border border-[rgba(20,90,69,0.12)] bg-white p-4 sm:p-5 space-y-3.5 shadow-[0_4px_16px_-4px_rgba(20,90,69,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]">
            <div className="flex items-center justify-between border-b border-[rgba(20,90,69,0.1)] pb-3">
              <h2 className="font-sans text-sm sm:text-base font-bold text-[#16201A]">
                {t.orderSummaryTitle}
              </h2>
              <span className="text-[11px] font-semibold text-[#3D4C44] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                {items.length} {lang === "hi" ? "सामान" : "items"}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#3D4C44] border-b border-[rgba(20,90,69,0.1)] pb-3">
              <div className="flex justify-between">
                <span>{t.itemSubtotal}</span>
                <span className="font-semibold text-[#16201A]">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isDeliveryEnabled ? t.deliveryFee : (lang === "hi" ? "पिकअप शुल्क" : "Pickup Fee")}</span>
                <span className="font-semibold text-[#145A45]">
                  {fee === 0 ? (isDeliveryEnabled ? t.free : (lang === "hi" ? "मुफ़्त (₹0)" : "FREE (₹0)")) : inr(fee)}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-[#15803D] font-semibold">
                  <span>{t.savings}</span>
                  <span>- {inr(savings)}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between text-base font-extrabold text-[#16201A]">
              <span>{t.totalAmount}</span>
              <span className="text-lg text-[#145A45]">{inr(subtotal + fee)}</span>
            </div>

            {savings > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200/60 p-2 text-center text-[11px] font-bold text-emerald-800">
                {lang === "hi"
                  ? `🎉 इस ऑर्डर पर आपकी कुल बचत: ${inr(savings)}`
                  : `🎉 Total Savings on this order: ${inr(savings)}`}
              </div>
            )}

            <Button
              asChild
              className="w-full h-9.5 rounded-xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-xs font-bold text-white shadow-[0_3px_10px_rgba(20,90,69,0.25)] active:scale-[0.99] transition-all cursor-pointer"
            >
              <Link to="/checkout" className="flex items-center justify-center gap-1.5">
                <span>{t.proceedToCheckout}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Local Trust Card */}
          <div className="rounded-xl border border-[rgba(20,90,69,0.12)] bg-[#FAF8F5] p-3 text-xs text-[#3D4C44] space-y-1.5 shadow-xs">
            <p className="flex items-center gap-1.5 font-bold text-[#145A45]">
              <ShieldCheck className="size-4 text-[#145A45]" />
              <span>{t.purityTagline} ({t.puritySub})</span>
            </p>
            <p className="text-[11px] leading-relaxed text-[#3D4C44]">
              {t.cartPaymentNote}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-[3.75rem] left-0 right-0 z-40 border-t border-[rgba(20,90,69,0.12)] bg-white/95 backdrop-blur-md p-2.5 sm:p-3 lg:hidden shadow-[0_-4px_16px_rgba(20,90,69,0.08)]">
          <div className="container-page flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-[#3D4C44] uppercase font-bold tracking-wider">{t.totalAmount}</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-base font-extrabold text-[#16201A]">{inr(subtotal + fee)}</p>
                {savings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                    बचत: {inr(savings)}
                  </span>
                )}
              </div>
            </div>
            <Button
              asChild
              className="flex-1 max-w-[190px] h-9 rounded-xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] text-xs font-bold text-white shadow-[0_2px_8px_rgba(20,90,69,0.25)] active:scale-95 transition-all"
            >
              <Link to="/checkout" className="flex items-center justify-center gap-1.5">
                <span>{t.proceedToCheckout}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
