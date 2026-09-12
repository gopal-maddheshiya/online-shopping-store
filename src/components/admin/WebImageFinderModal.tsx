import { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Link as LinkIcon,
  Check,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { searchWebProductImages, type WebImageResult } from "@/lib/web-image-search";

interface WebImageFinderModalProps {
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl || "");
  const [customUrl, setCustomUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && productName) {
      setQuery(productName);
      setSelectedUrl(currentImageUrl || "");
      void handleSearch(productName);
    }
  }, [isOpen, productName]);

  async function handleSearch(termToSearch?: string) {
    const q = (termToSearch !== undefined ? termToSearch : query).trim();
    if (!q) {
      toast.error("कृपया कोई सामान या ब्रांड का नाम लिखें।");
      return;
    }

    setIsLoading(true);
    try {
      const items = await searchWebProductImages(q);
      setResults(items);
      if (items.length === 0) {
        toast.info("इंटरनेट पर कोई सीधी फोटो नहीं मिली। आप नीचे सीधा इमेज लिंक पेस्ट कर सकते हैं।");
      }
    } catch (err) {
      console.warn("Web image search failed:", err);
      toast.error("वेब फोटो सर्च में समस्या आई।");
    } finally {
      setIsLoading(false);
    }
  }

  function handleApplyCustomUrl() {
    const clean = customUrl.trim();
    if (!clean || (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/"))) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-0 rounded-3xl border-[#E8E4DA] bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E8E4DA] bg-gradient-to-r from-[#FAF8F2] via-white to-[#F0F5F2] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-sans text-base sm:text-lg font-bold text-[#1F2924] flex items-center gap-2">
                <span className="size-7 rounded-lg bg-[#145A45] text-white flex items-center justify-center shadow-xs">
                  <Globe className="size-4" />
                </span>
                वेब से प्रोडक्ट फोटो खोजें (Auto Web Image Finder)
              </DialogTitle>
              <p className="text-xs text-[#5A655F] mt-1">
                इंटरनेट से असली किराना फोटो चुनें या किसी भी वेबसाइट से इमेज लिंक पेस्ट करें।
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B746F]" />
              <Input
                placeholder="सर्च करें (उदा. Tata Salt, Fortune Oil, Basmati Rice)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 h-10 text-xs rounded-xl border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white"
              />
            </div>
            <Button
              type="button"
              disabled={isLoading || !query.trim()}
              onClick={() => handleSearch()}
              className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-10 px-4 text-xs gap-1.5 shadow-xs"
            >
              {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
              फोटो खोजें
            </Button>
          </div>

          {/* Results Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#5A655F]">
              <span className="font-bold">
                उपलब्ध फोटो ({results.length}) — जो पसंद आए उस पर क्लिक करें:
              </span>
              {selectedUrl && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="size-3.5" /> 1 फोटो चुनी गई
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-[#6B746F] space-y-2">
                <Loader2 className="size-8 animate-spin mx-auto text-[#145A45]" />
                <p>इंटरनेट से असली फोटो ढूंढी जा रही हैं...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-[#E8E4DA] bg-[#FAF8F2]/40 text-xs text-[#6B746F] space-y-2">
                <ImageIcon className="size-8 mx-auto text-stone-300" />
                <p className="font-bold text-[#1F2924]">कोई सीधी फोटो नहीं मिली</p>
                <p className="text-[11px]">
                  सर्च नाम बदलें (उदा. केवल "Mustard oil" या "Salt") या नीचे सीधा Google Images / Blinkit से लिंक पेस्ट करें।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                {results.map((img) => {
                  const isSelected = selectedUrl === img.url;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedUrl(img.url)}
                      className={`group relative rounded-2xl border-2 p-2 text-left transition-all bg-white flex flex-col items-center justify-center overflow-hidden hover:shadow-md ${
                        isSelected
                          ? "border-[#145A45] ring-2 ring-[#145A45]/20 bg-emerald-50/20"
                          : "border-[#E8E4DA] hover:border-[#145A45]/40"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-xl bg-[#FAF8F2] flex items-center justify-center overflow-hidden p-1">
                        <img
                          src={img.thumbnail}
                          alt={img.title}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="w-full mt-1.5 px-0.5 flex items-center justify-between">
                        <span className="text-[10px] text-[#6B746F] truncate" title={img.title}>
                          {img.source}
                        </span>
                        {isSelected && (
                          <span className="size-4 rounded-full bg-[#145A45] text-white flex items-center justify-center">
                            <Check className="size-2.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manual Option: Paste Any Direct Web Image Link */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-3.5 space-y-2">
            <label className="text-[11px] font-bold text-[#1F2924] flex items-center gap-1.5">
              <LinkIcon className="size-3.5 text-[#145A45]" />
              या किसी भी वेबसाइट (Google / Blinkit / BigBasket / Amazon) से सीधा फोटो लिंक डालें:
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://... इमेज URL यहाँ पेस्ट करें"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white border-[#E8E4DA]"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!customUrl.trim()}
                onClick={handleApplyCustomUrl}
                className="rounded-xl text-xs h-9 font-bold border-[#145A45]/30 text-[#145A45] hover:bg-[#145A45]/10 shrink-0"
              >
                ✓ लिंक लगाएं
              </Button>
            </div>
            <p className="text-[10px] text-[#6B746F]">
              टिप: Google Images या Blinkit पर फोटो पर राइट-क्लिक करें और "Copy Image Address" दबाकर यहाँ पेस्ट कर दें।
            </p>
          </div>

          {/* Currently Selected Preview */}
          {selectedUrl && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <img
                src={selectedUrl}
                alt="Selected"
                className="size-12 rounded-lg object-contain bg-white border border-emerald-200 p-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-950">यह फोटो चुनी गई है</p>
                <p className="text-[10px] text-emerald-800 truncate">{selectedUrl}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E4DA] bg-[#FAF8F2]/80 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold text-[#5A655F]"
          >
            रद्द करें (Cancel)
          </Button>

          <Button
            type="button"
            disabled={!selectedUrl}
            onClick={handleConfirm}
            className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-10 px-6 shadow-xs gap-1.5"
          >
            <Check className="size-4" /> ✓ यह फोटो लगाएं
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
