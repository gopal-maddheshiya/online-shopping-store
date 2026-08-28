import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Sparkles, MoveHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface HeroSpotlightProduct {
  id: string;
  slug?: string;
  nameEn: string;
  nameHi: string;
  category: string;
  image: string;
  badgeEn: string;
  badgeHi: string;
  badgeColor: string;
  price: string;
  weight: string;
}

// Curated 8 Top Essential Staples from real store catalog
const HERO_PRODUCTS: HeroSpotlightProduct[] = [
  {
    id: "atta-1",
    slug: "aashirvaad-superior-mp-atta-5kg",
    nameEn: "Aashirvaad Chakki Atta",
    nameHi: "आशीर्वाद चक्की आटा",
    category: "flour-atta",
    image: "/images/products/aashirvaad-atta.jpg",
    badgeEn: "Bestseller",
    badgeHi: "बेस्ट सेलर",
    badgeColor: "bg-[#D97706]",
    price: "₹245",
    weight: "5 kg",
  },
  {
    id: "oil-1",
    slug: "fortune-kachi-ghani-mustard-oil-1l",
    nameEn: "Fortune Mustard Oil",
    nameHi: "फॉर्च्यून सरसों तेल",
    category: "oil-ghee",
    image: "/images/products/fortune-mustard-oil.jpg",
    badgeEn: "100% Pure",
    badgeHi: "100% शुद्ध",
    badgeColor: "bg-[#15803D]",
    price: "₹145",
    weight: "1 L",
  },
  {
    id: "ghee-1",
    slug: "amul-pure-ghee-tin-1l",
    nameEn: "Amul Pure Desi Ghee",
    nameHi: "अमूल शुद्ध देसी घी",
    category: "oil-ghee",
    image: "/images/products/amul-desi-ghee.jpg",
    badgeEn: "Authentic",
    badgeHi: "शुद्ध घी",
    badgeColor: "bg-[#D97706]",
    price: "₹310",
    weight: "500 ml",
  },
  {
    id: "rice-1",
    slug: "india-gate-basmati-rice-rozzana-5kg",
    nameEn: "India Gate Basmati",
    nameHi: "इंडिया गेट बासमती",
    category: "rice-grains",
    image: "/images/products/india-gate-basmati-rice.jpg",
    badgeEn: "Long Grain",
    badgeHi: "प्रीमियम",
    badgeColor: "bg-[#0F4A38]",
    price: "₹185",
    weight: "1 kg",
  },
  {
    id: "dal-1",
    slug: "tata-sampann-unpolished-toor-dal-1kg",
    nameEn: "Tata Sampann Toor Dal",
    nameHi: "टाटा अरहर दाल",
    category: "pulses-dal",
    image: "/images/products/tata-toor-dal.jpg",
    badgeEn: "Unpolished",
    badgeHi: "अनपॉलिश",
    badgeColor: "bg-[#15803D]",
    price: "₹165",
    weight: "1 kg",
  },
  {
    id: "masala-1",
    slug: "everest-turmeric-powder-200g",
    nameEn: "Everest Turmeric Powder",
    nameHi: "एवरेस्ट हल्दी पाउडर",
    category: "spices-masala",
    image: "/images/products/everest-turmeric.jpg",
    badgeEn: "Pure Spices",
    badgeHi: "खालिस मसाला",
    badgeColor: "bg-[#D97706]",
    price: "₹62",
    weight: "200 g",
  },
  {
    id: "salt-1",
    slug: "tata-salt-vacuum-evaporated-iodised-1kg",
    nameEn: "Tata Vacuum Salt",
    nameHi: "टाटा शुद्ध नमक",
    category: "sugar-salt",
    image: "/images/products/tata-salt.jpg",
    badgeEn: "Daily Need",
    badgeHi: "दैनिक राशन",
    badgeColor: "bg-[#0F4A38]",
    price: "₹28",
    weight: "1 kg",
  },
  {
    id: "honey-1",
    slug: "dabur-100-pure-honey-squeezy-400g",
    nameEn: "Dabur 100% Pure Honey",
    nameHi: "डाबर शुद्ध शहद",
    category: "sauces-spreads",
    image: "/images/products/dabur-honey.jpg",
    badgeEn: "100% Natural",
    badgeHi: "प्राकृतिक",
    badgeColor: "bg-[#D97706]",
    price: "₹120",
    weight: "250 g",
  },
];

