import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { type Product } from "@/lib/queries";

interface ProductSliderShelfProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: Product[];
  linkTo?: string;
  linkSearch?: Record<string, string>;
  linkLabel?: string;
  autoSlide?: boolean;
  intervalMs?: number;
  isLoading?: boolean;
}

export function ProductSliderShelf({
  title,
  subtitle,
  icon,
  products,
  linkTo = "/shop",
  linkSearch,
  linkLabel,
  autoSlide = true,
  intervalMs = 4000,
  isLoading = false,
}: ProductSliderShelfProps) {
  // Ensure enough items for a truly seamless, unbroken infinite loop
  const loopProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (products.length < 5) {
      return [...products, ...products, ...products];
    }
    if (products.length < 8) {
      return [...products, ...products];
    }
    return products;
  }, [products]);

  // Embla setup optimized for 60-120 FPS hardware acceleration
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: false,
    skipSnaps: false,
    duration: 30, // Smooth glide duration
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use refs for interaction so we NEVER trigger React re-renders on scroll
  const isInteractingRef = useRef(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update active slide index only when snap settles (zero lag during drag)
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

  // Handle user interaction with zero React re-renders
  const handleUserInteraction = useCallback(() => {
    isInteractingRef.current = true;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    // Give user 6 seconds undisturbed after any touch/drag
    cooldownTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 6000);
  }, []);

  // Listen to pointerDown only once per touch/click (NOT on every scroll frame)
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("pointerDown", handleUserInteraction);
    return () => {
      emblaApi.off("pointerDown", handleUserInteraction);
    };
  }, [emblaApi, handleUserInteraction]);

  // Auto-Slide Interval with zero re-rendering overhead
  useEffect(() => {
    if (!emblaApi || !autoSlide || loopProducts.length <= 2) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      emblaApi.scrollNext();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [emblaApi, autoSlide, loopProducts.length, intervalMs]);

  if (!isLoading && products.length === 0) {
    return null;
  }

  // Dots calculation
  const totalOriginal = products.length;
  const activeDotIndex = totalOriginal > 0 ? selectedIndex % totalOriginal : 0;
  const maxDots = Math.min(totalOriginal, 6);

  return (
    <section className="container-page space-y-3 sm:space-y-3.5">
      {/* 1. Clean Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {icon && (
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#EBF3ED] via-[#E2EEE5] to-[#D6E7DB] border border-[#145A45]/20 shrink-0 text-base shadow-[0_2px_8px_rgba(20,90,69,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-sans text-sm sm:text-base md:text-lg font-black text-[#16201A] tracking-tight truncate leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-[#5A655F] font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* View All Button */}
        <div className="flex items-center gap-2 shrink-0">
          {linkLabel && (
            <Link
              to={linkTo as any}
              search={linkSearch as any}
              className="inline-flex items-center gap-1 rounded-full bg-white hover:bg-[#145A45] border border-[#E0DACF] hover:border-[#145A45] text-[#0F4A38] hover:text-white px-3 py-1 text-[11px] sm:text-xs font-bold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_4px_12px_rgba(20,90,69,0.2)] shrink-0"
            >
              <span>{linkLabel}</span>
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. GPU-Accelerated Zero-Lag Carousel Reel */}
      <div
        ref={emblaRef}
        className="overflow-hidden -mx-1 px-1 py-1.5 cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={handleUserInteraction}
        onTouchStart={handleUserInteraction}
      >
        {/* Track without gap (padding-based gutter prevents Embla loop overlap) */}
        <div className="flex -ml-2.5 sm:-ml-3.5 select-none">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 grow-0 basis-[48%] sm:basis-[32%] md:basis-[24%] lg:basis-[19%] min-w-0 pl-2.5 sm:pl-3.5"
                >
                  <ProductCardSkeleton />
                </div>
              ))
            : loopProducts.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  className="shrink-0 grow-0 basis-[48%] sm:basis-[32%] md:basis-[24%] lg:basis-[19%] min-w-0 pl-2.5 sm:pl-3.5"
                >
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </div>

      {/* 3. Subtle Interactive Dots Indicator */}
      {maxDots > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {Array.from({ length: maxDots }).map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => {
                emblaApi?.scrollTo(dotIdx);
                handleUserInteraction();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === activeDotIndex % maxDots
                  ? "w-5 bg-[#145A45]"
                  : "w-1.5 bg-[#E2DDD3] hover:bg-[#B5AFA4]"
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
