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

  useEffect(() => {
    setZoomScale(1);
  }, [activeIndex]);

  function getThumbnailLabel(type: ProductImage["type"], idx: number): string {
    switch (type) {
      case "front":
        return lang === "hi" ? "सामने (Front)" : "Front View";
      case "back":
        return lang === "hi" ? "पीछे (Back)" : "Back View";
      case "detail":
        return lang === "hi" ? "न्यूट्रिशन (Detail)" : "Nutritional Info";
      case "additional":
        return lang === "hi" ? `फोटो ${idx + 1}` : `Photo ${idx + 1}`;
      default:
        return `#${idx + 1}`;
    }
  }

  return (
    <div className={`flex flex-col gap-4 select-none ${className}`}>
      {/* 1. MAIN CLEAN 1:1 SQUARE IMAGE STAGE */}
      <div className="relative w-full max-w-[500px] mx-auto">
        <div
          className="group relative w-full aspect-square rounded-3xl bg-white border border-[#EAE6DC] shadow-sm overflow-hidden flex items-center justify-center p-6 sm:p-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top-Left: Badge only (clean & uncluttered) */}
          {badge && (
            <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
              {badge}
            </div>
          )}

          {/* Top-Right: Clean Zoom / Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            title={lang === "hi" ? "बड़ा करके देखें (ज़ूम)" : "Click to zoom"}
            aria-label="View Fullscreen Image"
            className="absolute top-3.5 right-3.5 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#16201A] shadow-xs border border-[#EAE6DC] transition-all hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 backdrop-blur-xs cursor-pointer"
          >
            <Maximize2 className="size-4" />
          </button>

          {/* Image View Indicator Pill (e.g. Front View / Back View) */}
          {hasMultipleImages && (
            <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-[#145A45] border border-[#EAE6DC] shadow-xs">
              <span
                className={`size-1.5 rounded-full ${
                  activeImage.type === "back"
                    ? "bg-[#D97706]"
                    : activeImage.type === "detail"
                    ? "bg-emerald-600"
                    : "bg-[#145A45]"
                }`}
              />
              <span>{getThumbnailLabel(activeImage.type, activeIndex)}</span>
            </div>
          )}

          {/* Image Counter (e.g. 1 / 3) */}
          {hasMultipleImages && (
            <div className="absolute bottom-3.5 right-3.5 z-20 rounded-full bg-[#16201A]/80 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs pointer-events-none">
              {activeIndex + 1} / {safeImages.length}
            </div>
          )}

          {/* Desktop Hover Arrows */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Previous Image"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-9 items-center justify-center rounded-full bg-white/95 text-[#16201A] shadow-md border border-[#EAE6DC] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next Image"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 hidden sm:flex size-9 items-center justify-center rounded-full bg-white/95 text-[#16201A] shadow-md border border-[#EAE6DC] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#145A45] hover:text-white hover:border-[#145A45] active:scale-95 cursor-pointer"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          {/* Centered Crisp Product Image */}
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="size-full flex items-center justify-center cursor-zoom-in overflow-hidden"
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
              className={`max-h-full max-w-full w-auto h-auto object-contain object-center transition-all duration-200 ease-out select-none drop-shadow-sm ${
                isTransitioning ? "opacity-30 scale-98" : "opacity-100 scale-100"
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. REFINED THUMBNAIL SELECTOR STRIP */}
      {hasMultipleImages && (
        <div className="w-full max-w-[500px] mx-auto">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1 justify-center">
            {safeImages.map((img, idx) => {
              const isSelected = idx === activeIndex;

              return (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`Select image ${idx + 1}: ${img.label || img.type}`}
                  aria-current={isSelected ? "true" : "false"}
                  className={`group relative flex flex-col items-center gap-1.5 shrink-0 cursor-pointer focus:outline-none transition-all`}
                >
                  <div
                    className={`relative size-16 sm:size-18 rounded-2xl overflow-hidden bg-white p-1.5 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "border-2 border-[#145A45] ring-2 ring-[#145A45]/20 shadow-sm scale-105"
                        : "border border-[#EAE6DC] opacity-70 hover:opacity-100 hover:border-[#145A45]/50"
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

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                      isSelected
                        ? "bg-[#145A45] text-white shadow-2xs"
                        : "text-[#5A655F] bg-[#FAF8F2] border border-[#EAE6DC] group-hover:border-[#145A45] group-hover:text-[#145A45]"
                    }`}
                  >
                    {img.type === "front"
                      ? (lang === "hi" ? "सामने" : "Front")
                      : img.type === "back"
                      ? (lang === "hi" ? "पीछे" : "Back")
                      : (lang === "hi" ? "न्यूट्रिशन" : "Nutrition")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FULLSCREEN LIGHTBOX & HIGH-RES VIEWER */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md p-4 sm:p-6 text-white animate-in fade-in duration-200 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Product Image Viewer"
        >
          {/* Lightbox Top Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-white">
                {productName}
              </h3>
              <p className="text-xs text-white/70 flex items-center gap-2 mt-0.5">
                <span>{getThumbnailLabel(activeImage.type, activeIndex)}</span>
                <span>•</span>
                <span>
                  {activeIndex + 1} / {safeImages.length}
                </span>
                {zoomScale > 1 && (
                  <span className="rounded bg-[#E3B341] px-1.5 py-0.5 text-[10px] font-bold text-[#1F2924]">
                    {Math.round(zoomScale * 100)}% Zoomed
                  </span>
                )}
              </p>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(s - 0.5, 1))}
                disabled={zoomScale <= 1}
                title="Zoom Out (-)"
                className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30 cursor-pointer"
              >
                <ZoomOut className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(1)}
                title="Reset Zoom (1x)"
                className="flex h-9 px-2.5 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xs font-mono font-bold text-white transition-all hover:bg-white/20 cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-1" />
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(s + 0.5, 3))}
                disabled={zoomScale >= 3}
                title="Zoom In (+)"
                className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30 cursor-pointer"
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
                className="flex size-9 items-center justify-center rounded-xl bg-red-600/90 text-white transition-all hover:bg-red-600 active:scale-95 ml-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden my-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
                className="max-h-[72vh] max-w-[82vw] w-auto h-auto object-contain object-center drop-shadow-2xl rounded-xl"
              />
            </div>

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
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar pt-2 border-t border-white/10">
              {safeImages.map((img, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={`lb-${img.url}-${idx}`}
                    type="button"
                    onClick={() => goToIndex(idx)}
                    className={`size-14 shrink-0 rounded-xl overflow-hidden bg-white/10 p-1 transition-all cursor-pointer ${
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
