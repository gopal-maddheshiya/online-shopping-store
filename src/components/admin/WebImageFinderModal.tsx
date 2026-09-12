import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Globe,
  Link as LinkIcon,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { searchWebProductImages, type WebImageResult } from "../../lib/web-image-search";
import { sanitizeGroceryQuery } from "../../lib/server-image-search";

export interface WebImageFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  currentImageUrl?: string | null;
  onSelectImage: (imageUrl: string) => void;
}

export function WebImageFinderModal({
  isOpen,
  onClose,
  productName,
  currentImageUrl,
  onSelectImage,
}: WebImageFinderModalProps) {
  const [query, setQuery] = useState(productName || "");
  const [results, setResults] = useState<WebImageResult[]>([]);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl || "");
  const [customUrl, setCustomUrl] = useState<string>("");

  const handleSearch = useCallback(
    async (termToSearch?: string) => {
      const rawQ = (termToSearch !== undefined ? termToSearch : query).trim();
      if (!rawQ) {
        toast.error("कृपया कोई सामान या ब्रांड का नाम लिखें।");
        return;
      }

      setIsLoading(true);
      setFailedImageIds(new Set());
      try {
        const items = await searchWebProductImages(rawQ);
        setResults(items);
        if (items.length === 0) {
          toast.info(
            "इंटरनेट पर कोई सीधी फोटो नहीं मिली। आप नीचे दिए गए सुझाव चिप्स आज़माएं या लिंक पेस्ट करें।",
          );
        } else {
          toast.success(`${items.length} असली वेब फोटो मिलीं!`);
        }
      } catch (err) {
        console.warn("Web image search failed:", err);
        toast.error("वेब फोटो सर्च में समस्या आई।");
      } finally {
        setIsLoading(false);
      }
    },
    [query],
  );

  // When opening, automatically sanitize noisy names (e.g. 'Generic Big Raisins Munakka' -> 'Munakka')
  useEffect(() => {
    if (isOpen && productName) {
      const { cleanWord } = sanitizeGroceryQuery(productName);
      const initialTerm = cleanWord || productName;
      setQuery(initialTerm);
      setSelectedUrl(currentImageUrl || "");
      setFailedImageIds(new Set());
      setCustomUrl("");
      void handleSearch(initialTerm);
    }
  }, [isOpen, productName, currentImageUrl, handleSearch]);

  // Contextual smart suggestions based on product nature
  const contextualChips = useMemo(() => {
    const raw = (productName || query || "").trim();
    const { cleanWord } = sanitizeGroceryQuery(raw);
    const lower = raw.toLowerCase();
    const chips: string[] = [];

    if (cleanWord) chips.push(cleanWord);
    if (cleanWord) chips.push(`${cleanWord} packet`);

    if (
      lower.includes("oil") ||
      lower.includes("tel") ||
      lower.includes("ghani") ||
      lower.includes("sarso")
    ) {
      chips.push("Kacchi Ghani 1L", "Mustard Oil bottle", "1L pouch", "5L can");
    } else if (
      lower.includes("munakka") ||
      lower.includes("kaju") ||
      lower.includes("badam") ||
      lower.includes("raisin") ||
      lower.includes("anjeer") ||
      lower.includes("pista")
    ) {
      chips.push("Dry Fruit packet", "250g pack", "500g pouch");
    } else if (
      lower.includes("dal") ||
      lower.includes("daal") ||
      lower.includes("chana") ||
      lower.includes("rajma") ||
      lower.includes("matar")
    ) {
      chips.push("1kg packet", "Tata Sampann", "Desi unpolished");
    } else if (
      lower.includes("masala") ||
      lower.includes("mirch") ||
      lower.includes("haldi") ||
      lower.includes("dhaniya") ||
      lower.includes("jeera") ||
      lower.includes("elaichi")
    ) {
      chips.push("Everest Masala", "Catch Spices", "100g pack");
    } else if (lower.includes("chini") || lower.includes("sugar")) {
      chips.push("Sugar 1kg", "Sugar 5kg", "Madhur Sugar");
    } else {
      chips.push("1kg packet", "Grocery pack", "Branded");
    }

    return Array.from(new Set(chips)).slice(0, 5);
  }, [productName, query]);

  function handleChipClick(chipText: string) {
    setQuery(chipText);
    void handleSearch(chipText);
  }

  function handleApplyCustomUrl() {
    const clean = customUrl.trim();
    if (
      !clean ||
      (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/"))
    ) {
      toast.error("कृपया कोई मान्य इमेज लिंक (URL) डालें।");
      return;
    }
    setSelectedUrl(clean);
    toast.success("कस्टम फोटो लिंक चुन लिया गया!");
  }

  function handleConfirm() {
    if (!selectedUrl) {
      toast.error("कृपया कोई एक फोटो चुनें या लिंक पेस्ट करें।");
      return;
    }
    onSelectImage(selectedUrl);
    toast.success("फोटो सफलतापूर्वक सेट हो गई!");
    onClose();
  }

  // Filter out any broken hotlinked images dynamically
  const visibleResults = useMemo(() => {
    return results.filter((img) => !failedImageIds.has(img.id));
  }, [results, failedImageIds]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 rounded-3xl border-[#E8E4DA] bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E8E4DA] bg-gradient-to-r from-[#FAF8F2] via-white to-[#F0F5F2] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-sans text-base sm:text-lg font-bold text-[#1F2924] flex items-center gap-2">
                <span className="size-7 rounded-lg bg-[#145A45] text-white flex items-center justify-center shadow-xs">
                  <Globe className="size-4" />
                </span>
                वेब से असली प्रोडक्ट फोटो खोजें (Auto Web Image Finder)
              </DialogTitle>
              <p className="text-xs text-[#5A655F] mt-1">
                गूगल और ई-कॉमर्स (Flipkart, Amazon, Blinkit) से 50+ लाइव पैकेजिंग फोटो में से चुनें।
              </p>
              {productName && (
                <p className="text-[11px] text-[#8C7A5B] font-medium mt-0.5 truncate">
                  उत्पाद: <span className="text-[#1F2924] font-semibold">{productName}</span>
                </p>
              )}
            </div>

            {visibleResults.length > 0 && (
              <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold shrink-0">
                <Sparkles className="size-3.5 text-emerald-700" />
                {visibleResults.length} वेब फोटो उपलब्ध
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Search Bar & Smart Dynamic Modifiers */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B746F]" />
                <Input
                  placeholder="सर्च करें (उदा. Munakka, Tata Salt, Fortune Oil, Basmati Rice)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 h-11 text-xs sm:text-sm rounded-xl border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white focus:ring-2 focus:ring-[#145A45]/20"
                />
              </div>
              <Button
                type="button"
                disabled={isLoading || !query.trim()}
                onClick={() => handleSearch()}
                className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-11 px-5 text-xs sm:text-sm gap-2 shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                <span>खोजें (50+ फोटो)</span>
              </Button>
            </div>

            {/* Smart Contextual Search Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <span className="text-[#6B746F] shrink-0 font-medium mr-1">स्मार्ट सुझाव:</span>
              {contextualChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`rounded-lg border px-2.5 py-1 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    query.toLowerCase() === chip.toLowerCase()
                      ? "bg-[#145A45] text-white border-[#145A45]"
                      : "bg-[#FAF8F2] hover:bg-[#E6EFE8] border-[#E0D9CB] hover:border-[#145A45]/30 text-[#145A45]"
                  }`}
                >
                  🔍 {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#5A655F]">
              <span className="font-bold">
                {isLoading
                  ? "वेब से फोटो लोड हो रही हैं..."
                  : `फोटो ग्रिड (${visibleResults.length}) — जो फोटो पसंद आए उस पर क्लिक करें:`}
              </span>
              {selectedUrl && (
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="size-3.5" /> 1 फोटो चुनी गई
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-xs text-[#6B746F] space-y-3 bg-[#FAF8F2]/30 rounded-2xl border border-dashed border-[#E8E4DA]">
                <Loader2 className="size-9 animate-spin mx-auto text-[#145A45]" />
                <p className="font-bold text-[#1F2924]">
                  इंटरनेट से 50+ असली प्रोडक्ट पैकेजिंग फोटो खोजी जा रही हैं...
                </p>
                <p className="text-[11px] text-[#5A655F]">
                  Flipkart, Amazon, BigBasket और Blinkit से सटीक तस्वीरें इकट्ठा की जा रही हैं।
                </p>
              </div>
            ) : visibleResults.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[#E8E4DA] bg-[#FAF8F2]/40 text-xs text-[#6B746F] space-y-3">
                <ImageIcon className="size-10 mx-auto text-stone-300" />
                <p className="font-bold text-[#1F2924] text-sm">इस नाम से सीधी फोटो नहीं मिली</p>
                <p className="text-[11px] max-w-md mx-auto text-[#5A655F]">
                  ऊपर <strong>स्मार्ट सुझाव</strong> वाले किसी भी बटन (जैसे:{" "}
                  {contextualChips
                    .slice(0, 2)
                    .map((c) => `"${c}"`)
                    .join(" या ")}
                  ) पर क्लिक करें, अथवा नीचे सीधा Google Images से लिंक पेस्ट करें।
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {contextualChips.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChipClick(c)}
                      className="rounded-lg bg-emerald-700 text-white text-xs px-3 py-1 font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      🔍 "{c}" से खोजें
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[52vh] overflow-y-auto p-1.5 rounded-2xl bg-[#FAF8F2]/30 border border-[#E8E4DA]/60">
                {visibleResults.map((img) => {
                  const isSelected = selectedUrl === img.url;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setSelectedUrl(img.url)}
                      onDoubleClick={() => {
                        setSelectedUrl(img.url);
                        onSelectImage(img.url);
                        toast.success("फोटो सफलतापूर्वक चुन ली गई!");
                        onClose();
                      }}
                      className={`group relative rounded-2xl border-2 p-2 text-left transition-all bg-white flex flex-col items-center justify-between overflow-hidden cursor-pointer hover:shadow-md ${
                        isSelected
                          ? "border-[#145A45] ring-2 ring-[#145A45]/30 bg-emerald-50/30"
                          : "border-[#E8E4DA] hover:border-[#145A45]/50"
                      }`}
                    >
                      {/* Image Preview Box */}
                      <div className="w-full aspect-square rounded-xl bg-[#FAF8F2] flex items-center justify-center overflow-hidden p-1.5 relative">
                        <img
                          src={img.thumbnail}
                          alt={img.title}
                          loading="lazy"
                          onError={() => {
                            setFailedImageIds((prev) => new Set(prev).add(img.id));
                          }}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-[#145A45] text-white flex items-center justify-center shadow-md">
                            <Check className="size-3" />
                          </div>
                        )}
                      </div>

                      {/* Info & Source */}
                      <div className="w-full mt-2 px-0.5 flex items-center justify-between gap-1">
                        <span
                          className="text-[10px] font-semibold text-[#5A655F] truncate max-w-[85%]"
                          title={img.title}
                        >
                          {img.source || "वेब"}
                        </span>
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="बड़ी फोटो नई विंडो में देखें"
                          className="text-stone-400 hover:text-[#145A45] transition-colors"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Link Paste Option */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/70 p-3.5 space-y-2.5">
            <label className="text-xs font-bold text-[#1F2924] flex items-center gap-1.5">
              <LinkIcon className="size-3.5 text-[#145A45]" />
              या किसी भी वेबसाइट (Google Images / Blinkit / BigBasket) से सीधा फोटो लिंक डालें:
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://... इमेज URL यहाँ पेस्ट करें"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="h-10 text-xs rounded-xl bg-white border-[#E8E4DA]"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!customUrl.trim()}
                onClick={handleApplyCustomUrl}
                className="rounded-xl text-xs h-10 font-bold border-[#145A45]/30 text-[#145A45] hover:bg-[#145A45]/10 shrink-0 cursor-pointer"
              >
                ✓ लिंक चुनें
              </Button>
            </div>
            <p className="text-[11px] text-[#6B746F]">
              💡 <strong>टिप:</strong> Google Images या किसी भी वेबसाइट पर फोटो पर राइट-क्लिक करें,
              &ldquo;Copy Image Address&rdquo; (इमेज लिंक कॉपी) दबाएं और यहाँ पेस्ट कर दें।
            </p>
          </div>

          {/* Currently Selected Live Preview Card */}
          {selectedUrl && (
            <div className="flex items-center gap-3.5 p-3 rounded-2xl border-2 border-[#145A45]/30 bg-emerald-50/40">
              <div className="size-14 rounded-xl bg-white border border-emerald-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img
                  src={selectedUrl}
                  alt="Selected"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-[#145A45]" /> यह फोटो प्रोडक्ट के लिए चुनी
                  गई है
                </p>
                <p className="text-[10px] text-emerald-800 truncate mt-0.5">{selectedUrl}</p>
              </div>
              <Button
                type="button"
                onClick={handleConfirm}
                className="rounded-xl font-bold bg-[#145A45] hover:bg-[#0E4333] text-white text-xs h-9 px-4 shrink-0 shadow-xs cursor-pointer"
              >
                ✓ यह फोटो लगाएं
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E4DA] bg-[#FAF8F2]/90 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold text-[#5A655F] cursor-pointer"
          >
            रद्द करें (Cancel)
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="rounded-xl text-xs font-semibold border-[#D5CEBF] text-[#1F2924] h-10 px-3.5 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              पुनः खोजें (Refresh)
            </Button>

            <Button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-10 px-6 shadow-xs gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="size-4" /> ✓ यह फोटो लगाएं
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WebImageFinderModal;
