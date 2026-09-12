import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { ProductSliderShelf } from "@/components/home/ProductSliderShelf";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { getCategoryThumbnail } from "@/lib/product-images";
import {
  categoriesQuery,
  productsQuery,
  featuredProductsQuery,
  settingsQuery,
  couponsQuery,
  isOpenNow,
} from "@/lib/queries";
import { waHref } from "@/lib/format";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";
import { SmartRationBar } from "@/components/home/SmartRationBar";
import { SmartRationModal } from "@/components/home/SmartRationModal";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(featuredProductsQuery(12)),
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(couponsQuery),
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
        <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#EBF3ED] via-[#E2EEE5] to-[#D6E7DB] border border-[#145A45]/20 shadow-[0_2px_8px_rgba(20,90,69,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] text-[#145A45]">
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
        className="group inline-flex items-center gap-1 rounded-xl bg-white border border-[#E2DDD2] px-3 py-1.5 text-xs font-bold text-[#145A45] hover:bg-[#145A45] hover:text-white hover:border-[#145A45] transition-all shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_4px_12px_rgba(20,90,69,0.2)]"
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
   SKELETON & IMAGE PLACEHOLDER COMPONENTS (Slow network resilience)
   ═══════════════════════════════════════════════════════════════ */
function HeroBanner({
  images,
  storeName,
  isLoading,
}: {
  images?: string[];
  storeName: string;
  isLoading?: boolean;
}) {
  const activeImages = (images || []).filter(Boolean);

  if (isLoading || activeImages.length === 0) {
    return (
      <section className="container-page pt-2 sm:pt-3">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl max-w-4xl lg:max-w-[980px] mx-auto aspect-[16/9] bg-gradient-to-r from-[#EAE6DC]/60 via-[#F5F2EB] to-[#EAE6DC]/60 animate-pulse border border-[#EAE6DC]/50 flex items-center justify-center shadow-xs">
          <div className="flex items-center gap-2 text-[#8A958F] text-xs sm:text-sm font-medium">
            <Store className="size-5 opacity-40 animate-pulse text-[#145A45]" />
            <span className="opacity-60">{storeName}</span>
          </div>
        </div>
      </section>
    );
  }

  if (activeImages.length === 1) {
    return (
      <section className="container-page pt-2 sm:pt-3">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md border border-[#EAE6DC]/50 max-w-4xl lg:max-w-[980px] mx-auto bg-[#F5F2EB]">
          <img
            src={activeImages[0]}
            alt={storeName}
            decoding="async"
            fetchPriority="high"
            className="w-full h-auto block object-contain select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </section>
    );
  }

  return <HeroSlider images={activeImages} storeName={storeName} />;
}

function HeroSlider({ images, storeName }: { images: string[]; storeName: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 48,
    skipSnaps: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const isInteractingRef = useRef(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleUserInteraction = useCallback(() => {
    isInteractingRef.current = true;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 6000);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("pointerDown", handleUserInteraction);
    return () => {
      emblaApi.off("pointerDown", handleUserInteraction);
    };
  }, [emblaApi, handleUserInteraction]);

  useEffect(() => {
    if (!emblaApi || images.length <= 1) return;
    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      emblaApi.scrollNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [emblaApi, images.length]);

  return (
    <section className="container-page pt-2 sm:pt-3">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md border border-[#EAE6DC]/50 max-w-4xl lg:max-w-[980px] mx-auto bg-[#F5F2EB] group">
        <div
          ref={emblaRef}
          className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseEnter={handleUserInteraction}
          onTouchStart={handleUserInteraction}
        >
          <div
            className="flex select-none"
            style={{
              willChange: "transform",
              transform: "translate3d(0, 0, 0)",
              backfaceVisibility: "hidden",
            }}
          >
            {images.map((imgUrl, idx) => (
              <div key={idx} className="shrink-0 grow-0 basis-full min-w-0">
                <img
                  src={imgUrl}
                  alt={`${storeName} Offer Banner ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={idx === 0 ? "high" : "low"}
                  className="w-full h-auto block object-contain select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Indicator Pills */}
        <div className="absolute bottom-2.5 sm:bottom-3.5 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-xs border border-white/20 shadow-xs">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  emblaApi?.scrollTo(idx);
                  handleUserInteraction();
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === selectedIndex
                    ? "w-5 sm:w-6 h-1.5 bg-[#F5D061] shadow-2xs"
                    : "w-1.5 h-1.5 bg-white/70 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SubHeroBanner({ bannerUrl, title }: { bannerUrl: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="my-3 sm:my-5 relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xs border border-[#EAE6DC]/60 group/banner bg-[#F5F2EB]">
      {!loaded && (
        <div className="w-full aspect-[16/6] sm:aspect-[21/7] bg-gradient-to-r from-[#EAE6DC]/60 via-[#F5F2EB] to-[#EAE6DC]/60 animate-pulse flex items-center justify-center">
          <Sparkles className="size-5 text-[#8A958F]/40" />
        </div>
      )}
      <img
        src={bannerUrl}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-auto block transition-all duration-500 group-hover/banner:scale-[1.01] ${
          loaded ? "opacity-100" : "hidden"
        }`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

function CategoryThumbnail({
  category,
  name,
}: {
  category: Parameters<typeof getCategoryThumbnail>[0];
  name: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const src = getCategoryThumbnail(category);

  return (
    <div className="relative size-full flex items-center justify-center overflow-hidden">
      {!loaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#EAE6DC]/50 via-white/80 to-[#EAE6DC]/50 animate-pulse" />
      )}
      {hasError ? (
        <div className="flex flex-col items-center justify-center text-[#145A45]/60">
          <Store className="size-6 sm:size-7" />
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`size-full object-cover transition-all duration-500 ease-out group-hover:scale-108 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="space-y-7 sm:space-y-9 animate-pulse">
      {/* Skeleton Heading 1 */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-xl bg-[#E6EFE8]/80" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 sm:w-40 rounded-md bg-[#EAE6DC]/80" />
              <Skeleton className="h-2.5 w-16 sm:w-20 rounded-md bg-[#EAE6DC]/50" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-[#EAE6DC]/50" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5 lg:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 w-full">
              <div className="w-full aspect-[4/4.5] rounded-2xl bg-[#F0F4F1] border border-[#E0EAE2] p-1.5 sm:p-2 flex items-center justify-center">
                <div className="size-full rounded-xl bg-white/60" />
              </div>
              <div className="h-3 w-14 bg-[#EAE6DC]/60 rounded-md mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Heading 2 */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-xl bg-[#E6EFE8]/80" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 sm:w-36 rounded-md bg-[#EAE6DC]/80" />
              <Skeleton className="h-2.5 w-14 rounded-md bg-[#EAE6DC]/50" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-[#EAE6DC]/50" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5 lg:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 w-full">
              <div className="w-full aspect-[4/4.5] rounded-2xl bg-[#FCF5EC] border border-[#F4E3CD] p-1.5 sm:p-2 flex items-center justify-center">
                <div className="size-full rounded-xl bg-white/60" />
              </div>
              <div className="h-3 w-12 bg-[#EAE6DC]/60 rounded-md mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HOMEPAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function PremiumStoreHome() {
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQuery);
  const isDeliveryEnabled = Boolean(settings?.delivery_enabled);
  const { data: categories = [], isLoading: catLoading } = useQuery(categoriesQuery);
  const { data: featuredProducts = [], isLoading: featLoading } = useQuery(
    featuredProductsQuery(12),
  );
  const { data: products = [], isLoading: prodLoading } = useQuery(productsQuery());
  const { data: coupons = [] } = useQuery(couponsQuery);
  const { lang, t, getCategoryName } = useLanguage();
  const navigate = useNavigate();

  // Active promotional coupon from Supabase database (strictly checked against is_active, starts_at, ends_at)
  const activePromoCoupon = useMemo(() => {
    const now = new Date();
    return (coupons ?? []).find((c) => {
      if (!c.is_active) return false;
      if (c.starts_at && new Date(c.starts_at) > now) return false;
      if (c.ends_at && new Date(c.ends_at) < now) return false;
      return true;
    });
  }, [coupons]);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [smartRationOpen, setSmartRationOpen] = useState(false);
  const [smartRationMode, setSmartRationMode] = useState<"photo" | "text" | "voice">("text");

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
      {settingsLoading ? (
        <HeroBanner storeName="अरुण गोपाल ट्रेडर्स" isLoading={true} />
      ) : (
        <HeroBanner
          images={[
            settings?.hero_image_url,
            settings?.hero2_image_url,
            settings?.hero3_image_url,
            settings?.hero4_image_url,
          ].filter(Boolean) as string[]}
          storeName={settings?.store_name || "अरुण गोपाल ट्रेडर्स"}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          AI SMART RATION QUICK-BAR (Gemini 3.6 Multimodal + Rotating Ticker)
          ═══════════════════════════════════════════════════════ */}
      <SmartRationBar
        onOpenModal={(mode) => {
          setSmartRationMode(mode || "text");
          setSmartRationOpen(true);
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          2. GROUPED CATEGORIES — Beautiful Density & Responsive Grid
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page space-y-4 sm:space-y-6 pt-0 sm:pt-1 pb-6 sm:pb-8">
        {catLoading ? (
          <CategoryGridSkeleton />
        ) : (
          <div className="space-y-7 sm:space-y-9">
            {headings.map((heading) => {
              const items = parentCategories.filter((c) => heading.slugs.includes(c.slug));

              const subHeroMap: Record<string, string | null | undefined> = {
                hero2: settings?.hero2_image_url,
                hero3: settings?.hero3_image_url,
                hero4: settings?.hero4_image_url,
              };

              const bannerUrl =
                (heading.banner_sub && subHeroMap[heading.banner_sub]) ||
                heading.banner_image_url ||
                null;

              if (items.length === 0 && !bannerUrl) return null;

              const headingTitle = lang === "hi" ? heading.title_hi : (heading.title_en || heading.title_hi);

              return (
                <div key={heading.id} className="space-y-2.5 sm:space-y-3">
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
                    <SubHeroBanner bannerUrl={bannerUrl} title={headingTitle} />
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
                            className={`relative w-full aspect-square rounded-[1.35rem] overflow-hidden transition-all duration-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.95)] group-hover:shadow-[0_10px_24px_-4px_rgba(20,90,69,0.18),inset_0_1px_0_rgba(255,255,255,1)] group-hover:-translate-y-1 border ${tint.bg} ${tint.border} ${tint.hoverBorder}`}
                          >
                            <CategoryThumbnail category={c} name={c.name} />
                          </div>
                          <span className="text-[11px] sm:text-xs font-semibold text-[#18231D] group-hover:text-[#145A45] leading-[1.38] sm:leading-[1.42] transition-colors px-0.5 pt-1 pb-0.5 min-h-[3.2em] flex items-start justify-center tracking-normal text-center overflow-visible">
                            {getCategoryName(c)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {uncategorizedCategories.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#E6EFE8] via-[#D4E8DC] to-[#C9E0CD] border border-[#145A45]/20 shadow-xs text-base select-none">
                      🛒
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-sans text-sm sm:text-base font-bold text-[#16201A] tracking-normal leading-snug pt-0.5">
                        {lang === "hi" ? "अन्य श्रेणियाँ" : "Other Categories"}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-[#5A655F] font-medium">
                        {uncategorizedCategories.length} {lang === "hi" ? "श्रेणियाँ" : "categories"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5 lg:gap-3">
                  {uncategorizedCategories.map((c, cIdx) => {
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
                          className={`relative w-full aspect-square rounded-[1.35rem] overflow-hidden transition-all duration-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.95)] group-hover:shadow-[0_10px_24px_-4px_rgba(20,90,69,0.18),inset_0_1px_0_rgba(255,255,255,1)] group-hover:-translate-y-1 border ${tint.bg} ${tint.border} ${tint.hoverBorder}`}
                        >
                          <CategoryThumbnail category={c} name={c.name} />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-[#18231D] group-hover:text-[#145A45] leading-[1.38] sm:leading-[1.42] transition-colors px-0.5 pt-1 pb-0.5 min-h-[3.2em] flex items-start justify-center tracking-normal text-center overflow-visible">
                          {getCategoryName(c)}
                        </span>
                      </Link>
                    );
                  })}
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
              icon: isDeliveryEnabled ? (
                <Truck className="size-4 text-[#145A45]" />
              ) : (
                <Store className="size-4 text-[#145A45]" />
              ),
              title: isDeliveryEnabled
                ? (lang === "hi" ? "30 मिनट डिलीवरी" : "30-Min Delivery")
                : (lang === "hi" ? "दुकान से पिकअप" : "Store Pickup"),
              sub: isDeliveryEnabled
                ? (lang === "hi" ? "अड्डा बाजार" : "Adda Bazar")
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
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E4DFD5] shadow-[0_2px_8px_-2px_rgba(15,74,56,0.05),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#145A45]/30 transition-all"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-[#E6EFE8] border border-[#145A45]/15 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
          4. ⭐ BEST SELLERS & POPULAR PRODUCTS (Auto-Sliding)
          ═══════════════════════════════════════════════════════ */}
      <ProductSliderShelf
        icon={<Sparkles className="size-4 text-amber-600" />}
        title={lang === "hi" ? "लोकप्रिय उत्पाद व बेस्ट सेलर्स" : "Popular & Best Sellers"}
        subtitle={
          lang === "hi"
            ? "दुकान के सबसे ज्यादा बिकने वाले शुद्ध उत्पाद"
            : "Most ordered grocery essentials"
        }
        products={featuredProducts}
        linkTo="/shop"
        linkLabel={`${t.viewAll} (${products.length || 300}+)`}
        autoSlide={true}
        intervalMs={3500}
        isLoading={featLoading}
      />

      {/* ═══════════════════════════════════════════════════════
          5. 🌾 ATTA, RICE & GRAINS (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {attaRiceProducts.length > 0 && (
        <ProductSliderShelf
          icon={<span className="text-base leading-none">🌾</span>}
          title={lang === "hi" ? "आटा, बासमती चावल व अनाज" : "Atta, Rice & Grains"}
          subtitle={
            lang === "hi"
              ? "आशीर्वाद, फॉर्च्यून चक्की आटा, दावत बासमती"
              : "Aashirvaad, Fortune Atta & Daawat Basmati"
          }
          products={attaRiceProducts}
          linkTo="/shop"
          linkSearch={{ category: "flour-atta" }}
          linkLabel={`${t.viewAll} →`}
          autoSlide={true}
          intervalMs={4200}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          6. 🫘 PULSES & DAL (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {dalPulsesProducts.length > 0 && (
        <ProductSliderShelf
          icon={<span className="text-base leading-none">🫘</span>}
          title={lang === "hi" ? "शुद्ध दालें व दलहन" : "Pulses & Dal"}
          subtitle={
            lang === "hi"
              ? "अरहर, मूंग, चना दाल, राजमा व काबुली चना"
              : "Arhar, Moong, Chana Dal, Rajma"
          }
          products={dalPulsesProducts}
          linkTo="/shop"
          linkSearch={{ category: "pulses-dal" }}
          linkLabel={`${t.viewAll} →`}
          autoSlide={true}
          intervalMs={4600}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          7. 🛢️ OIL & GHEE (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {oilGheeProducts.length > 0 && (
        <ProductSliderShelf
          icon={<span className="text-base leading-none">🛢️</span>}
          title={lang === "hi" ? "सरसों तेल व शुद्ध देसी घी" : "Mustard Oil & Desi Ghee"}
          subtitle={
            lang === "hi"
              ? "फॉर्च्यून कच्ची घानी, धारा, अमूल घी"
              : "Fortune, Dhara & Amul Pure Ghee"
          }
          products={oilGheeProducts}
          linkTo="/shop"
          linkSearch={{ category: "oil-ghee" }}
          linkLabel={`${t.viewAll} →`}
          autoSlide={true}
          intervalMs={4000}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          8. PROMO BANNER (Mid-Page Hook - Strictly rendered only when an active coupon is in DB)
          ═══════════════════════════════════════════════════════ */}
      {activePromoCoupon && (
        <section className="container-page">
          <div className="relative overflow-hidden rounded-3xl border border-[#E0DACF] bg-gradient-to-r from-[#FAF8F2] via-white to-[#E6EFE8]/50 p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,74,56,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
            <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-[#145A45]/[0.06] blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#145A45] to-[#0D4433] px-3 py-1 text-[11px] font-bold text-white shadow-[0_2px_6px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] glint-effect">
                  <Gift className="size-3.5" />
                  <span>
                    {lang === "hi"
                      ? `विशेष ऑफर कोड: ${activePromoCoupon.code}`
                      : `SPECIAL OFFER: ${activePromoCoupon.code}`}
                  </span>
                </div>
                <h3 className="font-sans text-base sm:text-xl font-black text-[#16201A] tracking-tight">
                  {activePromoCoupon.discount_type === "percent"
                    ? lang === "hi"
                      ? `कोड ${activePromoCoupon.code} के साथ पाएं ${activePromoCoupon.value}% की छूट`
                      : `Get ${activePromoCoupon.value}% OFF with code ${activePromoCoupon.code}`
                    : lang === "hi"
                      ? `कोड ${activePromoCoupon.code} के साथ पाएं ₹${activePromoCoupon.value} की सीधी छूट`
                      : `Flat ₹${activePromoCoupon.value} OFF with code ${activePromoCoupon.code}`}
                </h3>
                <p className="text-xs text-[#5A655F]">
                  {activePromoCoupon.min_order > 0
                    ? lang === "hi"
                      ? `₹${activePromoCoupon.min_order} या उससे अधिक के ऑनलाइन किराना ऑर्डर पर मान्य।`
                      : `Applicable on online grocery orders above ₹${activePromoCoupon.min_order}.`
                    : activePromoCoupon.description || (lang === "hi"
                      ? "चेकआउट पर कूपन कोड दर्ज करके तुरंत बचत पाएं।"
                      : "Apply coupon code at checkout to save instantly.")}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(activePromoCoupon.code);
                    toast.success(
                      lang === "hi"
                        ? `कूपन कोड ${activePromoCoupon.code} कॉपी हो गया!`
                        : `Coupon code ${activePromoCoupon.code} copied!`
                    );
                  }}
                  className="rounded-2xl border border-[#145A45]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#145A45] shadow-[0_2px_6px_rgba(20,90,69,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] hover:bg-[#E6EFE8] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  title={lang === "hi" ? "कूपन कोड कॉपी करें" : "Copy coupon code"}
                >
                  <Copy className="size-3.5" />
                  <span>{activePromoCoupon.code}</span>
                </button>

                <Button
                  asChild
                  className="rounded-2xl bg-gradient-to-r from-[#145A45] to-[#0D4433] px-5 sm:px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-[#0E4333] hover:to-[#0A3628] transition-all cursor-pointer"
                >
                  <Link to="/shop">
                    {t.shopNow} <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          9. 🌶️ SPICES & DRY FRUITS (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {spicesMasalaProducts.length > 0 && (
        <ProductSliderShelf
          icon={<span className="text-base leading-none">🌶️</span>}
          title={lang === "hi" ? "मसाले व सूखे मेवे" : "Spices & Dry Fruits"}
          subtitle={
            lang === "hi"
              ? "MDH, एवरेस्ट, काजू, बादाम, किशमिश"
              : "MDH, Everest, Cashews, Almonds"
          }
          products={spicesMasalaProducts}
          linkTo="/shop"
          linkSearch={{ category: "spices-masala" }}
          linkLabel={`${t.viewAll} →`}
          autoSlide={true}
          intervalMs={4400}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          10. ☕ SNACKS, TEA & BREAKFAST (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {snacksBreakfastProducts.length > 0 && (
        <ProductSliderShelf
          icon={<span className="text-base leading-none">☕</span>}
          title={lang === "hi" ? "चाय, नाश्ता व नमकीन" : "Tea, Snacks & Biscuits"}
          subtitle={
            lang === "hi"
              ? "टाटा टी, पारले-जी, गुड डे, हल्दीराम"
              : "Tata Tea, Parle-G, Good Day, Haldiram"
          }
          products={snacksBreakfastProducts}
          linkTo="/shop"
          linkSearch={{ category: "snacks-namkeen" }}
          linkLabel={`${t.viewAll} →`}
          autoSlide={true}
          intervalMs={4100}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          11. 🧽 CLEANING & HOUSEHOLD (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {cleaningProducts.length > 0 && (
        <ProductSliderShelf
          icon={<span className="text-base leading-none">🧽</span>}
          title={lang === "hi" ? "सफाई, डिटर्जेंट व झाड़ू" : "Cleaning & Household"}
          subtitle={
            lang === "hi"
              ? "सर्फ, हार्पिक, प्रिल, गाला झाड़ू"
              : "Surf Excel, Harpic, Pril, Gala"
          }
          products={cleaningProducts}
          linkTo="/shop"
          linkSearch={{ category: "cleaning-supplies" }}
          linkLabel={`${t.viewAll} →`}
          autoSlide={true}
          intervalMs={4700}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          11B. 🛒 FULL CATALOG DISCOVERY BANNER (Dynamic Store Inventory)
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06241B] via-[#0B3527] to-[#041A14] border border-emerald-500/25 p-5 sm:p-7 md:p-8 text-white shadow-[0_12px_36px_rgba(6,36,27,0.35),inset_0_1px_1px_rgba(255,255,255,0.18)]">
          {/* Subtle Ambient Aurora Glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-[#E3B341]/12 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {/* Live Inventory Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-emerald-400/25 text-emerald-200 text-[11px] sm:text-xs font-semibold shadow-inner">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-400"></span>
                </span>
                <Sparkles className="size-3.5 text-amber-300" />
                <span>
                  {lang === "hi"
                    ? "लाइव स्टोर कैटलॉग • 100% शुद्ध राशन"
                    : "Live Store Inventory • 100% Authentic"}
                </span>
              </div>

              {/* Dynamic Title */}
              <h3 className="font-sans text-lg sm:text-2xl md:text-[26px] font-black text-white tracking-tight leading-snug">
                {lang === "hi" ? (
                  <>
                    हमारे पास{" "}
                    <span className="text-amber-300 font-extrabold">
                      {products.length > 0 ? `${products.length}+` : "100+"}
                    </span>{" "}
                    से अधिक दैनिक किराना सामान उपलब्ध हैं
                  </>
                ) : (
                  <>
                    Explore Over{" "}
                    <span className="text-amber-300 font-extrabold">
                      {products.length > 0 ? `${products.length}+` : "100+"}
                    </span>{" "}
                    Quality Grocery Essentials
                  </>
                )}
              </h3>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-emerald-100/80 font-normal leading-relaxed">
                {lang === "hi"
                  ? "दाल, चावल, शुद्ध तेल, मसाले, आटा, स्नैक्स और घरेलू ज़रूरत का हर सामान — सबसे किफ़ायती असली दुकान रेट पर!"
                  : "Pure grains, pulses, cooking oils, spices, flour, snacks and household essentials at live fair store rates."}
              </p>

              {/* Dynamic Mini Metrics Strip */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-emerald-100 font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <Package className="size-3.5 text-amber-300" />
                  <span>
                    <strong className="text-white font-bold">{products.length || 100}+</strong>{" "}
                    {lang === "hi" ? "कुल सामान" : "Products"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <Store className="size-3.5 text-emerald-300" />
                  <span>
                    <strong className="text-white font-bold">{categories.length || 8}+</strong>{" "}
                    {lang === "hi" ? "श्रेणियाँ" : "Categories"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <Truck className="size-3.5 text-teal-300" />
                  <span>{lang === "hi" ? "फास्ट डिलीवरी" : "Express Delivery"}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <ShieldCheck className="size-3.5 text-emerald-300" />
                  <span>{lang === "hi" ? "उचित दुकान रेट" : "Store Rates"}</span>
                </div>
              </div>
            </div>

            {/* Classy Modern CTA Button */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 items-start sm:items-center lg:items-end">
              <Link
                to="/shop"
                className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#06241B] px-6 py-3.5 text-xs sm:text-sm font-black shadow-[0_4px_18px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-white/40 shrink-0"
              >
                <ShoppingBag className="size-4 text-[#145A45] transition-transform group-hover:-rotate-6" />
                <span>{lang === "hi" ? "पूरी दुकान देखें" : "View Full Catalog"}</span>
                <span className="rounded-lg bg-[#EAF3ED] px-2 py-0.5 text-[11px] font-black text-[#145A45]">
                  {products.length > 0 ? `${products.length}+` : "100+"}
                </span>
                <ArrowRight className="size-3.5 text-[#145A45] transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          12. BOTTOM TRUST + WhatsApp CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <div className="rounded-3xl border border-[#E0DACF] bg-gradient-to-br from-white via-[#FAF8F2] to-[#E6EFE8]/40 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(15,74,56,0.08),inset_0_1px_0_rgba(255,255,255,1)] space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-[#E4DFD5] px-4 py-1.5 text-xs font-bold text-[#0F4A38] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
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
      <SmartRationModal
        open={smartRationOpen}
        onOpenChange={setSmartRationOpen}
        products={allDisplayProducts}
        initialMode={smartRationMode}
      />
    </div>
  );
}
