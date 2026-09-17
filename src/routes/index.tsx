import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
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
  ChevronLeft,
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
  pendingComponent: HomepageSkeleton,
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
          <h2 className="font-sans text-base sm:text-lg font-bold text-[#16201A] tracking-tight">
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
function HeroBannerSkeleton() {
  return (
    <section className="container-page pt-2 sm:pt-3">
      <div className="relative overflow-hidden rounded-flipkart-hero w-full aspect-[1536/750] border border-[#EAE6DC]/60 shadow-xs bg-[#F5F2EB]/50">
        <Skeleton className="size-full rounded-flipkart-hero" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xs border border-[#EAE6DC]/80 shadow-xs">
            <Store className="size-4.5 text-[#145A45] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-[#145A45]">अरुण गोपाल ट्रेडर्स</span>
          </div>
        </div>
      </div>
      {/* Skeleton Pagination Indicators */}
      <div className="flex items-center justify-center gap-2 pt-3 pb-1">
        <Skeleton className="w-7 sm:w-8 h-1.5 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
      </div>
    </section>
  );
}

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
    return <HeroBannerSkeleton />;
  }

  if (activeImages.length === 1) {
    return (
      <section className="container-page pt-2 sm:pt-3">
        <div className="relative overflow-hidden rounded-flipkart-hero shadow-xs border border-[#EAE6DC]/60 w-full aspect-[1536/750] bg-[#F5F2EB]">
          <img
            src={activeImages[0]}
            alt={storeName}
            decoding="async"
            fetchPriority="high"
            className="size-full object-cover select-none rounded-flipkart-hero"
            style={{ borderRadius: "inherit" }}
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
  // If fewer than 5 images, duplicate array for seamless infinite looping in Embla
  const loopImages = useMemo(() => {
    if (images.length < 5) {
      return [...images, ...images];
    }
    return images;
  }, [images]);

  const autoplay = useRef(
    Autoplay({
      delay: 4500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      duration: 25,
      skipSnaps: false,
      dragFree: false,
    },
    [autoplay.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap() % images.length);
  }, [emblaApi, images.length]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const handleResize = () => {
      emblaApi.reInit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      emblaApi.off("select", onSelect);
      window.removeEventListener("resize", handleResize);
    };
  }, [emblaApi, onSelect]);

  const handleManualAction = useCallback(() => {
    autoplay.current.reset();
  }, []);

  return (
    <section className="container-page pt-2 sm:pt-3">
      <div className="relative group">
        {/* Carousel Viewport with Flipkart Rounded Corners */}
        <div
          ref={emblaRef}
          className="overflow-hidden rounded-flipkart-hero cursor-grab active:cursor-grabbing select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex select-none gap-0 sm:gap-5 md:gap-6 lg:gap-7"
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {loopImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="shrink-0 grow-0 basis-full sm:basis-[58%] lg:basis-[45.5%] min-w-0 last:mr-0 last:sm:mr-5 last:md:mr-6 last:lg:mr-7"
              >
                <div
                  className="relative w-full aspect-[1536/750] rounded-flipkart-hero overflow-hidden shadow-xs border border-[#EAE6DC]/60 bg-[#F5F2EB] group/slide isolate"
                  style={{ borderRadius: "inherit" }}
                >
                  <img
                    src={imgUrl}
                    alt={`${storeName} Offer Banner ${(idx % images.length) + 1}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={idx === 0 ? "high" : "low"}
                    className="size-full object-cover select-none rounded-flipkart-hero transition-transform duration-300 group-hover/slide:scale-[1.01]"
                    style={{ borderRadius: "inherit" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Left & Right Arrow Navigation (Flipkart Style) */}
        <button
          type="button"
          onClick={() => {
            emblaApi?.scrollPrev();
            handleManualAction();
          }}
          aria-label="Previous banner"
          className="hidden sm:grid absolute left-3 top-1/2 -translate-y-1/2 size-9 place-items-center rounded-full bg-white/95 hover:bg-white text-[#16201A] shadow-md border border-[#EAE6DC] opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-pointer backdrop-blur-xs hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            emblaApi?.scrollNext();
            handleManualAction();
          }}
          aria-label="Next banner"
          className="hidden sm:grid absolute right-3 top-1/2 -translate-y-1/2 size-9 place-items-center rounded-full bg-white/95 hover:bg-white text-[#16201A] shadow-md border border-[#EAE6DC] opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-pointer backdrop-blur-xs hover:scale-105 active:scale-95"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Flipkart Standard Pagination Indicators with Animated Progress Fill */}
      <div
        className="flex items-center justify-center gap-2 pt-3 sm:pt-3.5 pb-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {images.map((_, idx) => {
          const isActive = idx === selectedIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                emblaApi?.scrollTo(idx);
                handleManualAction();
              }}
              className={`relative overflow-hidden rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? "w-7 sm:w-8 h-1.5 bg-[#D1CBC1] shadow-2xs"
                  : "w-1.5 h-1.5 bg-[#D1CBC1] hover:bg-[#A8A196]"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {isActive && images.length > 1 && (
                <span
                  key={`progress-${selectedIndex}`}
                  className="absolute inset-y-0 left-0 bg-[#2B3831] rounded-full animate-carousel-progress"
                  style={{
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
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
    <div className="relative size-full flex items-center justify-center overflow-hidden p-1 sm:p-1.5">
      {!loaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#EAE6DC]/30 via-white/70 to-[#EAE6DC]/30 animate-pulse" />
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
          className={`size-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-transform duration-200 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="space-y-7 sm:space-y-9">
      {[1, 2].map((g) => (
        <div key={g} className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#EAE6DC]/60">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-6 sm:h-7 w-1 sm:w-1.2 rounded-full bg-[#145A45]/30 shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 sm:h-5 w-32 sm:w-44 rounded-md" />
                <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-28 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 sm:h-7 w-18 sm:w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center w-full">
                <div className="w-full aspect-[1/1.02] rounded-[13px] overflow-hidden bg-[#EDF8F1]/60 border border-[#DDF3E4]/70 p-1.5 flex items-center justify-center shadow-2xs">
                  <Skeleton className="size-full rounded-[10px]" />
                </div>
                <Skeleton className="h-3 w-14 rounded-md mt-2" />
                <Skeleton className="h-2.5 w-10 rounded-md mt-1" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HomepageSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-5 pb-24 overflow-x-hidden pt-0">
      {/* 1. Hero Banner Skeleton */}
      <HeroBannerSkeleton />

      {/* 2. Category Grid Skeleton */}
      <section className="container-page space-y-4 sm:space-y-6 pt-0 sm:pt-1 pb-6 sm:pb-8">
        <CategoryGridSkeleton />
      </section>

      {/* 3. Mini Trust Strip Skeleton */}
      <section className="container-page">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#E4DFD5] shadow-xs"
            >
              <Skeleton className="size-9 rounded-xl shrink-0" />
              <div className="min-w-0 space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                <Skeleton className="h-2.5 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Product Shelf Skeleton (Popular Products) */}
      <section className="container-page space-y-3 sm:space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 sm:h-5 w-36 sm:w-48 rounded-md" />
              <Skeleton className="h-2.5 sm:h-3 w-24 sm:w-32 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 sm:h-7 w-20 rounded-full" />
        </div>
        <div className="flex gap-2.5 sm:gap-3.5 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 grow-0 basis-[48%] sm:basis-[32%] md:basis-[24%] lg:basis-[19%] min-w-0"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Second Product Shelf Skeleton (Atta & Rice) */}
      <section className="container-page space-y-3 sm:space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 sm:h-5 w-40 sm:w-52 rounded-md" />
              <Skeleton className="h-2.5 sm:h-3 w-28 sm:w-36 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 sm:h-7 w-20 rounded-full" />
        </div>
        <div className="flex gap-2.5 sm:gap-3.5 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 grow-0 basis-[48%] sm:basis-[32%] md:basis-[24%] lg:basis-[19%] min-w-0"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Category Heading Icon Mapper (Relevant SVGs instead of OS Emojis)
   ═══════════════════════════════════════════════════════════════ */
function getCategoryHeadingIcon(heading: { id: string; title_hi?: string; title_en?: string }) {
  const id = (heading.id || "").toLowerCase();
  const text = `${heading.title_hi || ""} ${heading.title_en || ""}`.toLowerCase();

  if (id === "food" || text.includes("खान") || text.includes("food") || text.includes("kitchen") || text.includes("रसोई") || text.includes("राशन")) {
    return <UtensilsCrossed className="size-5 text-[#145A45]" strokeWidth={2.2} />;
  }
  if (id === "household" || text.includes("सफ़ाई") || text.includes("cleaning") || text.includes("house") || text.includes("बर्तन") || text.includes("घरेलू")) {
    return <Sparkles className="size-5 text-[#145A45]" strokeWidth={2.2} />;
  }
  if (id === "personal" || text.includes("पर्सनल") || text.includes("personal") || text.includes("beauty") || text.includes("केयर")) {
    return <Heart className="size-5 text-[#145A45]" strokeWidth={2.2} />;
  }
  if (id === "pooja_misc" || text.includes("पूजा") || text.includes("pooja") || text.includes("स्टेशनरी")) {
    return <Flame className="size-5 text-[#145A45]" strokeWidth={2.2} />;
  }
  return <ShoppingCart className="size-5 text-[#145A45]" strokeWidth={2.2} />;
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

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: "photo" | "text" | "voice" }>;
      setSmartRationMode(customEvent.detail?.mode || "text");
      setSmartRationOpen(true);
    };
    window.addEventListener("open-smart-ration", handleOpen);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("smartRation");
      if (mode === "photo" || mode === "text" || mode === "voice") {
        setSmartRationMode(mode);
        setSmartRationOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("smartRation");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }

    return () => window.removeEventListener("open-smart-ration", handleOpen);
  }, []);

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
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CategoryHeading[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail) && customEvent.detail.length > 0) {
        setHeadings(customEvent.detail);
      } else {
        setHeadings(getCategoryHeadings());
      }
    };
    window.addEventListener("agt:headings-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("agt:headings-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

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
    <div className="space-y-3 sm:space-y-5 pb-24 overflow-x-hidden pt-0">
      {/* ═══════════════════════════════════════════════════════
          AI SMART RATION QUICK-BAR (Flipkart-style seamless strip)
          ═══════════════════════════════════════════════════════ */}
      <SmartRationBar
        onOpenModal={(mode) => {
          setSmartRationMode(mode || "text");
          setSmartRationOpen(true);
        }}
      />

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
          2. GROUPED CATEGORIES — Beautiful Density & Responsive Grid
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page space-y-4 sm:space-y-6 pt-0 sm:pt-1 pb-6 sm:pb-8">
        {catLoading ? (
          <CategoryGridSkeleton />
        ) : (
          <div className="space-y-7 sm:space-y-9">
            {headings.map((heading) => {
              const items = parentCategories.filter((c) => heading.slugs.includes(c.slug));

              if (items.length === 0) return null;

              const headingTitle = lang === "hi" ? heading.title_hi : (heading.title_en || heading.title_hi);

              return (
                <div key={heading.id} className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#EAE6DC]/60">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Left Forest Green Accent Bar */}
                      <div className="h-6 sm:h-7 w-1 sm:w-1.2 rounded-full bg-gradient-to-b from-[#145A45] via-[#1B6D55] to-[#2E8B57] shadow-xs shrink-0" />

                      {/* Heading Title & Item Count */}
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="font-sans text-base sm:text-lg lg:text-xl font-bold text-[#16201A] tracking-tight leading-tight truncate">
                          {headingTitle}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-[#5A655F] font-medium flex items-center gap-1.5">
                          <span>{items.length} {lang === "hi" ? "श्रेणियाँ" : "categories"}</span>
                          <span className="text-[#A8B2AC]">•</span>
                          <span className="text-[#145A45] font-semibold">{lang === "hi" ? "100% शुद्ध व असली" : "100% Genuine"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Flipkart/Blinkit Style 'सब देखें' Button */}
                    <Link
                      to="/shop"
                      className="group inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#145A45] text-[#145A45] hover:text-white border border-[#D5E4D9] hover:border-[#145A45] px-3 sm:px-4 py-1.5 text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_4px_12px_rgba(20,90,69,0.18)] transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                      <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4">
                    {items.map((c) => {
                      return (
                        <Link
                          key={c.id}
                          to="/shop"
                          search={{ category: c.slug }}
                          className="group flex flex-col items-center text-center w-full active:scale-[0.96] transition-transform duration-150"
                        >
                          <div
                            className="relative w-full aspect-[1/1.02] rounded-[13px] overflow-hidden transition-all duration-200 bg-[#EDF8F1] border border-[#DDF3E4] group-hover:bg-[#E4F7EA] group-hover:border-[#CEEED8] group-hover:scale-[1.03]"
                          >
                            <CategoryThumbnail category={c} name={c.name} />
                          </div>
                          <span className="mt-2 sm:mt-2.5 text-[11.5px] sm:text-[12px] lg:text-[12.5px] font-medium text-[#222725] group-hover:text-[#0F4A38] leading-[1.28] tracking-tight text-center line-clamp-2 min-h-[2.6em] flex items-start justify-center px-0.5 transition-colors">
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
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#EAE6DC]/60">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="h-6 sm:h-7 w-1 sm:w-1.2 rounded-full bg-gradient-to-b from-[#145A45] via-[#1B6D55] to-[#2E8B57] shadow-xs shrink-0" />
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="font-sans text-base sm:text-lg lg:text-xl font-bold text-[#16201A] tracking-tight leading-tight truncate">
                        {lang === "hi" ? "अन्य श्रेणियाँ" : "Other Categories"}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#5A655F] font-medium flex items-center gap-1.5">
                        <span>{uncategorizedCategories.length} {lang === "hi" ? "श्रेणियाँ" : "categories"}</span>
                        <span className="text-[#A8B2AC]">•</span>
                        <span className="text-[#145A45] font-semibold">{lang === "hi" ? "किराना व घरेलू जरूरतें" : "Daily Needs"}</span>
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/shop"
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#145A45] text-[#145A45] hover:text-white border border-[#D5E4D9] hover:border-[#145A45] px-3 sm:px-4 py-1.5 text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_4px_12px_rgba(20,90,69,0.18)] transition-all shrink-0 active:scale-95 cursor-pointer"
                  >
                    <span>{lang === "hi" ? "सब देखें" : "View All"}</span>
                    <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4">
                  {uncategorizedCategories.map((c) => {
                    return (
                      <Link
                        key={c.id}
                        to="/shop"
                        search={{ category: c.slug }}
                        className="group flex flex-col items-center text-center w-full active:scale-[0.96] transition-transform duration-150"
                      >
                        <div
                          className="relative w-full aspect-[1/1.02] rounded-[13px] overflow-hidden transition-all duration-200 bg-[#EDF8F1] border border-[#DDF3E4] group-hover:bg-[#E4F7EA] group-hover:border-[#CEEED8] group-hover:scale-[1.03]"
                        >
                          <CategoryThumbnail category={c} name={c.name} />
                        </div>
                        <span className="mt-2 sm:mt-2.5 text-[11.5px] sm:text-[12px] lg:text-[12.5px] font-medium text-[#222725] group-hover:text-[#0F4A38] leading-[1.28] tracking-tight text-center line-clamp-2 min-h-[2.6em] flex items-start justify-center px-0.5 transition-colors">
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
      {(prodLoading || attaRiceProducts.length > 0) && (
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
          isLoading={prodLoading}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          6. 🫘 PULSES & DAL (Auto-Sliding Shelf)
          ═══════════════════════════════════════════════════════ */}
      {(prodLoading || dalPulsesProducts.length > 0) && (
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
          isLoading={prodLoading}
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
          <div className="relative overflow-hidden rounded-3xl border border-[#E2E8E4] bg-gradient-to-r from-[#F8FAF9] via-white to-[#E6EFE8]/50 p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,74,56,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
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
                <h3 className="font-sans text-base sm:text-xl font-bold text-[#16201A] tracking-tight">
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
        <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl bg-gradient-to-br from-[#041A13] via-[#0A3628] to-[#03140F] border border-emerald-500/25 p-5 sm:p-7 md:p-8 lg:p-9 text-white shadow-[0_16px_48px_-8px_rgba(4,26,19,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)]">
          {/* Ambient Lighting & Glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#F5D061]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,208,97,0.06),transparent_50%)]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Column (7 cols on laptop): Core Narrative & Live Trust */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              {/* Live Inventory Status Beacon */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-emerald-400/25 text-emerald-200 text-[11px] sm:text-xs font-semibold shadow-inner">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-400"></span>
                </span>
                <Store className="size-3.5 text-amber-300" />
                <span>
                  {lang === "hi"
                    ? "लाइव स्टोर कैटलॉग • 100% शुद्ध राशन"
                    : "Live Store Inventory • 100% Authentic"}
                </span>
              </div>

              {/* Dynamic Impact Headline */}
              <h3 className="font-sans text-xl sm:text-2xl md:text-[27px] lg:text-[30px] font-extrabold text-white tracking-tight leading-snug sm:leading-tight">
                {lang === "hi" ? (
                  <>
                    हमारे पास{" "}
                    <span className="bg-gradient-to-r from-[#FDE68A] via-[#F5D061] to-[#E3B341] bg-clip-text text-transparent font-black">
                      {products.length > 0 ? `${products.length}+` : "150+"}
                    </span>{" "}
                    से अधिक दैनिक किराना सामान उपलब्ध हैं
                  </>
                ) : (
                  <>
                    Explore Over{" "}
                    <span className="bg-gradient-to-r from-[#FDE68A] via-[#F5D061] to-[#E3B341] bg-clip-text text-transparent font-black">
                      {products.length > 0 ? `${products.length}+` : "150+"}
                    </span>{" "}
                    Quality Grocery Essentials
                  </>
                )}
              </h3>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-emerald-100/85 font-normal leading-relaxed max-w-xl">
                {lang === "hi"
                  ? "दाल, चावल, शुद्ध तेल, मसाले, आटा, स्नैक्स और घरेलू ज़रूरत का हर सामान — सबसे किफ़ायती असली दुकान रेट पर!"
                  : "Pure grains, pulses, cooking oils, spices, flour, snacks and household essentials at live fair store rates."}
              </p>

              {/* Dynamic Mini Metrics (Grid on mobile, flex on desktop) */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1 text-xs text-emerald-100 font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <Package className="size-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">
                    <strong className="text-white font-bold">{products.length || 150}+</strong>{" "}
                    {lang === "hi" ? "कुल सामान" : "Products"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <Store className="size-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">
                    <strong className="text-white font-bold">{categories.length || 20}+</strong>{" "}
                    {lang === "hi" ? "श्रेणियाँ" : "Categories"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <Truck className="size-3.5 text-teal-300 shrink-0" />
                  <span className="truncate">{lang === "hi" ? "फास्ट डिलीवरी" : "Express Delivery"}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-xs">
                  <ShieldCheck className="size-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">{lang === "hi" ? "उचित दुकान रेट" : "Store Rates"}</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols on laptop): Category Visual Cards + Action Button */}
            <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-3.5">
              {/* Category Quick Showcase: 4 Popular Categories */}
              {parentCategories.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {parentCategories.slice(0, 4).map((c) => (
                    <Link
                      key={c.id}
                      to="/shop"
                      search={{ category: c.slug } as never}
                      className="group flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/12 hover:border-emerald-400/40 p-2 sm:p-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 backdrop-blur-xs shadow-xs cursor-pointer"
                    >
                      <img
                        src={getCategoryThumbnail(c)}
                        alt={getCategoryName(c)}
                        loading="lazy"
                        decoding="async"
                        width={36}
                        height={36}
                        className="size-9 sm:size-10 rounded-xl object-cover border border-white/20 shrink-0 bg-white/10 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate leading-tight">
                          {getCategoryName(c)}
                        </span>
                        <span className="text-[10px] text-emerald-200/70 font-medium flex items-center gap-0.5 mt-0.5">
                          <span>{lang === "hi" ? "देखें" : "View"}</span>
                          <span className="text-[8.5px] group-hover:translate-x-0.5 transition-transform">→</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* High-Impact Primary CTA Button */}
              <Link
                to="/shop"
                className="group flex items-center justify-between w-full rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#06241B] px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer border border-white/80"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="size-4 sm:size-4.5 text-[#145A45] transition-transform group-hover:-rotate-6" />
                  <span className="font-extrabold text-xs sm:text-sm">
                    {lang === "hi" ? "पूरी दुकान देखें" : "View Full Catalog"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-[#EAF3ED] px-2.5 py-0.5 text-[11px] sm:text-xs font-extrabold text-[#145A45]">
                    {products.length > 0 ? `${products.length}+` : "150+"} {lang === "hi" ? "सामान" : "Items"}
                  </span>
                  <ArrowRight className="size-3.5 sm:size-4 text-[#145A45] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          12. BOTTOM TRUST + WhatsApp CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="container-page">
        <div className="rounded-3xl border border-[#E2E8E4] bg-gradient-to-br from-white via-[#F8FAF9] to-[#E6EFE8]/40 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(15,74,56,0.06),inset_0_1px_0_rgba(255,255,255,1)] space-y-6">
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
            <h2 className="font-sans text-lg sm:text-xl font-bold text-[#16201A] tracking-tight">
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
