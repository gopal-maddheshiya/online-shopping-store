import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
      { title: "अरुण गोपाल ट्रेडर्स — Arun Gopal Traders" },
      {
        name: "description",
        content:
          "अरुण गोपाल ट्रेडर्स — रामनगर, अड्डा बाजार रोड, महाराजगंज स्थित आपकी अपनी किराना दुकान। आटा, चावल, दाल, तेल, मसाले और रोज़मर्रा का सामान।",
      },
      { property: "og:title", content: "अरुण गोपाल ट्रेडर्स — Arun Gopal Traders" },
      {
        property: "og:description",
        content:
          "रामनगर, अड्डा बाजार रोड, महाराजगंज की विश्वसनीय स्थानीय किराना दुकान — 100% शुद्ध राशन एवं तेज़ होम डिलीवरी।",
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

/* ═══════════════════════════════════════════════════════════════
   MAIN HOMEPAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function PremiumStoreHome() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories = [], isLoading: catLoading } = useQuery(categoriesQuery);
  const { data: featuredProducts = [], isLoading: featLoading } = useQuery(
    featuredProductsQuery(12),
  );
  const { data: products = [], isLoading: prodLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName } = useLanguage();
  const navigate = useNavigate();

  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const storeWhatsApp = settings?.whatsapp ?? "916388354988";

  // Use only database categories
  const parentCategories = categories.filter((c) => !c.parent_id);
  const foodSlugs = ["atta-flour","rice-grains","rice","pulses-dal","oil-ghee","spices-masala","salt-sugar","dry-fruits","tea-coffee","biscuits","namkeen-snacks","chocolates","noodles-pasta","sauces-spreads","dairy","beverages","packaged-foods","breakfast"];
  const householdSlugs = ["household-cleaning","laundry","kitchen-essentials","utensils-cookware"];
  const personalSlugs = ["personal-care","hair-care","skin-care","oral-care","baby-products"];
  const otherSlugs = ["pooja-items","stationery","pet-supplies","misc-items"];
  const allKnownSlugs = [...foodSlugs, ...householdSlugs, ...personalSlugs, ...otherSlugs];

  const foodCategories = parentCategories.filter(c => foodSlugs.includes(c.slug));
  const householdCategories = parentCategories.filter(c => householdSlugs.includes(c.slug));
  const personalCategories = parentCategories.filter(c => personalSlugs.includes(c.slug));
  const otherGroupCategories = parentCategories.filter(c => otherSlugs.includes(c.slug));
  const uncategorizedCategories = parentCategories.filter(c => !allKnownSlugs.includes(c.slug));

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
          1. HERO BANNER IMAGE (1920×1080 / 16:9)
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page pt-2 sm:pt-3">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
          {settings?.hero_image_url ? (
            <img
              src={settings.hero_image_url}
              alt={settings?.store_name || "Arun Gopal Traders"}
              className="w-full aspect-video object-cover"
              onError={(e) => {
                // If image fails to load, hide it and show fallback
                (e.target as HTMLImageElement).style.display = "none";
                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = "flex";
              }}
            />
          ) : null}
          {/* Fallback gradient banner — shown when no hero image or image fails */}
          <div
            className="w-full aspect-video bg-gradient-to-br from-[#062A1E] via-[#0B4232] to-[#041F16] flex flex-col items-center justify-center text-white text-center px-6"
            style={{ display: settings?.hero_image_url ? "none" : "flex" }}
          >
            <h1 className="font-sans text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
              {settings?.store_name || "Arun Gopal Traders"}
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-white/75 max-w-md">
              {settings?.tagline || "Your Trusted Local Grocery Store"}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          2. GROUPED CATEGORIES — Open Layout with Prominent Text
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page space-y-8 sm:space-y-10">
        <SectionHeader
          icon={<Store className="size-4.5 text-[#145A45]" />}
          title={lang === "hi" ? "कैटेगरी के अनुसार खरीदारी" : "Shop by Category"}
          subtitle={
            lang === "hi"
              ? "सभी ज़रूरी किराना उत्पाद श्रेणियों में व्यवस्थित"
              : "All grocery essentials neatly organized for you"
          }
          linkTo="/shop"
          linkLabel={t.viewAll}
        />

        {catLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="size-16 sm:size-20 md:size-[5.25rem] rounded-2xl" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-7 sm:space-y-9">
            {/* ── 🍽️ Group 1: Food & Kitchen ── */}
            {foodCategories.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#E6EFE8] border border-[#145A45]/15 text-[#145A45] shadow-2xs">
                      <UtensilsCrossed className="size-4 sm:size-4.5 text-[#145A45]" />
                    </div>
                    <h3 className="font-sans text-sm sm:text-base md:text-lg font-black text-[#16201A] tracking-tight">
                      {lang === "hi" ? "खाने-पीने का सामान" : "Food & Kitchen Essentials"}
                    </h3>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#145A45] hover:text-[#0F4A38] bg-[#E6EFE8]/70 hover:bg-[#E6EFE8] px-3 py-1 rounded-full border border-[#145A45]/15 transition-all shrink-0"
                  >
                    <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
                  {foodCategories.map((c) => (
                    <Link
                      key={c.id}
                      to="/shop"
                      search={{ category: c.slug }}
                      className="group flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-1"
                    >
                      <div className="relative size-16 sm:size-20 md:size-[5.25rem] rounded-2xl border border-[#E8E4DA] bg-white p-1.5 shadow-2xs group-hover:border-[#145A45] group-hover:shadow-md transition-all flex items-center justify-center">
                        <img
                          src={getCategoryThumbnail(c)}
                          alt={c.name}
                          loading="lazy"
                          className="size-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-110 drop-shadow-xs"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#16201A] group-hover:text-[#145A45] line-clamp-2 leading-tight transition-colors">
                        {getCategoryName(c.name, c.slug)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── 🏠 Group 2: Household & Cleaning ── */}
            {householdCategories.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#E6EFE8] border border-[#145A45]/15 text-[#145A45] shadow-2xs">
                      <Home className="size-4 sm:size-4.5 text-[#145A45]" />
                    </div>
                    <h3 className="font-sans text-sm sm:text-base md:text-lg font-black text-[#16201A] tracking-tight">
                      {lang === "hi" ? "घर की सफ़ाई व बर्तन" : "Household & Cleaning"}
                    </h3>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#145A45] hover:text-[#0F4A38] bg-[#E6EFE8]/70 hover:bg-[#E6EFE8] px-3 py-1 rounded-full border border-[#145A45]/15 transition-all shrink-0"
                  >
                    <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
                  {householdCategories.map((c) => (
                    <Link
                      key={c.id}
                      to="/shop"
                      search={{ category: c.slug }}
                      className="group flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-1"
                    >
                      <div className="relative size-16 sm:size-20 md:size-[5.25rem] rounded-2xl border border-[#E8E4DA] bg-white p-1.5 shadow-2xs group-hover:border-[#145A45] group-hover:shadow-md transition-all flex items-center justify-center">
                        <img
                          src={getCategoryThumbnail(c)}
                          alt={c.name}
                          loading="lazy"
                          className="size-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-110 drop-shadow-xs"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#16201A] group-hover:text-[#145A45] line-clamp-2 leading-tight transition-colors">
                        {getCategoryName(c.name, c.slug)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── 💆 Group 3: Personal Care & Beauty ── */}
            {personalCategories.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#E6EFE8] border border-[#145A45]/15 text-[#145A45] shadow-2xs">
                      <Heart className="size-4 sm:size-4.5 text-[#145A45]" />
                    </div>
                    <h3 className="font-sans text-sm sm:text-base md:text-lg font-black text-[#16201A] tracking-tight">
                      {lang === "hi" ? "पर्सनल केयर व ब्यूटी" : "Personal Care & Beauty"}
                    </h3>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#145A45] hover:text-[#0F4A38] bg-[#E6EFE8]/70 hover:bg-[#E6EFE8] px-3 py-1 rounded-full border border-[#145A45]/15 transition-all shrink-0"
                  >
                    <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
                  {personalCategories.map((c) => (
                    <Link
                      key={c.id}
                      to="/shop"
                      search={{ category: c.slug }}
                      className="group flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-1"
                    >
                      <div className="relative size-16 sm:size-20 md:size-[5.25rem] rounded-2xl border border-[#E8E4DA] bg-white p-1.5 shadow-2xs group-hover:border-[#145A45] group-hover:shadow-md transition-all flex items-center justify-center">
                        <img
                          src={getCategoryThumbnail(c)}
                          alt={c.name}
                          loading="lazy"
                          className="size-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-110 drop-shadow-xs"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#16201A] group-hover:text-[#145A45] line-clamp-2 leading-tight transition-colors">
                        {getCategoryName(c.name, c.slug)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── 📦 Group 4: Pooja, Stationery & More ── */}
            {(otherGroupCategories.length > 0 || uncategorizedCategories.length > 0) && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#E6EFE8] border border-[#145A45]/15 text-[#145A45] shadow-2xs">
                      <Package className="size-4 sm:size-4.5 text-[#145A45]" />
                    </div>
                    <h3 className="font-sans text-sm sm:text-base md:text-lg font-black text-[#16201A] tracking-tight">
                      {lang === "hi" ? "पूजा, स्टेशनरी व अन्य" : "Pooja, Stationery & More"}
                    </h3>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#145A45] hover:text-[#0F4A38] bg-[#E6EFE8]/70 hover:bg-[#E6EFE8] px-3 py-1 rounded-full border border-[#145A45]/15 transition-all shrink-0"
                  >
                    <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
                  {[...otherGroupCategories, ...uncategorizedCategories].map((c) => (
                    <Link
                      key={c.id}
                      to="/shop"
                      search={{ category: c.slug }}
                      className="group flex flex-col items-center gap-2 text-center transition-all hover:-translate-y-1"
                    >
                      <div className="relative size-16 sm:size-20 md:size-[5.25rem] rounded-2xl border border-[#E8E4DA] bg-white p-1.5 shadow-2xs group-hover:border-[#145A45] group-hover:shadow-md transition-all flex items-center justify-center">
                        <img
                          src={getCategoryThumbnail(c)}
                          alt={c.name}
                          loading="lazy"
                          className="size-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-110 drop-shadow-xs"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#16201A] group-hover:text-[#145A45] line-clamp-2 leading-tight transition-colors">
                        {getCategoryName(c.name, c.slug)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
              icon: <Truck className="size-4 text-[#145A45]" />,
              title: lang === "hi" ? "30 मिनट डिलीवरी" : "30-Min Delivery",
              sub: lang === "hi" ? "महाराजगंज" : "Local Delivery",
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
                icon: <Truck className="size-5 text-[#145A45]" />,
                title: lang === "hi" ? "तेज़ होम डिलीवरी" : "Fast Delivery",
                desc:
                  lang === "hi"
                    ? `₹${settings?.free_delivery_threshold ?? 499}+ पर फ्री`
                    : `Free on ₹${settings?.free_delivery_threshold ?? 499}+`,
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