export function HeroProductCarousel() {
  const { lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [stepWidth, setStepWidth] = useState(140);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const startXRef = useRef(0);
  const currentDragDeltaRef = useRef(0);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Measure card width and visible count based on viewport container
  const updateMeasurements = useCallback(() => {
    if (!containerRef.current || !trackRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

    // Mobile: ~2 cards with peek (~48% width); Desktop: ~3 to 4 cards (~135-150px)
    if (isMobile) {
      setVisibleCount(2);
      // 46% of container width allows ~2 items + a small peek of the 3rd
      const cardWidth = Math.floor(containerWidth * 0.46);
      setStepWidth(cardWidth + 10); // card width + gap (10px)
    } else if (isTablet) {
      setVisibleCount(3);
      const cardWidth = Math.floor((containerWidth - 24) / 3);
      setStepWidth(cardWidth + 12);
    } else {
      // Desktop
      const cardsToShow = containerWidth > 420 ? 3.5 : 3;
      setVisibleCount(Math.floor(cardsToShow));
      const cardWidth = Math.min(145, Math.floor((containerWidth - 24) / 3.2));
      setStepWidth(cardWidth + 12);
    }
  }, []);

  useEffect(() => {
    updateMeasurements();
    window.addEventListener("resize", updateMeasurements, { passive: true });
    return () => window.removeEventListener("resize", updateMeasurements);
  }, [updateMeasurements]);

  const maxIndex = useMemo(() => {
    return Math.max(0, HERO_PRODUCTS.length - visibleCount);
  }, [visibleCount]);

  // Navigate to slide
  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setCurrentIndex(clamped);
    },
    [maxIndex]
  );

  const prev = useCallback(() => {
    setIsUserInteracting(true);
    goTo(currentIndex - 1);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsUserInteracting(false), 5000);
  }, [currentIndex, goTo]);

  const next = useCallback(() => {
    setIsUserInteracting(true);
    goTo(currentIndex + 1);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsUserInteracting(false), 5000);
  }, [currentIndex, goTo]);

  // Desktop subtle autoplay: pauses on hover, pauses when interacting, disabled on mobile & reduced-motion
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isMobile || prefersReducedMotion || isHovered || isDragging || isUserInteracting) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= maxIndex) {
          return 0;
        }
        return prevIndex + 1;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered, isDragging, isUserInteracting, maxIndex]);

  // Pointer / Touch / Drag Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button
    if (e.button !== 0 && e.pointerType === "mouse") return;

    setIsDragging(true);
    setIsUserInteracting(true);
    startXRef.current = e.clientX;
    currentDragDeltaRef.current = 0;
    setDragOffset(0);

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    currentDragDeltaRef.current = deltaX;

    // Apply soft resistance if dragging beyond bounds
    const isAtStart = currentIndex === 0 && deltaX > 0;
    const isAtEnd = currentIndex === maxIndex && deltaX < 0;
    const effectiveDelta = isAtStart || isAtEnd ? deltaX * 0.3 : deltaX;

    setDragOffset(effectiveDelta);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaX = currentDragDeltaRef.current;
    const threshold = stepWidth * 0.25; // 25% of card width triggers snap

    if (deltaX < -threshold) {
      // Swiped Left -> Move Next
      const steps = Math.min(2, Math.max(1, Math.round(Math.abs(deltaX) / stepWidth)));
      goTo(currentIndex + steps);
    } else if (deltaX > threshold) {
      // Swiped Right -> Move Prev
      const steps = Math.min(2, Math.max(1, Math.round(deltaX) / stepWidth));
      goTo(currentIndex - steps);
    } else {
      // Snap back to current
      goTo(currentIndex);
    }

    setDragOffset(0);
    currentDragDeltaRef.current = 0;

    resumeTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 4500);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prev();
    } else if (e.key === "ArrowRight") {
      next();
    }
  };

  // Calculate current translation offset with GPU transform
  const currentTranslateX = -(currentIndex * stepWidth) + dragOffset;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Popular Groceries Showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl bg-black/25 backdrop-blur-md p-3 sm:p-4 border border-white/20 shadow-xl flex flex-col justify-between select-none overflow-hidden focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
    >
      {/* 1. Header: Micro-Badge & Navigation Buttons */}
      <div className="w-full flex items-center justify-between gap-2 mb-2.5 z-10">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur-md border border-white/20">
          <Sparkles className="size-3 text-[#E3B341]" />
          <span>
            {lang === "hi" ? "शुद्ध ताज़ा किराना सामग्री" : "Fresh Grocery Staples"}
          </span>
        </div>

        {/* Previous / Next Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            disabled={currentIndex === 0}
            aria-label="Previous products"
            className="flex size-7 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-white/20"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={currentIndex >= maxIndex}
            aria-label="Next products"
            className="flex size-7 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-white/20"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Product Carousel Track */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full overflow-hidden py-1 touch-pan-y cursor-grab active:cursor-grabbing"
      >
        <div
          ref={trackRef}
          className="flex gap-2.5 sm:gap-3 will-change-transform"
          style={{
            transform: `translate3d(${currentTranslateX}px, 0, 0)`,
            transition: isDragging ? "none" : "transform 450ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {HERO_PRODUCTS.map((product) => {
            const name = lang === "hi" ? product.nameHi : product.nameEn;
            const badge = lang === "hi" ? product.badgeHi : product.badgeEn;

            return (
              <div
                key={product.id}
                style={{ width: `${stepWidth - 10}px` }}
                className="shrink-0"
              >
                <Link
                  to="/shop"
                  search={{ category: product.category }}
                  className="group relative flex flex-col justify-between h-full rounded-xl bg-white p-2.5 sm:p-3 shadow-sm border border-black/5 hover:shadow-md hover:border-[#145A45]/30 transition-all duration-200 cursor-pointer"
                  draggable={false}
                  onClick={(e) => {
                    // Prevent accidental click if user was dragging
                    if (Math.abs(currentDragDeltaRef.current) > 8) {
                      e.preventDefault();
                    }
                  }}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between w-full min-h-[16px] mb-1">
                    <span
                      className={`inline-block rounded-sm ${product.badgeColor} px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-wider shadow-2xs leading-none`}
                    >
                      {badge}
                    </span>
                  </div>

                  {/* Clean Image Area (natural transparent/white blend, no distortion) */}
                  <div className="w-full aspect-[4/3] sm:aspect-square flex items-center justify-center p-0.5 my-0.5 overflow-hidden">
                    <img
                      src={product.image}
                      alt={name}
                      loading="eager"
                      draggable={false}
                      className="size-full object-contain group-hover:scale-105 transition-transform duration-250 pointer-events-none"
                    />
                  </div>

                  {/* Product Details (Name, Price & Weight) */}
                  <div className="w-full mt-1.5 pt-1 border-t border-black/5 flex flex-col text-left">
                    <h3 className="text-[11.5px] sm:text-xs font-bold text-[#16201A] line-clamp-1 group-hover:text-[#0F4A38] transition-colors leading-snug">
                      {name}
                    </h3>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11.5px] sm:text-xs font-black text-[#0F4A38]">
                        {product.price}
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] text-[#5A655F] font-medium">
                        {product.weight}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Information & Swipe Indicator */}
      <div className="w-full mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] sm:text-[11px] text-white/80 font-medium">
        <span className="flex items-center gap-1 text-[#E3B341]">
          <MoveHorizontal className="size-3" />
          <span>{lang === "hi" ? "स्वाइप करके देखें" : "Swipe to explore"}</span>
        </span>
        <span className="truncate text-white/70">
          {lang === "hi" ? "📍 रामनगर, महाराजगंज" : "📍 Ramnagar, Maharajganj"}
        </span>
      </div>
    </div>
  );
}
