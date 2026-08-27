import { Link, useNavigate } from "@tanstack/react-router";
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
  Sparkles,
  PhoneCall,
  LayoutDashboard,
  Store,
  ChevronRight,
  ShieldCheck,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { settingsQuery, categoriesQuery, isOpenNow } from "@/lib/queries";
import { getCategoryThumbnail } from "@/lib/product-images";
import { telHref, inr } from "@/lib/format";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";

export function Header() {
  const { data: settings } = useQuery(settingsQuery);
  const { count: cartCount, subtotal } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { profile } = useAuth();
  const { lang, setLang, t, formatStatus, getCategoryName } = useLanguage();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const status = isOpenNow(settings);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    void navigate({ to: "/shop", search: { q: term.trim() || undefined } as never });
  }

  const storePhone = settings?.phone ?? "+91 9621617360";
  const cleanPhone = storePhone.replace(/\s+/g, "");

  const navLinks = [
    { to: "/", label: t.home },
    { to: "/shop", label: t.allGroceries },
    { to: "/track", label: t.trackOrder },
    { to: "/contact", label: t.helpCenter },
  ] as const;

  const { data: categories } = useQuery(categoriesQuery);
  const parentCategories = (categories ?? []).filter((c) => !c.parent_id);

  return (
    <>
      {/* 1. Top Local Announcement Bar */}
      <div className="border-b border-[#EAE6DF] bg-gradient-to-r from-[#18483B] to-[#133A2F] text-white">
        <div className="container-page flex items-center justify-between py-1.5 text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex size-2 shrink-0 rounded-full bg-[#F59E0B] animate-pulse" />
            <p className="font-medium tracking-wide text-white/95 text-[11px] sm:text-xs truncate">
              ⚡{" "}
              <span className="hidden md:inline">
                {lang === "hi"
                  ? "महाराजगंज में 30 मिनट एक्सप्रेस होम डिलीवरी • "
                  : "30-Min Express Delivery in Maharajganj • "}
              </span>
              <span className="text-[#FEF08A] font-bold">
                {lang === "hi" ? "₹499+ पर फ्री डिलीवरी" : "Free Delivery on ₹499+"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium shrink-0">
            {/* Language Switcher Pill */}
            <div className="flex items-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                  lang === "en"
                    ? "bg-white text-[#18483B] shadow-2xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                  lang === "hi"
                    ? "bg-white text-[#18483B] shadow-2xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                🇮🇳 हिन्दी
              </button>
            </div>

            <span className="hidden sm:inline opacity-30 text-white">|</span>

            <span className="hidden sm:flex items-center gap-1.5 text-white/90">
              <Clock className="size-3 text-[#F59E0B]" /> {formatStatus(status)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Compact Sticky Main Header */}
      <header className="sticky top-0 z-40 border-b border-[#EAE6DF] bg-white/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4 md:gap-8">
          {/* Mobile Menu Trigger & Wordmark */}
          <div className="flex items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="flex size-9 items-center justify-center rounded-lg text-[#191C1B] hover:bg-[#F4F1EB] lg:hidden"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 text-[#191C1B]">
                <SheetHeader className="border-b border-[#EAE6DF] bg-[#FAF8F5] p-4.5 pr-14 text-left">
                  <div className="flex flex-col gap-1">
                    <SheetTitle className="text-lg font-black text-[#18483B] tracking-tight">
                      Arun Gopal Traders
                    </SheetTitle>
                    <p className="text-[11px] text-[#676D68]">
                      Ramnagar, Adda Bazar Road, Maharajganj, UP
                    </p>

                    {/* Mobile Lang Selector Pill */}
                    <div className="mt-2.5 flex items-center gap-1 self-start rounded-full bg-white border border-[#EAE6DF] p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setLang("en")}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          lang === "en" ? "bg-[#18483B] text-white shadow-2xs" : "text-[#676D68]"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang("hi")}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          lang === "hi" ? "bg-[#18483B] text-white shadow-2xs" : "text-[#676D68]"
                        }`}
                      >
                        🇮🇳 हिन्दी
                      </button>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex flex-col h-full overflow-y-auto">
                  <nav className="flex flex-col gap-1 p-4 border-b border-[#EAE6DF]">
                    {navLinks.map((n) => (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F4F1EB]"
                      >
                        <span>{n.label}</span>
                        <ChevronRight className="size-4 text-[#676D68]" />
                      </Link>
                    ))}
                    <Link
                      to="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F4F1EB]"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="size-4 text-[#18483B]" /> {t.wishlist}
                      </span>
                      {wishlistCount > 0 && (
                        <span className="rounded-full bg-[#18483B] px-2 py-0.5 text-xs font-bold text-white">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#F4F1EB]"
                    >
                      <span className="flex items-center gap-2">
                        <User className="size-4 text-[#18483B]" />{" "}
                        {profile?.full_name
                          ? `${t.myAccount} (${profile.full_name.split(" ")[0]})`
                          : t.login}
                      </span>
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[#18483B] hover:bg-[#EBF4F0]"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="size-4" /> {t.adminPortal}
                      </span>
                    </Link>
                  </nav>

                  {/* All Categories Directory in Hamburger */}
                  <div className="p-4 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#676D68] mb-2 px-1">
                      {lang === "hi" ? "सभी किराना श्रेणियां" : "All Categories"}
                    </p>
                    <div className="flex flex-col gap-1">
                      {parentCategories.map((c) => (
                        <Link
                          key={c.id}
                          to="/shop"
                          search={{ category: c.slug } as never}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#191C1B] hover:bg-[#EBF4F0] hover:text-[#18483B] transition-colors"
                        >
                          <img
                            src={getCategoryThumbnail(c)}
                            alt={c.name}
                            className="size-6 rounded-lg object-cover border border-[#EAE6DF] shrink-0"
                          />
                          <span className="line-clamp-1">{getCategoryName(c.name, c.slug)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#EAE6DF] bg-[#FAF8F5] mt-auto">
                    <a
                      href={telHref(cleanPhone)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#18483B] py-2.5 text-xs font-bold text-white shadow-xs"
                    >
                      <Phone className="size-4" /> {t.callStore} ({storePhone})
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Brand Logo / Wordmark */}
            <Link to="/" className="flex flex-col group shrink-0">
              <span className="font-sans text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#18483B] flex items-center gap-1.5 whitespace-nowrap">
                Arun Gopal Traders
              </span>
              <span className="hidden md:block text-[11px] font-medium text-[#676D68] group-hover:text-[#18483B] transition-colors whitespace-nowrap">
                {lang === "hi"
                  ? "महाराजगंज • शुद्ध एवं विश्वसनीय किराना"
                  : "Maharajganj • Trusted Local Kirana"}
              </span>
            </Link>
          </div>

          {/* Desktop Center: Search Bar */}
          <form onSubmit={submitSearch} className="relative hidden w-full max-w-lg md:block">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-10 w-full rounded-full border border-[#EAE6DF] bg-[#FAF8F5] pr-10 pl-4 text-xs sm:text-sm text-[#191C1B] placeholder:text-[#676D68] focus-visible:border-[#18483B] focus-visible:ring-1 focus-visible:ring-[#18483B] transition-all shadow-2xs"
              aria-label="Search grocery items"
            />
            <button
              type="submit"
              className="absolute top-0 right-0 flex h-10 w-10 items-center justify-center text-[#676D68] hover:text-[#18483B]"
              aria-label="Submit search"
            >
              <Search className="size-4" />
            </button>
          </form>

          {/* Desktop Right Actions: Call, Account, Wishlist, Cart */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Call Store Button */}
            <a
              href={telHref(cleanPhone)}
              className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#EAE6DF] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-semibold text-[#18483B] hover:bg-[#EBF4F0] hover:border-[#18483B] transition-colors shadow-2xs"
            >
              <Phone className="size-3.5 text-[#18483B]" />
              <span>{storePhone}</span>
            </a>

            {/* My Account */}
            <Link
              to="/account"
              className="hidden sm:flex items-center gap-1 rounded-full p-2 text-[#676D68] hover:bg-[#FAF8F5] hover:text-[#18483B] transition-colors"
              title={t.myAccount}
            >
              <User className="size-5" />
              <span className="text-xs font-medium">
                {profile?.full_name ? profile.full_name.split(" ")[0] : t.login.split(" / ")[0]}
              </span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative hidden sm:flex items-center justify-center rounded-full p-2 text-[#676D68] hover:bg-[#FAF8F5] hover:text-[#18483B] transition-colors"
              title={t.wishlist}
            >
              <Heart className="size-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-[#18483B] text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 rounded-full bg-[#18483B] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#133A2F] active:scale-95 transition-all"
            >
              <div className="relative flex items-center">
                <ShoppingBag className="size-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-[#D97706] text-[10px] font-extrabold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{cartCount > 0 ? inr(subtotal) : t.cart}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="border-t border-[#EAE6DF] bg-white px-4 py-2.5 md:hidden">
          <form onSubmit={submitSearch} className="relative w-full">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 w-full rounded-full border border-[#EAE6DF] bg-[#FAF8F5] pr-9 pl-3.5 text-xs text-[#191C1B] placeholder:text-[#676D68] focus-visible:border-[#18483B] focus-visible:ring-1 focus-visible:ring-[#18483B]"
              aria-label="Mobile search"
            />
            <button
              type="submit"
              className="absolute top-0 right-0 flex h-9 w-9 items-center justify-center text-[#676D68]"
            >
              <Search className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </>
  );
}
