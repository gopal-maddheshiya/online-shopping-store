import React, { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RotatingSearchInputProps {
  term: string;
  setTerm: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  variant?: "desktop" | "mobile";
  ariaLabel?: string;
}

export function RotatingSearchInput({
  term,
  setTerm,
  onSubmit,
  onFocus,
  onBlur,
  variant = "desktop",
  ariaLabel,
}: RotatingSearchInputProps) {
  const { t, lang } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  const suggestions = useMemo(() => {
    return t.searchSuggestions && t.searchSuggestions.length > 0
      ? t.searchSuggestions
      : ["Search groceries..."];
  }, [t.searchSuggestions]);

  // Extended list with cloned first item for infinite seamless loop
  const extendedList = useMemo(() => {
    return [...suggestions, suggestions[0]];
  }, [suggestions]);

  // Reset index when language changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsResetting(true);
    const r = requestAnimationFrame(() => setIsResetting(false));
    return () => cancelAnimationFrame(r);
  }, [lang]);

  // Interval ticker (2.5s per suggestion, 550ms continuous smooth roll)
  useEffect(() => {
    if (isFocused || term.length > 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // If we reached the cloned item at the end of the extended list
        if (next >= suggestions.length) {
          // After the 550ms transition to the clone completes, seamlessly snap back to index 0
          setTimeout(() => {
            setIsResetting(true);
            setCurrentIndex(0);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsResetting(false);
              });
            });
          }, 550);
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isFocused, term.length, suggestions.length]);

  const isDesktop = variant === "desktop";
  const itemHeight = isDesktop ? 22 : 20; // exact pixel height for text line

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <div className="relative flex items-center w-full">
        {/* Front Search Icon */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 flex items-center text-[#145A45] z-10",
            isDesktop ? "left-3.5" : "left-3"
          )}
        >
          <Search className={isDesktop ? "size-4.5 text-[#145A45]" : "size-4 text-[#145A45]"} />
        </div>

        <Input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder=""
          aria-label={ariaLabel || (isDesktop ? "Search grocery items" : "Mobile search")}
          className={cn(
            "w-full rounded-xl border border-[#E0DCD2] bg-[#FAF8F2] text-[#16201A] placeholder:text-transparent hover:border-[#145A45]/40 focus-visible:border-[#145A45] focus-visible:ring-2 focus-visible:ring-[#145A45]/20 transition-all shadow-2xs font-medium",
            isDesktop
              ? "h-11 pl-10.5 pr-9 text-[13px] sm:text-sm"
              : "h-10 pl-9.5 pr-8 text-[13px]"
          )}
        />

        {/* Animated Sliding Placeholder Overlay */}
        {!isFocused && term.length === 0 && (
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center overflow-hidden select-none",
              isDesktop ? "left-10.5 right-4 text-[13px] sm:text-sm" : "left-9.5 right-3 text-[13px]"
            )}
          >
            <div
              className="relative w-full overflow-hidden"
              style={{ height: `${itemHeight}px` }}
            >
              <div
                className="flex flex-col will-change-transform"
                style={{
                  transform: `translateY(-${currentIndex * itemHeight}px)`,
                  transition: isResetting
                    ? "none"
                    : "transform 550ms cubic-bezier(0.65, 0, 0.35, 1)",
                }}
              >
                {extendedList.map((text, idx) => (
                  <div
                    key={`${lang}-${idx}`}
                    className="flex items-center truncate text-[#5A655F]"
                    style={{ height: `${itemHeight}px` }}
                  >
                    <span className="truncate">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clear Button on the Right */}
        {term.trim() ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            className={cn(
              "absolute inset-y-0 flex items-center justify-center text-[#5A655F] hover:text-[#16201A] hover:bg-black/5 rounded-lg transition-all cursor-pointer",
              isDesktop ? "right-2.5 size-7 my-auto" : "right-2 size-6 my-auto"
            )}
            aria-label="Clear search"
          >
            <X className={isDesktop ? "size-3.5" : "size-3"} />
          </button>
        ) : null}
      </div>
    </form>
  );
}
