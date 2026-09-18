import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { type Product } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ProductSliderShelfProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconContainerClassName?: string;
  className?: string;
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
  iconContainerClassName,
  className,
  products,
  linkTo = "/shop",
  linkSearch,
  linkLabel,
  autoSlide = true,
  intervalMs = 4500,
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

  // Embla setup optimized for silky smooth 60-120 FPS glide (no jerky drag feeling)
  // align offset prevents leftmost product card from getting clipped when paused
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: (viewSize) => (viewSize < 640 ? 10 : 14),
    skipSnaps: true,
    duration: 48, // Gentle, progressive, buttery glide curve
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
    <section
      className={cn(
        "container-page space-y-3 sm:space-y-3.5 gsap-reveal-section shelf-viewport-contain",
        className,
      )}
    >
      {/* 1. Clean Header (Flipkart Grocery Style) */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#EAE6DC]/60">
        <h2 className="font-sans text-base sm:text-lg lg:text-xl font-bold text-[#18221D] tracking-tight truncate leading-tight">
          {title}
        </h2>

        {/* Flipkart Style Clean Arrow Button */}
        {linkTo && (
          <Link
            to={linkTo as any}
            search={linkSearch as any}
            aria-label={`View all ${title}`}
            className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-white hover:bg-[#145A45] text-[#18221D] hover:text-white border border-[#D5E4D9] hover:border-[#145A45] shadow-2xs hover:shadow-xs transition-all shrink-0 active:scale-90 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      {/* 2. GPU-Accelerated Zero-Lag Carousel Reel */}
      <div className="relative group/reel">
        <div
          ref={emblaRef}
          className="overflow-hidden -mx-2 px-2 py-2 sm:py-2.5 cursor-grab active:cursor-grabbing select-none touch-pan-y"
          onMouseEnter={handleUserInteraction}
          onTouchStart={handleUserInteraction}
        >
          {/* Hardware-accelerated track prevents dropped frames and stutter */}
          <div
            className="flex -ml-2.5 sm:-ml-3.5 select-none"
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 grow-0 basis-[48%] sm:basis-[32%] md:basis-[24%] lg:basis-[19%] min-w-0 pl-2.5 sm:pl-3.5 select-none"
                  >
                    <ProductCardSkeleton />
                  </div>
                ))
              : loopProducts.map((product, idx) => (
                  <div
                    key={`${product.id}-${idx}`}
                    className="shrink-0 grow-0 basis-[48%] sm:basis-[32%] md:basis-[24%] lg:basis-[19%] min-w-0 pl-2.5 sm:pl-3.5 select-none"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
        </div>

        {/* Previous Button (Desktop / Tablet) */}
        <button
          type="button"
          onClick={() => {
            emblaApi?.scrollPrev();
            handleUserInteraction();
          }}
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/95 hover:bg-[#145A45] border border-[#E0DACF] hover:border-[#145A45] text-[#16201A] hover:text-white shadow-md hover:shadow-lg items-center justify-center transition-all z-20 cursor-pointer opacity-0 group-hover/reel:opacity-100 active:scale-95 duration-200"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Next Button (Desktop / Tablet) */}
        <button
          type="button"
          onClick={() => {
            emblaApi?.scrollNext();
            handleUserInteraction();
          }}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/95 hover:bg-[#145A45] border border-[#E0DACF] hover:border-[#145A45] text-[#16201A] hover:text-white shadow-md hover:shadow-lg items-center justify-center transition-all z-20 cursor-pointer opacity-0 group-hover/reel:opacity-100 active:scale-95 duration-200"
          aria-label="Next Slide"
        >
          <ChevronRight className="size-4" />
        </button>
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
