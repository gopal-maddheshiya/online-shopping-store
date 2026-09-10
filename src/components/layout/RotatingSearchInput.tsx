import { useState, useEffect, useMemo } from "react";
import { Search, X, Mic, PhoneCall } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { VoiceSearchModal } from "@/components/layout/VoiceSearchModal";

interface RotatingSearchInputProps {
  term: string;
  setTerm: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVoiceSearch?: (val: string) => void;
  onPhoneClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  variant?: "desktop" | "mobile";
  ariaLabel?: string;
}

export function RotatingSearchInput({
  term,
  setTerm,
  onSubmit,
  onVoiceSearch,
  onPhoneClick,
  onFocus,
  onBlur,
  variant = "desktop",
  ariaLabel,
}: RotatingSearchInputProps) {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

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

  // Interval ticker: 2.0s stationary reading pause + 1200ms gentle gliding transition = 3200ms cycle
  useEffect(() => {
    if (isFocused || term.length > 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // If we reached the cloned item at the end of the extended list
        if (next >= suggestions.length) {
          // After the 1200ms transition to the clone completes, seamlessly snap back to index 0
          setTimeout(() => {
            setIsResetting(true);
            setCurrentIndex(0);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsResetting(false);
              });
            });
          }, 1200);
        }
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isFocused, term.length, suggestions.length]);

  function handleVoiceSearch(spokenQuery: string) {
    const clean = spokenQuery.trim();
    if (!clean) return;
    setTerm(clean);
    if (onVoiceSearch) {
      onVoiceSearch(clean);
    } else {
      void navigate({ to: "/shop", search: { q: clean } as never });
    }
  }

  const isDesktop = variant === "desktop";
  // Full height of input box: h-11.5 = 46px on desktop, h-10.5 = 42px on mobile
  const itemHeight = isDesktop ? 46 : 42;

  return (
    <>
      <form onSubmit={onSubmit} className="relative w-full">
        <div className="relative flex items-center w-full">
          {/* Front Search Icon (Bold, Punchy & Clickable) */}
          <button
            type="submit"
            aria-label="Search"
            title={lang === "hi" ? "खोजें" : "Search"}
            className={cn(
              "absolute inset-y-0 my-auto flex items-center justify-center text-[#145A45] hover:text-[#0A3628] active:scale-90 transition-all z-10 cursor-pointer",
              isDesktop ? "left-2.5 size-8.5" : "left-2 size-8"
            )}
          >
            <Search
              className={cn(
                "text-[#145A45] drop-shadow-[0_1px_1px_rgba(20,90,69,0.15)]",
                isDesktop ? "size-5" : "size-4.5"
              )}
              strokeWidth={2.5}
            />
          </button>

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
              "w-full rounded-full border border-[#DCD7CB] bg-white text-[#16201A] placeholder:text-transparent hover:border-[#145A45]/50 focus:bg-white focus-visible:border-[#145A45] focus-visible:ring-2 focus-visible:ring-[#145A45]/20 transition-all shadow-xs hover:shadow-sm font-medium",
              isDesktop
                ? (onPhoneClick ? "h-11.5 pl-11.5 pr-26 text-[13.5px]" : "h-11.5 pl-11.5 pr-22 text-[13.5px]")
                : (onPhoneClick ? "h-10.5 pl-10 pr-22 text-[12.5px]" : "h-10.5 pl-10 pr-18 text-[12.5px]")
            )}
          />

          {/* Animated Sliding Placeholder Overlay */}
          {!isFocused && term.length === 0 && (
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 flex items-center overflow-hidden select-none",
                isDesktop
                  ? (onPhoneClick ? "left-11.5 right-26 text-[13.5px]" : "left-11.5 right-22 text-[13.5px]")
                  : (onPhoneClick ? "left-10 right-22 text-[12.5px]" : "left-10 right-18 text-[12.5px]")
              )}
            >
              <div
                className="relative w-full h-full overflow-hidden"
                style={{ height: `${itemHeight}px` }}
              >
                <div
                  className="flex flex-col will-change-transform"
                  style={{
                    transform: `translateY(-${currentIndex * itemHeight}px)`,
                    transition: isResetting
                      ? "none"
                      : "transform 1200ms cubic-bezier(0.2, 0.9, 0.3, 1)",
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

          {/* Right Action Icons (Clear Button + Divider + Mic + Phone Order) */}
          <div className="absolute right-2 inset-y-0 flex items-center gap-1 sm:gap-1.5">
            {/* Clear Input Button */}
            {term.trim() ? (
              <button
                type="button"
                onClick={() => setTerm("")}
                className={cn(
                  "flex items-center justify-center text-[#5A655F] hover:text-[#16201A] hover:bg-black/5 rounded-full transition-all cursor-pointer",
                  isDesktop ? "size-7" : "size-6"
                )}
                aria-label="Clear search"
              >
                <X className={isDesktop ? "size-3.5" : "size-3"} />
              </button>
            ) : null}

            {/* Mic Vertical Divider */}
            <span className={cn("w-px bg-[#E5E0D5]", isDesktop ? "h-5" : "h-4")} />

            {/* Microphone Voice Search Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVoiceOpen(true);
              }}
              title={lang === "hi" ? "बोलकर खोजें (वॉयस सर्च)" : "Voice Search"}
              aria-label="Voice Search"
              className={cn(
                "flex items-center justify-center rounded-full text-[#145A45] hover:text-[#0A3628] hover:bg-black/5 active:scale-90 transition-all cursor-pointer",
                isDesktop ? "size-8.5" : "size-8"
              )}
            >
              <Mic className={isDesktop ? "size-4.5" : "size-4"} />
            </button>

            {/* Phone Order Direct Button */}
            {onPhoneClick && (
              <>
                <span className={cn("w-px bg-[#E5E0D5]", isDesktop ? "h-5" : "h-4")} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPhoneClick();
                  }}
                  title={lang === "hi" ? "फोन पर ऑर्डर करें" : "Order on Call"}
                  aria-label="Phone Order"
                  className={cn(
                    "flex items-center justify-center rounded-full text-[#145A45] hover:text-[#0A3628] hover:bg-black/5 active:scale-90 transition-all cursor-pointer",
                    isDesktop ? "size-8.5" : "size-8"
                  )}
                >
                  <PhoneCall className={isDesktop ? "size-4" : "size-3.5"} />
                </button>
              </>
            )}
          </div>
        </div>
      </form>

      {/* Voice Search Listening Modal */}
      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSearch={handleVoiceSearch}
      />
    </>
  );
}
