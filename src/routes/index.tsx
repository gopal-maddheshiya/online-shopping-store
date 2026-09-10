import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getCategoryHeadings, CategoryHeading } from "@/lib/category-headings";
import {
  ShoppingBag,
  Phone,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  PhoneCall,
  MessageCircle,
  ChevronRight,
  Flame,
  Award,
  Store,
  BadgeCheck,
  Gift,
  UtensilsCrossed,
  Home,
  Heart,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { getCategoryThumbnail } from "@/lib/product-images";
import {
  categoriesQuery,
  productsQuery,
  featuredProductsQuery,
  settingsQuery,
  isOpenNow,
} from "@/lib/queries";
import { waHref } from "@/lib/format";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";

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
      { title: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर | महाराजगंज" },
      {
        name: "description",
        content:
          "अरुण गोपाल ट्रेडर्स — हर दिन की जरूरत, अब आसान खरीदारी के साथ! आटा, चावल, दाल, तेल, मसाले और रोज़मर्रा का 100% शुद्ध सामान। रामनगर चौराहा, अड्डा बाजार रोड",
      },
      { property: "og:site_name", content: "अरुण गोपाल ट्रेडर्स — Arun Gopal Traders" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर | महाराजगंज" },
      {
        property: "og:description",
        content:
          "हर दिन की जरूरत, अब आसान खरीदारी के साथ! ऑनलाइन सामान देखें, शुद्ध राशन व घरेलू उत्पाद ऑर्डर करें। रामनगर चौराहा, अड्डा बाजार रोड",
      },
      {
        property: "og:image",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
      {
        property: "og:image:secure_url",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर, महाराजगंज",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर | महाराजगंज" },
      {
        name: "twitter:description",
        content:
          "हर दिन की जरूरत, अब आसान खरीदारी के साथ! ऑनलाइन सामान देखें, शुद्ध राशन व घरेलू उत्पाद ऑर्डर करें। रामनगर चौराहा, अड्डा बाजार रोड",
      },
      {
        name: "twitter:image",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="container-page py-16 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-[#E8E4DA] bg-white p-8 shadow-xs">
        <h2 className="font-sans text-xl font-bold text-[#1F2924]">
          Unable to load homepage catalogue
        </h2>
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

/* ═══════════════════════════════════════════════════════════════
   Reusable Section Header
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({
  icon,
  title,
  subtitle,
  linkTo,
  linkSearch,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  linkTo: string;
  linkSearch?: Record<string, string>;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between pb-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#E6EFE8] to-[#D4E8DC]/60 border border-[#145A45]/10 shadow-2xs">
          {icon}
        </div>
        <div>
          <h2 className="font-sans text-base sm:text-lg font-black text-[#16201A] tracking-tight">
            {title}
          </h2>
          <p className="text-[11px] sm:text-xs text-[#5A655F] mt-0.5">{subtitle}</p>
        </div>
      </div>
      <Link
        to={linkTo}
        search={linkSearch as never}
        className="group inline-flex items-center gap-1 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] px-3 py-1.5 text-xs font-bold text-[#145A45] hover:bg-[#145A45] hover:text-white hover:border-[#145A45] transition-all shrink-0 shadow-2xs"
      >
        <span>{linkLabel}</span>
        <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

// Soft pastel floating tints inspired by Blinkit / Zepto
const BLINKIT_CATEGORY_TINTS = [
  { bg: "bg-[#F0F7F2]", border: "border-[#D6EADB]", hoverBg: "group-hover:bg-[#E4F2E7]", hoverBorder: "group-hover:border-[#145A45]/35" }, // Mint fresh
  { bg: "bg-[#FCF5EC]", border: "border-[#F4E3CD]", hoverBg: "group-hover:bg-[#F8EBD8]", hoverBorder: "group-hover:border-[#C4832E]/35" }, // Warm harvest
  { bg: "bg-[#F3F6FC]", border: "border-[#D8E4F8]", hoverBg: "group-hover:bg-[#E6EFFB]", hoverBorder: "group-hover:border-[#3368C6]/35" }, // Soft azure
  { bg: "bg-[#FAF3EE]", border: "border-[#F2DFD4]", hoverBg: "group-hover:bg-[#F5E6DC]", hoverBorder: "group-hover:border-[#C66233]/35" }, // Terracotta
  { bg: "bg-[#F8F7EB]", border: "border-[#EDE8C8]", hoverBg: "group-hover:bg-[#F2EDC5]", hoverBorder: "group-hover:border-[#B5A122]/35" }, // Buttercup gold
  { bg: "bg-[#FAF2F6]", border: "border-[#F1DCE7]", hoverBg: "group-hover:bg-[#F5E4EE]", hoverBorder: "group-hover:border-[#A83874]/35" }, // Rose berry
  { bg: "bg-[#F2F8F8]", border: "border-[#D5ECEC]", hoverBg: "group-hover:bg-[#E2F3F3]", hoverBorder: "group-hover:border-[#2A9696]/35" }, // Teal breeze
  { bg: "bg-[#F8F5FC]", border: "border-[#EADDF8]", hoverBg: "group-hover:bg-[#EFE4FB]", hoverBorder: "group-hover:border-[#7A3EB8]/35" }, // Lavender
];

/* ═══════════════════════════════════════════════════════════════
   MAIN HOMEPAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function PremiumStoreHome() {
  const { data: settings } = useQuery(settingsQuery);
  const isDeliveryEnabled = settings?.delivery_enabled !== false;
  const { data: categories = [], isLoading: catLoading } = useQuery(categoriesQuery);
  const { data: featuredProducts = [], isLoading: featLoading } = useQuery(
    featuredProductsQuery(12),
  );
  const { data: products = [], isLoading: prodLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName } = useLanguage();
  const navigate = useNavigate();

  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const storeWhatsApp = settings?.whatsapp ?? "916388354988";

  // Dynamic Headings & Database Categories (from Supabase store_settings & cache)
  const [headings, setHeadings] = useState<CategoryHeading[]>(() =>
    getCategoryHeadings(settings?.category_headings as CategoryHeading[] | undefined),
  );

  useEffect(() => {
    if (settings?.category_headings && Array.isArray(settings.category_headings) && settings.category_headings.length > 0) {
      setHeadings(getCategoryHeadings(settings.category_headings as CategoryHeading[]));
    }
  }, [settings?.category_headings]);

  useEffect(() => {
    const handleUpdate = () => {
      setHeadings(getCategoryHeadings(settings?.category_headings as CategoryHeading[] | undefined));
    };
    window.addEventListener("agt:headings-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("agt:headings-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [settings?.category_headings]);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const allAssignedSlugs = new Set(headings.flatMap((h) => h.slugs));
  const uncategorizedCategories = parentCategories.filter((c) => !allAssignedSlugs.has(c.slug));

  // Use only database products
  const allDisplayProducts = products ?? [];

  // Category-based product groups
  const attaRiceProducts = allDisplayProducts.filter(
    (p) =>
      p.category_id === "flour-atta" ||
      p.category_id === "atta-flour" ||
      p.category_id === "rice-grains" ||
      p.category_id === "rice" ||
      p.category_id === "grains-pulses" ||
      p.name.toLowerCase().includes("atta") ||
      p.name.toLowerCase().includes("rice") ||
      p.name.toLowerCase().includes("gehu") ||
      p.name.toLowerCase().includes("bajra") ||
      p.name.toLowerCase().includes("jowar") ||
      p.name.toLowerCase().includes("besan") ||
      p.name.toLowerCase().includes("suji") ||
      p.name.toLowerCase().includes("maida"),
  );
  const dalPulsesProducts = allDisplayProducts.filter(
    (p) =>
      p.category_id === "pulses-dal" ||
      p.name.toLowerCase().includes("dal") ||
      p.name.toLowerCase().includes("chana") ||
      p.name.toLowerCase().includes("rajma") ||
      p.name.toLowerCase().includes("lentils") ||
      p.name.toLowerCase().includes("urad") ||
      p.name.toLowerCase().includes("moong"),
  );
  const oilGheeProducts = allDisplayProducts.filter(
    (p) =>
      p.category_id === "oil-ghee" ||
      p.category_id === "cooking-oils" ||
      p.name.toLowerCase().includes("oil") ||
      p.name.toLowerCase().includes("ghee") ||
      p.name.toLowerCase().includes("tel") ||
      p.name.toLowerCase().includes("sarson"),
  );
  const spicesMasalaProducts = allDisplayProducts.filter(
    (p) =>
      p.category_id === "spices-masala" ||
      p.category_id === "dry-fruits" ||
      p.category_id === "spices" ||
      p.category_id === "salt-sugar" ||
      p.name.toLowerCase().includes("masala") ||
      p.name.toLowerCase().includes("haldi") ||
      p.name.toLowerCase().includes("mirch") ||
      p.name.toLowerCase().includes("hing") ||
      p.name.toLowerCase().includes("jeera") ||
      p.name.toLowerCase().includes("cardamom") ||
      p.name.toLowerCase().includes("kesar") ||
      p.name.toLowerCase().includes("kaju") ||
      p.name.toLowerCase().includes("badam") ||
      p.name.toLowerCase().includes("salt") ||
      p.name.toLowerCase().includes("sugar"),
  );
  const snacksBreakfastProducts = allDisplayProducts.filter(
    (p) =>
      p.category_id === "namkeen-snacks" ||
      p.category_id === "snacks-namkeen" ||
      p.category_id === "tea-coffee" ||
      p.category_id === "breakfast" ||
      p.category_id === "breakfast-items" ||
      p.category_id === "snacks-sweets" ||
      p.category_id === "biscuits" ||
      p.category_id === "chocolates" ||
      p.category_id === "noodles-pasta" ||
      p.category_id === "beverages" ||
      p.name.toLowerCase().includes("tea") ||
      p.name.toLowerCase().includes("coffee") ||
      p.name.toLowerCase().includes("biscuit") ||
      p.name.toLowerCase().includes("maggi") ||
      p.name.toLowerCase().includes("chips") ||
      p.name.toLowerCase().includes("bhujia") ||
      p.name.toLowerCase().includes("chocolate") ||
      p.name.toLowerCase().includes("dairy milk") ||
      p.name.toLowerCase().includes("jam") ||
      p.name.toLowerCase().includes("bread"),
  );
  const cleaningProducts = allDisplayProducts.filter(
    (p) =>
      p.category_id === "household-cleaning" ||
      p.category_id === "cleaning-supplies" ||
      p.category_id === "cleaning" ||
      p.category_id === "laundry" ||
      p.name.toLowerCase().includes("detergent") ||
      p.name.toLowerCase().includes("surf") ||
      p.name.toLowerCase().includes("colin") ||
      p.name.toLowerCase().includes("pril") ||
      p.name.toLowerCase().includes("harpic") ||
      p.name.toLowerCase().includes("broom") ||
      p.name.toLowerCase().includes("mop") ||
      p.name.toLowerCase().includes("bucket") ||
      p.name.toLowerCase().includes("soap") ||
      p.name.toLowerCase().includes("handwash") ||
      p.name.toLowerCase().includes("rin"),
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════
          1. HERO BANNER IMAGE (Uncropped, Natural Fit, Sleek on Laptop)
          ═══════════════════════════════════════════════════════ */}
      {settings?.hero_image_url && (
        <section className="container-page pt-2 sm:pt-3">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md border border-[#EAE6DC]/50 max-w-4xl lg:max-w-[980px] mx-auto">
            <img
              src={settings.hero_image_url}
              alt={settings?.store_name || "Arun Gopal Traders"}
              className="w-full h-auto block object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          2. GROUPED CATEGORIES — Beautiful Density & Responsive Grid
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page space-y-4 sm:space-y-6 pt-0 sm:pt-1 pb-6 sm:pb-8">
        {catLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5 lg:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 w-full">
                <Skeleton className="w-full aspect-[4/4.75] rounded-2xl" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {headings.map((heading, idx) => {
              const assigned = parentCategories.filter((c) => heading.slugs.includes(c.slug));
              const isLast = idx === headings.length - 1;
              const items = isLast ? [...assigned, ...uncategorizedCategories] : assigned;

              const bannerUrl =
                heading.banner_image_url ||
                (heading.banner_sub === "hero2"
                  ? settings?.hero2_image_url
                  : heading.banner_sub === "hero3"
                  ? settings?.hero3_image_url
                  : heading.banner_sub === "hero4"
                  ? settings?.hero4_image_url
                  : null);

              if (items.length === 0 && !bannerUrl) return null;

              const headingTitle = lang === "hi" ? heading.title_hi : (heading.title_en || heading.title_hi);

              return (
                <div key={heading.id} className="contents">
                  <div className="space-y-2.5 sm:space-y-3 pt-0 pb-1">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#E6EFE8] via-[#D4E8DC] to-[#C9E0CD] border border-[#145A45]/20 shadow-xs text-base select-none">
                          {heading.icon || "🛒"}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-sans text-sm sm:text-base font-bold text-[#16201A] tracking-normal leading-snug pt-0.5">
                            {headingTitle}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-[#5A655F] font-medium">
                            {items.length} {lang === "hi" ? "श्रेणियाँ" : "categories"}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#145A45] hover:text-white hover:bg-[#145A45] px-3 py-1 rounded-full border border-[#145A45]/20 transition-all shrink-0"
                      >
                        <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>

                    {bannerUrl && (
                      <div className="my-4 sm:my-6 relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md border border-[#EAE6DC]/50 group/banner">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
                        <img
                          src={bannerUrl}
                          alt={headingTitle}
                          className="w-full aspect-[21/9] object-cover transition-transform duration-700 group-hover/banner:scale-[1.02]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5 lg:gap-3">
                      {items.map((c, cIdx) => {
                        const tint =
                          BLINKIT_CATEGORY_TINTS[cIdx % BLINKIT_CATEGORY_TINTS.length] ??
                          BLINKIT_CATEGORY_TINTS[0]!;
                        return (
                          <Link
                            key={c.id}
                            to="/shop"
                            search={{ category: c.slug }}
                            className="group flex flex-col items-center gap-1.5 text-center w-full active:scale-[0.96] transition-transform duration-150"
                          >
                            <div
                              className={`relative w-full aspect-[4/4.5] rounded-2xl p-1.5 sm:p-2 flex items-center justify-center transition-all duration-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] group-hover:shadow-[0_8px_18px_-4px_rgba(20,90,69,0.14)] group-hover:-translate-y-1 border ${tint.bg} ${tint.border} ${tint.hoverBg} ${tint.hoverBorder}`}
                            >
                              <div className="size-full rounded-xl overflow-hidden flex items-center justify-center bg-white/50 shadow-2xs">
                                <img
                                  src={getCategoryThumbnail(c)}
                                  alt={c.name}
                                  loading="lazy"
                                  className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                />
                              </div>
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-[#18231D] group-hover:text-[#145A45] leading-[1.38] sm:leading-[1.42] transition-colors px-0.5 pt-1 pb-0.5 min-h-[3.2em] flex items-start justify-center tracking-normal text-center overflow-visible">
                              {getCategoryName(c)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════
          3. MINI TRUST STRIP (Compact 3-col)
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {[
            {
              icon: isDeliveryEnabled ? (
                <Truck className="size-4 text-[#145A45]" />
              ) : (
                <Store className="size-4 text-[#145A45]" />
              ),
              title: isDeliveryEnabled
                ? (lang === "hi" ? "30 मिनट डिलीवरी" : "30-Min Delivery")
                : (lang === "hi" ? "दुकान से पिकअप" : "Store Pickup"),
              sub: isDeliveryEnabled
                ? (lang === "hi" ? "महाराजगंज" : "Local Delivery")
                : (lang === "hi" ? "तुरंत तैयार" : "Ready in Store"),
            },
            {
              icon: <Award className="size-4 text-[#145A45]" />,
              title: lang === "hi" ? "100% शुद्ध व असली" : "100% Authentic",
              sub: lang === "hi" ? "ब्रांडेड सामान" : "Branded Items",
            },
            {
              icon: <ShieldCheck className="size-4 text-[#145A45]" />,
              title: lang === "hi" ? "COD / UPI" : "COD / UPI",
              sub: lang === "hi" ? "सुरक्षित भुगतान" : "Safe Payments",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E8E4DA] shadow-2xs"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-[#E6EFE8] border border-[#145A45]/10 shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-[#16201A] truncate">
                  {item.title}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#5A655F] truncate">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          4. ⭐ BEST SELLERS & POPULAR PRODUCTS
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <SectionHeader
          icon={<Sparkles className="size-4.5 text-amber-600" />}
          title={
            lang === "hi"
              ? "लोकप्रिय उत्पाद व बेस्ट सेलर्स"
              : "Popular & Best Sellers"
          }
          subtitle={
            lang === "hi"
              ? "सबसे ज्यादा बिकने वाले शुद्ध उत्पाद"
              : "Most ordered grocery essentials"
          }
          linkTo="/shop"
          linkLabel={`${t.viewAll} (${products.length || 302})`}
        />
        <div className="grocery-grid">
          {featLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>

      {/* Subtle Section Divider */}
      {attaRiceProducts.length > 0 && (
        <div className="container-page">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E8E4DA] to-transparent" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          5. 🌾 ATTA, RICE & GRAINS
          ═══════════════════════════════════════════════════════ */}
      {attaRiceProducts.length > 0 && (
        <section className="container-page">
          <SectionHeader
            icon={<span className="text-lg leading-none">🌾</span>}
            title={
              lang === "hi"
                ? "आटा, बासमती चावल व अनाज"
                : "Atta, Rice & Grains"
            }
            subtitle={
              lang === "hi"
                ? "आशीर्वाद, फॉर्च्यून चक्की आटा, दावत बासमती"
                : "Aashirvaad, Fortune Atta & Daawat Basmati"
            }
            linkTo="/shop"
            linkSearch={{ category: "flour-atta" }}
            linkLabel={`${t.viewAll} →`}
          />
          <div className="home-shelf-grid">
            {attaRiceProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Subtle Section Divider */}
      {dalPulsesProducts.length > 0 && (
        <div className="container-page">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E8E4DA] to-transparent" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          6. 🫘 PULSES & DAL
          ═══════════════════════════════════════════════════════ */}
      {dalPulsesProducts.length > 0 && (
        <section className="container-page">
          <SectionHeader
            icon={<span className="text-lg leading-none">🫘</span>}
            title={lang === "hi" ? "शुद्ध दालें व दलहन" : "Pulses & Dal"}
            subtitle={
              lang === "hi"
                ? "अरहर, मूंग, चना दाल, राजमा व काबुली चना"
                : "Arhar, Moong, Chana Dal, Rajma"
            }
            linkTo="/shop"
            linkSearch={{ category: "pulses-dal" }}
            linkLabel={`${t.viewAll} →`}
          />
          <div className="home-shelf-grid">
            {dalPulsesProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Subtle Section Divider */}
      {oilGheeProducts.length > 0 && (
        <div className="container-page">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#E8E4DA] to-transparent" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          7. 🛢️ OIL & GHEE
          ═══════════════════════════════════════════════════════ */}
      {oilGheeProducts.length > 0 && (
        <section className="container-page">
          <SectionHeader
            icon={<span className="text-lg leading-none">🛢️</span>}
            title={
              lang === "hi"
                ? "सरसों तेल व शुद्ध देसी घी"
                : "Mustard Oil & Desi Ghee"
            }
            subtitle={
              lang === "hi"
                ? "फॉर्च्यून कच्ची घानी, धारा, अमूल घी"
                : "Fortune, Dhara & Amul Pure Ghee"
            }
            linkTo="/shop"
            linkSearch={{ category: "oil-ghee" }}
            linkLabel={`${t.viewAll} →`}
          />
          <div className="home-shelf-grid">
            {oilGheeProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          8. PROMO BANNER
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-[#E8E4DA] bg-gradient-to-r from-[#FAF8F2] via-white to-[#E6EFE8]/40 p-6 sm:p-8 shadow-xs">
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-[#145A45]/[0.05] blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#145A45] px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                <Gift className="size-3.5" />
                <span>
                  {lang === "hi" ? "विशेष स्वागत ऑफर" : "WELCOME OFFER"}
                </span>
              </div>
              <h3 className="font-sans text-lg sm:text-xl font-black text-[#16201A] tracking-tight">
                {t.welcomeOfferTitle}
              </h3>
              <p className="text-xs text-[#5A655F]">{t.welcomeOfferSub}</p>
            </div>
            <Button
              asChild
              className="rounded-2xl bg-[#145A45] px-7 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0E4333] transition-all"
            >
              <Link to="/shop">
                {t.shopNow} <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          9. 🌶️ SPICES & DRY FRUITS
          ═══════════════════════════════════════════════════════ */}
      {spicesMasalaProducts.length > 0 && (
        <section className="container-page">
          <SectionHeader
            icon={<span className="text-lg leading-none">🌶️</span>}
            title={
              lang === "hi"
                ? "मसाले व सूखे मेवे"
                : "Spices & Dry Fruits"
            }
            subtitle={
              lang === "hi"
                ? "MDH, एवरेस्ट, काजू, बादाम, किशमिश"
                : "MDH, Everest, Cashews, Almonds"
            }
            linkTo="/shop"
            linkSearch={{ category: "spices-masala" }}
            linkLabel={`${t.viewAll} →`}
          />
          <div className="home-shelf-grid">
            {spicesMasalaProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          10. ☕ SNACKS, TEA & BREAKFAST
          ═══════════════════════════════════════════════════════ */}
      {snacksBreakfastProducts.length > 0 && (
        <section className="container-page">
          <SectionHeader
            icon={<span className="text-lg leading-none">☕</span>}
            title={
              lang === "hi"
                ? "चाय, नाश्ता व नमकीन"
                : "Tea, Snacks & Biscuits"
            }
            subtitle={
              lang === "hi"
                ? "टाटा टी, पारले-जी, गुड डे, हल्दीराम"
                : "Tata Tea, Parle-G, Good Day, Haldiram"
            }
            linkTo="/shop"
            linkSearch={{ category: "snacks-namkeen" }}
            linkLabel={`${t.viewAll} →`}
          />
          <div className="home-shelf-grid">
            {snacksBreakfastProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          11. 🧽 CLEANING & HOUSEHOLD
          ═══════════════════════════════════════════════════════ */}
      {cleaningProducts.length > 0 && (
        <section className="container-page">
          <SectionHeader
            icon={<span className="text-lg leading-none">🧽</span>}
            title={
              lang === "hi"
                ? "सफाई, डिटर्जेंट व झाड़ू"
                : "Cleaning & Household"
            }
            subtitle={
              lang === "hi"
                ? "सर्फ, हार्पिक, प्रिल, गाला झाड़ू"
                : "Surf Excel, Harpic, Pril, Gala"
            }
            linkTo="/shop"
            linkSearch={{ category: "cleaning-supplies" }}
            linkLabel={`${t.viewAll} →`}
          />
          <div className="home-shelf-grid">
            {cleaningProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          12. BOTTOM TRUST + WhatsApp CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <div className="rounded-3xl border border-[#E8E4DA] bg-gradient-to-br from-white via-[#FAF8F2] to-[#E6EFE8]/30 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] px-4 py-1.5 text-xs font-bold text-[#0F4A38] shadow-2xs">
              <BadgeCheck className="size-4 text-[#145A45]" />
              <span>
                {lang === "hi"
                  ? "रामनगर, महाराजगंज की विश्वसनीय दुकान"
                  : "Trusted Store in Maharajganj"}
              </span>
            </div>
            <h2 className="font-sans text-lg sm:text-xl font-black text-[#16201A] tracking-tight">
              {lang === "hi"
                ? `क्यों खरीदें ${t.storeName} से?`
                : `Why Choose ${t.storeName}?`}
            </h2>
          </div>

          {/* Trust Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: <CheckCircle2 className="size-5 text-[#145A45]" />,
                title: lang === "hi" ? "100% असली सामान" : "100% Genuine",
                desc: "Fortune, Aashirvaad, Tata, MDH, Amul",
              },
              {
                icon: isDeliveryEnabled ? (
                  <Truck className="size-5 text-[#145A45]" />
                ) : (
                  <Store className="size-5 text-[#145A45]" />
                ),
                title: isDeliveryEnabled
                  ? (lang === "hi" ? "तेज़ होम डिलीवरी" : "Fast Delivery")
                  : (lang === "hi" ? "दुकान से पिकअप" : "Store Pickup"),
                desc: isDeliveryEnabled
                  ? (lang === "hi"
                    ? `₹${settings?.free_delivery_threshold ?? 499}+ पर फ्री`
                    : `Free on ₹${settings?.free_delivery_threshold ?? 499}+`)
                  : (lang === "hi" ? "ऑनलाइन बुक करें, दुकान से लें" : "Order online, collect at store"),
              },
              {
                icon: <PhoneCall className="size-5 text-[#145A45]" />,
                title: lang === "hi" ? "सीधा संपर्क" : "Direct Support",
                desc: "+91 6388354988",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white/80 border border-[#E8E4DA] shadow-2xs"
              >
                <div className="grid size-9 place-items-center rounded-xl bg-[#E6EFE8] shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#16201A]">{item.title}</h4>
                  <p className="text-[10px] text-[#5A655F] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <div className="text-center pt-1">
            <a
              href={waHref(storeWhatsApp, "Namaste! I want to order grocery.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#145A45] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#0E4333] transition-all"
            >
              <MessageCircle className="size-4 fill-white text-[#145A45]" />
              <span>
                {lang === "hi"
                  ? "WhatsApp पर ऑर्डर करें"
                  : "Order on WhatsApp"}
              </span>
            </a>
          </div>
        </div>
      </section>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </div>
  );
}
