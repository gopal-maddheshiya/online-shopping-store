import { useState, useRef } from "react";
import {
  Sparkles,
  Camera,
  Upload,
  Mic,
  MicOff,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Layers,
  Store,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { inr } from "@/lib/format";
import type { Category, Product } from "@/lib/queries";
import { getProductImage } from "@/lib/product-images";
import { WebImageFinderModal } from "./WebImageFinderModal";
import {
  parseSupplierBillWithGemini,
  generateCleanSlug,
  type ParsedAiProduct,
  type ParsedAiProductVariant,
} from "@/lib/gemini-admin";

interface AdminAiProductAdderProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  existingProducts: Product[];
  onSuccess: () => void;
}

export function AdminAiProductAdder({
  isOpen,
  onClose,
  categories,
  existingProducts,
  onSuccess,
}: AdminAiProductAdderProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Active input mode: "invoice" | "voice" | "text"
  const [activeTab, setActiveTab] = useState<"invoice" | "voice" | "text">("invoice");

  // Inputs
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Parsing & Processing State
  const [isParsing, setIsParsing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ParsedAiProduct[]>([]);
  const [summaryMessage, setSummaryMessage] = useState<string>("");

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [currentSavingName, setCurrentSavingName] = useState("");

  // Web Image Finder State
  const [webFinderProductIdx, setWebFinderProductIdx] = useState<number | null>(null);

  const parentCategories = categories.filter((c) => !c.parent_id);

  function resetAll() {
    setInputText("");
    setImagePreview(null);
    setParsedProducts([]);
    setSummaryMessage("");
    setIsParsing(false);
    setIsSaving(false);
    setSaveProgress(0);
    setCurrentSavingName("");
    setWebFinderProductIdx(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Non-blocking
      }
      setIsRecording(false);
    }
  }

  function handleClose() {
    if (isSaving || isParsing) return;
    resetAll();
    onClose();
  }

  // Handle Image Selection / Camera Capture
  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("कृपया कोई मान्य फोटो (JPG, PNG, WebP) चुनें।");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("फोटो का साइज बहुत बड़ा है (अधिकतम 12 MB)।");
      return;
    }

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Speech Recognition Handling
  function toggleRecording() {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("आपके ब्राउज़र में वॉइस रिकॉग्निशन सपोर्ट नहीं है। कृपया टेक्स्ट टाइप करें।");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("माइक चालू है — सामान का नाम, पैक साइज और रेट बोलें...");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setInputText(transcript.trim());
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech error:", err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech start failed:", e);
      setIsRecording(false);
    }
  }

  // Execute AI Parsing
  async function handleParseWithAi() {
    if (!imagePreview && !inputText.trim()) {
      toast.error("कृपया बिल की फोटो चुनें, बोलकर रिकॉर्ड करें या टेक्स्ट पेस्ट करें।");
      return;
    }

    if (isRecording) {
      toggleRecording();
    }

    setIsParsing(true);
    setSummaryMessage("");

    try {
      const res = await parseSupplierBillWithGemini({
        text: inputText,
        imageBase64: imagePreview || undefined,
        mimeType: imageMime,
        categories: categories,
      });

      if (res.success && res.products.length > 0) {
        // Smart Deduplication & Image Assignment
        const annotated: ParsedAiProduct[] = res.products.map((p) => {
          const cleanName = p.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
          const match = existingProducts.find((ep) => {
            const epEn = (ep.name_en || ep.name).toLowerCase().trim().replace(/[^a-z0-9]/g, "");
            const epHi = (ep.name_hi || "").trim();
            if (epEn === cleanName || (epHi && p.name.includes(epHi))) return true;
            if (cleanName.length >= 4 && (epEn.includes(cleanName) || cleanName.includes(epEn))) {
              return true;
            }
            return false;
          });

          const autoImg = match?.image_url || getProductImage({ name: p.name });

          return {
            ...p,
            matched_existing_id: match?.id ?? null,
            matched_existing_name: match ? (match.name_hi || match.name) : null,
            action_type: match ? ("update_stock" as const) : ("create_new" as const),
            image_url: autoImg,
          };
        });

        const existingCount = annotated.filter((a) => a.matched_existing_id).length;
        const newCount = annotated.length - existingCount;

        setParsedProducts(annotated);
        setSummaryMessage(
          `AI ने ${annotated.length} सामान निकाले (${existingCount} पहले से मौजूद [स्टॉक रीफिल], ${newCount} नए उत्पाद)`
        );
        toast.success(
          `पहचान पूरी! ${existingCount} सामान पहले से स्टोर में मिले (स्टॉक बढ़ेगा), ${newCount} नए सामान जुड़ेंगे।`
        );
      } else {
        toast.error(res.error || "AI पर्चा पढ़ने में असमर्थ रहा। कृपया जानकारी दोबारा जांचें।");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI पार्सिंग में समस्या आई।";
      toast.error(msg);
    } finally {
      setIsParsing(false);
    }
  }

  // Row Modification Handlers
  function updateProductField(index: number, field: keyof ParsedAiProduct, value: any) {
    setParsedProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  }

  function updateVariantField(
    pIndex: number,
    vIndex: number,
    field: keyof ParsedAiProductVariant,
    value: any
  ) {
    setParsedProducts((prev) => {
      const next = [...prev];
      const prod = next[pIndex]!;
      const nextVariants = [...prod.variants];
      nextVariants[vIndex] = { ...nextVariants[vIndex]!, [field]: value };
      next[pIndex] = { ...prod, variants: nextVariants };
      return next;
    });
  }

  function addVariantToProduct(pIndex: number) {
    setParsedProducts((prev) => {
      const next = [...prev];
      const prod = next[pIndex]!;
      next[pIndex] = {
        ...prod,
        variants: [
          ...prod.variants,
          { label: "1 Unit", price: 50, mrp: 60, stock: 20 },
        ],
      };
      return next;
    });
  }

  function removeVariant(pIndex: number, vIndex: number) {
    setParsedProducts((prev) => {
      const next = [...prev];
      const prod = next[pIndex]!;
      if (prod.variants.length <= 1) {
        toast.warning("हर प्रोडक्ट में कम से कम 1 पैक साइज होना आवश्यक है।");
        return prev;
      }
      next[pIndex] = {
        ...prod,
        variants: prod.variants.filter((_, i) => i !== vIndex),
      };
      return next;
    });
  }

  function removeProductRow(index: number) {
    setParsedProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function addNewEmptyProduct() {
    const defaultCat = parentCategories[0]?.id || categories[0]?.id;
    setParsedProducts((prev) => [
      ...prev,
      {
        name: "",
        name_hi: "",
        brand: "",
        category_id: defaultCat,
        description: "",
        description_hi: "",
        variants: [{ label: "1 kg", price: 100, mrp: 110, stock: 30 }],
      },
    ]);
  }

  // Batch Save Valid Products into Supabase
  async function handleConfirmSave() {
    if (parsedProducts.length === 0) {
      toast.error("जोड़ने के लिए कोई सामान नहीं है।");
      return;
    }

    // Filter invalid entries
    const validToSave = parsedProducts.filter(
      (p) => p.name.trim().length > 0 && p.variants.length > 0 && p.variants.every((v) => v.price > 0)
    );

    if (validToSave.length === 0) {
      toast.error("कृपया सुनिश्चित करें कि सभी सामानों का नाम और मूल्य (Price > 0) सही भरा है।");
      return;
    }

    setIsSaving(true);
    setSaveProgress(0);

    const existingSlugs = new Set(existingProducts.map((p) => p.slug));
    let savedCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < validToSave.length; i++) {
        const prod = validToSave[i]!;
        setCurrentSavingName(prod.name);

        if (prod.action_type === "update_stock" && prod.matched_existing_id) {
          // 1. SMART MERGE: Update Stock & Prices on Existing Product
          const existing = existingProducts.find((p) => p.id === prod.matched_existing_id);
          const existingVars = existing?.product_variants || [];

          for (const v of prod.variants) {
            const cleanLabel = v.label.toLowerCase().replace(/[^a-z0-9]/g, "");
            const matchedVar = existingVars.find(
              (ev) => ev.label.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanLabel
            );

            if (matchedVar) {
              const updatedStock = (matchedVar.stock || 0) + v.stock;
              await supabase
                .from("product_variants")
                .update({
                  stock: updatedStock,
                  price: v.price > 0 ? v.price : matchedVar.price,
                  mrp: v.mrp > 0 ? Math.max(v.mrp, v.price) : matchedVar.mrp,
                })
                .eq("id", matchedVar.id);
            } else {
              // Add newly found pack size to existing product
              await supabase.from("product_variants").insert({
                product_id: prod.matched_existing_id,
                label: v.label.trim(),
                price: v.price,
                mrp: Math.max(v.mrp, v.price),
                stock: v.stock,
                low_stock_threshold: 5,
                sort_order: existingVars.length + 1,
              });
            }
          }
          savedCount++;
        } else {
          let baseSlug = generateCleanSlug(prod.name, prod.brand);

          let slug = baseSlug;
          let counter = 1;
          while (existingSlugs.has(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
          existingSlugs.add(slug);

          const targetCatId = prod.category_id || categories[0]?.id;
          const finalImg = prod.image_url || getProductImage({ name: prod.name });

          const { data: newProd, error: prodErr } = await supabase
            .from("products")
            .insert({
              name: prod.name.trim(),
              name_en: prod.name.trim(),
              name_hi: prod.name_hi?.trim() || null,
              slug: slug,
              brand: prod.brand?.trim() || null,
              category_id: targetCatId ?? null,
              description: prod.description?.trim() || null,
              description_en: prod.description?.trim() || null,
              description_hi: prod.description_hi?.trim() || null,
              image_url: finalImg,
              images: finalImg ? [finalImg] : [],
              is_active: true,
              is_featured: false,
              is_popular: false,
            })
            .select("id")
            .single();

          if (prodErr || !newProd) {
            console.error(`Error saving product "${prod.name}":`, prodErr);
            failedCount++;
            continue;
          }

          const variantsPayload = prod.variants.map((v, vIndex) => ({
            product_id: newProd.id,
            label: v.label.trim(),
            price: v.price,
            mrp: Math.max(v.mrp, v.price),
            stock: Math.max(0, v.stock),
            low_stock_threshold: 5,
            sort_order: vIndex,
          }));

          const { error: varErr } = await supabase.from("product_variants").insert(variantsPayload);
          if (varErr) {
            console.error(`Error saving variants for "${prod.name}":`, varErr);
          }

          savedCount++;
        }
        setSaveProgress(Math.round(((i + 1) / validToSave.length) * 100));
      }

      // Sync across caches
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });

      if (savedCount > 0) {
        toast.success(`🎉 ${savedCount} सामान सफलतापूर्वक आपके स्टोर में जुड़ गए!`);
        onSuccess();
        handleClose();
      } else {
        toast.error("डेटाबेस में सामान सेव करने में विफलता आई। कृपया नेटवर्क जांचें।");
      }
    } catch (err: unknown) {
      console.error("Batch save error:", err);
      toast.error(err instanceof Error ? err.message : "सामान सेव नहीं हो सका।");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[96vw] sm:max-w-5xl max-h-[94vh] flex flex-col p-0 rounded-3xl border-[#E8E4DA] bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E8E4DA] bg-gradient-to-r from-[#FAF8F2] via-white to-[#F0F5F2] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
                <span className="size-8 rounded-xl bg-[#145A45] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="size-4.5" />
                </span>
                AI स्मार्ट प्रोडक्ट इन्टेक (Smart Product Intake)
              </DialogTitle>
              <p className="text-xs text-[#5A655F] mt-1">
                सप्लायर के डिस्ट्रीब्यूटर बिल की फोटो खींचें, बोलकर दर्ज करें, या WhatsApp लिस्ट पेस्ट करें।
              </p>
            </div>

            {/* Input Mode Selector */}
            <div className="inline-flex rounded-xl bg-[#E8E4DA]/50 p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("invoice")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "invoice"
                    ? "bg-[#145A45] text-white shadow-xs"
                    : "text-[#5A655F] hover:text-[#1F2924]"
                }`}
              >
                <Camera className="size-3.5" /> डिस्ट्रीब्यूटर बिल
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "voice"
                    ? "bg-[#145A45] text-white shadow-xs"
                    : "text-[#5A655F] hover:text-[#1F2924]"
                }`}
              >
                <Mic className="size-3.5" /> बोलकर दर्ज करें
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "text"
                    ? "bg-[#145A45] text-white shadow-xs"
                    : "text-[#5A655F] hover:text-[#1F2924]"
                }`}
              >
                <FileText className="size-3.5" /> रफ़ / WhatsApp टेक्स्ट
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Intake Card */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-4 sm:p-5 space-y-4">
            {/* Tab 1: Distributor Invoice / Receipt Photo */}
            {activeTab === "invoice" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Camera Button (Mobile/Direct) */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:w-auto rounded-xl border-[#145A45]/30 text-[#145A45] hover:bg-[#145A45]/10 font-bold text-xs h-11 gap-2"
                  >
                    <Camera className="size-4" /> 📷 कैमरे से तुरंत फोटो खींचें
                  </Button>

                  {/* Gallery/File Picker */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto rounded-xl border-[#E8E4DA] text-[#1F2924] hover:bg-stone-100 font-bold text-xs h-11 gap-2"
                  >
                    <Upload className="size-4" /> 🖼️ गैलरी / फाइल से बिल चुनें
                  </Button>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-xs text-red-600 hover:underline font-semibold ml-auto"
                    >
                      फोटो हटाएं
                    </button>
                  )}
                </div>

                {/* Preview Thumbnail */}
                {imagePreview && (
                  <div className="relative inline-block border-2 border-[#145A45]/30 rounded-xl overflow-hidden bg-black/5">
                    <img
                      src={imagePreview}
                      alt="Bill preview"
                      className="max-h-48 max-w-full sm:max-w-md object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Voice Dictation */}
            {activeTab === "voice" && (
              <div className="space-y-3 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="button"
                    onClick={toggleRecording}
                    className={`rounded-2xl px-6 h-12 font-bold text-xs gap-2 transition-all ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        : "bg-[#145A45] hover:bg-[#0E4333] text-white"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="size-4" /> 🛑 बोलना बंद करें (रिकॉर्डिंग चालू)
                      </>
                    ) : (
                      <>
                        <Mic className="size-4" /> 🎙️ बोलकर माल दर्ज करना शुरू करें
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-[#6B746F]">
                    उदाहरण: <em>"टाटा नमक 1 किलो 100 पैकेट रेट 28 एमआरपी 30, फॉर्च्यून तेल 1 लीटर 50 पाउच..."</em>
                  </p>
                </div>

                <Textarea
                  placeholder="यहाँ आपकी बोली हुई लिस्ट दिखेगी..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs min-h-[70px] resize-none"
                />
              </div>
            )}

            {/* Tab 3: Raw Text Paste */}
            {activeTab === "text" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="सप्लायर का WhatsApp मैसेज या कच्ची लिस्ट यहाँ पेस्ट करें (जैसे: Fortune Oil 1L 50 pcs 150/165, Tata Salt 1kg 100 pkt 28/30)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs min-h-[90px] resize-none"
                />
              </div>
            )}

            {/* Process Button */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DA]/60">
              <span className="text-[11px] text-[#6B746F]">
                AI बिल की लिखावट और दरों को स्टोर के फॉर्मेट में बदल देगा।
              </span>
              <Button
                type="button"
                disabled={isParsing || (!imagePreview && !inputText.trim())}
                onClick={handleParseWithAi}
                className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-10 px-5 shadow-xs gap-1.5"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> AI पार्स कर रहा है...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" /> AI से लिस्ट तैयार करें
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Saving Progress Indicator */}
          {isSaving && (
            <div className="rounded-2xl border border-[#145A45]/30 bg-[#145A45]/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#145A45]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  स्टोर में सेव हो रहा है: {currentSavingName}...
                </span>
                <span>{saveProgress}%</span>
              </div>
              <Progress value={saveProgress} className="h-2 bg-stone-200" />
            </div>
          )}

          {/* Interactive Editable Verification Grid */}
          {parsedProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                  <h3 className="font-sans text-sm font-bold text-[#1F2924]">
                    पहचाने गए सामान ({parsedProducts.length} आइटम्स) — रिव्यू और बदलाव करें
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addNewEmptyProduct}
                    className="rounded-xl border-[#E8E4DA] text-xs h-8 text-[#145A45] font-bold gap-1"
                  >
                    <Plus className="size-3.5" /> नया सामान जोड़ें
                  </Button>
                </div>
              </div>

              {summaryMessage && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-medium">
                  ✓ {summaryMessage}
                </p>
              )}

              {/* Editable Product Cards List */}
              <div className="space-y-3">
                {parsedProducts.map((prod, pIdx) => (
                  <div
                    key={pIdx}
                    className={`rounded-2xl border p-4 shadow-2xs space-y-3 transition-colors ${
                      prod.action_type === "update_stock"
                        ? "border-amber-300 bg-amber-50/20"
                        : "border-[#E8E4DA] bg-white hover:border-[#145A45]/40"
                    }`}
                  >
                    {/* Status & De-duplication Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E8E4DA]/60">
                      {prod.matched_existing_id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                            <RefreshCw className="size-3 text-amber-700" />
                            पहले से मौजूद: "{prod.matched_existing_name}"
                          </span>

                          <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => updateProductField(pIdx, "action_type", "update_stock")}
                              className={`px-2 py-0.5 rounded transition-all ${
                                prod.action_type === "update_stock"
                                  ? "bg-[#145A45] text-white shadow-xs"
                                  : "text-[#5A655F] hover:text-[#1F2924]"
                              }`}
                            >
                              ✓ रीफिल & स्टॉक बढ़ाएं
                            </button>
                            <button
                              type="button"
                              onClick={() => updateProductField(pIdx, "action_type", "create_new")}
                              className={`px-2 py-0.5 rounded transition-all ${
                                prod.action_type === "create_new"
                                  ? "bg-[#145A45] text-white shadow-xs"
                                  : "text-[#5A655F] hover:text-[#1F2924]"
                              }`}
                            >
                              + अलग नया बनाएं
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Sparkles className="size-3 text-emerald-700" />
                          ✨ नया प्रोडक्ट (New Item)
                        </span>
                      )}

                      {/* Photo Thumbnail & Web/Manual Finder Button */}
                      <div className="flex items-center gap-2 ml-auto">
                        <div className="relative size-8 rounded-lg overflow-hidden bg-[#FAF8F2] border border-[#E8E4DA] flex items-center justify-center shrink-0">
                          <img
                            src={prod.image_url || getProductImage({ name: prod.name })}
                            alt={prod.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                            }}
                            className="size-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setWebFinderProductIdx(pIdx)}
                          className="h-7 px-2 rounded-lg border-sky-200 bg-sky-50 text-sky-800 text-[10px] font-bold hover:bg-sky-100 flex items-center gap-1 shadow-2xs"
                        >
                          <Globe className="size-3 text-sky-600" />
                          <span>फोटो बदलें</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                        {/* English Name */}
                        <div>
                          <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                            नाम (English Name) *
                          </label>
                          <Input
                            value={prod.name}
                            onChange={(e) => updateProductField(pIdx, "name", e.target.value)}
                            placeholder="Fortune Kachi Ghani Oil"
                            className="rounded-lg text-xs h-8.5 mt-0.5"
                          />
                        </div>

                        {/* Hindi Name */}
                        <div>
                          <label className="text-[10px] font-bold text-[#145A45] uppercase">
                            हिंदी नाम (Devanagari)
                          </label>
                          <Input
                            value={prod.name_hi}
                            onChange={(e) => updateProductField(pIdx, "name_hi", e.target.value)}
                            placeholder="फॉर्च्यून कच्ची घानी तेल"
                            className="rounded-lg text-xs h-8.5 mt-0.5 text-[#145A45] font-medium"
                          />
                        </div>

                        {/* Category Selector */}
                        <div>
                          <label className="text-[10px] font-bold text-[#5A655F] uppercase">
                            कैटेगरी (Category) *
                          </label>
                          <Select
                            value={prod.category_id || parentCategories[0]?.id || ""}
                            onValueChange={(val) => updateProductField(pIdx, "category_id", val)}
                          >
                            <SelectTrigger className="rounded-lg text-xs h-8.5 mt-0.5">
                              <SelectValue placeholder="Category चुनें" />
                            </SelectTrigger>
                            <SelectContent>
                              {parentCategories.map((c) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.name} {c.name_hi ? `(${c.name_hi})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Remove Entire Product Button */}
                      <button
                        type="button"
                        onClick={() => removeProductRow(pIdx)}
                        title="हटाएं"
                        className="p-1 text-stone-400 hover:text-red-600 rounded-lg transition-colors mt-4 shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Brand & Short Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-[#E8E4DA]/40 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-[#6B746F]">ब्रांड (Brand)</label>
                        <Input
                          value={prod.brand}
                          onChange={(e) => updateProductField(pIdx, "brand", e.target.value)}
                          placeholder="Fortune / Tata"
                          className="rounded-lg text-xs h-7.5 mt-0.5"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold text-[#6B746F]">विवरण (Description)</label>
                        <Input
                          value={prod.description_hi || prod.description}
                          onChange={(e) => updateProductField(pIdx, "description_hi", e.target.value)}
                          placeholder="शुद्ध और ताज़ा किराना सामग्री"
                          className="rounded-lg text-xs h-7.5 mt-0.5"
                        />
                      </div>
                    </div>

                    {/* Variants Table (Pack sizes, Rates, Stock) */}
                    <div className="bg-[#FAF8F2]/60 rounded-xl p-2.5 border border-[#E8E4DA]/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5A655F]">
                        <span>पैक साइज व दर (Pack Size, Selling Price, MRP, Stock)</span>
                        <button
                          type="button"
                          onClick={() => addVariantToProduct(pIdx)}
                          className="text-[#145A45] hover:underline font-bold text-[10px] flex items-center gap-1"
                        >
                          <Plus className="size-3" /> + साइज जोड़ें
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {prod.variants.map((v, vIdx) => (
                          <div
                            key={vIdx}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs bg-white p-1.5 rounded-lg border border-[#E8E4DA]/80"
                          >
                            <div className="w-24 shrink-0">
                              <Input
                                value={v.label}
                                onChange={(e) =>
                                  updateVariantField(pIdx, vIdx, "label", e.target.value)
                                }
                                placeholder="1 L / 1 kg"
                                className="h-7 text-xs rounded-md"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-[#6B746F]">रेट: ₹</span>
                              <Input
                                type="number"
                                value={v.price || ""}
                                onChange={(e) =>
                                  updateVariantField(pIdx, vIdx, "price", parseFloat(e.target.value) || 0)
                                }
                                placeholder="Price"
                                className="h-7 w-20 text-xs rounded-md font-bold text-[#145A45]"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-[#6B746F]">MRP: ₹</span>
                              <Input
                                type="number"
                                value={v.mrp || ""}
                                onChange={(e) =>
                                  updateVariantField(pIdx, vIdx, "mrp", parseFloat(e.target.value) || 0)
                                }
                                placeholder="MRP"
                                className="h-7 w-20 text-xs rounded-md"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-[#6B746F]">स्टॉक:</span>
                              <Input
                                type="number"
                                value={v.stock || ""}
                                onChange={(e) =>
                                  updateVariantField(pIdx, vIdx, "stock", parseInt(e.target.value, 10) || 0)
                                }
                                placeholder="Qty"
                                className="h-7 w-16 text-xs rounded-md"
                              />
                            </div>

                            {prod.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariant(pIdx, vIdx)}
                                className="text-stone-400 hover:text-red-600 ml-auto"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E4DA] bg-[#FAF8F2]/80 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-xl text-xs font-semibold text-[#5A655F]"
          >
            बंद करें (Cancel)
          </Button>

          <div className="flex items-center gap-2">
            {parsedProducts.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setParsedProducts([])}
                disabled={isSaving}
                className="rounded-xl text-xs border-[#E8E4DA] text-[#5A655F]"
              >
                खाली करें (Clear)
              </Button>
            )}

            <Button
              type="button"
              disabled={parsedProducts.length === 0 || isSaving}
              onClick={handleConfirmSave}
              className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-10 px-5 shadow-xs gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> स्टोर में जुड़ रहा है...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" /> ✓ {parsedProducts.length} सामान स्टोर में जोड़ें
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Manual & Web Image Finder Modal for AI Ingestion */}
    {webFinderProductIdx !== null && parsedProducts[webFinderProductIdx] && (
      <WebImageFinderModal
        isOpen={webFinderProductIdx !== null}
        onClose={() => setWebFinderProductIdx(null)}
        productName={`${parsedProducts[webFinderProductIdx].brand || ""} ${parsedProducts[webFinderProductIdx].name}`.trim()}
        currentImageUrl={parsedProducts[webFinderProductIdx].image_url || getProductImage({ name: parsedProducts[webFinderProductIdx].name })}
        onSelectImage={(url) => {
          updateProductField(webFinderProductIdx, "image_url", url);
          setWebFinderProductIdx(null);
          toast.success("फोटो सफलतापूर्वक सेट कर दी गई है!");
        }}
      />
    )}
  </>
  );
}
