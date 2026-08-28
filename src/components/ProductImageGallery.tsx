import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { getImageTypeLabel } from "@/lib/product-images";
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
  const [zoomScale, setZoomScale] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Safe fallback if images array is empty
  const safeImages: ProductImage[] =
    images && images.length > 0
      ? images
      : [{ url: "/images/packaged.jpg", type: "front", label: "Front View", sort_order: 0 }];

  const activeImage = safeImages[activeIndex] || safeImages[0]!;
  const hasMultipleImages = safeImages.length > 1;

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

    // Detect intentional horizontal swipe (> 40px) while ensuring user wasn't just scrolling vertically
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // Swiped Left -> Next Image
        goToNext();
      } else {
        // Swiped Right -> Prev Image
        goToPrev();
      }
    }
  }

  const goToIndex = useCallback((index: number) => {
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 150);
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  }, [safeImages.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomScale(1);
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "+" || e.key === "=") {
        setZoomScale((s) => Math.min(s + 0.5, 3));
      } else if (e.key === "-") {
        setZoomScale((s) => Math.max(s - 0.5, 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    // Prevent background body scroll when Lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isLightboxOpen, goToNext, goToPrev]);

  // Reset zoom scale when switching image in lightbox
  useEffect(() => {
    setZoomScale(1);
  }, [activeIndex]);

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {/* Main Image Container */}
      <div
        className="card-base group relative aspect-square w-full max-w-[460px] mx-auto overflow-hidden rounded-2xl bg-[#FAF8F2] border border-[#E5E0D5] p-6 sm:p-8 shadow-xs flex items-center justify-center select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Optional Custom Top Badge */}
        {badge ? <div className="absolute top-3 left-3 z-10">{badge}</div> : null}

        {/* Image Type Indicator Tag (e.g. Front View, Back & Nutrition, Detail) */}
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0F4A38] shadow-2xs border border-[#E5E0D5] backdrop-blur-xs">
          <span
            className={`size-1.5 rounded-full ${
              activeImage.type === "front"
                ? "bg-[#145A45]"
                : activeImage.type === "back"
                  ? "bg-[#D97706]"
                  : "bg-emerald-600"
            }`}
          />
          <span>{getImageTypeLabel(activeImage.type, lang)}</span>
        </div>

        {/* Fullscreen / Zoom Trigger Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          title={lang === "hi" ? "बड़ा करके देखें (ज़ूम)" : "Click to view fullscreen"}
          aria-label="View Fullscreen Image"
          className="absolute top-3.5 right-3.5 z-10 flex size-9 items-center justify-center rounded-lg bg-white/90 text-[#16201A] shadow-2xs border border-[#E5E0D5] transition-all hover:bg-white hover:text-[#145A45] hover:scale-105 active:scale-95 backdrop-blur-xs cursor-pointer"
        >
          <Maximize2 className="size-4" />
        </button>

        {/* Mobile / Screen Counter Badge (e.g. 1 / 3) */}
        {hasMultipleImages && (
          <div className="absolute bottom-3.5 right-3.5 z-10 rounded-full bg-[#16201A]/80 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
            {activeIndex + 1} / {safeImages.length}
          </div>
        )}

        {/* Prev / Next Chevrons on Hover (Desktop & Tablet) */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous Product Image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-8 items-center justify-center rounded-full bg-white/90 text-[#16201A] shadow-xs border border-[#E5E0D5] opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next Product Image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-8 items-center justify-center rounded-full bg-white/90 text-[#16201A] shadow-xs border border-[#E5E0D5] opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}

        {/* Active Product Image */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="size-full flex items-center justify-center cursor-zoom-in"
        >
          <img
            key={activeImage.url}
            src={activeImage.url}
            alt={`${productName} — ${activeImage.label || activeImage.type}`}
            loading={activeIndex === 0 ? "eager" : "lazy"}
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/packaged.jpg";
            }}
            className={`size-full max-h-[380px] object-contain object-center transition-all duration-200 ${
              isTransitioning ? "opacity-40 scale-95" : "opacity-100 scale-100"
            } hover:scale-105`}
          />
        </div>
      </div>

      {/* Thumbnail Strip (Rendered if product has multiple images) */}
      {hasMultipleImages && (
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 max-w-[460px] mx-auto w-full px-0.5">
          {safeImages.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${img.url}-${idx}`}
                type="button"
                onClick={() => goToIndex(idx)}
                aria-label={`Select product image ${idx + 1}: ${img.label || img.type}`}
                aria-current={isSelected ? "true" : "false"}
                className={`relative size-16 shrink-0 rounded-xl overflow-hidden bg-white border p-1 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-[#145A45] ring-2 ring-[#145A45] shadow-xs scale-102"
                    : "border-[#E5E0D5] opacity-70 hover:opacity-100 hover:border-[#145A45]/40"
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                  }}
                  className="size-full object-contain object-center"
                />

                {/* Subtle Mini Type Tag */}
                <span className="absolute bottom-0.5 inset-x-0.5 text-center text-[8px] font-bold uppercase tracking-tight text-[#0F4A38] bg-white/90 rounded-xs py-0.2 truncate border border-[#E5E0D5]/50">
                  {img.type === "front"
                    ? "Front"
                    : img.type === "back"
                      ? "Back"
                      : img.type === "detail"
                        ? "Detail"
                        : `#${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox & Interactive Zoom Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md p-4 sm:p-6 text-white animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Product Image Lightbox"
        >
          {/* Lightbox Header Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm sm:text-base font-bold text-white">
                {productName}
              </h3>
              <p className="text-xs text-white/70">
                {getImageTypeLabel(activeImage.type, lang)} • {activeIndex + 1} of {safeImages.length}
              </p>
            </div>

            {/* Lightbox Controls: Zoom Out, Reset, Zoom In, Close */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(s - 0.5, 1))}
                disabled={zoomScale <= 1}
                title="Zoom Out (-)"
                className="flex size-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ZoomOut className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(1)}
                title="Reset Zoom (1x)"
                className="flex h-9 px-2.5 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xs font-mono font-bold text-white transition-all hover:bg-white/20 cursor-pointer"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(s + 0.5, 3))}
                disabled={zoomScale >= 3}
                title="Zoom In (+)"
                className="flex size-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ZoomIn className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomScale(1);
                }}
                title="Close Fullscreen (Esc)"
                aria-label="Close Lightbox"
                className="flex size-9 items-center justify-center rounded-lg bg-red-600/80 text-white transition-all hover:bg-red-600 active:scale-95 ml-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden my-3 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Prev Navigation Button */}
            {hasMultipleImages && (
              <button
                type="button"
                onClick={goToPrev}
                aria-label="Previous Image"
                className="absolute left-2 sm:left-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/40 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Scalable Fullscreen Image */}
            <div
              className="relative max-h-[75vh] max-w-[85vw] flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoomScale})`,
                cursor: zoomScale > 1 ? "grab" : "zoom-in",
              }}
              onClick={() => {
                // Double-click/toggle zoom
                setZoomScale((s) => (s > 1 ? 1 : 2));
              }}
            >
              <img
                src={activeImage.url}
                alt={`${productName} — ${activeImage.label || activeImage.type}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                }}
                className="max-h-[72vh] max-w-[82vw] object-contain drop-shadow-2xl rounded-lg"
              />
            </div>

            {/* Next Navigation Button */}
            {hasMultipleImages && (
              <button
                type="button"
                onClick={goToNext}
                aria-label="Next Image"
                className="absolute right-2 sm:right-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/40 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Bar */}
          {hasMultipleImages && (
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar pt-2 border-t border-white/10">
              {safeImages.map((img, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={`lb-${img.url}-${idx}`}
                    type="button"
                    onClick={() => goToIndex(idx)}
                    className={`size-14 shrink-0 rounded-lg overflow-hidden bg-white/10 p-1 transition-all cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#E3B341] ring-2 ring-[#E3B341]/50 scale-105 bg-white/20"
                        : "border border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                      }}
                      className="size-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
