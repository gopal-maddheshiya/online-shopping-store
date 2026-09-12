import { useState, useRef, useEffect, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Camera,
  UploadCloud,
  FileText,
  Mic,
  MicOff,
  Check,
  CheckCircle2,
  Edit3,
  Languages,
  Plus,
  Minus,
  ArrowRight,
  Loader2,
  Trash2,
  ShoppingBag,
  AlertCircle,
  HelpCircle,
  Volume2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage, type ProductLike } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/queries";
import {
  parseGrocerySlipWithGemini,
  type MatchedRationItem,
} from "@/lib/gemini";
import { playNewOrderChime } from "@/lib/sound";
import {
  speakVoiceConfirmation,
  playMicTone,
  isSpeechRecognitionAvailable,
  cleanDeduplicateSpeech,
  removeStutteredWords,
  formatSpokenGroceryList,
} from "@/lib/voice";

export interface SmartRationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  initialMode?: "photo" | "text" | "voice";
}

const SAMPLE_LISTS = [
  {
    label: "दैनिक राशन",
    text: "2 किलो चीनी, 1 लीटर फॉर्च्यून सरसों तेल, 1 किलो टाटा नमक, 1 किलो अरहर दाल",
  },
  {
    label: "मसाला व पूजा",
    text: "200 ग्राम एवरेस्ट हल्दी, 100 ग्राम जीरा, 1 डिब्बी हींग, 500 ग्राम अमूल देसी घी",
  },
  {
    label: "नाश्ता व स्नैक्स",
    text: "2 पैकेट मैगी 4-पैक, 1 पैकेट पारले-जी, 250 ग्राम टाटा टी गोल्ड",
  },
];

