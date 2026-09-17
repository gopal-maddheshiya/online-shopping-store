import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Menu,
  LayoutDashboard,
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
  Truck,
  Lock,
  Camera,
  Mic,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const status = isOpenNow(settings);

  const handleAIMode = (mode: "photo" | "text" | "voice") => {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/") {
        window.dispatchEvent(new CustomEvent("open-smart-ration", { detail: { mode } }));
      } else {
        void navigate({ to: "/", search: { smartRation: mode } as never });
      }
    }
  };

  // Automatically dismiss suggestions popover when navigating routes
  useEffect(() => {
    setShowSuggestions(false);
  }, [currentPath]);

  // Dismiss suggestions on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <div className="relative overflow-hidden border-b border-[#0A3628] bg-gradient-to-r from-[#07271D] via-[#0E4635] to-[#07271D] text-white shadow-xs select-none">
        <div className="container-page relative flex items-center justify-between py-1.5 md:py-2 text-xs gap-2.5 sm:gap-3 lg:gap-4">
          {(() => {
            const rawText =
              lang === "hi"
                ? settings?.announcement_hi || settings?.announcement || ""
                : settings?.announcement || settings?.announcement_hi || "";
            const activeText = rawText.trim();

            const deliveryBadge = isDeliveryEnabled ? (
              <div className="flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-medium backdrop-blur-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.18)] bg-emerald-500/18 border border-emerald-400/35 text-white hover:bg-emerald-500/25">
                <span className="grid size-4.5 place-items-center rounded-full shrink-0 bg-[#F5D061]/25 text-[#F5D061]">
                  <Truck className="size-2.5 text-[#F5D061]" />
                </span>
                <span className="font-bold text-white tracking-tight">
                  {lang === "hi" ? "तेज़ होम डिलीवरी" : "Express Home Delivery"}
                </span>
                <span className="opacity-40 text-white">•</span>
                <span className="text-[#F5D061] font-bold">
                  {lang === "hi" ? "30 मिनट में" : "In 30 Mins"}
                </span>
                {settings?.free_delivery_threshold ? (
                  <>
                    <span className="opacity-40 text-white">•</span>
                    <span className="text-emerald-200 font-medium">
                      {lang === "hi"
                        ? `₹${settings.free_delivery_threshold}+ पर मुफ़्त`
                        : `Free over ₹${settings.free_delivery_threshold}`}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null;

            const languageAndTiming = (
              <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-medium shrink-0 z-20">
                {/* Language Switcher */}
                <div className="flex items-center rounded-full bg-black/35 border border-white/20 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider transition-all cursor-pointer ${
                      lang === "en"
                        ? "bg-white text-[#0A3628] shadow-xs"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("hi")}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider transition-all cursor-pointer ${
                      lang === "hi"
                        ? "bg-white text-[#0A3628] shadow-xs"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>

                <span className="hidden sm:inline opacity-30 text-white font-light">|</span>

                {/* Store Timing & Status Pill */}
                <span className="hidden sm:inline-flex items-center gap-1.5 text-white/95 text-[11.5px] font-medium bg-white/[0.08] hover:bg-white/[0.14] rounded-full px-3 py-1 border border-white/20 shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-all">
                  <span className="relative flex size-2">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        status.open ? "bg-emerald-400" : "bg-rose-400 animate-pulse"
                      }`}
                    />
                    <span
                      className={`relative inline-flex size-2 rounded-full ${
                        status.open ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                  </span>
                  <Clock className="size-3 text-[#E3B341]" />
                  <span className="font-semibold text-white">{formatStatus(status)}</span>
                </span>
              </div>
            );

            if (!activeText) return (
              <div className="flex items-center justify-between w-full">
                {isDeliveryEnabled ? (
                  <div className="hidden md:flex items-center justify-start shrink-0">
                    {deliveryBadge}
                  </div>
                ) : null}
                <div className="flex items-center justify-end flex-1">
                  {languageAndTiming}
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

            const announcementPill = (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 px-3.5 py-1 shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-all max-w-full backdrop-blur-xs">
                <span className="grid size-4.5 place-items-center rounded-full bg-gradient-to-br from-[#E3B341]/35 to-[#F5D061]/20 border border-[#E3B341]/60 text-[#F5D061] shrink-0 shadow-[0_1px_4px_rgba(227,179,65,0.3)]">
                  <Megaphone className="size-2.5 text-[#F5D061] -rotate-12" strokeWidth={2.4} />
                </span>
                <span className="inline-flex items-center rounded-full bg-[#E3B341]/30 border border-[#E3B341]/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-[#F5D061] shrink-0">
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
            );

            return (
              <>
                {/* ─── MOBILE VIEW (Auto-Marquee without truncation & snug spacing) ─── */}
                <div className="flex md:hidden items-center gap-1.5 min-w-0 flex-1">
                  <span className="grid size-5 place-items-center rounded-lg bg-gradient-to-br from-[#E3B341]/30 via-[#E3B341]/20 to-[#F5D061]/10 border border-[#E3B341]/50 text-[#F5D061] shrink-0 shadow-[0_1px_4px_rgba(227,179,65,0.25)]">
                    <Megaphone className="size-2.5 text-[#F5D061] -rotate-12" strokeWidth={2.4} />
                  </span>
                  <div className="relative flex-1 overflow-hidden min-w-0">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-[#07271D] to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-[#07271D] to-transparent z-10" />
                    <div className="animate-marquee-smooth flex items-center gap-2.5 py-0.5 text-[11px] whitespace-nowrap">
                      {mobileSnippet}
                      <span className="text-[#E3B341]/60 font-bold">•</span>
                      {mobileSnippet}
                      <span className="text-[#E3B341]/60 font-bold">•</span>
                      {mobileSnippet}
                      <span className="text-[#E3B341]/60 font-bold">•</span>
                      {mobileSnippet}
                      <span className="text-[#E3B341]/60 font-bold">•</span>
                    </div>
                  </div>
                </div>

                {/* ─── LAPTOP / DESKTOP VIEW ─── */}
                {isDeliveryEnabled ? (
                  <>
                    {/* When Delivery is ON: 3-column layout */}
                    <div className="hidden md:flex items-center shrink-0">
                      {deliveryBadge}
                    </div>

                    <div className="hidden md:flex items-center justify-center flex-1 min-w-0 px-2 lg:px-4">
                      {announcementPill}
                    </div>

                    <div className="hidden md:flex items-center justify-end shrink-0">
                      {languageAndTiming}
                    </div>
                  </>
                ) : (
                  <>
                    {/* When Delivery is OFF: Announcement anchors Left, Timing on Right (Zero awkward gap!) */}
                    <div className="hidden md:flex items-center flex-1 min-w-0 pr-4">
                      {announcementPill}
                    </div>

                    <div className="hidden md:flex items-center justify-end shrink-0">
                      {languageAndTiming}
                    </div>
                  </>
                )}

                {/* Mobile Right Controls */}
                <div className="flex md:hidden items-center justify-end shrink-0">
                  {languageAndTiming}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* 2. Main Sticky Header — clean premium crystal glass */}
      <header
        className="sticky top-0 z-40 border-b border-[#E0DACF]/80 bg-white/95 backdrop-blur-xl shadow-[0_2px_12px_-2px_rgba(15,74,56,0.05),inset_0_-1px_0_rgba(255,255,255,0.8)]"
        style={{ fontFeatureSettings: '"ss01", "cv11"' }}
      >
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <div className="container-page flex h-15 sm:h-16 items-center justify-between gap-2 sm:gap-4 md:gap-6">
            {/* Mobile Menu Trigger (Drawer) — Soft Green Theme Squircle with 3-Line Menu */}
            <div className="flex md:hidden items-center shrink-0">
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="group relative flex size-9.5 items-center justify-center rounded-xl border border-[#DDF3E4] bg-[#EDF8F1] hover:bg-[#E4F7EA] hover:border-[#CEEED8] text-[#145A45] shadow-2xs active:scale-92 transition-all duration-200 cursor-pointer"
                  title={lang === "hi" ? "मेन्यू खोलें" : "Open Menu"}
                >
                  <Menu className="size-5 text-[#145A45] group-hover:scale-105 transition-transform duration-200" strokeWidth={2.2} />
                </button>
              </SheetTrigger>
            </div>

            {/* Brand Identity with Store Emblem (Desktop Left, Mobile Center) */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-center md:text-left justify-center md:justify-start group shrink-0 min-w-0 py-0.5 flex-1 md:flex-initial"
            >
              <div className="hidden md:grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#145A45] via-[#104A38] to-[#0A3628] text-[#F5D061] shadow-[0_2px_8px_rgba(10,54,40,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#1E6B53] shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Store className="size-5 text-[#F5D061]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-brand-hindi text-[17.5px] sm:text-[19px] md:text-[22px] font-bold text-[#0B4635] tracking-tight leading-tight group-hover:text-[#145A45] transition-colors drop-shadow-[0_1px_1px_rgba(11,70,53,0.08)]">
                  {t.storeName}
                </span>
                <span className="text-[9.5px] sm:text-[10px] md:text-[11px] font-medium text-[#667085] flex items-center justify-center md:justify-start gap-1 leading-tight mt-0.5 tracking-tight truncate">
                  <MapPin className="size-3 text-[#D97706] shrink-0" />
                  <span>{lang === "hi" ? "रामनगर चौराहा, अड्डा बाजार" : "Ramnagar Chauraha, Adda Bazar"}</span>
                </span>
              </div>
            </Link>

            {/* ─── DESKTOP NAVIGATION TABS (Fills the center void gracefully) ─── */}
            <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-1.5 flex-1 max-w-xl mx-auto px-2">
              <Link
                to="/"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  currentPath === "/"
                    ? "bg-[#EBF3ED] text-[#145A45] border border-[#145A45]/20 shadow-2xs"
                    : "text-[#4A5568] hover:text-[#145A45] hover:bg-[#FAF8F5] border border-transparent"
                }`}
              >
                <Home className={`size-3.5 ${currentPath === "/" ? "text-[#145A45]" : "text-[#718096]"}`} />
                <span>{t.home}</span>
              </Link>

              <Link
                to="/shop"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  currentPath.startsWith("/shop")
                    ? "bg-[#EBF3ED] text-[#145A45] border border-[#145A45]/20 shadow-2xs"
                    : "text-[#4A5568] hover:text-[#145A45] hover:bg-[#FAF8F5] border border-transparent"
                }`}
              >
                <ShoppingBag className={`size-3.5 ${currentPath.startsWith("/shop") ? "text-[#145A45]" : "text-[#718096]"}`} />
                <span>{t.allGroceries}</span>
              </Link>

              <Link
                to="/track"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  currentPath === "/track"
                    ? "bg-[#EBF3ED] text-[#145A45] border border-[#145A45]/20 shadow-2xs"
                    : "text-[#4A5568] hover:text-[#145A45] hover:bg-[#FAF8F5] border border-transparent"
                }`}
              >
                <Package className={`size-3.5 ${currentPath === "/track" ? "text-[#145A45]" : "text-[#718096]"}`} />
                <span>{lang === "hi" ? "ऑर्डर ट्रैक" : "Track Order"}</span>
              </Link>

              <Link
                to="/contact"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  currentPath === "/contact"
                    ? "bg-[#EBF3ED] text-[#145A45] border border-[#145A45]/20 shadow-2xs"
                    : "text-[#4A5568] hover:text-[#145A45] hover:bg-[#FAF8F5] border border-transparent"
                }`}
              >
                <HelpCircle className={`size-3.5 ${currentPath === "/contact" ? "text-[#145A45]" : "text-[#718096]"}`} />
                <span>{lang === "hi" ? "सहायता" : "Help"}</span>
              </Link>
            </nav>

            {/* Clean Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Quick Call & Phone Order Button */}
              <button
                type="button"
                onClick={() => setOrderModalOpen(true)}
                className="hidden xl:flex items-center gap-1.5 rounded-full border border-[#E0DACF] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-bold text-[#0F4A38] hover:bg-[#EBF3ED] hover:border-[#145A45]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer"
                title={lang === "hi" ? "फोन पर ऑर्डर करें" : "Order on Call"}
              >
                <PhoneCall className="size-3.5 text-[#145A45]" />
                <span>{storePhone}</span>
              </button>

              {/* Quick WhatsApp Button */}
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
                className="hidden lg:flex size-9 items-center justify-center rounded-full border border-[#25D366]/35 bg-[#25D366]/10 hover:bg-[#25D366]/20 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <svg viewBox="0 0 24 24" className="size-4.5 fill-[#25D366]" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.43C16.31 14.31 15.08 13.7 14.85 13.62C14.62 13.53 14.46 13.49 14.29 13.74C14.13 13.99 13.64 14.56 13.49 14.73C13.34 14.89 13.2 14.91 12.95 14.79C12.7 14.67 11.89 14.4 10.93 13.55C10.18 12.89 9.68 12.07 9.53 11.82C9.38 11.57 9.51 11.44 9.64 11.31C9.75 11.2 9.89 11.02 10.01 10.87C10.13 10.72 10.18 10.62 10.26 10.45C10.34 10.28 10.3 10.14 10.24 10.02C10.18 9.9 9.69 8.69 9.48 8.19C9.28 7.7 9.07 7.77 8.92 7.76C8.78 7.75 8.61 7.75 8.45 7.75C8.28 7.75 8.01 7.81 7.79 8.05C7.56 8.3 6.93 8.89 6.93 10.09C6.93 11.29 7.8 12.45 7.92 12.61C8.04 12.77 9.64 15.25 12.1 16.31C12.68 16.56 13.14 16.71 13.49 16.82C14.07 17.01 14.6 16.98 15.02 16.92C15.49 16.85 16.47 16.33 16.67 15.75C16.88 15.18 16.88 14.69 16.81 14.58C16.75 14.47 16.58 14.41 16.33 14.29L16.56 14.43Z" />
                </svg>
              </a>

              {/* Account Link */}
              <Link
                to="/account"
                className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#2D3748] hover:text-[#145A45] hover:bg-[#EBF3ED] hover:border-[#145A45]/30 border border-[#E0DACF] bg-[#FAF8F5] transition-all shadow-xs"
                title={user ? t.myAccount : t.login}
              >
                <User className="size-3.5 text-[#145A45]" />
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
                className="relative hidden sm:flex items-center justify-center size-9 rounded-full text-[#4A5568] hover:text-[#145A45] hover:bg-[#EBF3ED] hover:border-[#145A45]/30 border border-[#E0DACF] bg-[#FAF8F5] transition-all shadow-xs"
                title={t.wishlist}
              >
                <Heart className="size-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-[#145A45] text-[9.5px] font-bold text-white shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Desktop Cart Button (Always visible on Laptop/PC) */}
              <Link
                to="/cart"
                onClick={handleCartClick}
                title={t.cart}
                className={`hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isOnCart
                    ? "bg-[#0A3628] text-white border-[#0A3628] ring-2 ring-[#145A45]/40 shadow-xs"
                    : "bg-gradient-to-b from-[#145A45] to-[#0D4433] text-white border-[#0D4433] shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_14px_rgba(20,90,69,0.35)] active:scale-98"
                }`}
              >
                <div className="relative flex items-center">
                  <ShoppingBag className="size-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 grid size-4.5 place-items-center rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-[9.5px] font-bold text-white shadow-[0_2px_4px_rgba(217,119,6,0.3)] border border-white/60">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="font-bold text-xs tracking-tight">
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

            {/* Mobile Actions: Phone & WhatsApp paired together seamlessly */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {/* Phone Order Direct Button */}
              <button
                type="button"
                onClick={() => setOrderModalOpen(true)}
                title={lang === "hi" ? "फोन पर ऑर्डर करें" : "Order on Phone"}
                aria-label="Order on Phone"
                className="flex size-8.5 items-center justify-center rounded-full border border-[#E0DACF] bg-white hover:bg-[#FAF8F2] text-[#145A45] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <PhoneCall className="size-4 text-[#145A45]" />
              </button>

              {/* WhatsApp Quick Order Button */}
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
                className="flex size-8.5 items-center justify-center rounded-full border border-[#E0DACF] bg-white hover:bg-[#FAF8F2] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4.5 fill-[#25D366]"
                  aria-hidden="true"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.43C16.31 14.31 15.08 13.7 14.85 13.62C14.62 13.53 14.46 13.49 14.29 13.74C14.13 13.99 13.64 14.56 13.49 14.73C13.34 14.89 13.2 14.91 12.95 14.79C12.7 14.67 11.89 14.4 10.93 13.55C10.18 12.89 9.68 12.07 9.53 11.82C9.38 11.57 9.51 11.44 9.64 11.31C9.75 11.2 9.89 11.02 10.01 10.87C10.13 10.72 10.18 10.62 10.26 10.45C10.34 10.28 10.3 10.14 10.24 10.02C10.18 9.9 9.69 8.69 9.48 8.19C9.28 7.7 9.07 7.77 8.92 7.76C8.78 7.75 8.61 7.75 8.45 7.75C8.28 7.75 8.01 7.81 7.79 8.05C7.56 8.3 6.93 8.89 6.93 10.09C6.93 11.29 7.8 12.45 7.92 12.61C8.04 12.77 9.64 15.25 12.1 16.31C12.68 16.56 13.14 16.71 13.49 16.82C14.07 17.01 14.6 16.98 15.02 16.92C15.49 16.85 16.47 16.33 16.67 15.75C16.88 15.18 16.88 14.69 16.81 14.58C16.75 14.47 16.58 14.41 16.33 14.29L16.56 14.43Z" />
                </svg>
              </a>

              {/* Cart Pill (when items in cart) */}
              {cartCount > 0 && (
                <Link
                  to="/cart"
                  onClick={handleCartClick}
                  title={t.cart}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                    isOnCart
                      ? "bg-[#0A3628] text-white border-[#0A3628] ring-2 ring-[#145A45]/40 shadow-xs"
                      : "bg-gradient-to-b from-[#145A45] to-[#0D4433] text-white border-[#0D4433] shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-98"
                  }`}
                >
                  <div className="relative flex items-center">
                    <ShoppingBag className="size-3.5" />
                    <span className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-[9px] font-bold text-white shadow-[0_2px_4px_rgba(217,119,6,0.3)] border border-white/60">
                      {cartCount}
                    </span>
                  </div>
                  <span className="font-bold text-[11px] tracking-tight">{inr(subtotal)}</span>
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <SheetContent side="left" className="w-[320px] sm:w-[350px] p-0 text-[#16201A] flex flex-col h-full bg-[#FAF9F5]">
                  {/* 1. Clean Warm-Neutral Brand & User Profile Header (No overwhelming dark green) */}
                  <SheetHeader className="p-0 border-b border-[#E8E3D9] bg-gradient-to-b from-white via-[#FCFAF6] to-[#F5F1E8] text-[#16201A] text-left shrink-0">
                    <div className="p-4 pb-3.5 space-y-3">
                      <div className="flex items-center justify-between pr-8">
                        {/* Store Emblem & Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid size-9.5 place-items-center rounded-xl bg-gradient-to-br from-[#FAF5EA] to-[#F2E8D2] border border-[#E8DCBF] text-[#B45309] shadow-2xs shrink-0">
                            <Store className="size-5 text-[#B45309]" />
                          </div>
                          <div className="min-w-0">
                            <SheetTitle className="font-brand-hindi text-base font-bold text-[#0B4635] tracking-tight leading-tight truncate">
                              {t.storeName}
                            </SheetTitle>
                            <p className="text-[10.5px] font-medium text-[#6B746F] leading-tight mt-0.5 truncate">
                              {lang === "hi" ? "रामनगर चौराहा, अड्डा बाजार" : "Ramnagar Chauraha, Adda Bazar"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User Account / Welcome Card */}
                      <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-[#E5E0D5] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid size-8 place-items-center rounded-full bg-[#F3EFE6] text-[#16201A] font-bold text-xs shrink-0">
                            {user ? (profile?.full_name?.[0]?.toUpperCase() || "U") : <User className="size-4 text-[#6B746F]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#16201A] truncate">
                              {user
                                ? (profile?.full_name || (user.phone ? `+91 ${user.phone.slice(-10)}` : t.myAccount))
                                : (lang === "hi" ? "नमस्ते! स्वागत है 👋" : "Welcome! 👋")}
                            </p>
                            <p className="text-[10px] text-[#6B746F] truncate">
                              {user ? (lang === "hi" ? "अकाउंट एक्टिव है" : "Account Active") : (lang === "hi" ? "ऑर्डर हिस्ट्री व सेव एड्रेस" : "Orders & Address")}
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setMenuOpen(false)}
                          className="shrink-0 rounded-lg bg-[#16201A] hover:bg-[#2A342E] px-3 py-1 text-[11px] font-bold text-white shadow-xs transition-colors"
                        >
                          {user ? (lang === "hi" ? "देखें" : "View") : (lang === "hi" ? "लॉगिन" : "Login")}
                        </Link>
                      </div>

                      {/* Language Selector in Header */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10.5px] font-semibold text-[#6B746F] flex items-center gap-1">
                          <Languages className="size-3 text-[#B45309]" /> {lang === "hi" ? "भाषा चुनें" : "Language"}
                        </span>
                        <div className="flex items-center rounded-lg bg-[#EFEBE3] p-0.5 border border-[#E2DDD2]">
                          <button
                            type="button"
                            onClick={() => setLang("en")}
                            className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                              lang === "en" ? "bg-white text-[#16201A] shadow-xs" : "text-[#6B746F] hover:text-[#16201A]"
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setLang("hi")}
                            className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                              lang === "hi" ? "bg-white text-[#16201A] shadow-xs" : "text-[#6B746F] hover:text-[#16201A]"
                            }`}
                          >
                            हिन्दी
                          </button>
                        </div>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* 2. Scrollable Drawer Body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[#E8E3D9]">
                    {/* Delivery & Trust Badge */}
                    <div className="bg-[#FAF8F5] px-3.5 py-2.5 flex items-center justify-between text-[11px] font-semibold text-[#16201A]">
                      <span className="flex items-center gap-1.5">
                        {isDeliveryEnabled ? (
                          <Zap className="size-3.5 text-[#D97706] fill-[#D97706]" />
                        ) : (
                          <Store className="size-3.5 text-[#B45309]" />
                        )}
                        <span className="font-bold">
                          {isDeliveryEnabled
                            ? (lang === "hi" ? "अड्डा बाजार में फास्ट डिलीवरी" : "Fast Local Delivery")
                            : (lang === "hi" ? "दुकान से पिकअप उपलब्ध" : "Store Pickup Available")}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[10.5px] text-[#6B746F]">
                        <ShieldCheck className="size-3 text-[#D97706]" />
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
                          <Home className="size-4 text-[#4A5568]" />
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
                          <ShoppingBag className="size-4 text-[#B45309]" />
                          <span>{t.allGroceries}</span>
                        </span>
                        <span className="rounded-full bg-[#FAF5EA] border border-[#E9DFCB] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
                          {lang === "hi" ? "सभी सामान" : "Shop"}
                        </span>
                      </Link>

                      <Link
                        to="/track"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Package className="size-4 text-[#2B6CB0]" />
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
                          <Heart className="size-4 text-[#E53E3E]" />
                          <span>{t.wishlist}</span>
                        </span>
                        {wishlistCount > 0 ? (
                          <span className="rounded-full bg-[#D97706] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
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
                          <HelpCircle className="size-4 text-[#4A5568]" />
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
                          className="text-[11px] font-bold text-[#B45309] hover:text-[#92400E] hover:underline"
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
                            className="flex items-center gap-2 rounded-xl border border-[#E5E0D5] bg-white p-2 text-left hover:border-[#B45309]/50 hover:bg-[#FCFAF6] hover:shadow-2xs transition-all"
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
                      <Clock className="size-3.5 text-[#B45309]" />
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
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#16201A] hover:bg-[#2A342E] py-2 px-2 text-xs font-bold text-white transition-all shadow-xs"
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
                        className="text-[10px] font-semibold text-[#8C827A] hover:text-[#16201A] transition-colors inline-flex items-center gap-1"
                      >
                        <Lock className="size-2.5" />
                        <span>{lang === "hi" ? "दुकानदार / एडमिन पोर्टल" : "Admin Portal"}</span>
                      </Link>
                    </div>
                  </div>
        </SheetContent>
      </Sheet>

        {/* Desktop Row 2: Search View on Left + AI Quick Actions beside it (Laptop & Desktop) */}
        <div className="border-t border-[#EAE6DC]/75 bg-white/95 backdrop-blur-md hidden md:block relative z-30">
          <div className="container-page py-2 flex items-center justify-between gap-3 lg:gap-4">
            {/* Search View on Left - Expanded & Long */}
            <div className="relative flex-1 min-w-0">
              <RotatingSearchInput
                term={term}
                setTerm={(val) => {
                  setTerm(val);
                  setShowSuggestions(true);
                }}
                onSubmit={submitSearch}
                onVoiceSearch={(val) => {
                  setShowSuggestions(false);
                  submitSearch(undefined, val);
                }}
                onFocus={() => setShowSuggestions(true)}
                variant="desktop"
                ariaLabel="Search grocery items"
              />

              {/* Desktop Autocomplete Popover */}
              {showSuggestions && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]"
                    onClick={() => setShowSuggestions(false)}
                  />
                  <div
                    className="absolute top-13 left-0 right-0 max-w-2xl z-50 rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-xl space-y-3"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {!term.trim() ? (
                      <div>
                        <div className="flex items-center justify-between px-1 mb-2">
                          <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                            <Sparkles className="size-3 text-[#D97706]" />
                            <span>{lang === "hi" ? "दुकान में सबसे लोकप्रिय खोज" : "Trending Searches"}</span>
                          </p>
                          <span className="text-[9.5px] font-medium text-[#8C827A]">
                            {lang === "hi" ? "क्लिक करके तुरंत खोजें" : "Click to search"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {trendingSearches.map((item, idx) => {
                            const val = lang === "hi" ? item.hi : item.en;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setTerm(val);
                                  submitSearch(undefined, val);
                                }}
                                className="group inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#16201A] hover:border-[#145A45] hover:bg-[#EBF3ED] hover:text-[#145A45] transition-colors cursor-pointer active:scale-95"
                              >
                                <Search className="size-2.5 text-[#8C827A] group-hover:text-[#145A45]" />
                                <span>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        {matchingCategories.length > 0 && (
                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C827A] px-1 mb-1.5">
                              {lang === "hi" ? "श्रेणियाँ (Categories)" : "Categories"}
                            </p>
                            <div className="space-y-1">
                              {matchingCategories.map((c) => (
                                <Link
                                  key={c.id}
                                  to="/shop"
                                  search={{ category: c.slug } as never}
                                  onClick={() => setShowSuggestions(false)}
                                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-[#F3F4F6] transition-colors group"
                                >
                                  <div className="size-7 rounded-lg overflow-hidden bg-white border border-[#E5E7EB] shrink-0">
                                    <img
                                      src={getCategoryThumbnail(c)}
                                      alt={getCategoryName(c)}
                                      className="size-full object-cover"
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-[#16201A] group-hover:text-[#145A45] flex-1">
                                    {getCategoryName(c)}
                                  </span>
                                  <span className="text-[10px] text-[#8C827A] font-medium">
                                    {lang === "hi" ? "श्रेणी देखें →" : "View →"}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {matchingProducts.length > 0 && (
                          <div>
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C827A] px-1 mb-1.5">
                              {lang === "hi" ? "सामान (Products)" : "Products"}
                            </p>
                            <div className="space-y-1">
                              {matchingProducts.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setShowSuggestions(false);
                                    void navigate({ to: "/product/$slug", params: { slug: p.slug } });
                                  }}
                                  className="w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-[#FAF8F2] transition-colors text-left group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                    <div className="size-7 rounded-lg overflow-hidden bg-white border border-[#E5E0D5] shrink-0">
                                      <img
                                        src={getProductImage(p)}
                                        alt={getProductName(p)}
                                        className="size-full object-cover"
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-[#16201A] group-hover:text-[#145A45] truncate">
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
                            className="text-xs font-bold text-[#145A45] hover:underline cursor-pointer"
                          >
                            {lang === "hi"
                              ? `"${term}" के सभी परिणाम देखें →`
                              : `View all results for "${term}" →`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Subtle Vertical Divider */}
            <div className="h-8 w-px bg-[#EAE6DC] shrink-0 mx-1 lg:mx-2" />

            {/* Right: AI Quick Action Strip */}
            <div className="flex items-center shrink-0 gap-1 sm:gap-2 lg:gap-3 xl:gap-4">
              {/* 1. AI सहायक ("thoda lamba sa" Elongated Capsule) */}
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="group flex items-center gap-2 rounded-2xl bg-[#EDF8F1] border border-[#DDF3E4] hover:bg-[#E4F7EA] hover:border-[#CEEED8] px-2.5 py-1 text-left transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title={lang === "hi" ? "AI राशन सहायक कैसे काम करता है? देखें" : "How AI Grocery Assistant Works"}
              >
                <div className="grid size-7.5 place-items-center rounded-xl bg-white border border-[#DDF3E4] text-[#145A45] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Store className="size-4" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-sans text-[11px] font-extrabold text-[#145A45] tracking-tight whitespace-nowrap">
                      {lang === "hi" ? "AI सहायक" : "AI Assistant"}
                    </span>
                    <span className="text-[7.5px] font-black text-[#145A45] bg-white/90 border border-[#DDF3E4] px-1 py-0.2 rounded-full leading-none shadow-2xs">
                      10s
                    </span>
                  </div>
                  <span className="text-[9.5px] font-semibold text-[#2D5A43] flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                    <span>{lang === "hi" ? "कैसे काम करता है?" : "How it works"}</span>
                    <span className="text-[8.5px] font-bold">ⓘ</span>
                  </span>
                </div>
              </button>

              {/* पर्ची (Camera) */}
              <button
                type="button"
                onClick={() => handleAIMode("photo")}
                className="group flex flex-col items-center justify-center shrink-0 px-2 sm:px-3 lg:px-4 py-1 rounded-xl hover:bg-[#F3F4F6] transition-all cursor-pointer select-none text-center active:scale-95"
                title={lang === "hi" ? "पर्ची की फोटो भेजें" : "Upload Slip Photo"}
              >
                <div className="size-8 flex items-center justify-center text-[#16201A] group-hover:text-[#145A45] group-hover:scale-110 transition-transform">
                  <Camera className="size-5" strokeWidth={2.1} />
                </div>
                <span className="mt-0.5 font-sans text-xs font-semibold text-[#16201A] group-hover:text-[#145A45] tracking-tight leading-none">
                  {lang === "hi" ? "पर्ची" : "Slip"}
                </span>
              </button>

              {/* बोलें (Mic) */}
              <button
                type="button"
                onClick={() => handleAIMode("voice")}
                className="group flex flex-col items-center justify-center shrink-0 px-2 sm:px-3 lg:px-4 py-1 rounded-xl hover:bg-[#F3F4F6] transition-all cursor-pointer select-none text-center active:scale-95"
                title={lang === "hi" ? "बोलकर सामान मंगाएं" : "Speak to Order"}
              >
                <div className="size-8 flex items-center justify-center text-[#16201A] group-hover:text-[#145A45] group-hover:scale-110 transition-transform">
                  <Mic className="size-5" strokeWidth={2.1} />
                </div>
                <span className="mt-0.5 font-sans text-xs font-semibold text-[#16201A] group-hover:text-[#145A45] tracking-tight leading-none">
                  {lang === "hi" ? "बोलें" : "Voice"}
                </span>
              </button>

              {/* लिस्ट (ClipboardList) */}
              <button
                type="button"
                onClick={() => handleAIMode("text")}
                className="group flex flex-col items-center justify-center shrink-0 px-2 sm:px-3 lg:px-4 py-1 rounded-xl hover:bg-[#F3F4F6] transition-all cursor-pointer select-none text-center active:scale-95"
                title={lang === "hi" ? "सामान की लिस्ट लिखें या पेस्ट करें" : "Type or Paste List"}
              >
                <div className="size-8 flex items-center justify-center text-[#16201A] group-hover:text-[#145A45] group-hover:scale-110 transition-transform">
                  <ClipboardList className="size-5" strokeWidth={2.1} />
                </div>
                <span className="mt-0.5 font-sans text-xs font-semibold text-[#16201A] group-hover:text-[#145A45] tracking-tight leading-none">
                  {lang === "hi" ? "लिस्ट" : "List"}
                </span>
              </button>

              {/* Right: कैसे काम करता है? */}
              <button
                type="button"
                onClick={() => setShowHowItWorks(true)}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#5A655F] hover:text-[#145A45] px-3 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#145A45]/30 bg-[#FAF8F5] hover:bg-white shadow-2xs transition-all cursor-pointer shrink-0 ml-1"
              >
                <HelpCircle className="size-3.5 text-[#145A45]" />
                <span>{lang === "hi" ? "कैसे काम करता है?" : "How it works?"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Row (Slim, Roomy & Clean White) */}
        <div className="border-t border-[#E5E7EB] bg-white px-3.5 py-2 md:hidden relative">
          <RotatingSearchInput
            term={term}
            setTerm={(val) => {
              setTerm(val);
              setShowSuggestions(true);
            }}
            onSubmit={submitSearch}
            onVoiceSearch={(val) => {
              setShowSuggestions(false);
              submitSearch(undefined, val);
            }}
            onFocus={() => setShowSuggestions(true)}
            variant="mobile"
            ariaLabel="Mobile search"
          />

          {/* Mobile Autocomplete Suggestions */}
          {showSuggestions && (
            <>
              {/* Click-away backdrop to close suggestions */}
              <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={() => setShowSuggestions(false)}
              />
              <div
                className="absolute top-14.5 left-3 right-3 z-50 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-xl space-y-2.5 max-h-[70vh] overflow-y-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {!term.trim() ? (
                  <div>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                        <Sparkles className="size-3 text-[#D97706]" />
                        <span>{lang === "hi" ? "🔥 लोकप्रिय खोजें" : "🔥 Trending Searches"}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="flex size-6 items-center justify-center rounded-full text-[#5A655F] hover:text-[#16201A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        title={lang === "hi" ? "बंद करें" : "Close"}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
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
                            className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#16201A] hover:bg-[#145A45] hover:text-white transition-all cursor-pointer shadow-2xs"
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
                              className="flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#0F4A38]"
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
            </>
          )}
        </div>
      </header>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />

      {/* ═══ "How It Works" Dialog ═══ */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-md sm:max-w-lg p-5 sm:p-6 rounded-3xl bg-white border border-[#E0DACF]">
          <DialogHeader className="text-left space-y-1 pb-2 border-b border-[#EAE6DC]">
            <div className="flex items-center gap-2">
              <Store className="size-5 sm:size-6 text-[#145A45] shrink-0" strokeWidth={2.3} />
              <DialogTitle className="text-base sm:text-lg font-bold text-[#16201A]">
                {lang === "hi" ? "AI राशन सहायक कैसे काम करता है?" : "How AI Grocery Assistant Works"}
              </DialogTitle>
            </div>
            <p className="text-xs text-[#5A655F]">
              {lang === "hi"
                ? "दुकान में सामान खोजने का झंझट खत्म — 3 आसान चरणों में 100% सही रेट पर ऑर्डर!"
                : "Skip searching shelf by shelf — fill your cart in 3 quick steps!"}
            </p>
          </DialogHeader>

          <div className="space-y-2.5 py-2 text-xs">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F0F7F2] border border-[#D6EADB]">
              <div className="size-7 rounded-xl bg-[#145A45] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div>
                <p className="font-bold text-[#145A45] text-xs sm:text-sm">
                  {lang === "hi" ? "पर्ची फोटो, आवाज या लिस्ट दें" : "Slip, Voice or Text"}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3D4841] leading-relaxed mt-0.5">
                  {lang === "hi"
                    ? "कागज पर लिखी पर्ची की फोटो खींचें, माइक दबाकर सामान बोलें, या WhatsApp लिस्ट पेस्ट करें।"
                    : "Snap a photo of your handwritten paper slip, tap the mic to speak items, or paste a list from WhatsApp."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F2F6FF] border border-[#D3E2FD]">
              <div className="size-7 rounded-xl bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                2
              </div>
              <div>
                <p className="font-bold text-[#1D4ED8] text-xs sm:text-sm">
                  {lang === "hi" ? "AI दुकान से मैच करेगा" : "AI Matches Live Store Items"}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3D4841] leading-relaxed mt-0.5">
                  {lang === "hi"
                    ? "Gemini AI हर सामान का सही वजन, ब्रांड और दुकान का 100% असली रेट अपने आप सेट कर देगा।"
                    : "Gemini AI automatically detects quantities, packs, and maps them to Arun Gopal Traders live inventory."}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFF8EE] border border-[#F6DCBA]">
              <div className="size-7 rounded-xl bg-[#D97706] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                3
              </div>
              <div>
                <p className="font-bold text-[#D97706] text-xs sm:text-sm">
                  {lang === "hi" ? "सीधा थैला तैयार व 1-क्लिक ऑर्डर" : "Instant Cart & Fast Delivery"}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3D4841] leading-relaxed mt-0.5">
                  {lang === "hi"
                    ? "पूरा सामान कार्ट में जुड़ जाएगा। घर बैठे होम डिलीवरी पाएं या दुकान से सीधा पिकअप लें।"
                    : "Review your items and checkout with 30-min home delivery or in-store pickup."}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowHowItWorks(false);
                handleAIMode("photo");
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#145A45] to-[#258B6D] hover:from-[#0F4A38] hover:to-[#1E7259] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <span>{lang === "hi" ? "अभी आज़माएं (पर्चा फोटो या बोलकर)" : "Try AI Now"}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
