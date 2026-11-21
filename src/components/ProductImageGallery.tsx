import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "@/lib/product-images";
import type { ProductImage } from "@/lib/queries";

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
  className?: string;
  badge?: React.ReactNode;
};

export function ProductImageGallery({
  images,
  productName,
  className = "",
  badge,
}: ProductImageGalleryProps) {
  const { lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Safe fallback if images array is empty
  const safeImages: ProductImage[] =
    images && images.length > 0
      ? images
      : [{ url: DEFAULT_PRODUCT_PLACEHOLDER, type: "front", label: "Front View", sort_order: 0 }];

  const activeImage = safeImages[activeIndex] || safeImages[0]!;
  const hasMultipleImages = safeImages.length > 1;

  useEffect(() => {
    if (activeIndex >= safeImages.length) {
      setActiveIndex(Math.max(0, safeImages.length - 1));
    }
  }, [safeImages.length, activeIndex]);

  // Touch Swipe Handling for Mobile
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches[0]) {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    }
  }

  function handleTouchEnd() {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  }

  const goToIndex = useCallback((index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 120);
  }, [activeIndex]);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
    setTimeout(() => setIsTransitioning(false), 120);
  }, [safeImages.length]);

  const goToPrev = useCallback(() => {
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    setTimeout(() => setIsTransitioning(false), 120);
  }, [safeImages.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isLightboxOpen, goToNext, goToPrev]);

  return (
    <div className={`flex flex-col gap-3 select-none ${className}`}>
      {/* 1. MAIN EXPANSIVE STAGE (Occupies full column width naturally, unboxed) */}
      <div className="relative w-full mx-auto">
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="group relative w-full aspect-square rounded-2xl sm:rounded-3xl bg-white border border-gray-100 sm:border-gray-200/80 shadow-2xs overflow-hidden flex items-center justify-center p-3 sm:p-6 cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          title={lang === "hi" ? "फोटो बड़ी देखने के लिए क्लिक करें" : "Click to view full photo"}
        >
          {/* Top-Left: Modern floating discount badge */}
          {badge && (
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              {badge}
            </div>
          )}

          {/* Desktop Hover Arrows (if multiple images) */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Previous Image"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next Image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}

          {/* Centered Crisp Product Image (fills nicely with soft rounded corners) */}
          <div className="size-full flex items-center justify-center overflow-hidden">
            <img
              key={activeImage.url}
              src={activeImage.url}
              alt={`${productName} — ${activeImage.label || activeImage.type}`}
              loading={activeIndex === 0 ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
                  target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                }
              }}
              className={`max-h-full max-w-full w-auto h-auto object-contain object-center rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 ease-out select-none drop-shadow-xs ${
                isTransitioning ? "opacity-30 scale-98" : "opacity-100 scale-100"
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. BLINKIT-STYLE CLEAN THUMBNAIL SELECTOR STRIP (Front, Back & Extra) */}
      {hasMultipleImages && (
        <div className="w-full mx-auto pt-1">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 justify-center">
            {safeImages.map((img, idx) => {
              const isSelected = idx === activeIndex;

              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`Select image ${idx + 1}: ${img.label || img.type}`}
                  aria-current={isSelected ? "true" : "false"}
                  className={`group relative shrink-0 cursor-pointer focus:outline-none transition-all`}
                >
                  <div
                    className={`relative size-14 sm:size-16 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center transition-all duration-150 ${
                      isSelected
                        ? "border-2 border-[#145A45] ring-2 ring-[#145A45]/20 shadow-xs scale-105"
                        : "border border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
                          target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                        }
                      }}
                      className="max-h-full max-w-full w-auto h-auto object-contain object-center rounded-lg"
                    />
                  </div>
                </button>
              );
            })}

            {safeImages.length > 4 && (
              <button
                type="button"
                onClick={goToNext}
                className="size-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer ml-0.5"
                aria-label="Next image"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. PURE FULLSCREEN VIEWER (Pure image only, no extra details or toolbars) */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-6 text-white animate-in fade-in duration-200 select-none cursor-pointer"
          role="dialog"
          aria-modal="true"
          aria-label="Product Image Viewer"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Simple Clean Close Button in Top-Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            title="Close"
            aria-label="Close Viewer"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <X className="size-5" />
          </button>

          {/* Previous Arrow if Multiple Images */}
          {hasMultipleImages && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous Image"
              className="absolute left-3 sm:left-6 z-50 flex size-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Pure High-Resolution Center Image */}
          <div
            className="relative max-h-[92vh] max-w-[95vw] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activeImage.url}
              alt={`${productName} — ${activeImage.label || activeImage.type}`}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
                  target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                }
              }}
              className="max-h-[90vh] max-w-[92vw] w-auto h-auto object-contain object-center drop-shadow-2xl rounded-xl sm:rounded-2xl transition-all duration-200"
            />
          </div>

          {/* Next Arrow if Multiple Images */}
          {hasMultipleImages && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next Image"
              className="absolute right-3 sm:right-6 z-50 flex size-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