export function SmartRationModal({
  open,
  onOpenChange,
  products,
  initialMode = "text",
}: SmartRationModalProps) {
  const { lang, getProductName, getVariantLabel } = useLanguage();
  const cart = useCart();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"photo" | "text" | "voice">(initialMode);
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [recognizedItems, setRecognizedItems] = useState<MatchedRationItem[]>([]);
  const [isDone, setIsDone] = useState(false);

  // Voice speech recognition state
  const [voiceLang, setVoiceLang] = useState<"hi" | "en">(lang === "hi" ? "hi" : "en");
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [recognizedVoiceItems, setRecognizedVoiceItems] = useState<string[]>([]);
  const [isManualEditing, setIsManualEditing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalAccumulatorRef = useRef<string>("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep recognizedVoiceItems updated when inputText changes
  useEffect(() => {
    setRecognizedVoiceItems(formatSpokenGroceryList(inputText));
  }, [inputText]);

  // Start Voice Recording with zero-duplication accumulator
  const startVoiceRecording = (targetLang?: "hi" | "en") => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        lang === "hi"
          ? "आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया लिखकर राशन मंगाएं।"
          : "Voice recognition not supported in this browser. Please type."
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      const chosenLang = targetLang || voiceLang;
      // Pre-seed accumulator with current input so speech appends smoothly without duplicating
      finalAccumulatorRef.current = inputText.trim();
      setInterimText("");

      const recognition = new SpeechRecognition();
      recognition.lang = chosenLang === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        playMicTone("start");
      };

      recognition.onresult = (event: any) => {
        // Reset silence timer whenever any speech sound is captured
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        let latestInterim = "";
        let newlyFinalized = "";

        // Process only newly updated result items to avoid looping old frames
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (!res || !res[0]) continue;
          const chunk = (res[0].transcript || "").trim();
          if (!chunk) continue;

          if (res.isFinal) {
            newlyFinalized = newlyFinalized
              ? cleanDeduplicateSpeech(newlyFinalized, chunk)
              : chunk;
          } else {
            latestInterim = chunk;
          }
        }

        if (newlyFinalized) {
          const mergedFinal = cleanDeduplicateSpeech(
            finalAccumulatorRef.current,
            newlyFinalized
          );
          const cleanFinal = removeStutteredWords(mergedFinal);
          finalAccumulatorRef.current = cleanFinal;
          setInputText(cleanFinal);
        }

        setInterimText(latestInterim);

        // Auto-silence timer: Stop smoothly after 2.3 seconds of silence
        silenceTimerRef.current = setTimeout(() => {
          if (latestInterim) {
            const promotedFinal = cleanDeduplicateSpeech(
              finalAccumulatorRef.current,
              latestInterim
            );
            const cleanFinal = removeStutteredWords(promotedFinal);
            finalAccumulatorRef.current = cleanFinal;
            setInputText(cleanFinal);
            setInterimText("");
          }
          stopVoiceRecording();
          toast.success(
            lang === "hi"
              ? "✅ आवाज़ सुन ली गई! नीचे 1-क्लिक में थैला भरें"
              : "✅ Voice captured! Tap below to match items"
          );
        }, 2300);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        if (err.error === "no-speech") {
          return;
        }
        setIsRecording(false);
        playMicTone("stop");

        if (err.error === "not-allowed" || err.error === "service-not-allowed") {
          toast.error(
            lang === "hi"
              ? "माइक की अनुमति बंद है। कृपया ब्राउज़र में ऊपर 🔒 या Settings पर क्लिक करके Mic Allow करें।"
              : "Microphone permission blocked. Please allow mic in browser settings."
          );
        } else if (err.error === "network") {
          toast.error(
            lang === "hi"
              ? "इंटरनेट कनेक्शन की जांच करें।"
              : "Network error during speech recognition."
          );
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsRecording(false);
      playMicTone("stop");
    }
  };

  // Stop Voice Recording cleanly
  const stopVoiceRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    setInterimText("");
    playMicTone("stop");
  };

  // Toggle Voice Recording
  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Switch Voice Language
  const handleSwitchVoiceLang = (newLang: "hi" | "en") => {
    setVoiceLang(newLang);
    if (isRecording) {
      stopVoiceRecording();
      setTimeout(() => {
        startVoiceRecording(newLang);
      }, 150);
    }
  };

  // Clear Voice Text and Accumulator
  const handleClearVoice = () => {
    setInputText("");
    finalAccumulatorRef.current = "";
    setInterimText("");
    setRecognizedVoiceItems([]);
  };

  // Gracefully switch tabs and manage recording lifecycle
  const handleTabChange = (tab: "photo" | "text" | "voice") => {
    if (tab !== "voice" && isRecording) {
      stopVoiceRecording();
    }
    setActiveTab(tab);
    if (tab === "voice" && !isRecording) {
      setTimeout(() => {
        startVoiceRecording();
      }, 200);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      setActiveTab(initialMode);
      setIsDone(false);
      setRecognizedItems([]);
      setStatusMessage("");
      if (initialMode === "voice") {
        timer = setTimeout(() => {
          startVoiceRecording();
        }, 350);
      }
    } else {
      stopVoiceRecording();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, initialMode]);

  // Handle Photo File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(lang === "hi" ? "कृपया केवल इमेज फाइल चुनें।" : "Please select an image file.");
      return;
    }

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini AI Parser
  const handleProcessWithGemini = async () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    setIsLoading(true);
    setStatusMessage(
      lang === "hi"
        ? "पर्चा स्कैन हो रहा है और दुकान के सामान से मिलाया जा रहा है..."
        : "Analyzing grocery list and matching store items..."
    );

    try {
      const res = await parseGrocerySlipWithGemini({
        text: inputText || undefined,
        imageBase64: (activeTab === "photo" && imagePreview) ? imagePreview : undefined,
        mimeType: imageMime,
        availableProducts: products,
      });

      if (!res.success || res.items.length === 0) {
        toast.error(res.error || (lang === "hi" ? "कोई सामान नहीं मिला।" : "No items found."));
        setIsLoading(false);
        return;
      }

      setRecognizedItems(res.items);
      setIsDone(true);
      toast.success(
        lang === "hi"
          ? `AI ने ${res.items.length} सामान की पहचान की!`
          : `AI identified ${res.items.length} items!`
      );

      // Spoken voice feedback to the customer
      speakVoiceConfirmation("items_matched", lang);
    } catch (err) {
      toast.error(
        lang === "hi"
          ? "AI विश्लेषण विफल रहा। कृपया दोबारा कोशिश करें।"
          : "AI analysis failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Quantity adjustments in results
  const handleUpdateQty = (index: number, delta: number) => {
    setRecognizedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setRecognizedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Add all matched items to cart in 1 click
  const handleAddAllToCart = () => {
    const matched = recognizedItems.filter((i) => i.matched && i.variant_id && i.product_id);
    if (matched.length === 0) {
      toast.error(
        lang === "hi"
          ? "थैले में जोड़ने योग्य कोई सामान नहीं है।"
          : "No items available to add to cart."
      );
      return;
    }

    const payload = matched.map((item) => {
      const prodObj: ProductLike = {
        name: item.product_name,
        name_hi: item.product_name_hi ?? null,
        slug: item.slug,
      };
      const localizedName = getProductName(prodObj, item.slug);
      const localizedVariant = getVariantLabel(item.variant_label);

      return {
        item: {
          variantId: item.variant_id!,
          productId: item.product_id!,
          slug: item.slug,
          name: localizedName,
          name_hi: item.product_name_hi ?? null,
          variantLabel: localizedVariant || item.variant_label || "1 Unit",
          price: item.unit_price,
          mrp: item.mrp || item.unit_price,
          imageUrl: item.image_url,
          stock: 99,
        },
        qty: item.quantity,
      };
    });

    cart.addMultiple(payload);
    playNewOrderChime();

    toast.success(
      lang === "hi"
        ? `${matched.length} सामान तुरंत आपके थैले में जुड़ गए!`
        : `${matched.length} items added to your cart!`
    );

    // Voice response confirming the exact user request: "aapke kaheanusar ye kam ho gya"
    speakVoiceConfirmation("task_done", lang);

    onOpenChange(false);
  };

  const matchedCount = recognizedItems.filter((i) => i.matched).length;
  const totalPrice = recognizedItems
    .filter((i) => i.matched)
    .reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-4 sm:p-6 rounded-3xl border border-[#E4DFD5] shadow-[0_12px_40px_rgba(0,0,0,0.16)] bg-white max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-3 border-b border-[#E8E3D9]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="grid size-9 sm:size-10 place-items-center rounded-xl bg-gradient-to-br from-[#FAF5EA] to-[#F2E8D2] border border-[#E8DCBF] text-[#B45309] shadow-2xs shrink-0">
              <Sparkles className="size-5 text-[#B45309]" />
            </div>
            <div>
              <DialogTitle className="font-sans text-base sm:text-lg font-black text-[#16201A] tracking-tight">
                {lang === "hi" ? "स्मार्ट राशन सहायक" : "Smart Ration Assistant"}
              </DialogTitle>
              <DialogDescription className="text-[11.5px] sm:text-xs text-[#5A655F] mt-0.5">
                {lang === "hi"
                  ? "पर्चा फोटो लगाएं, बोलकर बताएं या लिस्ट लिखें — 1-क्लिक में थैला तैयार!"
                  : "Upload slip, speak, or type — instant 1-click cart match!"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {!isDone ? (
            <>
              {/* Clean Segmented Mode Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FAF8F2] border border-[#E5E0D5]">
                <button
                  type="button"
                  onClick={() => handleTabChange("photo")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "photo"
                      ? "bg-[#145A45] text-white shadow-xs"
                      : "text-[#5A655F] hover:text-[#16201A] hover:bg-white/70"
                  }`}
                >
                  <Camera className="size-3.5" />
                  <span>{lang === "hi" ? "पर्चा फोटो" : "Slip Photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("voice")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "voice"
                      ? "bg-[#145A45] text-white shadow-xs"
                      : "text-[#5A655F] hover:text-[#16201A] hover:bg-white/70"
                  }`}
                >
                  <Mic className="size-3.5" />
                  <span>{lang === "hi" ? "बोलकर बताएं" : "By Voice"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("text")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "text"
                      ? "bg-[#145A45] text-white shadow-xs"
                      : "text-[#5A655F] hover:text-[#16201A] hover:bg-white/70"
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>{lang === "hi" ? "लिस्ट लिखें" : "Type List"}</span>
                </button>
              </div>

              {/* TAB 1: PHOTO / CAMERA SCAN */}
              {activeTab === "photo" && (
                <div className="space-y-3">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl border border-[#E5E0D5] bg-[#FAF8F5] p-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Grocery slip preview"
                          className="max-h-56 w-auto object-contain rounded-xl shadow-xs"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="rounded-full bg-white/95 hover:bg-white text-[#16201A] border border-[#D5CEBF] px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="गैलरी से दूसरी फोटो"
                          >
                            <ImageIcon className="size-3 text-[#145A45]" />
                            <span>{lang === "hi" ? "गैलरी" : "Gallery"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="rounded-full bg-black/75 hover:bg-black text-white px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="हटाएं"
                          >
                            <Trash2 className="size-3" />
                            <span>{lang === "hi" ? "हटाएं" : "Remove"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Direct 1-Click Search Button for Photo */}
                      <Button
                        type="button"
                        onClick={handleProcessWithGemini}
                        disabled={isLoading}
                        className="w-full rounded-2xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white py-3 px-4 font-bold text-xs sm:text-sm shadow-[0_3px_10px_rgba(20,90,69,0.25)] transition-all cursor-pointer h-11 gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-[#E3B341]" />
                            <span>{statusMessage || (lang === "hi" ? "AI पर्चा पढ़ रहा है..." : "Reading slip...")}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4 text-[#E3B341]" />
                            <span>{lang === "hi" ? "✨ AI से पर्चा पढ़कर सामान खोजें" : "✨ Read Slip & Match with AI"}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-[#145A45]/25 bg-[#FAF8F5] p-5 sm:p-7 text-center space-y-3.5">
                      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#E6EFE8] text-[#145A45] shadow-xs">
                        <UploadCloud className="size-6 text-[#145A45]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#16201A]">
                          {lang === "hi" ? "कागज़ के पर्चे की फोटो लगाएं" : "Add grocery slip photo"}
                        </p>
                        <p className="text-[11.5px] text-[#5A655F] max-w-xs mx-auto leading-relaxed">
                          {lang === "hi"
                            ? "हाथ से लिखी पर्ची का नया फोटो खींचें या फोन की गैलरी से अपलोड करें"
                            : "Snap a fresh photo with camera or upload from your gallery"}
                        </p>
                      </div>

                      {/* TWO DISTINCT EASY BUTTONS: Camera & Gallery */}
                      <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto pt-1">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#145A45] hover:bg-[#0E4333] text-white py-2.5 px-3 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Camera className="size-4" />
                          <span>{lang === "hi" ? "कैमरा से खींचें" : "Use Camera"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-[#F2EFE8] border border-[#D5CEBF] text-[#16201A] py-2.5 px-3 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <ImageIcon className="size-4 text-[#145A45]" />
                          <span>{lang === "hi" ? "गैलरी से अपलोड" : "From Gallery"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TYPED / PASTED TEXT */}
              {activeTab === "text" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#16201A] flex items-center justify-between">
                      <span>{lang === "hi" ? "अपनी पूरी राशन लिस्ट यहाँ लिखें / पेस्ट करें:" : "Write or paste grocery list:"}</span>
                      <span className="text-[10px] text-[#5A655F]">
                        {lang === "hi" ? "उदा. '5kg आटा, 1L सरसों तेल, 2 मैगी'" : "e.g. 5kg atta, 1L oil"}
                      </span>
                    </label>
                    <Textarea
                      rows={5}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        lang === "hi"
                          ? "यहाँ लिखें, जैसे:\n5 किलो आशीर्वाद आटा\n1 लीटर फॉर्च्यून सरसों तेल\n1 किलो टाटा नमक\n500 ग्राम अरहर दाल\n2 पैकेट मैगी"
                          : "Write here, e.g.:\n5kg Aashirvaad Atta\n1L Fortune Mustard Oil\n1kg Tata Salt\n500g Toor Dal"
                      }
                      className="rounded-2xl border-[#E4DFD5] bg-white p-3 text-xs leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:border-[#145A45]"
                    />
                  </div>

                  {/* Sample Quick-Pick Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#5A655F] uppercase tracking-wider block">
                      {lang === "hi" ? "⚡ तुरंत आज़माएं (क्लिक करें):" : "⚡ Quick sample lists:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_LISTS.map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          onClick={() => setInputText(sample.text)}
                          className="rounded-lg bg-[#FAF8F2] border border-[#E4DFD5] px-2.5 py-1 text-[11px] font-medium text-[#145A45] hover:bg-[#E6EFE8] hover:border-[#145A45]/30 transition-colors cursor-pointer"
                        >
                          + {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ULTRA-PREMIUM VOICE STUDIO */}
              {activeTab === "voice" && (
                <div className="space-y-3.5 py-1">
                  {/* 1. Glassmorphic Hero Audio Stage */}
                  <div className="relative overflow-hidden rounded-3xl border border-[#145A45]/30 bg-gradient-to-b from-[#0C382A] via-[#145A45] to-[#0A2E22] p-5 sm:p-6 text-white text-center shadow-[0_10px_35px_rgba(20,90,69,0.25)]">
                    {/* Soft Ambient Gold/Emerald Glow Orbs */}
                    <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-[#E3B341]/15 blur-2xl" />
                    <div className="pointer-events-none absolute -left-8 -bottom-8 size-40 rounded-full bg-emerald-400/10 blur-2xl" />

                    {/* Top Header: Language Switcher Pill */}
                    <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                      <div className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-md border border-white/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                        <Sparkles className="size-3 text-[#E3B341]" />
                        <span>{lang === "hi" ? "AI वॉयस सहायक" : "AI Voice Studio"}</span>
                      </div>

                      {/* Language Switch Buttons */}
                      <div className="inline-flex rounded-full bg-black/40 backdrop-blur-md p-0.5 border border-white/15">
                        <button
                          type="button"
                          onClick={() => handleSwitchVoiceLang("hi")}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                            voiceLang === "hi"
                              ? "bg-white text-[#145A45] shadow-xs"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          🇮🇳 हिन्दी
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchVoiceLang("en")}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                            voiceLang === "en"
                              ? "bg-white text-[#145A45] shadow-xs"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          🇬🇧 English
                        </button>
                      </div>
                    </div>

                    {/* Center Animated Microphone Button */}
                    <div className="relative my-4 flex items-center justify-center">
                      {isRecording && (
                        <>
                          <div className="absolute size-36 rounded-full bg-red-500/20 animate-ping duration-1000 pointer-events-none" />
                          <div className="absolute size-28 rounded-full bg-red-500/30 animate-pulse duration-700 pointer-events-none" />
                        </>
                      )}

                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`relative z-10 flex size-20 sm:size-24 items-center justify-center rounded-full transition-all duration-300 active:scale-95 cursor-pointer ${
                          isRecording
                            ? "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white shadow-[0_0_35px_rgba(239,68,68,0.6)] ring-4 ring-red-300/60 scale-105"
                            : "bg-gradient-to-tr from-white/20 via-white/10 to-white/5 text-white border-2 border-white/40 hover:border-white hover:bg-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                        }`}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                      >
                        {isRecording ? (
                          <MicOff className="size-9 sm:size-10 animate-bounce" />
                        ) : (
                          <Mic className="size-9 sm:size-10 text-[#E3B341]" />
                        )}
                      </button>
                    </div>

                    {/* Dynamic Soundwave Equalizer (11 smooth dancing bars) */}
                    <div className="my-2.5 flex items-center justify-center gap-1.5 h-7">
                      {[
                        { h: "h-3", activeH: "h-5", delay: "delay-75" },
                        { h: "h-2", activeH: "h-7", delay: "delay-150" },
                        { h: "h-4", activeH: "h-6", delay: "delay-0" },
                        { h: "h-2", activeH: "h-8", delay: "delay-200" },
                        { h: "h-3", activeH: "h-5", delay: "delay-100" },
                        { h: "h-5", activeH: "h-7", delay: "delay-300" },
                        { h: "h-2", activeH: "h-6", delay: "delay-75" },
                        { h: "h-4", activeH: "h-8", delay: "delay-150" },
                        { h: "h-2", activeH: "h-5", delay: "delay-250" },
                        { h: "h-3", activeH: "h-7", delay: "delay-0" },
                        { h: "h-2", activeH: "h-4", delay: "delay-100" },
                      ].map((bar, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 rounded-full transition-all duration-200 ${
                            isRecording
                              ? `${bar.activeH} ${bar.delay} bg-gradient-to-t from-[#E3B341] to-red-400 animate-pulse`
                              : `${bar.h} bg-white/25`
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status Badge & Helper Text */}
                    <div className="relative z-10 space-y-1">
                      <p className="text-xs sm:text-sm font-extrabold tracking-wide">
                        {isRecording ? (
                          <span className="inline-flex items-center gap-1.5 text-red-200">
                            <span className="size-2 rounded-full bg-red-400 animate-ping" />
                            {lang === "hi"
                              ? "🎙️ AI सुन रहा है... राशन का नाम और वजन बोलिए"
                              : "🎙️ AI is listening... speak item names & quantities"}
                          </span>
                        ) : recognizedVoiceItems.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-200">
                            <CheckCircle2 className="size-3.5 text-[#E3B341]" />
                            {lang === "hi"
                              ? "✨ आवाज़ दर्ज हो गई! नीचे 1-क्लिक में थैला भरें"
                              : "✨ Voice recorded! Tap below to match"}
                          </span>
                        ) : (
                          <span className="text-white/95">
                            {lang === "hi"
                              ? "माइक दबाकर बोलें — जैसे '2 किलो चीनी, 1L तेल'"
                              : "Tap mic & speak — e.g. '2kg sugar, 1L oil'"}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-white/70 max-w-sm mx-auto">
                        {isRecording
                          ? lang === "hi"
                            ? "बोलना बंद करते ही AI अपने आप पहचान कर लेगा (या लाल बटन दबाएं)"
                            : "Pausing speech auto-completes, or tap red button to finish"
                          : lang === "hi"
                            ? "हिन्दी, अंग्रेजी व देहाती नामों (जैसे चना दाल, कोल्हू तेल) को 100% पहचानता है"
                            : "Recognizes local Hindi terms, brand names & weights accurately"}
                      </p>
                    </div>
                  </div>

                  {/* 2. Live Spoken Items Studio Card */}
                  <div className="rounded-2xl border border-[#E4DFD5] bg-white p-3 sm:p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="size-3.5 text-[#145A45]" />
                        <span className="text-xs font-bold text-[#16201A]">
                          {lang === "hi" ? "पहचाने गए राशन सामान" : "Recognized Grocery Items"}
                        </span>
                        {recognizedVoiceItems.length > 0 && (
                          <span className="rounded-full bg-[#E6EFE8] px-2 py-0.5 text-[10px] font-black text-[#145A45]">
                            {recognizedVoiceItems.length} {lang === "hi" ? "आइटम" : "items"}
                          </span>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2">
                        {inputText && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsManualEditing((prev) => !prev)}
                              className="text-[11px] font-bold text-[#145A45] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="size-3" />
                              <span>
                                {isManualEditing
                                  ? lang === "hi"
                                    ? "चिप्स देखें"
                                    : "View Chips"
                                  : lang === "hi"
                                  ? "एडिट करें"
                                  : "Edit Text"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={handleClearVoice}
                              className="text-[11px] font-semibold text-[#8C827A] hover:text-red-600 cursor-pointer"
                            >
                              {lang === "hi" ? "साफ़ करें" : "Clear"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Live Interim Pill when currently speaking */}
                    {interimText && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/70 p-2 text-xs text-amber-900 animate-pulse">
                        <span className="size-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <span className="font-semibold">{lang === "hi" ? "सुन रहे हैं:" : "Hearing:"}</span>
                        <span className="italic font-medium text-amber-800">"{interimText}..."</span>
                      </div>
                    )}

                    {/* Main Spoken List View */}
                    {isManualEditing ? (
                      <Textarea
                        rows={3}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          lang === "hi"
                            ? "यहाँ राशन लिस्ट दिखेगी या आप टाइप भी कर सकते हैं..."
                            : "Spoken items will appear here..."
                        }
                        className="rounded-xl border-[#E4DFD5] bg-[#FAF8F5] p-2.5 text-xs focus-visible:border-[#145A45]"
                      />
                    ) : recognizedVoiceItems.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {recognizedVoiceItems.map((item, idx) => (
                          <span
                            key={`${item}-${idx}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#F2F6F3] border border-[#145A45]/20 px-2.5 py-1 text-xs font-bold text-[#145A45] shadow-2xs"
                          >
                            <Check className="size-3 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                    ) : !interimText ? (
                      <div className="rounded-xl bg-[#FAF8F5] border border-dashed border-[#DCD6CA] p-3 text-center space-y-2">
                        <p className="text-xs text-[#5A655F]">
                          {lang === "hi"
                            ? "अभी कोई सामान नहीं बोला गया है। ऊपर माइक दबाकर बोलें या नीचे से चुनें:"
                            : "No items spoken yet. Tap mic above or click sample list:"}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {SAMPLE_LISTS.map((sample) => (
                            <button
                              key={sample.label}
                              type="button"
                              onClick={() => {
                                setInputText(sample.text);
                                finalAccumulatorRef.current = sample.text;
                              }}
                              className="rounded-lg bg-white border border-[#D5CEBF] px-2.5 py-1 text-[11px] font-medium text-[#145A45] hover:bg-[#E6EFE8] hover:border-[#145A45]/30 transition-colors cursor-pointer"
                            >
                              + {sample.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* 3. High-Converting Instant AI Match Action Button */}
                    {inputText.trim() && (
                      <Button
                        type="button"
                        onClick={handleProcessWithGemini}
                        disabled={isLoading}
                        className="w-full mt-2 rounded-2xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white py-3 px-4 font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(20,90,69,0.25)] transition-all cursor-pointer h-11 gap-2 active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-[#E3B341]" />
                            <span>
                              {statusMessage ||
                                (lang === "hi" ? "AI सामान मिला रहा है..." : "Matching items with store...")}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4 text-[#E3B341]" />
                            <span>
                              {lang === "hi"
                                ? "✨ AI से पूरा थैला भरें (1-क्लिक मैच) →"
                                : "✨ Match All Items & Fill Cart (1-Click) →"}
                            </span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* RESULTS VIEW: MATCHED GROCERY ITEMS */
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#E6EFE8]/70 border border-[#145A45]/25">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#145A45] text-white">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0F4A38]">
                      {lang === "hi" ? "राशन लिस्ट तैयार है!" : "Ration list matched!"}
                    </h4>
                    <p className="text-[10px] text-[#5A655F]">
                      {lang === "hi"
                        ? `${matchedCount} में से ${matchedCount} सामान दुकान में उपलब्ध हैं`
                        : `${matchedCount} items matched in store inventory`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#5A655F] block">{lang === "hi" ? "कुल अनुमान" : "Total Estimate"}</span>
                  <span className="text-sm sm:text-base font-black text-[#145A45]">{inr(totalPrice)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {recognizedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      item.matched
                        ? "border-[#E4DFD5] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                        : "border-amber-200 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="size-10 rounded-xl object-contain bg-[#FAF8F2] p-1 border border-[#E4DFD5] shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-xl bg-[#FAF8F2] border border-[#E4DFD5] flex items-center justify-center text-[#145A45] shrink-0">
                          <ShoppingBag className="size-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-[#16201A] truncate">
                            {getProductName(
                              {
                                name: item.product_name,
                                name_hi: item.product_name_hi ?? null,
                                slug: item.slug,
                              },
                              item.slug
                            )}
                          </p>
                          <span className="text-[10px] font-semibold text-[#145A45] bg-[#E6EFE8] px-1.5 py-0.2 rounded-md">
                            {getVariantLabel(item.variant_label)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5A655F] truncate mt-0.5">
                          {lang === "hi" ? "पर्चे से:" : "From note:"} "{item.original_item}"
                        </p>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {item.matched ? (
                        <>
                          <div className="flex items-center rounded-xl border border-[#E4DFD5] bg-[#FAF8F2] p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="size-6 rounded-lg bg-white flex items-center justify-center text-[#16201A] hover:bg-stone-100 cursor-pointer shadow-2xs"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-[#16201A]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="size-6 rounded-lg bg-white flex items-center justify-center text-[#16201A] hover:bg-stone-100 cursor-pointer shadow-2xs"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[55px]">
                            <span className="text-xs font-black text-[#145A45] block">
                              {inr(item.unit_price * item.quantity)}
                            </span>
                            {item.mrp && item.mrp > item.unit_price && (
                              <span className="text-[10px] text-[#8C827A] line-through block">
                                {inr(item.mrp * item.quantity)}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-xl">
                          <AlertCircle className="size-3.5" />
                          <span>{lang === "hi" ? "उपलब्ध नहीं" : "Not available"}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-[#8C827A] hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-3 border-t border-[#E4DFD5] flex items-center justify-between gap-3">
          {!isDone ? (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs font-semibold text-[#5A655F] hover:text-[#16201A] cursor-pointer"
              >
                {lang === "hi" ? "बंद करें" : "Close"}
              </button>

              <Button
                type="button"
                disabled={isLoading || (activeTab === "photo" && !imagePreview) || (activeTab !== "photo" && !inputText.trim())}
                onClick={handleProcessWithGemini}
                className="rounded-2xl font-bold bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] text-xs sm:text-sm h-10 px-5 gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-[#E3B341]" />
                    <span>{statusMessage || (lang === "hi" ? "AI विश्लेषण हो रहा है..." : "Processing...")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-[#E3B341]" />
                    <span>{lang === "hi" ? "AI से थैला भरें" : "Generate Cart with AI"}</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDone(false)}
                className="rounded-xl border border-[#E4DFD5] text-xs font-semibold text-[#5A655F] hover:bg-[#FAF8F2] cursor-pointer h-9"
              >
                {lang === "hi" ? "← दोबारा पर्चा बदलें" : "← Edit List"}
              </Button>

              <Button
                type="button"
                disabled={matchedCount === 0}
                onClick={handleAddAllToCart}
                className="rounded-2xl font-bold bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] text-xs sm:text-sm h-10 px-5 gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                <ShoppingBag className="size-4 text-[#E3B341]" />
                <span>
                  {lang === "hi"
                    ? `सभी ${matchedCount} सामान थैले में जोड़ें (${inr(totalPrice)})`
                    : `Add All ${matchedCount} Items to Cart (${inr(totalPrice)})`}
                </span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
