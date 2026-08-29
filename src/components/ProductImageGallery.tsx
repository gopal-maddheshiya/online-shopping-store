import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
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

  // Touch Swipe Handling for Mobile (Safe angle calculation so vertical scroll is undisturbed)
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

    // Detect intentional horizontal swipe (> 35px) while ensuring vertical scroll was not dominant
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

  // Map thumbnail labels concisely
  function getThumbnailLabel(type: ProductImage["type"], idx: number): string {
    switch (type) {
      case "front":
        return lang === "hi" ? "सामने" : "Front";
      case "back":
        return lang === "hi" ? "पीछे" : "Back";
      case "detail":
        return lang === "hi" ? "बारीक" : "Detail";
      case "additional":
        return lang === "hi" ? `फोटो ${idx + 1}` : `Photo ${idx + 1}`;
      default:
        return `#${idx + 1}`;
    }
  }

  return (
    <div className={`flex flex-col gap-3 sm:gap-4 select-none ${className}`}>
      {/* 1. MAIN FIXED 1:1 SQUARE IMAGE FRAME */}
      <div className="relative w-full max-w-[480px] mx-auto">
        {/* Strict 1:1 Aspect Ratio Canvas */}
        <div
          className="group relative w-full aspect-square rounded-2xl bg-white border border-[#E8E4DA] shadow-2xs overflow-hidden flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Custom Discount / Offer Badge (Top-Left) */}
          {badge ? <div className="absolute top-3 left-3 z-20 pointer-events-none">{badge}</div> : null}

          {/* Slot Type Tag (Front View / Back & Nutrition / Detail) */}
          <div
            className={`absolute z-10 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-2xs border border-[#E8E4DA] backdrop-blur-xs transition-opacity duration-150 ${
              badge ? "top-11 left-3" : "top-3 left-3"
            }`}
          >
            <span
              className={`size-1.5 rounded-full shrink-0 ${
                activeImage.type === "front"
                  ? "bg-[#145A45]"
                  : activeImage.type === "back"
                    ? "bg-[#D97706]"
                    : "bg-emerald-600"
              }`}
            />
            <span className="text-[#145A45] tracking-tight">
              {getImageTypeLabel(activeImage.type, lang)}
            </span>
          </div>

          {/* Fullscreen / Zoom Trigger Button (Top-Right) */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            title={lang === "hi" ? "बड़ा करके देखें (ज़ूम)" : "Click to view fullscreen"}
            aria-label="View Fullscreen Image"
            className="absolute top-3 right-3 z-10 flex size-8.5 items-center justify-center rounded-lg bg-white/95 text-[#16201A] shadow-2xs border border-[#E8E4DA] transition-all hover:bg-white hover:text-[#145A45] hover:scale-105 active:scale-95 backdrop-blur-xs cursor-pointer"
          >
            <Maximize2 className="size-3.5" />
          </button>

          {/* Counter Badge for Mobile (Bottom-Right, e.g. 1 / 3) */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 right-3 z-10 rounded-full bg-[#16201A]/85 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white shadow-xs backdrop-blur-xs tracking-wider pointer-events-none">
              {activeIndex + 1} / {safeImages.length}
            </div>
          )}

          {/* Desktop Hover Prev / Next Buttons */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Previous Product Image"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-9 items-center justify-center rounded-full bg-white/95 text-[#16201A] shadow-xs border border-[#E8E4DA] opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-[#145A45] hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="size-4.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next Product Image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-9 items-center justify-center rounded-full bg-white/95 text-[#16201A] shadow-xs border border-[#E8E4DA] opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-[#145A45] hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="size-4.5" />
              </button>
            </>
          )}

          {/* Centered Product Image Container with Strict object-contain & Bounded Safe Padding */}
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="absolute inset-0 p-5 sm:p-7 md:p-8 flex items-center justify-center cursor-zoom-in overflow-hidden"
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

              className={`max-h-full max-w-full w-auto h-auto object-contain object-center transition-opacity duration-150 ease-out select-none ${
                isTransitioning ? "opacity-30" : "opacity-100"
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. UNIFORM SQUARE THUMBNAIL STRIP */}
      {hasMultipleImages && (
        <div className="w-full max-w-[480px] mx-auto">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 justify-start sm:justify-center">
            {safeImages.map((img, idx) => {
              const isSelected = idx === activeIndex;
              const label = getThumbnailLabel(img.type, idx);

              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`Select image ${idx + 1}: ${img.label || img.type}`}
                  aria-current={isSelected ? "true" : "false"}
                  className={`group relative flex flex-col items-center gap-1 shrink-0 cursor-pointer focus:outline-none transition-all`}
                >
                  {/* Thumbnail Box - Strict 1:1 Square */}
                  <div
                    className={`relative size-14 sm:size-16 rounded-xl overflow-hidden bg-white p-1.5 flex items-center justify-center transition-all duration-150 ${
                      isSelected
                        ? "border-2 border-[#145A45] ring-2 ring-[#145A45]/30 shadow-2xs scale-102"
                        : "border border-[#E8E4DA] opacity-75 hover:opacity-100 hover:border-[#145A45]/50"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                      }}

                      className="max-h-full max-w-full w-auto h-auto object-contain object-center"
                    />
                  </div>

                  {/* Clean Mini Badge Tag */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-md transition-colors ${
                      isSelected
                        ? "bg-[#145A45] text-white"
                        : "text-[#5A655F] group-hover:text-[#145A45]"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FULLSCREEN LIGHTBOX & HIGH-RES 3X ZOOM VIEWER */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md p-3 sm:p-6 text-white animate-in fade-in duration-150 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Product Image Fullscreen Viewer"
        >
          {/* Lightbox Top Control Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm sm:text-base font-bold text-white">
                {productName}
              </h3>
              <p className="text-xs text-white/70 flex items-center gap-2">
                <span>{getImageTypeLabel(activeImage.type, lang)}</span>
                <span>•</span>
                <span>
                  {activeIndex + 1} / {safeImages.length}
                </span>
                {zoomScale > 1 && (
                  <span className="rounded bg-[#E3B341] px-1.5 py-0.2 text-[10px] font-bold text-[#1F2924]">
                    {Math.round(zoomScale * 100)}% Zoomed
                  </span>
                )}
              </p>
            </div>

            {/* Zoom Controls */}
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
                <RotateCcw className="size-3.5 mr-1" />
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
                title="Close (Esc)"
                aria-label="Close Lightbox"
                className="flex size-9 items-center justify-center rounded-lg bg-red-600/90 text-white transition-all hover:bg-red-600 active:scale-95 ml-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden my-3"
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

            {/* Centered Scalable Product Image (object-contain with max constraints) */}
            <div
              className="relative max-h-[75vh] max-w-[85vw] flex items-center justify-center transition-transform duration-150"
              style={{
                transform: `scale(${zoomScale})`,
                cursor: zoomScale > 1 ? "grab" : "zoom-in",
              }}
              onClick={() => {
                setZoomScale((s) => (s > 1 ? 1 : 2));
              }}
            >
              <img
                src={activeImage.url}
                alt={`${productName} — ${activeImage.label || activeImage.type}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                }}
                className="max-h-[72vh] max-w-[82vw] w-auto h-auto object-contain object-center drop-shadow-2xl rounded-lg"
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

          {/* Lightbox Bottom Thumbnails */}
          {hasMultipleImages && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/10">
              {safeImages.map((img, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={`lb-${img.url}-${idx}`}
                    type="button"
                    onClick={() => goToIndex(idx)}
                    className={`size-13 sm:size-14 shrink-0 rounded-lg overflow-hidden bg-white/10 p-1 transition-all cursor-pointer ${
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
                      className="max-h-full max-w-full w-auto h-auto object-contain object-center m-auto"
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
