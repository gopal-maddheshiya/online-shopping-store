import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Heart,
  User,
  MapPin,
  Clock,
  PhoneCall,
  Store,
  ChevronRight,
  ShieldCheck,
  Languages,
  X,
  ArrowLeft,
  Sparkles,
  Megaphone,
  Home,
  Package,
  HelpCircle,
  MessageCircle,
  Zap,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { settingsQuery, categoriesQuery, productsQuery, isOpenNow } from "@/lib/queries";
import { getCategoryThumbnail, getProductImage } from "@/lib/product-images";
import { telHref, inr, waHref } from "@/lib/format";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";
import { RotatingSearchInput } from "@/components/layout/RotatingSearchInput";

export function Header() {
  const { data: settings } = useQuery(settingsQuery);
  const { count: cartCount, subtotal } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, profile } = useAuth();
  const { lang, setLang, t, formatStatus, getCategoryName, getProductName } = useLanguage();
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isOnCart = currentPath === "/cart";

  const handleCartClick = (e: React.MouseEvent) => {
    if (isOnCart) {
      e.preventDefault();
      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
      } else {
        void navigate({ to: "/" });
      }
    }
  };

  const [term, setTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const status = isOpenNow(settings);

  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(productsQuery());

  const matchingCategories = term.trim().length >= 2
    ? categories.filter((c) =>
      c.name.toLowerCase().includes(term.toLowerCase()) ||
      c.slug.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 3)
    : [];

  const matchingProducts = term.trim().length >= 2
    ? products.filter((p) => {
      const hName = getProductName(p);
      const enName = p.name_en || p.name;
      return (
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        enName.toLowerCase().includes(term.toLowerCase()) ||
        hName.toLowerCase().includes(term.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(term.toLowerCase()))
      );
    }).slice(0, 5)
    : [];

  function submitSearch(e?: React.FormEvent, customTerm?: string) {
    e?.preventDefault();
    setShowSuggestions(false);
    const q = (customTerm !== undefined ? customTerm : term).trim();
    void navigate({ to: "/shop", search: { q: q || undefined } as never });
  }

  const trendingSearches = [
    { hi: "बैल कोल्हू तेल", en: "Bail Kolhu Oil" },
    { hi: "गुड़ और चीनी", en: "Gud & Chini" },
    { hi: "चायपत्ती", en: "Chaypatti" },
    { hi: "बासमती चावल", en: "Basmati Chawal" },
    { hi: "बेसन व मैदा", en: "Besan & Maida" },
    { hi: "जीरा व मरीच", en: "Jira & Marich" },
    { hi: "खड़े मसाले", en: "Khade Masale" },
    { hi: "पिसे मसाले", en: "Pise Masale" },
    { hi: "नमकीन", en: "Namkeen" },
    { hi: "बिस्कुट", en: "Biscuits" },
    { hi: "चाउमीन", en: "Chowmein" },
    { hi: "चिप्स", en: "Chips" },
    { hi: "डिटर्जेंट", en: "Detergent" },
    { hi: "अमूल दूध", en: "Amul Doodh" },
  ];

  const storePhone = settings?.phone ?? "+91 6388354988";
  const cleanPhone = storePhone.replace(/\s+/g, "");
  const storeWhatsApp = settings?.whatsapp ?? "916388354988";
  const isDeliveryEnabled = Boolean(settings?.delivery_enabled);

  const navLinks = [
    { to: "/", label: t.home },
    { to: "/shop", label: t.allGroceries },
    { to: "/track", label: t.trackOrder },
    { to: "/contact", label: t.helpCenter },
  ] as const;

  const parentCategories = categories.filter((c) => !c.parent_id);

  return (
    <>
      {/* 1. Premium Top Announcement Bar */}
      <div className="relative overflow-hidden border-b border-[#0A3628] bg-gradient-to-r from-[#0A3628] via-[#145A45] to-[#0A3628] text-white shadow-xs select-none">
        <div className="container-page relative flex items-center justify-between py-1.5 sm:py-2 text-xs gap-2.5 sm:gap-3">
          {(() => {
            const rawText =
              lang === "hi"
                ? settings?.announcement_hi || settings?.announcement || ""
                : settings?.announcement || settings?.announcement_hi || "";
            const activeText = rawText.trim();

            if (!activeText) return (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-white/80 text-[11px]">
                  <span>{lang === "hi" ? "अरुण गोपाल ट्रेडर्स — रामनगर, अड्डा बाजार" : "Arun Gopal Traders — Adda Bazar"}</span>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-medium shrink-0">
                  <div className="flex items-center rounded-md bg-black/25 border border-white/15 p-0.5">
                    <button
                      type="button"
                      onClick={() => setLang("en")}
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${
                        lang === "en" ? "bg-white text-[#0F4A38]" : "text-white/80 hover:text-white"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang("hi")}
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${
                        lang === "hi" ? "bg-white text-[#0F4A38]" : "text-white/80 hover:text-white"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>
              </div>
            );

            const parts = activeText.split("•");

            const mobileSnippet = (
              <span className="inline-flex items-center gap-1.5">
                {parts.length > 1 ? (
                  <>
                    <span className="text-white/95 font-medium">{parts[0]?.trim()}</span>
                    <span className="text-[#E3B341] font-bold">•</span>
                    <span className="text-[#F5D061] font-bold">{parts.slice(1).join(" • ").trim()}</span>
                  </>
                ) : (
                  <span className="text-[#F5D061] font-bold">{activeText}</span>
                )}
              </span>
            );

            return (
              <>
                {/* ─── MOBILE VIEW (Auto-Marquee without truncation & snug spacing) ─── */}
                <div className="flex md:hidden items-center gap-1.5 min-w-0 flex-1">
                  <span className="grid size-4.5 place-items-center rounded-md bg-[#E3B341]/20 border border-[#E3B341]/40 shrink-0">
                    <Sparkles className="size-2.5 text-[#E3B341]" />
                  </span>
                  <div className="relative flex-1 overflow-hidden min-w-0">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-[#0A3628] to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-[#0A3628] to-transparent z-10" />
                    <div className="animate-marquee-smooth flex items-center gap-2.5 py-0.5 text-[11px] whitespace-nowrap">
                      {mobileSnippet}
                      <span className="text-[#E3B341]/50 text-[10px]">✦</span>
                      {mobileSnippet}
                      <span className="text-[#E3B341]/50 text-[10px]">✦</span>
                      {mobileSnippet}
                      <span className="text-[#E3B341]/50 text-[10px]">✦</span>
                      {mobileSnippet}
                      <span className="text-[#E3B341]/50 text-[10px]">✦</span>
                    </div>
                  </div>
                </div>

                {/* ─── LAPTOP / DESKTOP VIEW ─── */}
                <div className="hidden md:flex items-center gap-2 text-white/80 text-[11px] shrink-0 font-medium">
                  <span>{lang === "hi" ? "रामनगर, अड्डा बाजार" : "Ramnagar, Adda Bazar"}</span>
                </div>

                {/* Laptop Center Premium Highlight Pill */}
                <div className="hidden md:flex items-center justify-center flex-1 min-w-0 px-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-black/25 border border-white/15 px-3 py-1 shadow-2xs hover:bg-black/35 transition-colors max-w-full">
                    <span className="grid size-4 place-items-center rounded-full bg-[#E3B341]/25 text-[#E3B341] shrink-0">
                      <Sparkles className="size-2.5 text-[#E3B341]" />
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#E3B341]/25 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#E3B341] shrink-0">
                      {lang === "hi" ? "अपडेट" : "UPDATE"}
                    </span>
                    <p className="text-xs font-semibold tracking-wide truncate">
                      {parts.length > 1 ? (
                        <>
                          <span className="text-white/95 font-medium">{parts[0]?.trim()}</span>
                          <span className="mx-1.5 text-[#E3B341] font-bold">•</span>
                          <span className="text-[#F5D061] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                            {parts.slice(1).join(" • ").trim()}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#F5D061] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          {activeText}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Items: Language Switcher + Store Timing */}
                <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-medium shrink-0 z-20">
                  {/* Language Switcher */}
                  <div className="flex items-center rounded-md bg-black/30 border border-white/15 p-0.5">
                    <button
                      type="button"
                      onClick={() => setLang("en")}
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${
                        lang === "en"
                          ? "bg-white text-[#0F4A38] shadow-xs"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang("hi")}
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${
                        lang === "hi"
                          ? "bg-white text-[#0F4A38] shadow-xs"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>

                  <span className="hidden sm:inline opacity-25 text-white">|</span>

                  <span className="hidden sm:flex items-center gap-1.5 text-white/90 text-[11px] font-medium bg-black/20 rounded-full px-2.5 py-0.5 border border-white/10">
                    <span className="relative flex size-1.5">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.open ? "bg-emerald-400" : "bg-rose-400"}`} />
                      <span className={`relative inline-flex size-1.5 rounded-full ${status.open ? "bg-emerald-400" : "bg-rose-400"}`} />
                    </span>
                    <Clock className="size-3 text-[#E3B341]" />
                    <span>{formatStatus(status)}</span>
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* 2. Main Sticky Header — clean premium */}
      <header
        className="sticky top-0 z-40 border-b border-[#E5E0D5] bg-white/95 backdrop-blur-md"
        style={{ fontFeatureSettings: '"ss01", "cv11"' }}
      >
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <div className="container-page flex h-15 sm:h-16 items-center justify-between gap-2 sm:gap-4 md:gap-6">
            {/* Mobile Menu Trigger (Drawer) — Pinned to Left on Mobile */}
            <div className="flex md:hidden items-center shrink-0 w-8.5">
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="flex size-8.5 items-center justify-center rounded-full text-[#16201A] hover:bg-[#FAF8F2] border border-[#E5E0D5] bg-white transition-colors shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Menu className="size-4.5 text-[#0F4A38]" />
                </button>
              </SheetTrigger>
            </div>

            {/* Brand Typography & Location (Centered on Mobile, Left-aligned on Desktop) */}
            <Link
              to="/"
              className="flex flex-col text-center md:text-left justify-center group shrink min-w-0 py-0.5 flex-1 md:flex-initial"
            >
              <span
                className="font-sans text-[17px] sm:text-[18px] md:text-[22px] font-black text-[#0F4A38] tracking-tight leading-tight group-hover:text-[#145A45] transition-colors"
              >
                {t.storeName}
              </span>
              <span className="text-[9.5px] sm:text-[10px] md:text-[10.5px] font-medium text-[#5A655F] leading-tight mt-0.5 tracking-tight truncate">
                {lang === "hi" ? "रामनगर चौराहा, अड्डा बाजार" : "Ramnagar Chauraha, Adda Bazar"}
              </span>
            </Link>

          {/* Desktop Search Bar */}
          <div className="relative hidden w-full max-w-lg md:block">
            <RotatingSearchInput
              term={term}
              setTerm={(val) => {
                setTerm(val);
                setShowSuggestions(true);
              }}
              onSubmit={submitSearch}
              onVoiceSearch={(val) => submitSearch(undefined, val)}
              onPhoneClick={() => setOrderModalOpen(true)}
              onFocus={() => setShowSuggestions(true)}
              variant="desktop"
              ariaLabel="Search grocery items"
            />

            {/* Desktop Autocomplete Popover */}
            {showSuggestions && (
              <div
                className="absolute top-13 left-0 right-0 z-50 rounded-2xl border border-[#E5E0D5] bg-white p-3.5 shadow-xl space-y-3"
                onMouseDown={(e) => e.preventDefault()}
              >
                {!term.trim() ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] px-1 mb-2 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#D97706]" />
                      <span>{lang === "hi" ? "🔥 लोकप्रिय खोजें" : "🔥 Trending Searches"}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {trendingSearches.map((item) => {
                        const label = lang === "hi" ? item.hi : item.en;
                        return (
                          <button
                            key={item.en}
                            type="button"
                            onClick={() => {
                              setShowSuggestions(false);
                              setTerm(label);
                              submitSearch(undefined, label);
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-[#E5E0D5] bg-[#FAF8F2] px-3 py-1 text-xs font-semibold text-[#16201A] hover:bg-[#145A45] hover:text-white hover:border-[#145A45] transition-all cursor-pointer shadow-2xs"
                          >
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {matchingCategories.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A655F] px-1 mb-1">
                          {lang === "hi" ? "श्रेणियां" : "Categories"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {matchingCategories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setShowSuggestions(false);
                                setTerm("");
                                void navigate({ to: "/shop", search: { category: c.slug } as never });
                              }}
                              className="flex items-center gap-1.5 rounded-md border border-[#E5E0D5] bg-[#FAF8F2] px-2.5 py-1 text-xs font-semibold text-[#0F4A38] hover:bg-[#E6EFE8] transition-colors"
                            >
                              <img
                                src={getCategoryThumbnail(c)}
                                alt={c.name}
                                loading="lazy"
                                decoding="async"
                                width={16}
                                height={16}
                                className="size-4 rounded object-cover"
                              />
                              <span>{getCategoryName(c)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchingProducts.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A655F] px-1 mb-1">
                          {lang === "hi" ? "उत्पाद" : "Products"}
                        </p>
                        <div className="divide-y divide-[#E5E0D5]/60">
                          {matchingProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setShowSuggestions(false);
                                setTerm("");
                                void navigate({ to: "/product/$slug", params: { slug: p.slug } });
                              }}
                              className="flex items-center justify-between w-full py-1.5 px-1 hover:bg-[#FAF8F2] rounded-lg text-left transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={getProductImage(p)}
                                  alt={p.name}
                                  loading="lazy"
                                  decoding="async"
                                  width={28}
                                  height={28}
                                  className="size-7 object-contain shrink-0"
                                />
                                <span className="text-xs font-bold text-[#16201A] truncate">
                                  {getProductName(p)}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-[#0F4A38] shrink-0">
                                {inr(p.product_variants?.[0]?.price ?? 0)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E5E0D5] pt-1.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => submitSearch(e)}
                        className="text-xs font-bold text-[#145A45] hover:underline"
                      >
                        {lang === "hi"
                          ? `"${term}" के सभी परिणाम देखें →`
                          : `View all results for "${term}" →`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Clean Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Call Button */}
            <a
              href={telHref(cleanPhone)}
              className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#E5E0D5] bg-[#FAF8F2] px-3.5 py-1.5 text-xs font-bold text-[#0F4A38] hover:bg-[#E6EFE8] hover:border-[#145A45] transition-all shadow-2xs"
            >
              <Phone className="size-3.5 text-[#145A45]" />
              <span>{storePhone}</span>
            </a>

            {/* Account Link */}
            <Link
              to="/account"
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#145A45] transition-colors"
              title={user ? t.myAccount : t.login}
            >
              <User className="size-4 text-[#145A45]" />
              <span>
                {profile?.full_name
                  ? profile.full_name.split(" ")[0]
                  : user?.phone
                    ? user.phone.slice(-4)
                    : t.login.split(" / ")[0]}
              </span>
            </Link>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative hidden sm:flex items-center justify-center rounded-full p-2 text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#145A45] transition-colors"
              title={t.wishlist}
            >
              <Heart className="size-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-[#145A45] text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Desktop Cart Button (Always visible on Laptop/PC) */}
            <Link
              to="/cart"
              onClick={handleCartClick}
              title={t.cart}
              className={`hidden md:flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                isOnCart
                  ? "bg-[#0A3628] text-white ring-2 ring-[#145A45]/40"
                  : "bg-[#145A45] text-white hover:bg-[#0A3628] hover:shadow-sm active:scale-98"
              }`}
            >
              <div className="relative flex items-center">
                <ShoppingBag className="size-3.5 sm:size-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 grid size-4.5 place-items-center rounded-full bg-[#D97706] text-[9.5px] font-black text-white shadow-2xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-extrabold text-xs tracking-tight">
                {cartCount > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="hidden sm:inline font-bold">{cartCount} {lang === "hi" ? "सामान" : "items"}</span>
                    <span className="hidden sm:inline opacity-40">|</span>
                    <span>{inr(subtotal)}</span>
                  </span>
                ) : (
                  <span>{t.cart}</span>
                )}
              </span>
            </Link>

            {/* Mobile Actions: Cart when cartCount > 0, otherwise sleek circular WhatsApp icon */}
            <div className="flex md:hidden items-center shrink-0">
              {cartCount > 0 ? (
                <Link
                  to="/cart"
                  onClick={handleCartClick}
                  title={t.cart}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isOnCart
                      ? "bg-[#0A3628] text-white ring-2 ring-[#145A45]/40"
                      : "bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-98"
                  }`}
                >
                  <div className="relative flex items-center">
                    <ShoppingBag className="size-3.5" />
                    <span className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-[#D97706] text-[9px] font-black text-white shadow-2xs">
                      {cartCount}
                    </span>
                  </div>
                  <span className="font-extrabold text-[11px] tracking-tight">{inr(subtotal)}</span>
                </Link>
              ) : (
                <a
                  href={waHref(
                    storeWhatsApp,
                    lang === "hi"
                      ? "नमस्ते अरुण गोपाल ट्रेडर्स, मुझे सामान ऑर्डर करना है।"
                      : "Hello Arun Gopal Traders, I want to send my grocery list."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Order on WhatsApp"
                  title={lang === "hi" ? "व्हाट्सएप पर ऑर्डर करें" : "Order on WhatsApp"}
                  className="flex size-8.5 items-center justify-center rounded-full border border-[#E5E0D5] bg-white hover:bg-[#FAF8F2] shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4.5 fill-[#25D366]"
                    aria-hidden="true"
                  >
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.43C16.31 14.31 15.08 13.7 14.85 13.62C14.62 13.53 14.46 13.49 14.29 13.74C14.13 13.99 13.64 14.56 13.49 14.73C13.34 14.89 13.2 14.91 12.95 14.79C12.7 14.67 11.89 14.4 10.93 13.55C10.18 12.89 9.68 12.07 9.53 11.82C9.38 11.57 9.51 11.44 9.64 11.31C9.75 11.2 9.89 11.02 10.01 10.87C10.13 10.72 10.18 10.62 10.26 10.45C10.34 10.28 10.3 10.14 10.24 10.02C10.18 9.9 9.69 8.69 9.48 8.19C9.28 7.7 9.07 7.77 8.92 7.76C8.78 7.75 8.61 7.75 8.45 7.75C8.28 7.75 8.01 7.81 7.79 8.05C7.56 8.3 6.93 8.89 6.93 10.09C6.93 11.29 7.8 12.45 7.92 12.61C8.04 12.77 9.64 15.25 12.1 16.31C12.68 16.56 13.14 16.71 13.49 16.82C14.07 17.01 14.6 16.98 15.02 16.92C15.49 16.85 16.47 16.33 16.67 15.75C16.88 15.18 16.88 14.69 16.81 14.58C16.75 14.47 16.58 14.41 16.33 14.29L16.56 14.43Z" />
                  </svg>
                </a>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <SheetContent side="left" className="w-[320px] sm:w-[350px] p-0 text-[#16201A] flex flex-col h-full bg-[#FAF8F2]">
                  {/* 1. Premium Brand & User Profile Header */}
                  <SheetHeader className="p-0 border-b border-[#E5E0D5] bg-gradient-to-br from-[#0F4A38] via-[#145A45] to-[#0A3628] text-white text-left shrink-0">
                    <div className="p-4.5 pb-3.5 space-y-3">
                      <div className="flex items-center justify-between pr-8">
                        {/* Store Emblem & Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid size-9 place-items-center rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-xs shrink-0">
                            <Store className="size-4.5 text-[#F5D061]" />
                          </div>
                          <div className="min-w-0">
                            <SheetTitle className="text-base font-black text-white tracking-tight leading-tight truncate">
                              {t.storeName}
                            </SheetTitle>
                            <p className="text-[10.5px] font-medium text-[#E6EFE8]/80 leading-tight mt-0.5 truncate">
                              {lang === "hi" ? "रामनगर चौराहा, अड्डा बाजार" : "Ramnagar Chauraha, Adda Bazar"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User Account / Welcome Card */}
                      <div className="flex items-center justify-between rounded-xl bg-white/10 backdrop-blur-xs p-2.5 border border-white/15">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="grid size-8 place-items-center rounded-full bg-white/20 text-white font-black text-xs shrink-0">
                            {user ? (profile?.full_name?.[0]?.toUpperCase() || "U") : <User className="size-4 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {user
                                ? (profile?.full_name || (user.phone ? `+91 ${user.phone.slice(-10)}` : t.myAccount))
                                : (lang === "hi" ? "नमस्ते! स्वागत है 👋" : "Welcome! 👋")}
                            </p>
                            <p className="text-[10px] text-[#E6EFE8]/70 truncate">
                              {user ? (lang === "hi" ? "अकाउंट एक्टिव है" : "Account Active") : (lang === "hi" ? "ऑर्डर हिस्ट्री व सेव एड्रेस" : "Orders & Address")}
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setMenuOpen(false)}
                          className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#0F4A38] shadow-xs hover:bg-[#FAF8F2] transition-colors"
                        >
                          {user ? (lang === "hi" ? "देखें" : "View") : (lang === "hi" ? "लॉगिन" : "Login")}
                        </Link>
                      </div>

                      {/* Language Selector in Header */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10.5px] font-semibold text-[#E6EFE8]/80 flex items-center gap-1">
                          <Languages className="size-3 text-[#F5D061]" /> {lang === "hi" ? "भाषा / Language" : "Language"}
                        </span>
                        <div className="flex items-center rounded-lg bg-black/20 p-0.5 border border-white/10">
                          <button
                            type="button"
                            onClick={() => setLang("en")}
                            className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                              lang === "en" ? "bg-white text-[#0F4A38] shadow-xs" : "text-white/80 hover:text-white"
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setLang("hi")}
                            className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                              lang === "hi" ? "bg-white text-[#0F4A38] shadow-xs" : "text-white/80 hover:text-white"
                            }`}
                          >
                            हिन्दी
                          </button>
                        </div>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* 2. Scrollable Drawer Body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[#E5E0D5]">
                    {/* Delivery & Trust Badge */}
                    <div className="bg-[#E6EFE8]/70 px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-[#0F4A38]">
                      <span className="flex items-center gap-1">
                        {isDeliveryEnabled ? (
                          <Zap className="size-3.5 text-[#D97706] fill-[#D97706]" />
                        ) : (
                          <Store className="size-3.5 text-[#145A45]" />
                        )}
                        <span>
                          {isDeliveryEnabled
                            ? (lang === "hi" ? "अड्डा बाजार में फास्ट डिलीवरी" : "Fast Local Delivery")
                            : (lang === "hi" ? "दुकान से पिकअप उपलब्ध" : "Store Pickup Available")}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[10.5px] text-[#5A655F]">
                        <ShieldCheck className="size-3 text-[#145A45]" />
                        <span>100% शुद्ध राशन</span>
                      </span>
                    </div>

                    {/* Quick Shopping Navigation */}
                    <div className="p-2 space-y-0.5 bg-white">
                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Home className="size-4 text-[#145A45]" />
                          <span>{t.home}</span>
                        </span>
                        <ChevronRight className="size-3.5 text-[#8C827A]" />
                      </Link>

                      <Link
                        to="/shop"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <ShoppingBag className="size-4 text-[#145A45]" />
                          <span>{t.allGroceries}</span>
                        </span>
                        <span className="rounded-full bg-[#145A45]/10 px-2 py-0.5 text-[10px] font-bold text-[#145A45]">
                          {lang === "hi" ? "सभी सामान" : "Shop"}
                        </span>
                      </Link>

                      <Link
                        to="/track"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Package className="size-4 text-[#145A45]" />
                          <span>{t.trackOrder}</span>
                        </span>
                        <ChevronRight className="size-3.5 text-[#8C827A]" />
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Heart className="size-4 text-[#145A45]" />
                          <span>{t.wishlist}</span>
                        </span>
                        {wishlistCount > 0 ? (
                          <span className="rounded-full bg-[#D97706] px-2 py-0.5 text-[10px] font-black text-white shadow-2xs">
                            {wishlistCount}
                          </span>
                        ) : (
                          <ChevronRight className="size-3.5 text-[#8C827A]" />
                        )}
                      </Link>

                      <Link
                        to="/contact"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <HelpCircle className="size-4 text-[#145A45]" />
                          <span>{t.helpCenter}</span>
                        </span>
                        <ChevronRight className="size-3.5 text-[#8C827A]" />
                      </Link>
                    </div>

                    {/* All Categories Grid */}
                    <div className="p-3 bg-[#FAF8F2]">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#5A655F]">
                          {lang === "hi" ? "किराना श्रेणियां" : "Categories"}
                        </p>
                        <Link
                          to="/shop"
                          onClick={() => setMenuOpen(false)}
                          className="text-[11px] font-bold text-[#145A45] hover:underline"
                        >
                          {lang === "hi" ? "सभी देखें →" : "View all →"}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {parentCategories.map((c) => (
                          <Link
                            key={c.id}
                            to="/shop"
                            search={{ category: c.slug } as never}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl border border-[#E5E0D5] bg-white p-2 text-left hover:border-[#145A45] hover:shadow-2xs transition-all"
                          >
                            <img
                              src={getCategoryThumbnail(c)}
                              alt={c.name}
                              loading="lazy"
                              decoding="async"
                              width={28}
                              height={28}
                              className="size-7 rounded-lg object-cover border border-[#E5E0D5]/60 shrink-0"
                            />
                            <span className="text-[11px] font-bold text-[#16201A] line-clamp-1 leading-tight">
                              {getCategoryName(c)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Sticky Drawer Bottom Contact Actions */}
                  <div className="p-3 border-t border-[#E5E0D5] bg-white shrink-0 space-y-2">
                    {/* Store Timings */}
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5A655F]">
                      <Clock className="size-3.5 text-[#145A45]" />
                      <span>{lang === "hi" ? "दुकान: सुबह 7:00 AM से रात 9:00 PM तक" : "Store: 7:00 AM - 9:00 PM"}</span>
                    </div>

                    {/* WhatsApp & Call Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/91${cleanPhone.replace(/^(\+91|91|0)/, "")}?text=${encodeURIComponent(
                          lang === "hi"
                            ? "नमस्ते अरुण गोपाल ट्रेडर्स, मुझे राशन/किराना ऑर्डर करना है।"
                            : "Hello Arun Gopal Traders, I want to place an order."
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] py-2 px-2 text-xs font-bold text-white transition-all shadow-xs"
                      >
                        <MessageCircle className="size-4" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={telHref(cleanPhone)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#145A45] hover:bg-[#0A3628] py-2 px-2 text-xs font-bold text-white transition-all shadow-xs"
                      >
                        <Phone className="size-3.5" />
                        <span>{lang === "hi" ? "कॉल करें" : "Call Store"}</span>
                      </a>
                    </div>

                    {/* Admin Portal subtle link */}
                    <div className="text-center pt-0.5">
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="text-[10px] font-semibold text-[#8C827A] hover:text-[#145A45] transition-colors inline-flex items-center gap-1"
                      >
                        <Lock className="size-2.5" />
                        <span>{lang === "hi" ? "दुकानदार / एडमिन पोर्टल" : "Admin Portal"}</span>
                      </Link>
                    </div>
                  </div>
        </SheetContent>
      </Sheet>

        {/* Mobile Search Bar Row (Slim & Roomy) */}
        <div className="border-t border-[#EAE6DC] bg-[#FAF8F2]/60 px-3 py-1.5 md:hidden relative">
          <RotatingSearchInput
            term={term}
            setTerm={(val) => {
              setTerm(val);
              setShowSuggestions(true);
            }}
            onSubmit={submitSearch}
            onVoiceSearch={(val) => submitSearch(undefined, val)}
            onPhoneClick={() => setOrderModalOpen(true)}
            onFocus={() => setShowSuggestions(true)}
            variant="mobile"
            ariaLabel="Mobile search"
          />

          {/* Mobile Autocomplete Suggestions */}
          {showSuggestions && (
            <div
              className="absolute top-14 left-3 right-3 z-50 rounded-2xl border border-[#E5E0D5] bg-white p-3 shadow-xl space-y-2.5"
              onMouseDown={(e) => e.preventDefault()}
            >
              {!term.trim() ? (
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#D97706] px-1 mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3 text-[#D97706]" />
                    <span>{lang === "hi" ? "🔥 लोकप्रिय खोजें" : "🔥 Trending Searches"}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingSearches.map((item) => {
                      const label = lang === "hi" ? item.hi : item.en;
                      return (
                        <button
                          key={item.en}
                          type="button"
                          onClick={() => {
                            setShowSuggestions(false);
                            setTerm(label);
                            submitSearch(undefined, label);
                          }}
                          className="flex items-center gap-1 rounded-full border border-[#E5E0D5] bg-[#FAF8F2] px-2.5 py-1 text-[11px] font-semibold text-[#16201A] hover:bg-[#145A45] hover:text-white transition-all cursor-pointer shadow-2xs"
                        >
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {matchingCategories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A655F] px-1 mb-1">
                        {lang === "hi" ? "श्रेणियां" : "Categories"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {matchingCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setShowSuggestions(false);
                              setTerm("");
                              void navigate({ to: "/shop", search: { category: c.slug } as never });
                            }}
                            className="flex items-center gap-1 rounded-md border border-[#E5E0D5] bg-[#FAF8F2] px-2 py-0.5 text-[11px] font-semibold text-[#0F4A38]"
                          >
                            <span>{getCategoryName(c)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingProducts.length > 0 && (
                    <div className="divide-y divide-[#E5E0D5]/60">
                      {matchingProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setShowSuggestions(false);
                            setTerm("");
                            void navigate({ to: "/product/$slug", params: { slug: p.slug } });
                          }}
                          className="flex items-center justify-between w-full py-1.5 px-1 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              className="size-6 object-contain shrink-0"
                            />
                            <span className="text-xs font-bold text-[#16201A] truncate">
                              {getProductName(p)}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#0F4A38] shrink-0">
                            {inr(p.product_variants?.[0]?.price ?? 0)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-[#E5E0D5] pt-1 text-center">
                    <button
                      type="button"
                      onClick={(e) => submitSearch(e)}
                      className="text-xs font-bold text-[#145A45]"
                    >
                      {lang === "hi"
                        ? `"${term}" के सभी परिणाम देखें →`
                        : `View all results for "${term}" →`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </>
  );
}
