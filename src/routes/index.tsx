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
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { getProductImage, getCategoryThumbnail } from "@/lib/product-images";
import { useCart } from "@/lib/cart";
import {
  categoriesQuery,
  productsQuery,
  settingsQuery,
  isOpenNow,
  type Product,
} from "@/lib/queries";
import { telHref, waHref, inr, discountPercent } from "@/lib/format";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders — Trusted Grocery Store in Maharajganj, UP" },
      {
        name: "description",
        content:
          "Buy Chakki Atta, Basmati Rice, Mustard Oil, Spices, Pulses & daily Kirana essentials online or by phone (+91 9621617360) with fast delivery in Maharajganj, UP.",
      },
      {
        property: "og:title",
        content: "Arun Gopal Traders — Trusted Grocery Store in Maharajganj, UP",
      },
      {
        property: "og:description",
        content: "Pure grocery essentials at genuine prices with doorstep delivery in Maharajganj.",
      },
    ],
  }),
  component: PremiumStoreHome,
});

function PremiumStoreHome() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories = [], isLoading: catLoading } = useQuery(categoriesQuery);
  const { data: products = [], isLoading: prodLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName, getProductName, getVariantLabel } = useLanguage();
  const { items: cartItems, add, setQty } = useCart();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [spotlightVariantIndex, setSpotlightVariantIndex] = useState(0);

  // Mobile Touch Swipe State for Hero Banner
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStartX(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchEndX(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped left -> next slide
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Live countdown timer for deal of the day
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 5, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const status = isOpenNow(settings);
  const storePhone = settings?.phone ?? "+91 9621617360";
  const cleanPhone = storePhone.replace(/\s+/g, "");
  const storeWhatsApp = settings?.whatsapp ?? "919621617360";

  const HERO_SLIDES = [
    {
      id: 1,
      tag: lang === "hi" ? "✨ खास वेलकम ऑफर" : "✨ SPECIAL WELCOME OFFER",
      statusLabel: lang === "hi" ? "⏰ फ्लैश ऑफर समाप्त होने में:" : "⏰ Flash Sale Ends In:",
      showTimer: true,
      preTitle: lang === "hi" ? "WELCOME50 कूपन कोड के साथ" : "With Coupon Code: WELCOME50",
      mainTitle: lang === "hi" ? "₹50 की सीधी छूट" : "Flat ₹50 Instant OFF",
      subtitle:
        lang === "hi"
          ? "₹300 से अधिक के राशन ऑर्डर पर पाएं ₹50 की तत्काल छूट। 100% शुद्ध चक्की आटा, दालें और शुद्ध तेल।"
          : "Get Flat ₹50 instant discount on grocery orders above ₹300. Freshly milled chakki atta, pulses & cold-pressed oils.",
      cta: lang === "hi" ? "ऑफर से खरीदारी करें →" : "Shop Offers Now →",
      coupon: "WELCOME50",
      link: "/shop",
      bgGradient: "from-[#0F382E] via-[#164E40] to-[#0A261F]",
      pillBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      accentIcon: "🎁",
      tabLabel: lang === "hi" ? "₹50 कूपन छूट" : "₹50 Welcome OFF",
    },
    {
      id: 2,
      tag: lang === "hi" ? "🚚 सुपरफास्ट होम डिलीवरी" : "🚚 EXPRESS HOME DELIVERY",
      statusLabel: lang === "hi" ? "⚡ 30-मिनट डिलीवरी चालू है" : "⚡ 30-Min Fast Delivery Active",
      showTimer: false,
      preTitle: lang === "hi" ? "₹499+ के सभी राशन ऑर्डर्स पर" : "On All Grocery Orders Above ₹499",
      mainTitle: lang === "hi" ? "100% फ्री होम डिलीवरी" : "100% FREE Home Delivery",
      subtitle:
        lang === "hi"
          ? "आटा, फॉर्च्यून तेल, दालें और मसाले सीधे आपके घर तक पहुंचाएं। सही तौल, पक्का बिल, नो हिडन चार्ज।"
          : "Daily essentials, Chakki Atta, Fortune Mustard Oil & Tata Salt delivered to your doorstep in Maharajganj.",
      cta: lang === "hi" ? "किराना सामान देखें →" : "Browse Groceries →",
      coupon: null,
      link: "/shop",
      bgGradient: "from-[#143E33] via-[#1A5344] to-[#0E2F26]",
      pillBg: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
      accentIcon: "🚚",
      tabLabel: lang === "hi" ? "फ्री होम डिलीवरी" : "Free Delivery",
    },
    {
      id: 3,
      tag: lang === "hi" ? "💬 डायरेक्ट व्हाट्सएप सेवा" : "💬 DIRECT WHATSAPP ORDER",
      statusLabel: lang === "hi" ? "🟢 2 मिनट में पर्ची पैकिंग" : "🟢 2-Min Quick Order Processing",
      showTimer: false,
      preTitle: lang === "hi" ? "पर्ची की फोटो या मैसेज भेजें" : "Send List Photo or Message",
      mainTitle: lang === "hi" ? "व्हाट्सएप पर 1-टैप ऑर्डर" : "Order on WhatsApp",
      subtitle:
        lang === "hi"
          ? "ऐप में सामान ढूंढने का झंझट छोड़ें — अपनी मासिक राशन पर्ची की फोटो +91 9621617360 पर भेजें और घर बैठे पाएं।"
          : "Skip adding items to cart — simply send your handwritten monthly grocery list to +91 9621617360 for instant packing.",
      cta: lang === "hi" ? "व्हाट्सएप पर लिस्ट भेजें" : "Send List on WhatsApp",
      isWhatsApp: true,
      coupon: null,
      link: "/contact",
      bgGradient: "from-[#0D3329] via-[#124235] to-[#08221B]",
      pillBg: "bg-green-400/20 text-green-300 border-green-400/40",
      accentIcon: "💬",
      tabLabel: lang === "hi" ? "व्हाट्सएप ऑर्डर" : "WhatsApp Order",
    },
  ];

  // Auto-advance banner carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [HERO_SLIDES.length]);

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCoupon(false), 3000);
  }

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

  const activeSlide = HERO_SLIDES[currentSlide] ?? HERO_SLIDES[0]!;

  // Spotlight Deal product for right hero widget
  const spotlightProduct = products.find((p) => p.is_featured) ?? products[0];
  const spotlightVariants = (spotlightProduct?.product_variants ?? []).filter((v) => v.is_active);
  const activeSpotlightVariant = spotlightVariants[spotlightVariantIndex] ?? spotlightVariants[0];
  const spotlightDiscount = activeSpotlightVariant
    ? discountPercent(Number(activeSpotlightVariant.mrp), Number(activeSpotlightVariant.price))
    : 0;
  const spotlightInCart = cartItems.find((i) => i.variantId === activeSpotlightVariant?.id);

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
      {/* 1. Category Showcase Grid/Cards */}
      <section className="border-b border-[#EAE6DF] bg-white py-4 sm:py-5 shadow-2xs">
        <div className="container-page">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#676D68] flex items-center gap-1.5">
              <span>🏪</span>{" "}
              {lang === "hi" ? "कैटेगरी के अनुसार खरीदारी करें" : "Shop by Category"}
            </h2>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#18483B] hover:underline flex items-center gap-1"
            >
              {t.viewAll} ({parentCategories.length}) <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-1 py-1">
            {catLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[5.5rem]">
                    <Skeleton className="size-16 rounded-2xl" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              : parentCategories.map((c) => (
                  <Link
                    key={c.id}
                    to="/shop"
                    search={{ category: c.slug }}
                    className="group flex flex-col items-center gap-2 min-w-[5.4rem] sm:min-w-[6.4rem] shrink-0 text-center transition-all hover:-translate-y-1"
                  >
                    <div className="relative flex size-16 sm:size-20 items-center justify-center overflow-hidden rounded-2xl border border-[#EAE6DF] bg-white p-1 shadow-2xs group-hover:border-[#18483B] group-hover:shadow-md transition-all">
                      <img
                        src={getCategoryThumbnail(c)}
                        alt={c.name}
                        loading="lazy"
                        className="size-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#191C1B] group-hover:text-[#18483B] line-clamp-1 max-w-[6.2rem]">
                      {getCategoryName(c.name, c.slug)}
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* 2. Top-Notch Hero Section with Slider & Deal Spotlight */}
      <section className="container-page pt-1">
        <div className="grid gap-4 lg:grid-cols-[1fr_21.5rem] items-stretch">
          {/* Left Column: Interactive Swipeable Banner Slider with Locked Height */}
          <div
            className="relative overflow-hidden rounded-3xl shadow-lg border border-[#18483B]/20 flex flex-col justify-between select-none bg-[#0F382E]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Horizontal Sliding Track */}
            <div
              className="flex w-full transition-transform duration-500 ease-out items-stretch"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {HERO_SLIDES.map((slide) => (
                <div
                  key={slide.id}
                  className={`w-full shrink-0 relative flex flex-col justify-between bg-gradient-to-br ${slide.bgGradient} p-5 sm:p-8 md:p-10 text-white min-h-[380px] sm:min-h-[400px] md:min-h-[430px] overflow-hidden`}
                >
                  {/* Subtle background ambient mesh */}
                  <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-emerald-400/15 blur-3xl" />
                  <div className="pointer-events-none absolute -left-16 -bottom-16 size-80 rounded-full bg-amber-400/15 blur-3xl" />

                  <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center flex-1">
                    {/* Left: Text Content with Uniform Height Rhythm */}
                    <div className="max-w-xl flex flex-col justify-between h-full space-y-2.5 sm:space-y-3">
                      {/* Top Eyebrow Badge & Contextual Status */}
                      <div className="flex flex-wrap items-center gap-2 min-h-[28px]">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[11px] font-bold tracking-wide backdrop-blur-md ${slide.pillBg}`}
                        >
                          <Sparkles className="size-3.5" />
                          <span>{slide.tag}</span>
                        </span>

                        {/* Contextual Status / Timer Pill */}
                        {slide.showTimer ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/50 border border-amber-400/50 px-3 py-1 text-[11px] font-mono font-bold text-amber-300 backdrop-blur-md shadow-2xs">
                            <Timer className="size-3.5 text-amber-400 animate-pulse" />
                            <span className="font-sans font-medium text-amber-200/90 mr-0.5">
                              {slide.statusLabel}
                            </span>
                            <span>
                              {String(timeLeft.hours).padStart(2, "0")}:
                              {String(timeLeft.minutes).padStart(2, "0")}:
                              {String(timeLeft.seconds).padStart(2, "0")}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-md shadow-2xs">
                            <span>{slide.statusLabel}</span>
                          </div>
                        )}
                      </div>

                      {/* Clear Typography Hierarchy: Subheading + Massive Headline */}
                      <div className="space-y-1 min-h-[62px] sm:min-h-[76px] flex flex-col justify-center">
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 drop-shadow-2xs">
                          {slide.preTitle}
                        </p>
                        <h1 className="font-sans text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                          {slide.mainTitle}
                        </h1>
                      </div>

                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-lg min-h-[36px] sm:min-h-[40px] line-clamp-2 sm:line-clamp-none">
                        {slide.subtitle}
                      </p>

                      {/* Uniform 36px Value/Benefit Row */}
                      <div className="min-h-[36px] flex items-center">
                        {slide.coupon ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyCode(slide.coupon!)}
                              className="inline-flex items-center gap-2 rounded-xl bg-black/50 border border-amber-400/60 px-3.5 py-1.5 text-xs font-mono font-bold text-amber-300 shadow-sm hover:bg-black/70 transition-colors cursor-pointer active:scale-95"
                            >
                              <Tag className="size-3.5 text-amber-400" />
                              <span>Code: {slide.coupon}</span>
                              {copiedCoupon ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-sans text-[11px]">
                                  <Check className="size-3.5" />{" "}
                                  {lang === "hi" ? "कॉपी हो गया!" : "COPIED!"}
                                </span>
                              ) : (
                                <Copy className="size-3.5 text-white/80" />
                              )}
                            </button>
                            <span className="text-[11px] text-white/80 font-medium">
                              {lang === "hi" ? "(टैप करके कूपन कोड कॉपी करें)" : "(Tap to copy)"}
                            </span>
                          </div>
                        ) : slide.id === 2 ? (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-black/40 border border-emerald-400/40 px-3.5 py-1.5 text-xs font-medium text-emerald-200 shadow-sm">
                            <Truck className="size-3.5 text-emerald-400" />
                            <span>
                              {lang === "hi"
                                ? "₹499+ के ऑर्डर पर 0 डिलीवरी शुल्क • सीधा घर तक"
                                : "Zero Delivery Fee on ₹499+ • Doorstep Delivery"}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-black/40 border border-green-400/40 px-3.5 py-1.5 text-xs font-medium text-green-200 shadow-sm">
                            <MessageCircle className="size-3.5 text-green-400" />
                            <span>
                              {lang === "hi"
                                ? "व्हाट्सएप: +91 9621617360 पर पर्ची भेजें"
                                : "WhatsApp: +91 9621617360 for Fast Packing"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        {slide.isWhatsApp ? (
                          <Button
                            asChild
                            size="lg"
                            className="rounded-full bg-[#25D366] text-[#0A261F] font-extrabold px-6 sm:px-7 py-2.5 sm:py-3 text-xs shadow-xl hover:bg-[#20ba59] transition-all hover:scale-105"
                          >
                            <a
                              href={waHref(
                                storeWhatsApp,
                                "Namaste Arun Gopal Traders, I want to send my grocery list.",
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="mr-2 size-4 fill-current" /> {slide.cta}
                            </a>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            size="lg"
                            className="rounded-full bg-white px-6 sm:px-7 py-2.5 sm:py-3 text-xs font-extrabold text-[#18483B] shadow-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
                          >
                            <Link to={slide.link}>
                              <ShoppingBag className="mr-2 size-4 text-[#18483B]" /> {slide.cta}
                            </Link>
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => setOrderModalOpen(true)}
                          className="rounded-full border border-white/40 bg-white/15 px-4 py-2 sm:py-2.5 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <PhoneCall className="size-3.5 text-amber-300" /> {t.orderOnPhone}
                        </button>
                      </div>
                    </div>

                    {/* Right: Grounded Supermarket Studio Product Showcase Podium */}
                    <div className="hidden md:flex flex-col items-center justify-center relative shrink-0">
                      <div className="relative w-64 lg:w-72 rounded-3xl bg-black/25 backdrop-blur-md p-4 border border-white/20 shadow-2xl overflow-hidden flex flex-col items-center">
                        {/* Studio Ambient Glow */}
                        <div className="pointer-events-none absolute -top-10 inset-x-0 h-32 rounded-full bg-emerald-400/20 blur-2xl" />

                        {/* Platform Top Badge */}
                        <div className="relative z-10 mb-3 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/20">
                          <Sparkles className="size-3 text-amber-300" />
                          <span>
                            {lang === "hi"
                              ? "100% शुद्ध ताज़ा किराना"
                              : "100% Pure Fresh Groceries"}
                          </span>
                        </div>

                        {/* Studio Counter Showcase with 3 Grounded Products */}
                        <div className="relative z-10 flex items-end justify-center gap-2 w-full pt-1 pb-1">
                          {/* Product 1: Fortune Oil (Left) */}
                          <div className="flex flex-col items-center group/item">
                            <div className="w-16 sm:w-20 h-28 rounded-xl bg-white p-1.5 shadow-lg border border-white/60 flex items-center justify-center transition-transform group-hover/item:scale-105">
                              <img
                                src="/images/products/fortune-mustard-oil.jpg"
                                alt="Fortune Mustard Oil"
                                className="size-full object-contain"
                              />
                            </div>
                            <div className="w-14 h-1.5 bg-black/50 rounded-full blur-[2px] mt-1" />
                            <span className="text-[9px] font-bold text-white/90 mt-1 text-center">
                              {lang === "hi" ? "सरसों तेल" : "Mustard Oil"}
                            </span>
                          </div>

                          {/* Product 2: Aashirvaad Atta (Center - Hero Product) */}
                          <div className="flex flex-col items-center group/item z-10 -mx-1">
                            <div className="w-20 sm:w-24 h-32 rounded-2xl bg-white p-2 shadow-2xl border-2 border-amber-300 flex items-center justify-center transition-transform group-hover/item:scale-105 relative">
                              <span className="absolute -top-2 rounded-full bg-amber-500 px-2 py-0.2 text-[8px] font-black text-black uppercase tracking-wider shadow-xs">
                                {lang === "hi" ? "सर्वश्रेष्ठ" : "Bestseller"}
                              </span>
                              <img
                                src="/images/products/aashirvaad-atta.jpg"
                                alt="Aashirvaad Atta"
                                className="size-full object-contain"
                              />
                            </div>
                            <div className="w-20 h-2 bg-black/60 rounded-full blur-[2px] mt-1" />
                            <span className="text-[10px] font-extrabold text-amber-300 mt-1 text-center">
                              {lang === "hi" ? "चक्की आटा" : "Chakki Atta"}
                            </span>
                          </div>

                          {/* Product 3: Amul Desi Ghee (Right) */}
                          <div className="flex flex-col items-center group/item">
                            <div className="w-16 sm:w-20 h-28 rounded-xl bg-white p-1.5 shadow-lg border border-white/60 flex items-center justify-center transition-transform group-hover/item:scale-105">
                              <img
                                src="/images/products/amul-desi-ghee.jpg"
                                alt="Amul Pure Desi Ghee"
                                className="size-full object-contain"
                              />
                            </div>
                            <div className="w-14 h-1.5 bg-black/50 rounded-full blur-[2px] mt-1" />
                            <span className="text-[9px] font-bold text-white/90 mt-1 text-center">
                              {lang === "hi" ? "देसी घी" : "Desi Ghee"}
                            </span>
                          </div>
                        </div>

                        {/* Grounded Showcase Base Surface */}
                        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Offer Switcher Bar (Tabs + Dots + Arrows at bottom of hero) */}
            <div className="border-t border-white/15 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              {/* Offer Category Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      currentSlide === idx
                        ? "bg-white text-[#18483B] shadow-xs scale-105"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <span>{slide.accentIcon}</span>
                    <span>{slide.tabLabel}</span>
                  </button>
                ))}
              </div>

              {/* Slider Dots + Arrows */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentSlide === idx ? "w-5 bg-amber-400" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlide(
                        (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
                      )
                    }
                    aria-label="Previous slide"
                    className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5 sm:size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                    aria-label="Next slide"
                    className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronRight className="size-3.5 sm:size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: "Deal of the Day" Live Product Spotlight Box */}
          {spotlightProduct && activeSpotlightVariant && (
            <div className="card-base hidden lg:flex flex-col justify-between p-5 bg-white border border-[#EAE6DF] relative overflow-hidden shadow-xs">
              {/* Spotlight Header with Live Flame */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE6DF]">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#18483B] uppercase tracking-wider">
                  <span className="flex size-2 rounded-full bg-amber-500 animate-ping" />
                  <Flame className="size-4 text-amber-600 fill-amber-600" />
                  {lang === "hi" ? "आज का खास ऑफर" : "Deal of the Day"}
                </span>
                <span className="rounded-full bg-[#EBF4F0] px-2.5 py-0.5 text-[11px] font-bold text-[#18483B]">
                  {spotlightDiscount}% {t.off}
                </span>
              </div>

              {/* Product Image with Floating Savings Badge */}
              <Link
                to="/product/$slug"
                params={{ slug: spotlightProduct.slug }}
                className="group relative my-2.5 flex aspect-square w-full max-h-48 items-center justify-center overflow-hidden rounded-xl bg-white border border-[#EFECE6] p-3 transition-all duration-200 group-hover:border-[#D8D2C4]"
              >
                <img
                  src={getProductImage(spotlightProduct)}
                  alt={getProductName(spotlightProduct.name, spotlightProduct.slug)}
                  className="size-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                />
                {activeSpotlightVariant.mrp > activeSpotlightVariant.price && (
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-[#15803D] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    {t.save} ₹
                    {Math.round(activeSpotlightVariant.mrp - activeSpotlightVariant.price)}
                  </span>
                )}
              </Link>

              {/* Details & Variant Pills */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#676D68]">
                  <span>{spotlightProduct.brand}</span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <Star className="size-3 fill-amber-400 text-amber-400" /> 4.9 (120+)
                  </span>
                </div>

                <Link
                  to="/product/$slug"
                  params={{ slug: spotlightProduct.slug }}
                  className="font-sans text-sm font-bold text-[#191C1B] hover:text-[#18483B] line-clamp-1 mt-0.5"
                >
                  {getProductName(spotlightProduct.name, spotlightProduct.slug)}
                </Link>

                {/* Variant Selector Pills */}
                {spotlightVariants.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {spotlightVariants.map((v, i) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSpotlightVariantIndex(i)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all ${
                          i === spotlightVariantIndex
                            ? "border-[#18483B] bg-[#18483B] text-white"
                            : "border-[#EAE6DF] bg-white text-[#676D68] hover:border-[#18483B]"
                        }`}
                      >
                        {getVariantLabel(v.label)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Price Row */}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-extrabold text-[#191C1B]">
                    {inr(activeSpotlightVariant.price)}
                  </span>
                  {activeSpotlightVariant.mrp > activeSpotlightVariant.price && (
                    <span className="text-xs text-[#676D68] line-through">
                      {inr(activeSpotlightVariant.mrp)}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-[#15803D] ml-auto">
                    {lang === "hi" ? "🔥 स्टॉक में उपलब्ध" : "🔥 Live Stock"}
                  </span>
                </div>

                {/* Instant Add to Cart / Stepper */}
                <div className="mt-3">
                  {spotlightInCart ? (
                    <div className="flex h-9 items-center justify-between rounded-full border border-[#18483B] bg-[#EBF4F0] px-3">
                      <button
                        type="button"
                        onClick={() => setQty(spotlightInCart.variantId, spotlightInCart.qty - 1)}
                        className="flex size-6 items-center justify-center rounded-full text-[#18483B] hover:bg-white transition-colors"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="text-xs font-bold text-[#18483B]">
                        {spotlightInCart.qty} {lang === "hi" ? "जोड़ा गया" : "Added"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(spotlightInCart.variantId, spotlightInCart.qty + 1)}
                        className="flex size-6 items-center justify-center rounded-full text-[#18483B] hover:bg-white transition-colors"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        add({
                          variantId: activeSpotlightVariant.id,
                          productId: spotlightProduct.id,
                          slug: spotlightProduct.slug,
                          name: getProductName(spotlightProduct.name, spotlightProduct.slug),
                          variantLabel: getVariantLabel(activeSpotlightVariant.label),
                          price: Number(activeSpotlightVariant.price),
                          mrp: Number(activeSpotlightVariant.mrp),
                          imageUrl: getProductImage(spotlightProduct),
                          stock: activeSpotlightVariant.stock,
                        });
                        toast.success(
                          `${getProductName(spotlightProduct.name, spotlightProduct.slug)} added to cart`,
                        );
                      }}
                      className="w-full rounded-full bg-[#18483B] text-xs font-bold text-white shadow-xs hover:bg-[#133A2F]"
                    >
                      <Plus className="mr-1 size-3.5" /> {t.add}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4-Item Trust & Assurance Ribbon under Hero */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="card-base flex items-center gap-3 p-3 bg-white border border-[#EAE6DF]">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B] shrink-0">
              <Truck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">
                {lang === "hi" ? "30 मिनट होम डिलीवरी" : "30-Min Fast Delivery"}
              </p>
              <p className="text-[10px] text-[#676D68]">
                {lang === "hi" ? "रामनगर व महाराजगंज में" : "In Ramnagar & City"}
              </p>
            </div>
          </div>

          <div className="card-base flex items-center gap-3 p-3 bg-white border border-[#EAE6DF]">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B] shrink-0">
              <Award className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">
                {lang === "hi" ? "100% शुद्ध एवं असली" : "100% Pure & Authentic"}
              </p>
              <p className="text-[10px] text-[#676D68]">
                {lang === "hi" ? "सीधे मंडी व ब्रांड से" : "Fresh Mandi Sourcing"}
              </p>
            </div>
          </div>

          <div className="card-base flex items-center gap-3 p-3 bg-white border border-[#EAE6DF]">
            <div className="grid size-9 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B] shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">
                {lang === "hi" ? "कैश ऑन डिलीवरी / UPI" : "Pay on Delivery / UPI"}
              </p>
              <p className="text-[10px] text-[#676D68]">
                {lang === "hi" ? "सामान देखकर भुगतान करें" : "Safe & Easy Payments"}
              </p>
            </div>
          </div>

          <a
            href={waHref(storeWhatsApp, "Namaste! I want to order monthly grocery list.")}
            target="_blank"
            rel="noreferrer"
            className="card-base flex items-center gap-3 p-3 bg-[#EBF4F0] border border-[#18483B]/20 hover:border-[#18483B] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#25D366] text-white shrink-0">
              <MessageCircle className="size-4 fill-white text-[#25D366]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#18483B]">
                {lang === "hi" ? "व्हाट्सएप पर ऑर्डर करें" : "WhatsApp Quick Order"}
              </p>
              <p className="text-[10px] text-[#133A2F]">
                {lang === "hi" ? "राशन पर्ची भेजें" : "+91 9621617360"}
              </p>
            </div>
          </a>
        </div>

        {/* Trending Quick Search Bar below Hero */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#676D68] shrink-0">
            <TrendingUp className="size-3 text-[#18483B]" />
            {lang === "hi" ? "लोकप्रिय खोजें:" : "Popular Searches:"}
          </span>
          <div className="flex items-center gap-1.5">
            {TRENDING_SEARCHES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void navigate({ to: "/shop", search: { q: item.q } as never })}
                className="shrink-0 rounded-full border border-[#EAE6DF] bg-white px-2.5 py-1 text-[11px] font-medium text-[#191C1B] hover:border-[#18483B] hover:text-[#18483B] transition-colors shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Quick Actions Row */}
      <section className="container-page">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Link
            to="/shop"
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#18483B] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F5] text-[#18483B]">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.quickShop}</p>
              <p className="text-[10px] text-[#676D68]">
                {lang === "hi" ? "सामान सूची" : "Browse items"}
              </p>
            </div>
          </Link>

          <Link
            to="/track"
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#18483B] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F5] text-[#18483B]">
              <Package className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.quickOrders}</p>
              <p className="text-[10px] text-[#676D68]">
                {lang === "hi" ? "लाइव स्थिति" : "Track status"}
              </p>
            </div>
          </Link>

          <Link
            to="/account"
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#18483B] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F5] text-[#18483B]">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.quickBuyAgain}</p>
              <p className="text-[10px] text-[#676D68]">
                {lang === "hi" ? "पुराना सामान" : "Past essentials"}
              </p>
            </div>
          </Link>

          <a
            href={telHref(cleanPhone)}
            className="card-base flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#18483B] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F5] text-[#18483B]">
              <Phone className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.quickCall}</p>
              <p className="text-[10px] text-[#676D68]">{storePhone}</p>
            </div>
          </a>

          <a
            href={
              settings?.maps_link ??
              "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
            }
            target="_blank"
            rel="noreferrer"
            className="card-base col-span-2 sm:col-span-1 flex items-center gap-3 p-3 sm:p-3.5 hover:border-[#18483B] transition-colors"
          >
            <div className="grid size-9 place-items-center rounded-full bg-[#FAF8F5] text-[#18483B]">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.quickLocation}</p>
              <p className="text-[10px] text-[#676D68]">Ramnagar, Adda Bazar</p>
            </div>
          </a>
        </div>
      </section>

      {/* 4. Trust Badges Row */}
      <section className="container-page">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 card-base p-3 sm:p-4">
          <div className="flex items-center gap-3 p-2 border-r border-[#EAE6DF] last:border-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <Truck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.freeDeliveryTitle}</p>
              <p className="text-[10px] text-[#676D68]">{t.freeDeliverySub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-r border-[#EAE6DF] last:border-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <Store className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.storePickupTitle}</p>
              <p className="text-[10px] text-[#676D68]">{t.storePickupSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-r border-[#EAE6DF] last:border-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#191C1B]">{t.genuineBrandsTitle}</p>
              <p className="text-[10px] text-[#676D68]">{t.genuineBrandsSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <Award className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#18483B]">{t.purityTagline}</p>
              <p className="text-[10px] text-[#191C1B] font-medium">{t.puritySub}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ⚡ Flash Deals of the Day / आज के खास ऑफर्स */}
      <section className="container-page">
        <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-[#EBF4F0] text-[#18483B]">
              <Flame className="size-4 text-amber-600 fill-amber-600" />
            </span>
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {t.dealsOfDay}
              </h2>
              <p className="text-xs text-[#676D68]">{t.dealsOfDaySub}</p>
            </div>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-[#18483B] hover:underline flex items-center gap-1"
          >
            {t.viewAll} ({products.length}) <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {prodLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))
            : flashDeals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* 6. 🌾 Atta, Rice & Whole Grains Shelf (आटा, चावल व अनाज) */}
      {attaRiceProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "🌾 आटा, बासमती चावल एवं अनाज"
                  : "🌾 Fresh Atta, Basmati Rice & Grains"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "आशीर्वाद, फॉर्च्यून चक्की आटा और प्रीमियम दावत बासमती चावल"
                  : "Aashirvaad, Fortune Chakki Atta, Daawat Basmati Rice & Poha"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "flour-atta" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {attaRiceProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 7. 🫘 Pure Pulses & Dal Shelf (दालें व दलहन) */}
      {dalPulsesProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi" ? "🫘 शुद्ध दालें एवं दलहन" : "🫘 Pure Pulses & Dal Varieties"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "अरहर/तूर दाल, मूंग दाल, चना दाल, राजमा और काबुली चना"
                  : "Arhar Dal, Moong Dal, Chana Dal, Rajma & Kabuli Chana"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "pulses-dal" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {dalPulsesProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 8. 🛢️ Cooking Oil & Pure Ghee Shelf (सरसों तेल व देसी घी) */}
      {oilGheeProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "🛢️ सरसों का तेल एवं शुद्ध देसी घी"
                  : "🛢️ Mustard Oil & Pure Desi Ghee"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "फॉर्च्यून कच्ची घानी, धारा और अमूल देसी घी"
                  : "Fortune Kachi Ghani, Dhara & Amul Pure Ghee"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "oil-ghee" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {oilGheeProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Promotional Coupon Banner */}
      <section className="container-page">
        <div className="card-base border border-[#EAE6DF] bg-gradient-to-br from-[#FAF8F5] via-[#F4F1EB] to-[#EBF4F0] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="inline-block rounded-full bg-[#18483B] px-3 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                {lang === "hi" ? "विशेष स्वागत कूपन" : "SPECIAL STORE COUPON"}
              </span>
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#191C1B]">
                {t.welcomeOfferTitle}
              </h3>
              <p className="text-xs text-[#676D68]">{t.welcomeOfferSub}</p>
            </div>
            <Button
              asChild
              className="rounded-full bg-[#18483B] px-8 text-xs font-bold text-white shadow-xs hover:bg-[#133A2F]"
            >
              <Link to="/shop">{t.shopNow}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 10. 🌶️ Spices, Masala & Dry Fruits Shelf (मसाले व सूखे मेवे) */}
      {spicesMasalaProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "🌶️ खड़े मसाले, पिसा मसाला व सूखे मेवे"
                  : "🌶️ Spices, Whole Masala & Dry Fruits"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "एमडीएच, एवरेस्ट मसाले, काजू, बादाम और किशमिश"
                  : "MDH, Everest Masala, Cashews, Almonds & Raisins"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "spices-masala" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {spicesMasalaProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 11. ☕ Snacks, Tea & Daily Essentials Shelf */}
      {snacksBreakfastProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "☕ चाय, नाश्ता, नमकीन एवं बिस्कुट"
                  : "☕ Tea, Coffee, Namkeen & Biscuits"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "टाटा टी गोल्ड, पारले-जी, गुड डे और हल्दीराम भुजिया"
                  : "Tata Tea Gold, Parle-G, Good Day & Haldiram Snacks"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "snacks-namkeen" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {snacksBreakfastProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 12. 🥛 Fresh Dairy & Milk Products Shelf */}
      {dairyProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "🥛 ताज़ा डेयरी, पनीर, दही एवं दूध उत्पाद"
                  : "🥛 Fresh Dairy, Paneer, Dahi & Cheese"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "अमूल मस्ती दही, मलाई पनीर, फ्रेश क्रीम, छाछ और चीज"
                  : "Amul Masti Dahi, Malai Paneer, Fresh Cream, Buttermilk & Cheese"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "dairy" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {dairyProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 13. 🍳 Cookware & Kitchen Utensils Shelf */}
      {cookwareUtensils.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "🍳 बर्तन, प्रेशर कुकर एवं रसोई उपकरण"
                  : "🍳 Cookware, Pressure Cookers & Utensils"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "हॉकिन्स कुकर, प्रेस्टीज डोसा तवा, कड़ाही, मिक्सर ग्राइंडर व चकला बेलन"
                  : "Hawkins Cookers, Prestige Non-stick Tawa, Kadhai & Mixer Grinders"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "utensils-cookware" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cookwareUtensils.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 14. 🧽 Cleaning & Household Essentials Shelf */}
      {cleaningProducts.length > 0 && (
        <section className="container-page">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#191C1B]">
                {lang === "hi"
                  ? "🧽 सफाई आपूर्ति, डिटर्जेंट, झाड़ू व पोछा"
                  : "🧽 Cleaning Supplies, Detergents & Mops"}
              </h2>
              <p className="text-xs text-[#676D68]">
                {lang === "hi"
                  ? "सर्फ एक्सेल, हार्पिक, प्रिल जेल, कोलिन, गाला झाड़ू व कॉटन पोछा"
                  : "Surf Excel, Harpic, Pril, Colin, Gala Broom & Cotton Mop"}
              </p>
            </div>
            <Link
              to="/shop"
              search={{ category: "cleaning-supplies" }}
              className="text-xs font-semibold text-[#18483B] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cleaningProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 15. Local Store Trust & Rating Section */}
      <section className="container-page">
        <div className="card-base border border-[#EAE6DF] bg-white p-6 sm:p-10">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] px-3 py-1 text-xs font-bold text-[#18483B]">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>
                4.9 / 5.0 • {lang === "hi" ? "500+ स्थानीय परिवार" : "500+ Local Families"}
              </span>
            </div>
            <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#191C1B]">
              {lang === "hi"
                ? "अरुण गोपाल ट्रेडर्स पर क्यों करें भरोसा?"
                : "Why shop with Arun Gopal Traders?"}
            </h2>
            <p className="text-xs sm:text-sm text-[#676D68]">
              {lang === "hi"
                ? "रामनगर, महाराजगंज में स्थित आपकी अपनी भरोसेमंद किराना दुकान — शुद्ध राशन, सही तौल, और विश्वसनीय सेवा।"
                : "Your trusted neighbourhood grocery store in Ramnagar, Maharajganj — committed to pure staples, accurate weights, and doorstep delivery."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
              <CheckCircle2 className="size-5 shrink-0 text-[#18483B]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#191C1B]">
                  {lang === "hi" ? "100% असली व शुद्ध ब्रांड्स" : "100% Genuine Brands"}
                </h4>
                <p className="mt-0.5 text-xs text-[#676D68]">
                  Fortune, Aashirvaad, Tata, MDH &amp; Amul.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
              <Truck className="size-5 shrink-0 text-[#18483B]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#191C1B]">
                  {lang === "hi" ? "महाराजगंज में तेज़ होम डिलीवरी" : "Fast Local Delivery"}
                </h4>
                <p className="mt-0.5 text-xs text-[#676D68]">
                  {lang === "hi"
                    ? `₹${settings?.free_delivery_threshold ?? 499} से ऊपर फ्री डिलीवरी।`
                    : `Free delivery on orders above ₹${settings?.free_delivery_threshold ?? 499}.`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
              <PhoneCall className="size-5 shrink-0 text-[#18483B]" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#191C1B]">
                  {lang === "hi" ? "आसान फोन व व्हाट्सएप ऑर्डर" : "Easy Phone Ordering"}
                </h4>
                <p className="mt-0.5 text-xs text-[#676D68]">
                  {lang === "hi"
                    ? "कॉल या व्हाट्सएप करें: +91 9621617360"
                    : "Call or WhatsApp: +91 9621617360"}
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
