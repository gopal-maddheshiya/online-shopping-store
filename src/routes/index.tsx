import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Package,
  RotateCcw,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  MessageCircle,
  Tag,
  Star,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Zap,
  Store,
  Copy,
  Check,
  Heart,
  Plus,
  Minus,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { getProductImage, getCategoryThumbnail } from "@/lib/product-images";
import { useCart } from "@/lib/cart";
import {
  categoriesQuery,
  productsQuery,
  featuredProductsQuery,
  settingsQuery,
  isOpenNow,
  type Product,
} from "@/lib/queries";
import { telHref, waHref, inr, discountPercent } from "@/lib/format";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(featuredProductsQuery(12)),
      context.queryClient.ensureQueryData(productsQuery()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Online Grocery Store" },
      {
        name: "description",
        content:
          "Buy Chakki Atta, Basmati Rice, Mustard Oil, Spices, Pulses & daily Kirana essentials online or by phone (+91 6388354988) with fast delivery in Maharajganj, UP.",
      },
      {
        property: "og:title",
        content: "Arun Gopal Traders | Online Grocery Store",
      },
      {
        property: "og:description",
        content: "Pure grocery essentials at genuine prices with doorstep delivery in Maharajganj.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="container-page py-16 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-[#E8E4DA] bg-white p-8 shadow-xs">
        <h2 className="font-sans text-xl font-bold text-[#1F2924]">Unable to load homepage catalogue</h2>
        <p className="text-xs text-[#6B746F]">
          Please check your network connection and try again.
        </p>
        <Button onClick={() => reset()} className="rounded-full bg-[#145A45] text-white">
          Retry Loading
        </Button>
      </div>
    </div>
  ),
  component: PremiumStoreHome,
});

