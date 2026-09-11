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
  Plus,
  Minus,
  ArrowRight,
  Loader2,
  Trash2,
  ShoppingBag,
  AlertCircle,
  HelpCircle,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
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
  const { lang } = useLanguage();
  const cart = useCart();
  const fileInputId = useId();

  const [activeTab, setActiveTab] = useState<"photo" | "text" | "voice">(initialMode);
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [recognizedItems, setRecognizedItems] = useState<MatchedRationItem[]>([]);
  const [isDone, setIsDone] = useState(false);

  // Voice speech recognition
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  // Start Voice Recording
  const startVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        lang === "hi"
          ? "आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया टेक्स्ट लिखें।"
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

      baseTextRef.current = inputText.trim();

      const recognition = new SpeechRecognition();
      recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        playMicTone("start");
        toast.info(lang === "hi" ? "🎙️ बोलिए, AI सुन रहा है..." : "Listening...");
      };

      recognition.onresult = (event: any) => {
        let sessionTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            sessionTranscript += res[0].transcript + " ";
          }
        }
        const trimmedSession = sessionTranscript.trim();
        const base = baseTextRef.current;
        const combined = base ? `${base} ${trimmedSession}` : trimmedSession;
        setInputText(combined);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        if (err.error === "no-speech") {
          // Silent interval, don't abort
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
        playMicTone("stop");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsRecording(false);
      playMicTone("stop");
    }
  };

  // Stop Voice Recording
  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
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

    const payload = matched.map((item) => ({
      item: {
        variantId: item.variant_id!,
        productId: item.product_id!,
        slug: item.slug,
        name: item.product_name,
        variantLabel: item.variant_label,
        price: item.unit_price,
        mrp: item.mrp || item.unit_price,
        imageUrl: item.image_url,
        stock: 99,
      },
      qty: item.quantity,
    }));

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
        <DialogHeader className="pb-3 border-b border-[#E4DFD5]">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#145A45] to-[#0A3628] text-white shadow-[0_2px_6px_rgba(20,90,69,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]">
              <Sparkles className="size-4 text-[#E3B341]" />
            </span>
            <div>
              <DialogTitle className="font-sans text-base sm:text-lg font-black text-[#16201A] flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>{lang === "hi" ? "स्मार्ट राशन सहायक" : "Smart Ration Assistant"}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6EFE8] text-[#145A45] border border-[#145A45]/20">
                  {lang === "hi" ? "1-क्लिक ऑर्डर" : "1-Click Order"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#166534] border border-[#86EFAC] inline-flex items-center gap-1 shadow-2xs">
                  <Volume2 className="size-3 text-[#166534]" />
                  <span>{lang === "hi" ? "बोलकर बताएगा" : "Voice Response"}</span>
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5A655F]">
                {lang === "hi"
                  ? "पर्चे का फोटो खींचें, लिस्ट पेस्ट करें या बोलकर बताएं — सारा सामान 1-क्लिक में आपके थैले में जुड़ जाएगा।"
                  : "Upload a slip photo, paste text, or speak — items will be added to your cart instantly."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {!isDone ? (
            <>
              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FAF8F2] border border-[#E4DFD5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("photo")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "photo"
                      ? "bg-gradient-to-r from-[#145A45] to-[#0E4333] text-white shadow-[0_2px_6px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-[#5A655F] hover:text-[#16201A] hover:bg-white/60"
                  }`}
                >
                  <Camera className="size-3.5" />
                  <span>{lang === "hi" ? "पर्चा फोटो" : "Slip Photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "text"
                      ? "bg-gradient-to-r from-[#145A45] to-[#0E4333] text-white shadow-[0_2px_6px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-[#5A655F] hover:text-[#16201A] hover:bg-white/60"
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>{lang === "hi" ? "लिस्ट लिखें" : "Type List"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("voice")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "voice"
                      ? "bg-gradient-to-r from-[#145A45] to-[#0E4333] text-white shadow-[0_2px_6px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "text-[#5A655F] hover:text-[#16201A] hover:bg-white/60"
                  }`}
                >
                  <Mic className="size-3.5" />
                  <span>{lang === "hi" ? "बोलें" : "Voice"}</span>
                </button>
              </div>

              {/* TAB 1: PHOTO / CAMERA SCAN */}
              {activeTab === "photo" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    id={fileInputId}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-2xl border border-[#E4DFD5] overflow-hidden bg-stone-900/5 p-2">
                      <img
                        src={imagePreview}
                        alt="Grocery slip preview"
                        className="max-h-60 w-full object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute top-4 right-4 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={fileInputId}
                      className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-[#145A45]/30 bg-[#FAF8F2] hover:bg-[#F2EFE8] transition-all cursor-pointer text-center space-y-2 group shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <div className="size-12 rounded-2xl bg-[#E6EFE8] text-[#145A45] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_2px_6px_rgba(20,90,69,0.15)]">
                        <Camera className="size-6" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#16201A]">
                          {lang === "hi"
                            ? "कागज़ के पर्चे की फोटो खींचें या अपलोड करें"
                            : "Take a photo or upload grocery slip"}
                        </p>
                        <p className="text-[11px] text-[#5A655F] mt-0.5">
                          {lang === "hi"
                            ? "हाथ से लिखी डायरी या रसीद (PNG, JPG, HEIC)"
                            : "Handwritten list or receipt"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#145A45] mt-1 group-hover:underline">
                        <UploadCloud className="size-3.5" />
                        <span>{lang === "hi" ? "फोटो चुनें →" : "Choose File →"}</span>
                      </span>
                    </label>
                  )}

                  {/* Optional extra note for photo */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#16201A] block">
                      {lang === "hi" ? "अतिरिक्त निर्देश (ऐच्छिक)" : "Any extra note (Optional)"}
                    </label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        lang === "hi"
                          ? "उदा. तेल में केवल फॉर्च्यून चाहिए, या 1 किलो दाल और जोड़ दें"
                          : "e.g. Please choose Fortune brand for oil"
                      }
                      className="w-full h-9 rounded-xl border border-[#E4DFD5] bg-white px-3 text-xs shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:outline-none focus-visible:border-[#145A45]"
                    />
                  </div>
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

              {/* TAB 3: VOICE INPUT */}
              {activeTab === "voice" && (
                <div className="space-y-4 py-1">
                  <div className="p-5 sm:p-6 rounded-3xl border border-[#E4DFD5] bg-gradient-to-b from-[#FAF8F2] via-white to-[#F5F2EA] flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden shadow-inner">
                    {/* Pulsing Aura Rings when listening */}
                    {isRecording && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="size-36 rounded-full bg-red-500/10 animate-ping duration-1000" />
                        <div className="size-28 rounded-full bg-red-500/15 animate-pulse" />
                      </div>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`size-20 rounded-full flex items-center justify-center text-white transition-all shadow-[0_4px_16px_rgba(20,90,69,0.3)] cursor-pointer relative z-10 ${
                          isRecording
                            ? "bg-red-600 animate-pulse ring-8 ring-red-200/80 scale-105"
                            : "bg-gradient-to-br from-[#145A45] to-[#0A3628] hover:scale-105 active:scale-95"
                        }`}
                        aria-label="Toggle voice"
                      >
                        {isRecording ? <MicOff className="size-8 animate-bounce" /> : <Mic className="size-8" />}
                      </button>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs sm:text-sm font-black text-[#16201A]">
                        {isRecording
                          ? lang === "hi"
                            ? "🎙️ AI सुन रहा है... राशन का नाम और वजन बोलिए"
                            : "🎙️ Listening... speak items & weights"
                          : lang === "hi"
                            ? "माइक पर टैप करें और बोलकर बताएं"
                            : "Tap mic to speak in Hindi or English"}
                      </p>
                      <p className="text-[11.5px] text-[#5A655F] mt-1 font-medium">
                        {lang === "hi"
                          ? "उदा. '2 किलो चीनी, 1 लीटर सरसों तेल, 1 किलो चना दाल'"
                          : "e.g. '2 kg sugar, 1 litre oil, 1 kg chana dal'"}
                      </p>

                      {/* Sound Wave Graphic when recording */}
                      {isRecording && (
                        <div className="flex items-center justify-center gap-1 mt-2.5">
                          <span className="w-1 h-3.5 bg-red-500 rounded-full animate-pulse" />
                          <span className="w-1 h-6 bg-red-600 rounded-full animate-bounce delay-75" />
                          <span className="w-1 h-8 bg-red-500 rounded-full animate-bounce delay-150" />
                          <span className="w-1 h-5 bg-red-600 rounded-full animate-pulse delay-200" />
                          <span className="w-1 h-7 bg-red-500 rounded-full animate-bounce delay-100" />
                          <span className="w-1 h-3.5 bg-red-600 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#16201A] flex items-center gap-1.5">
                        <Volume2 className="size-3.5 text-[#145A45]" />
                        <span>{lang === "hi" ? "पहचाने गए शब्द (Live Voice):" : "Recognized Voice Words:"}</span>
                      </label>
                      {inputText && (
                        <button
                          type="button"
                          onClick={() => setInputText("")}
                          className="text-[10px] font-semibold text-[#8C827A] hover:text-red-600 cursor-pointer"
                        >
                          {lang === "hi" ? "साफ़ करें" : "Clear"}
                        </button>
                      )}
                    </div>

                    <Textarea
                      rows={3}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        lang === "hi"
                          ? "बोले गए शब्द यहाँ दिखेंगे... (उदा. '2 किलो चीनी, 1 लीटर सरसों तेल')"
                          : "Spoken words will appear here..."
                      }
                      className="rounded-2xl border-[#E4DFD5] bg-white p-3 text-xs shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:border-[#145A45]"
                    />

                    {/* Quick 1-Click Action Button right under voice transcript */}
                    {inputText.trim() && (
                      <button
                        type="button"
                        onClick={handleProcessWithGemini}
                        disabled={isLoading}
                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white py-2.5 px-4 font-bold text-xs sm:text-sm shadow-[0_3px_10px_rgba(20,90,69,0.25)] transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Sparkles className="size-4 text-[#E3B341]" />
                        <span>
                          {lang === "hi"
                            ? "✨ AI से सामान खोजें (1-क्लिक) →"
                            : "✨ Match Items with AI (1-Click) →"}
                        </span>
                      </button>
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
                            {item.product_name}
                          </p>
                          <span className="text-[10px] font-semibold text-[#145A45] bg-[#E6EFE8] px-1.5 py-0.2 rounded-md">
                            {item.variant_label}
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
