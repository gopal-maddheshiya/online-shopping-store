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
  Truck,
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
import { telHref, inr } from "@/lib/format";
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

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    void navigate({ to: "/shop", search: { q: term.trim() || undefined } as never });
  }

  const storePhone = settings?.phone ?? "+91 6388354988";
  const cleanPhone = storePhone.replace(/\s+/g, "");

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
      <div className="relative overflow-hidden border-b border-[#0A3628] bg-gradient-to-r from-[#0F4A38] via-[#145A45] to-[#0F4A38] text-white shadow-sm">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0F4A38] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0F4A38] to-transparent pointer-events-none" />
        <div className="container-page relative flex items-center justify-between py-2 text-xs gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="grid size-5 place-items-center rounded-md bg-[#E3B341]/15 border border-[#E3B341]/30">
                <Truck className="size-3 text-[#E3B341]" />
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#E3B341]/90">
                Live
              </span>
            </span>
            <p
              className="font-medium tracking-wide text-white/95 text-[11px] sm:text-xs truncate"
              style={{ letterSpacing: "0.005em" }}
            >
              <span className="hidden md:inline">
                {lang === "hi"
                  ? "महाराजगंज में 30 मिनट एक्सप्रेस डिलीवरी"
                  : "30-Min Express Delivery in Maharajganj"}
              </span>
              <span className="hidden md:inline mx-1.5 text-white/40">•</span>
              <span className="text-[#E3B341] font-bold">
                {lang === "hi" ? "₹499+ के ऑर्डर पर फ्री डिलीवरी" : "Free Delivery on ₹499+"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-medium shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center rounded-md bg-black/25 border border-white/15 p-0.5">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded px-2.5 py-0.5 text-[10px] font-bold tracking-wider transition-colors ${
                  lang === "en"
                    ? "bg-white text-[#0F4A38]"
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
                    ? "bg-white text-[#0F4A38]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                हिन्दी
              </button>
            </div>

            <span className="hidden sm:inline opacity-25 text-white">|</span>

            <span className="hidden sm:flex items-center gap-1.5 text-white/90 text-[11px] font-medium">
              <span className="relative flex size-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.open ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span className={`relative inline-flex size-1.5 rounded-full ${status.open ? "bg-emerald-400" : "bg-rose-400"}`} />
              </span>
              <Clock className="size-3 text-[#E3B341]" />
              {formatStatus(status)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Header — clean premium */}
      <header
        className="sticky top-0 z-40 border-b border-[#E5E0D5] bg-white/95 backdrop-blur-md"
        style={{ fontFeatureSettings: '"ss01", "cv11"' }}
      >
        <div className="container-page flex h-16 items-center justify-between gap-3 md:gap-6">
          {/* Mobile Menu & Brand */}
          <div className="flex items-center gap-2.5">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="flex size-9 items-center justify-center rounded-lg text-[#16201A] hover:bg-[#FAF8F2] lg:hidden transition-colors"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 text-[#16201A]">
                <SheetHeader className="border-b border-[#E5E0D5] bg-[#FAF8F2] p-4.5 pr-14 text-left">
                  <div className="flex flex-col gap-1">
                    <SheetTitle className="text-lg font-bold text-[#0F4A38] tracking-tight flex items-center gap-1.5">
                      <span className="text-base">🌾</span> {t.storeName}
                    </SheetTitle>
                    <p className="text-[11px] text-[#5A655F]">
                      {t.storeAddressShort}
                    </p>

                    {/* Mobile Lang Selector */}
                    <div className="mt-2.5 flex items-center gap-1 self-start rounded-md bg-white border border-[#E5E0D5] p-0.5">
                      <button
                        type="button"
                        onClick={() => setLang("en")}
                        className={`rounded px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                          lang === "en" ? "bg-[#145A45] text-white" : "text-[#5A655F]"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang("hi")}
                        className={`rounded px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                          lang === "hi" ? "bg-[#145A45] text-white" : "text-[#5A655F]"
                        }`}
                      >
                        हिन्दी
                      </button>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex flex-col h-full overflow-y-auto">
                  <nav className="flex flex-col gap-0.5 p-3 border-b border-[#E5E0D5]">
                    {navLinks.map((n) => (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span>{n.label}</span>
                        <ChevronRight className="size-4 text-[#5A655F]" />
                      </Link>
                    ))}
                    <Link
                      to="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#FAF8F2] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="size-4 text-[#145A45]" /> {t.wishlist}
                      </span>
                      {wishlistCount > 0 && (
                        <span className="rounded-full bg-[#145A45] px-2 py-0.5 text-xs font-bold text-white">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#FAF8F2] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <User className="size-4 text-[#145A45]" />{" "}
                        {user
                          ? `${t.myAccount} (${profile?.full_name ? profile.full_name.split(" ")[0] : user.phone ? user.phone.slice(-4) : ""})`
                          : t.login}
                      </span>
                    </Link>
                  </nav>

                  {/* Categories in Hamburger */}
                  <div className="p-3.5 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#5A655F] mb-2 px-1">
                      {lang === "hi" ? "सभी किराना श्रेणियां" : "All Categories"}
                    </p>
                    <div className="flex flex-col gap-1">
                      {parentCategories.map((c) => (
                        <Link
                          key={c.id}
                          to="/shop"
                          search={{ category: c.slug } as never}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#16201A] hover:bg-[#E6EFE8] hover:text-[#0F4A38] transition-colors"
                        >
                          <img
                            src={getCategoryThumbnail(c)}
                            alt={c.name}
                            className="size-6 rounded object-cover border border-[#E5E0D5] shrink-0"
                          />
                          <span className="line-clamp-1">{getCategoryName(c)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#E5E0D5] bg-[#FAF8F2] mt-auto">
                    <a
                      href={telHref(cleanPhone)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#145A45] py-2.5 text-xs font-bold text-white hover:bg-[#0A3628] transition-colors"
                    >
                      <Phone className="size-4" /> {t.callStore} ({storePhone})
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Clean Brand Logo */}
            <Link to="/" className="flex flex-col group shrink-0">
              <span
                className="font-sans text-lg sm:text-xl md:text-2xl font-bold text-[#0F4A38] flex items-center gap-1.5 whitespace-nowrap"
                style={{ letterSpacing: "-0.02em", fontFeatureSettings: '"ss01"' }}
              >
                <span className="text-base sm:text-lg">🌾</span> {t.storeName}
              </span>
              <span
                className="hidden md:block text-[11px] font-medium text-[#5A655F] group-hover:text-[#145A45] transition-colors whitespace-nowrap"
                style={{ letterSpacing: "0.01em" }}
              >
                {lang === "hi"
                  ? "रामनगर, महाराजगंज • शुद्ध किराना एवं राशन"
                  : "Maharajganj • Trusted Local Kirana Store"}
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="relative hidden w-full max-w-lg md:block">
            <RotatingSearchInput
              term={term}
              setTerm={(val) => {
                setTerm(val);
                setShowSuggestions(true);
              }}
              onSubmit={submitSearch}
              onFocus={() => setShowSuggestions(true)}
              variant="desktop"
              ariaLabel="Search grocery items"
            />

            {/* Desktop Autocomplete Popover */}
            {showSuggestions && (matchingCategories.length > 0 || matchingProducts.length > 0) && (
              <div
                className="absolute top-13 left-0 right-0 z-50 rounded-xl border border-[#E5E0D5] bg-white p-3 shadow-xl space-y-3"
                onMouseDown={(e) => e.preventDefault()}
              >
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
              </div>
            )}
          </div>

          {/* Clean Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Call Button */}
            <a
              href={telHref(cleanPhone)}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#E5E0D5] bg-[#FAF8F2] px-3 py-1.5 text-xs font-semibold text-[#0F4A38] hover:bg-[#E6EFE8] hover:border-[#145A45] transition-colors"
            >
              <Phone className="size-3.5 text-[#145A45]" />
              <span>{storePhone}</span>
            </a>

            {/* Account Link */}
            <Link
              to="/account"
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#145A45] transition-colors"
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
              className="relative hidden sm:flex items-center justify-center rounded-lg p-2 text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#145A45] transition-colors"
              title={t.wishlist}
            >
              <Heart className="size-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-[#145A45] text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              onClick={handleCartClick}
              title={t.cart}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                isOnCart
                  ? "bg-[#0A3628] text-white ring-2 ring-[#145A45]/40"
                  : "bg-[#145A45] text-white hover:bg-[#0A3628]"
              }`}
            >
              <div className="relative flex items-center">
                <ShoppingBag className="size-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-[#D97706] text-[10px] font-extrabold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">
                {cartCount > 0 ? inr(subtotal) : t.cart}
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="border-t border-[#E5E0D5] bg-white px-3 py-2 md:hidden relative">
          <RotatingSearchInput
            term={term}
            setTerm={(val) => {
              setTerm(val);
              setShowSuggestions(true);
            }}
            onSubmit={submitSearch}
            onFocus={() => setShowSuggestions(true)}
            variant="mobile"
            ariaLabel="Mobile search"
          />

          {/* Mobile Autocomplete Suggestions */}
          {showSuggestions && (matchingCategories.length > 0 || matchingProducts.length > 0) && (
            <div
              className="absolute top-13 left-3 right-3 z-50 rounded-xl border border-[#E5E0D5] bg-white p-3 shadow-xl space-y-2.5"
              onMouseDown={(e) => e.preventDefault()}
            >
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
            </div>
          )}
        </div>
      </header>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </>
  );
}