function PremiumStoreHome() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories = [], isLoading: catLoading } = useQuery(categoriesQuery);
  const { data: featuredProducts = [], isLoading: featLoading } = useQuery(featuredProductsQuery(12));
  const { data: products = [], isLoading: prodLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName, getProductName, getVariantLabel } = useLanguage();
  const { items: cartItems, add, setQty } = useCart();
  const navigate = useNavigate();

  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const status = isOpenNow(settings);
  const storePhone = settings?.phone ?? "+91 6388354988";
  const cleanPhone = storePhone.replace(/\s+/g, "");
  const storeWhatsApp = settings?.whatsapp ?? "916388354988";

  // Filter categories
  const parentCategories = categories.filter((c) => !c.parent_id);

  // Group products by category types to show maximum items cleanly
  const flashDeals = products.slice(0, 10);
  const attaRiceProducts = products.filter(
    (p) =>
      p.category_id === "flour-atta" ||
      p.category_id === "rice-grains" ||
      p.category_id === "grains-pulses" ||
      p.name.toLowerCase().includes("atta") ||
      p.name.toLowerCase().includes("rice") ||
      p.name.toLowerCase().includes("gehu") ||
      p.name.toLowerCase().includes("bajra") ||
      p.name.toLowerCase().includes("jowar") ||
      p.name.toLowerCase().includes("besan"),
  );
  const dalPulsesProducts = products.filter(
    (p) =>
      p.category_id === "pulses-dal" ||
      p.name.toLowerCase().includes("dal") ||
      p.name.toLowerCase().includes("chana") ||
      p.name.toLowerCase().includes("rajma") ||
      p.name.toLowerCase().includes("lentils"),
  );
  const oilGheeProducts = products.filter(
    (p) =>
      p.category_id === "oil-ghee" ||
      p.category_id === "cooking-oils" ||
      p.name.toLowerCase().includes("oil") ||
      p.name.toLowerCase().includes("ghee") ||
      p.name.toLowerCase().includes("tel"),
  );
  const spicesMasalaProducts = products.filter(
    (p) =>
      p.category_id === "spices-masala" ||
      p.category_id === "dry-fruits" ||
      p.category_id === "spices" ||
      p.name.toLowerCase().includes("masala") ||
      p.name.toLowerCase().includes("haldi") ||
      p.name.toLowerCase().includes("mirch") ||
      p.name.toLowerCase().includes("hing") ||
      p.name.toLowerCase().includes("cardamom") ||
      p.name.toLowerCase().includes("kesar") ||
      p.name.toLowerCase().includes("kaju"),
  );
  const dairyProducts = products.filter(
    (p) =>
      p.category_id === "dairy" ||
      p.category_id === "dairy-products" ||
      p.name.toLowerCase().includes("milk") ||
      p.name.toLowerCase().includes("dahi") ||
      p.name.toLowerCase().includes("paneer") ||
      p.name.toLowerCase().includes("cheese") ||
      p.name.toLowerCase().includes("butter"),
  );
  const cookwareUtensils = products.filter(
    (p) =>
      p.category_id === "utensils-cookware" ||
      p.category_id === "cookware" ||
      p.category_id === "storage-dining" ||
      p.name.toLowerCase().includes("cooker") ||
      p.name.toLowerCase().includes("tawa") ||
      p.name.toLowerCase().includes("kadhai") ||
      p.name.toLowerCase().includes("mixer") ||
      p.name.toLowerCase().includes("belan") ||
      p.name.toLowerCase().includes("knife") ||
      p.name.toLowerCase().includes("jar"),
  );
  const cleaningProducts = products.filter(
    (p) =>
      p.category_id === "cleaning-supplies" ||
      p.category_id === "cleaning" ||
      p.name.toLowerCase().includes("detergent") ||
      p.name.toLowerCase().includes("surf") ||
      p.name.toLowerCase().includes("colin") ||
      p.name.toLowerCase().includes("pril") ||
      p.name.toLowerCase().includes("harpic") ||
      p.name.toLowerCase().includes("broom") ||
      p.name.toLowerCase().includes("mop") ||
      p.name.toLowerCase().includes("bucket"),
  );
  const snacksBreakfastProducts = products.filter(
    (p) =>
      p.category_id === "snacks-namkeen" ||
      p.category_id === "tea-coffee" ||
      p.category_id === "breakfast-items" ||
      p.category_id === "snacks-sweets" ||
      p.category_id === "beverages" ||
      p.name.toLowerCase().includes("tea") ||
      p.name.toLowerCase().includes("biscuit") ||
      p.name.toLowerCase().includes("jam") ||
      p.name.toLowerCase().includes("bread") ||
      p.name.toLowerCase().includes("rasgulla") ||
      p.name.toLowerCase().includes("gulab jamun"),
  );


  // Trending search suggestions
  const TRENDING_SEARCHES = [
    { label: lang === "hi" ? "🌾 आशीर्वाद आटा" : "🌾 Aashirvaad Atta", q: "Aashirvaad" },
    { label: lang === "hi" ? "🛢️ फॉर्च्यून सरसों तेल" : "🛢️ Fortune Oil", q: "Fortune" },
    { label: lang === "hi" ? "🍲 तुअर दाल" : "🍲 Toor Dal", q: "Toor Dal" },
    { label: lang === "hi" ? "🍳 प्रेशर कुकर" : "🍳 Cooker", q: "Cooker" },
    { label: lang === "hi" ? "🥛 अमूल पनीर व दही" : "🥛 Amul Paneer", q: "Amul" },
    { label: lang === "hi" ? "🍚 बासमती चावल" : "🍚 Basmati Rice", q: "Basmati" },
    { label: lang === "hi" ? "🧂 टाटा नमक" : "🧂 Tata Salt", q: "Tata Salt" },
    { label: lang === "hi" ? "☕ टाटा चायपत्ती" : "☕ Tata Tea", q: "Tata Tea" },
    { label: lang === "hi" ? "🧹 गाला झाड़ू व वाइपर" : "🧹 Gala Broom", q: "Gala" },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 pb-28 overflow-x-hidden">
      {/* 1. Category Showcase Shortcuts Strip */}
      <section className="border-b border-[#E8E4DA] bg-white py-3.5 sm:py-4 shadow-2xs">
        <div className="container-page">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6B746F] flex items-center gap-1.5">
              <span>🏪</span>{" "}
              {lang === "hi" ? "कैटेगरी के अनुसार खरीदारी करें" : "Shop by Category"}
            </h2>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#145A45] hover:underline flex items-center gap-1"
            >
              {t.viewAll} ({parentCategories.length}) <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="no-scrollbar flex items-center gap-2.5 sm:gap-3 overflow-x-auto px-1 py-1">
            {catLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[5.2rem]">
                    <Skeleton className="size-14 sm:size-16 rounded-2xl" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))
              : parentCategories.map((c) => (
                  <Link
                    key={c.id}
                    to="/shop"
                    search={{ category: c.slug }}
                    className="group flex flex-col items-center gap-1.5 min-w-[5.2rem] sm:min-w-[6.2rem] shrink-0 text-center transition-all hover:-translate-y-1"
                  >
                    <div className="relative flex size-14 sm:size-18 items-center justify-center overflow-hidden rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2] p-1 shadow-2xs group-hover:border-[#145A45] group-hover:shadow-md transition-all">
                      <img
                        src={getCategoryThumbnail(c)}
                        alt={c.name}
                        loading="lazy"
                        className="size-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#1F2924] group-hover:text-[#145A45] line-clamp-1 max-w-[5.8rem]">
                      {getCategoryName(c.name, c.slug)}
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* 2. NEW STATIC HERO: Premium Local Grocery Showcase (One Hero = One Message) */}
      <section className="container-page pt-1">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#145A45] via-[#104838] to-[#0A3327] border border-[#145A45]/30 shadow-lg text-white">
          {/* Ambient Warm Sunlight & Soft Leaves Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-[#DCEBDD]/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-[#E3B341]/10 blur-3xl" />

          {/* Hero Content Grid: Clean & Viewport-friendly */}
          <div className="relative z-10 p-5 sm:p-8 md:p-10 lg:p-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] items-center">
            {/* Left Column: Brand, Headline, Benefits, CTAs */}
            <div className="flex flex-col items-start justify-center space-y-3 sm:space-y-4 max-w-xl">
              {/* Brand / Trust Label */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCEBDD]/20 border border-[#DCEBDD]/30 px-3.5 py-1 text-[11px] sm:text-xs font-bold text-[#DCEBDD] backdrop-blur-xs">
                <Sparkles className="size-3.5 text-[#E3B341]" />
                <span>
                  {lang === "hi"
                    ? "🌿 आपकी भरोसेमंद किराना दुकान"
                    : "🌿 Your Trusted Neighbourhood Kirana"}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-sans text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {lang === "hi" ? (
                  <>
                    हर दिन की जरूरत,<br />
                    <span className="text-[#E3B341]">अब आपके घर तक।</span>
                  </>
                ) : (
                  <>
                    Everyday Grocery Essentials,<br />
                    <span className="text-[#E3B341]">Delivered to Your Doorstep.</span>
                  </>
                )}
              </h1>

              {/* Supporting Text */}
              <p className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed max-w-lg">
                {lang === "hi"
                  ? "आटा, चावल, दाल, तेल, मसाले और रोज़मर्रा का जरूरी सामान — आसान ऑनलाइन ऑर्डर के साथ।"
                  : "Fresh chakki atta, pulses, mustard oil, spices & household staples with quick doorstep delivery in Maharajganj."}
              </p>

              {/* Main Customer Offer */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-black/30 border border-[#E3B341]/50 px-3.5 py-1.5 text-xs font-bold text-[#E3B341] backdrop-blur-xs shadow-2xs">
                <Truck className="size-4 text-[#E3B341]" />
                <span>
                  {lang === "hi"
                    ? "₹499+ के ऑर्डर पर FREE DELIVERY"
                    : "FREE Home Delivery on Orders ₹499+"}
                </span>
              </div>

              {/* Primary & Secondary Action Buttons */}
              <div className="pt-1.5 flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white px-6 sm:px-8 py-3 text-xs sm:text-sm font-black text-[#145A45] shadow-xl hover:bg-[#FAF8F2] hover:scale-105 active:scale-95 transition-all"
                >
                  <Link to="/shop">
                    <ShoppingBag className="mr-2 size-4 text-[#145A45]" />
                    {lang === "hi" ? "सामान खरीदें →" : "Shop Groceries Now →"}
                  </Link>
                </Button>

                <button
                  type="button"
                  onClick={() => setOrderModalOpen(true)}
                  className="rounded-full border border-white/40 bg-white/15 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-xs hover:bg-white/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="size-3.5 sm:size-4 text-[#E3B341]" />
                  <span>{lang === "hi" ? "फोन पर ऑर्डर करें" : "Order by Phone"}</span>
                </button>
              </div>

              {/* Desktop Supporting Micro-Row */}
              <div className="hidden lg:flex items-center gap-3 pt-3 border-t border-white/15 text-[11px] text-white/80 font-medium">
                <span className="flex items-center gap-1">
                  <Truck className="size-3.5 text-[#DCEBDD]" />{" "}
                  {lang === "hi" ? "30 मिनट होम डिलीवरी" : "30-Min Fast Delivery"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-[#DCEBDD]" />{" "}
                  {lang === "hi" ? "100% शुद्ध व असली" : "100% Pure & Authentic"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5 text-[#E3B341]" />{" "}
                  {lang === "hi" ? "फोन / WhatsApp ऑर्डर" : "Call & WhatsApp Support"}
                </span>
              </div>
            </div>

            {/* Right Column: Premium Grocery Showcase Composition */}
            <div className="relative flex items-center justify-center pt-2 lg:pt-0">
              <div className="relative w-full max-w-sm lg:max-w-md rounded-3xl bg-black/25 backdrop-blur-md p-4 sm:p-5 border border-white/20 shadow-2xl flex flex-col items-center">
                {/* Ambient Glow */}
                <div className="pointer-events-none absolute -top-8 inset-x-0 h-28 rounded-full bg-[#DCEBDD]/20 blur-2xl" />

                {/* Top Badge */}
                <div className="relative z-10 mb-3 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur-md border border-white/25">
                  <Sparkles className="size-3 text-[#E3B341]" />
                  <span>
                    {lang === "hi"
                      ? "100% शुद्ध ताज़ा किराना राशन"
                      : "100% Pure Fresh Grocery Staples"}
                  </span>
                </div>

                {/* 3-Item Real Grocery Product Showcase Stage */}
                <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 items-end w-full pt-1 pb-2">
                  {/* Product 1: Fortune Mustard Oil */}
                  <Link
                    to="/shop"
                    search={{ category: "oil-ghee" }}
                    className="group flex flex-col items-center text-center transition-transform hover:scale-105"
                  >
                    <div className="w-full aspect-[3/4] rounded-2xl bg-white p-2 shadow-lg border border-white/60 flex items-center justify-center">
                      <img
                        src="/images/products/fortune-mustard-oil.jpg"
                        alt="Fortune Mustard Oil"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="w-4/5 h-1.5 bg-black/50 rounded-full blur-[2px] mt-1.5" />
                    <span className="text-[10px] sm:text-xs font-bold text-white mt-1 line-clamp-1">
                      {lang === "hi" ? "सरसों तेल" : "Mustard Oil"}
                    </span>
                  </Link>

                  {/* Product 2: Aashirvaad Chakki Atta (Center Stage) */}
                  <Link
                    to="/shop"
                    search={{ category: "flour-atta" }}
                    className="group flex flex-col items-center text-center z-10 -mx-1 transition-transform hover:scale-105"
                  >
                    <div className="w-full aspect-[3/4] rounded-2xl bg-white p-2 shadow-2xl border-2 border-[#E3B341] flex items-center justify-center relative">
                      <span className="absolute -top-2 rounded-full bg-[#E3B341] px-2 py-0.5 text-[8px] font-black text-[#1F2924] uppercase tracking-wider shadow-xs">
                        {lang === "hi" ? "सर्वश्रेष्ठ" : "Bestseller"}
                      </span>
                      <img
                        src="/images/products/aashirvaad-atta.jpg"
                        alt="Aashirvaad Chakki Atta"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="w-full h-2 bg-black/60 rounded-full blur-[2px] mt-1.5" />
                    <span className="text-[11px] sm:text-xs font-extrabold text-[#E3B341] mt-1 line-clamp-1">
                      {lang === "hi" ? "चक्की आटा" : "Chakki Atta"}
                    </span>
                  </Link>

                  {/* Product 3: Amul Desi Ghee */}
                  <Link
                    to="/shop"
                    search={{ category: "oil-ghee" }}
                    className="group flex flex-col items-center text-center transition-transform hover:scale-105"
                  >
                    <div className="w-full aspect-[3/4] rounded-2xl bg-white p-2 shadow-lg border border-white/60 flex items-center justify-center">
                      <img
                        src="/images/products/amul-desi-ghee.jpg"
                        alt="Amul Pure Desi Ghee"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="w-4/5 h-1.5 bg-black/50 rounded-full blur-[2px] mt-1.5" />
                    <span className="text-[10px] sm:text-xs font-bold text-white mt-1 line-clamp-1">
                      {lang === "hi" ? "शुद्ध देसी घी" : "Pure Ghee"}
                    </span>
                  </Link>
                </div>

                {/* Base Surface Line */}
                <div className="w-full h-1 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent mt-1" />

                <div className="mt-2 text-[10px] text-white/75 font-medium text-center">
                  📍 Ramnagar, Adda Bazar Road, Maharajganj
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST / SERVICE STRIP (Compact & Clean) */}
      <section className="container-page">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="card-base flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 bg-white border border-[#E8E4DA]">
            <div className="grid size-8 sm:size-9 place-items-center rounded-full bg-[#DCEBDD] text-[#145A45] shrink-0">
              <Truck className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">
                {lang === "hi" ? "30 मिनट होम डिलीवरी" : "30-Min Fast Delivery"}
              </p>
              <p className="text-[10px] text-[#6B746F] truncate">
                {lang === "hi" ? "रामनगर व महाराजगंज में" : "In Ramnagar & City"}
              </p>
            </div>
          </div>

          <div className="card-base flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 bg-white border border-[#E8E4DA]">
            <div className="grid size-8 sm:size-9 place-items-center rounded-full bg-[#DCEBDD] text-[#145A45] shrink-0">
              <Award className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">
                {lang === "hi" ? "100% शुद्ध एवं असली" : "100% Pure & Authentic"}
              </p>
              <p className="text-[10px] text-[#6B746F] truncate">
                {lang === "hi" ? "सीधे मंडी व ब्रांड से" : "Fresh Mandi Sourcing"}
              </p>
            </div>
          </div>

          <div className="card-base flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 bg-white border border-[#E8E4DA]">
            <div className="grid size-8 sm:size-9 place-items-center rounded-full bg-[#DCEBDD] text-[#145A45] shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">
                {lang === "hi" ? "कैश ऑन डिलीवरी / UPI" : "Pay on Delivery / UPI"}
              </p>
              <p className="text-[10px] text-[#6B746F] truncate">
                {lang === "hi" ? "सामान देखकर भुगतान करें" : "Safe & Easy Payments"}
              </p>
            </div>
          </div>

          <a
            href={waHref(storeWhatsApp, "Namaste! I want to order monthly grocery list.")}
            target="_blank"
            rel="noreferrer"
            className="card-base flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 bg-[#DCEBDD]/40 border border-[#145A45]/30 hover:border-[#145A45] transition-colors"
          >
            <div className="grid size-8 sm:size-9 place-items-center rounded-full bg-[#145A45] text-white shrink-0">
              <MessageCircle className="size-4 fill-white text-[#145A45]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#145A45] truncate">
                {lang === "hi" ? "व्हाट्सएप पर ऑर्डर करें" : "WhatsApp Quick Order"}
              </p>
              <p className="text-[10px] text-[#0E4333] truncate">
                {lang === "hi" ? "राशन पर्ची भेजें" : "+91 6388354988"}
              </p>
            </div>
          </a>
        </div>

        {/* Trending Popular Searches */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#6B746F] shrink-0">
            <TrendingUp className="size-3 text-[#145A45]" />
            {lang === "hi" ? "लोकप्रिय खोजें:" : "Popular Searches:"}
          </span>
          <div className="flex items-center gap-1.5">
            {TRENDING_SEARCHES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void navigate({ to: "/shop", search: { q: item.q } as never })}
                className="shrink-0 rounded-full border border-[#E8E4DA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1F2924] hover:border-[#145A45] hover:text-[#145A45] transition-colors shadow-2xs cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ⭐ BEST SELLERS & POPULAR PRODUCTS GRID (2 Cols Mobile, 4 Cols Desktop) */}
      <section className="container-page">
        <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 sm:size-9 place-items-center rounded-full bg-[#DCEBDD] text-[#145A45]">
              <Sparkles className="size-4 sm:size-5 text-[#E3B341] fill-[#E3B341]" />
            </span>
            <div>
              <h2 className="font-sans text-base sm:text-2xl font-black text-[#1F2924]">
                {lang === "hi" ? "⭐ लोकप्रिय उत्पाद एवं बेस्ट सेलर्स" : "⭐ Popular Groceries & Best Sellers"}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "दैनिक रसोई के सबसे ज्यादा बिकने वाले शुद्ध उत्पाद"
                  : "Most ordered authentic grocery essentials at honest rates"}
              </p>
            </div>
          </div>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-bold text-[#145A45] hover:underline flex items-center gap-1 shrink-0"
          >
            {t.viewAll} ({products.length || 302}) <ChevronRight className="size-3.5 sm:size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {featLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>

      {/* 5. TODAY'S OFFERS: "आज के खास ऑफर" (Horizontal Swipe on Mobile with partial card peek) */}
      <section className="container-page">
        <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-[#DCEBDD] text-[#145A45]">
              <Flame className="size-4 text-[#E3B341] fill-[#E3B341]" />
            </span>
            <div>
              <h2 className="font-sans text-base sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi" ? "आज के खास ऑफर" : "Today's Special Offers"}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "रसोई के दैनिक किराना सामानों पर विशेष छूट"
                  : "Special discounts on daily grocery essentials"}
              </p>
            </div>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-[#145A45] hover:underline flex items-center gap-1 shrink-0"
          >
            {t.viewAll} ({products.length}) <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* Mobile: Horizontal scrollable track with peeking card / Desktop: 5-Col Grid */}
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
          {prodLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[160px] sm:min-w-0 shrink-0">
                  <ProductCardSkeleton />
                </div>
              ))
            : flashDeals.map((product) => (
                <div key={product.id} className="min-w-[160px] sm:min-w-0 shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </section>

      {/* 5. Quick Store Actions */}
      <section className="container-page">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Link
            to="/shop"
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#145A45] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F2] text-[#145A45]">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2924]">{t.quickShop}</p>
              <p className="text-[10px] text-[#6B746F]">
                {lang === "hi" ? "सामान सूची" : "Browse items"}
              </p>
            </div>
          </Link>

          <Link
            to="/track"
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#145A45] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F2] text-[#145A45]">
              <Package className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2924]">{t.quickOrders}</p>
              <p className="text-[10px] text-[#6B746F]">
                {lang === "hi" ? "लाइव स्थिति" : "Track status"}
              </p>
            </div>
          </Link>

          <Link
            to="/account"
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#145A45] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F2] text-[#145A45]">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2924]">{t.quickBuyAgain}</p>
              <p className="text-[10px] text-[#6B746F]">
                {lang === "hi" ? "पुराना सामान" : "Past essentials"}
              </p>
            </div>
          </Link>

          <a
            href={telHref(cleanPhone)}
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#145A45] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F2] text-[#145A45]">
              <Phone className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2924]">{t.quickCall}</p>
              <p className="text-[10px] text-[#6B746F]">{storePhone}</p>
            </div>
          </a>

          <a
            href={
              settings?.maps_link ??
              "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
            }
            target="_blank"
            rel="noreferrer"
            className="card-base col-span-2 sm:col-span-1 flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#145A45] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F2] text-[#145A45]">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2924]">{t.quickLocation}</p>
              <p className="text-[10px] text-[#6B746F]">Ramnagar, Adda Bazar</p>
            </div>
          </a>
        </div>
      </section>

      {/* 6. 🌾 Atta, Rice & Whole Grains Shelf (आटा, चावल व अनाज) */}
      {attaRiceProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "🌾 आटा, बासमती चावल एवं अनाज"
                  : "🌾 Fresh Atta, Basmati Rice & Grains"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "आशीर्वाद, फॉर्च्यून चक्की आटा और प्रीमियम दावत बासमती चावल"
                  : "Aashirvaad, Fortune Chakki Atta, Daawat Basmati Rice & Poha"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "flour-atta" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {attaRiceProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 7. 🫘 Pure Pulses & Dal Shelf (दालें व दलहन) */}
      {dalPulsesProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi" ? "🫘 शुद्ध दालें एवं दलहन" : "🫘 Pure Pulses & Dal Varieties"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "अरहर/तूर दाल, मूंग दाल, चना दाल, राजमा और काबुली चना"
                  : "Arhar Dal, Moong Dal, Chana Dal, Rajma & Kabuli Chana"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "pulses-dal" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {dalPulsesProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 8. 🛢️ Cooking Oil & Pure Ghee Shelf (सरसों तेल व देसी घी) */}
      {oilGheeProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "🛢️ सरसों का तेल एवं शुद्ध देसी घी"
                  : "🛢️ Mustard Oil & Pure Desi Ghee"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "फॉर्च्यून कच्ची घानी, धारा और अमूल देसी घी"
                  : "Fortune Kachi Ghani, Dhara & Amul Pure Ghee"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "oil-ghee" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {oilGheeProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Promotional Coupon Banner */}
      <section className="container-page">
        <div className="card-base border border-[#E8E4DA] bg-gradient-to-br from-[#FAF8F2] via-[#FFFFFF] to-[#DCEBDD]/40 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="inline-block rounded-full bg-[#145A45] px-3 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                {lang === "hi" ? "विशेष स्वागत कूपन" : "SPECIAL STORE COUPON"}
              </span>
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#1F2924]">
                {t.welcomeOfferTitle}
              </h3>
              <p className="text-xs text-[#6B746F]">{t.welcomeOfferSub}</p>
            </div>
            <Button
              asChild
              className="rounded-full bg-[#145A45] px-8 text-xs font-bold text-white shadow-xs hover:bg-[#0E4333]"
            >
              <Link to="/shop">{t.shopNow}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 10. 🌶️ Spices, Masala & Dry Fruits Shelf (मसाले व सूखे मेवे) */}
      {spicesMasalaProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "🌶️ खड़े मसाले, पिसा मसाला व सूखे मेवे"
                  : "🌶️ Spices, Whole Masala & Dry Fruits"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "एमडीएच, एवरेस्ट मसाले, काजू, बादाम और किशमिश"
                  : "MDH, Everest Masala, Cashews, Almonds & Raisins"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "spices-masala" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {spicesMasalaProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 11. ☕ Snacks, Tea & Daily Essentials Shelf */}
      {snacksBreakfastProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "☕ चाय, नाश्ता, नमकीन एवं बिस्कुट"
                  : "☕ Tea, Coffee, Namkeen & Biscuits"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "टाटा टी गोल्ड, पारले-जी, गुड डे और हल्दीराम भुजिया"
                  : "Tata Tea Gold, Parle-G, Good Day & Haldiram Snacks"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "snacks-namkeen" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {snacksBreakfastProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 12. 🥛 Fresh Dairy & Milk Products Shelf */}
      {dairyProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "🥛 ताज़ा डेयरी, पनीर, दही एवं दूध उत्पाद"
                  : "🥛 Fresh Dairy, Paneer, Dahi & Cheese"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "अमूल मस्ती दही, मलाई पनीर, फ्रेश क्रीम, छाछ और चीज"
                  : "Amul Masti Dahi, Malai Paneer, Fresh Cream, Buttermilk & Cheese"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "dairy" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {dairyProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 13. 🍳 Cookware & Kitchen Utensils Shelf */}
      {cookwareUtensils.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "🍳 बर्तन, प्रेशर कुकर एवं रसोई उपकरण"
                  : "🍳 Cookware, Pressure Cookers & Utensils"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "हॉकिन्स कुकर, प्रेस्टीज डोसा तवा, कड़ाही, मिक्सर ग्राइंडर व चकला बेलन"
                  : "Hawkins Cookers, Prestige Non-stick Tawa, Kadhai & Mixer Grinders"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "utensils-cookware" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {cookwareUtensils.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 14. 🧽 Cleaning & Household Essentials Shelf */}
      {cleaningProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi"
                  ? "🧽 सफाई आपूर्ति, डिटर्जेंट, झाड़ू व पोछा"
                  : "🧽 Cleaning Supplies, Detergents & Mops"}
              </h2>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi"
                  ? "सर्फ एक्सेल, हार्पिक, प्रिल जेल, कोलिन, गाला झाड़ू व कॉटन पोछा"
                  : "Surf Excel, Harpic, Pril, Colin, Gala Broom & Cotton Mop"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "cleaning-supplies" }}
              className="text-xs font-semibold text-[#145A45] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 home-shelf-grid">
            {cleaningProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 15. Local Store Trust Section: क्यों चुनें Arun Gopal Traders? */}
      <section className="container-page">
        <div className="card-base border border-[#E8E4DA] bg-white p-6 sm:p-10">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F2] border border-[#E8E4DA] px-3.5 py-1 text-xs font-bold text-[#145A45]">
              <Store className="size-3.5 text-[#145A45]" />
              <span>
                {lang === "hi"
                  ? "📍 रामनगर, महाराजगंज की विश्वसनीय स्थानीय दुकान"
                  : "📍 Trusted Local Grocery Store in Ramnagar, Maharajganj"}
              </span>
            </div>
            <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#1F2924]">
              {lang === "hi"
                ? "क्यों खरीदें Arun Gopal Traders से?"
                : "Why Choose Arun Gopal Traders?"}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B746F]">
              {lang === "hi"
                ? "रामनगर, अड्डा बाजार रोड, महाराजगंज स्थित आपकी अपनी किराना दुकान — 100% शुद्ध राशन, सही वजन, उचित दरें और भरोसेमंद होम डिलीवरी।"
                : "Your trusted neighbourhood grocery store at Ramnagar, Adda Bazar Road, Maharajganj — committed to pure staples, accurate weights, fair rates, and reliable doorstep delivery."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]">
              <CheckCircle2 className="size-5 shrink-0 text-[#145A45]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2924]">
                  {lang === "hi" ? "100% असली व शुद्ध सामान" : "100% Pure & Genuine Staples"}
                </h4>
                <p className="mt-0.5 text-xs text-[#6B746F]">
                  Fortune, Aashirvaad, Tata, MDH, Everest &amp; Amul.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]">
              <Truck className="size-5 shrink-0 text-[#145A45]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2924]">
                  {lang === "hi" ? "30 मिनट तेज़ होम डिलीवरी" : "Fast Local Delivery"}
                </h4>
                <p className="mt-0.5 text-xs text-[#6B746F]">
                  {lang === "hi"
                    ? `₹${settings?.free_delivery_threshold ?? 499} से ऊपर 100% फ्री डिलीवरी।`
                    : `Free doorstep delivery on orders above ₹${settings?.free_delivery_threshold ?? 499}.`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]">
              <PhoneCall className="size-5 shrink-0 text-[#145A45]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2924]">
                  {lang === "hi" ? "दुकान से सीधा संपर्क" : "Direct Store Support"}
                </h4>
                <p className="mt-0.5 text-xs text-[#6B746F]">
                  {lang === "hi"
                    ? "कॉल या व्हाट्सएप: +91 6388354988"
                    : "Call or WhatsApp: +91 6388354988"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. Floating Contact Widget */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <button
          onClick={() => setOrderModalOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#EAE6DF] bg-white px-4 py-2.5 text-xs font-bold text-[#18483B] shadow-md hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95"
        >
          <Phone className="size-4 text-[#18483B]" />
          <span>{t.needHelp}</span>
        </button>
      </div>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </div>
  );
}
