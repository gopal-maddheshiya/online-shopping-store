import { useState, useEffect } from "react";
import {
  Camera,
  ClipboardList,
  Mic,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface SmartRationBarProps {
  onOpenModal: (mode?: "photo" | "text" | "voice") => void;
}

const ROTATING_EXAMPLES = [
  {
    mode: "photo" as const,
    label_hi: "पर्चा फोटो",
    label_en: "Slip Photo",
    prompt_hi: "कागज पर लिखी राशन पर्ची की फोटो खींचें, AI खुद सामान जोड़ देगा",
    prompt_en: "Snap a photo of your paper slip, AI adds items to cart",
    badge_hi: "📸 पर्ची स्कैनर",
    badge_en: "📸 Slip Scanner",
  },
  {
    mode: "voice" as const,
    label_hi: "बोलकर मंगाएं",
    label_en: "Voice Order",
    prompt_hi: "माइक दबाकर बोलें: '2 किलो चीनी, 1L तेल, 500g चना दाल, चाय पत्ती'",
    prompt_en: "Tap mic & say: '2kg sugar, 1L oil, 500g dal, tea powder'",
    badge_hi: "🎙️ आवाज से ऑर्डर",
    badge_en: "🎙️ Voice Order",
  },
  {
    mode: "text" as const,
    label_hi: "लिस्ट पेस्ट करें",
    label_en: "Paste List",
    prompt_hi: "WhatsApp या डायरी की राशन लिस्ट यहाँ पेस्ट करें और 1-क्लिक में ऑर्डर करें",
    prompt_en: "Paste grocery list from WhatsApp or notes for 1-click cart",
    badge_hi: "📋 स्मार्ट लिस्ट",
    badge_en: "📋 Smart List",
  },
];

export function SmartRationBar({ onOpenModal }: SmartRationBarProps) {
  const { lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Smooth rotating examples
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
        setIsFading(false);
      }, 200);
    }, 4800);

    return () => clearInterval(interval);
  }, []);

  const active = ROTATING_EXAMPLES[currentIndex] || ROTATING_EXAMPLES[0]!;

  return (
    <section className="container-page pt-2.5 sm:pt-3.5">
      {/* ═══ Main Polished AI Concierge Container ═══ */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-white/95 border border-[#145A45]/18 p-3 sm:p-4 shadow-[0_4px_20px_rgba(20,90,69,0.06),0_1px_3px_rgba(0,0,0,0.03)] hover:border-[#145A45]/30 transition-all duration-300">
        
        {/* TOP BAR: Compact Name ("AI राशन सहायक") + Value Tag + "How It Works" Trigger */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#145A45]/10">
          <div className="flex items-center gap-2 min-w-0">
            {/* Jewel AI Sparkle Icon */}
            <div className="size-7 sm:size-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[#145A45] to-[#258B6D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="size-3.5 sm:size-4 text-[#F3E5AB]" strokeWidth={2} />
            </div>

            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="font-sans text-xs sm:text-sm font-black text-[#16201A] tracking-tight whitespace-nowrap">
                {lang === "hi" ? "AI राशन सहायक" : "AI Grocery Assistant"}
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-bold text-[#145A45] bg-[#EAF3ED] px-2 py-0.5 rounded-full border border-[#145A45]/15">
                <Zap className="size-2.5 text-[#145A45]" strokeWidth={2} />
                <span>{lang === "hi" ? "10 सेकंड में थैला भरें" : "Instant 10s Cart"}</span>
              </span>
            </div>
          </div>

          {/* "How It Works?" Interactive Toggle */}
          <button
            type="button"
            onClick={() => setShowHowItWorks((prev) => !prev)}
            className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer select-none shrink-0 ${
              showHowItWorks
                ? "bg-[#145A45] text-white shadow-xs"
                : "bg-[#F5F2EB] text-[#3D4841] hover:text-[#145A45] hover:bg-[#EBE5DA]"
            }`}
            aria-expanded={showHowItWorks}
          >
            <HelpCircle className="size-3.5 text-current" strokeWidth={2} />
            <span>{lang === "hi" ? "यह कैसे काम करता है?" : "How it works?"}</span>
            {showHowItWorks ? (
              <ChevronUp className="size-3 text-current" strokeWidth={2} />
            ) : (
              <ChevronDown className="size-3 text-current" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* EXPANDABLE "HOW IT WORKS" WALKTHROUGH STRIP */}
        {showHowItWorks && (
          <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-[#F7FBF9] to-[#F2F7F4] border border-[#145A45]/15 text-[#16201A] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-[#145A45] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#145A45]" strokeWidth={2} />
                <span>{lang === "hi" ? "3 आसान स्टेप्स — सामान खोजने का झंझट खत्म" : "3 Simple Steps — Skip Searching Manually"}</span>
              </h4>
              <span className="text-[10px] text-[#5A655F]">
                {lang === "hi" ? "100% शुद्ध दुकान रेट" : "100% Live Store Rates"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
              {/* Step 1 */}
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#E0DACF]">
                <div className="size-6 rounded-full bg-[#145A45]/10 text-[#145A45] font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-[#16201A] text-[11px] sm:text-xs">
                    {lang === "hi" ? "पर्ची, बोलकर या लिखकर दें" : "Slip, Voice or Text"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[#5A655F] leading-snug mt-0.5">
                    {lang === "hi"
                      ? "कागज की पर्ची की फोटो खींचें, माइक से बोलें या WhatsApp लिस्ट पेस्ट करें।"
                      : "Snap paper slip photo, tap mic and speak, or paste list."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#E0DACF]">
                <div className="size-6 rounded-full bg-[#145A45]/10 text-[#145A45] font-black text-[11px] flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-[#16201A] text-[11px] sm:text-xs">
                    {lang === "hi" ? "AI दुकान से मैच करेगा" : "AI Matches Store Items"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[#5A655F] leading-snug mt-0.5">
                    {lang === "hi"
                      ? "AI हर सामान का सही वजन, ब्रांड और असली दुकान रेट अपने आप जोड़ देगा।"
                      : "AI matches item pack sizes and live fair rates automatically."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#E0DACF]">
                <div className="size-6 rounded-full bg-[#145A45]/10 text-[#145A45] font-black text-[11px] flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-[#16201A] text-[11px] sm:text-xs">
                    {lang === "hi" ? "सीधा थैला तैयार व ऑर्डर" : "Instant Cart & Checkout"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[#5A655F] leading-snug mt-0.5">
                    {lang === "hi"
                      ? "पूरा सामान 1-क्लिक में कार्ट में जुड़ेगा। घर बैठे मंगाएं या दुकान से लें।"
                      : "Everything ready in your cart for quick delivery or pickup."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MIDDLE / INTERACTIVE PROMPT BAR */}
        <div
          onClick={() => onOpenModal(active.mode)}
          className="mt-2.5 px-3 py-2 rounded-xl bg-[#FAF8F3] hover:bg-[#F5F0E6] border border-[#E4DFD5] flex items-center justify-between gap-2 cursor-pointer transition-colors group select-none"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#145A45] bg-[#EAF3ED] px-2 py-0.5 rounded-md shrink-0 border border-[#145A45]/15">
              {lang === "hi" ? active.badge_hi : active.badge_en}
            </span>
            <div
              className={`transition-all duration-200 min-w-0 ${
                isFading ? "opacity-0 -translate-y-0.5" : "opacity-100 translate-y-0"
              }`}
            >
              <p className="text-xs sm:text-[13px] font-medium text-[#2C3831] truncate group-hover:text-[#145A45]">
                {lang === "hi" ? active.prompt_hi : active.prompt_en}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#145A45] shrink-0 hidden sm:inline-flex items-center gap-1">
            <span>{lang === "hi" ? "शुरू करें" : "Try Now"}</span>
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
          </span>
        </div>

        {/* BOTTOM: 3 Equal-Hierarchy, Consistent Action Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2.5">
          {/* 1. Slip Photo */}
          <button
            type="button"
            onClick={() => onOpenModal("photo")}
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 p-2 sm:py-2.5 sm:px-3 rounded-xl bg-[#FAF8F4] hover:bg-white border border-[#E0DACF] hover:border-[#145A45]/40 hover:shadow-xs text-center sm:text-left transition-all cursor-pointer active:scale-97 group"
          >
            <div className="size-8 rounded-lg bg-[#EAF3ED] text-[#145A45] flex items-center justify-center shrink-0 border border-[#145A45]/12 group-hover:scale-105 group-hover:bg-[#145A45] group-hover:text-white transition-all duration-200">
              <Camera className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-bold text-[#16201A] group-hover:text-[#145A45] leading-tight transition-colors">
                {lang === "hi" ? "पर्चा फोटो" : "Slip Photo"}
              </p>
              <p className="hidden sm:block text-[10px] text-[#6A756F] leading-tight mt-0.5">
                {lang === "hi" ? "कागज की पर्ची स्कैन करें" : "Scan paper slip"}
              </p>
            </div>
          </button>

          {/* 2. Paste List */}
          <button
            type="button"
            onClick={() => onOpenModal("text")}
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 p-2 sm:py-2.5 sm:px-3 rounded-xl bg-[#FAF8F4] hover:bg-white border border-[#E0DACF] hover:border-[#145A45]/40 hover:shadow-xs text-center sm:text-left transition-all cursor-pointer active:scale-97 group"
          >
            <div className="size-8 rounded-lg bg-[#EAF3ED] text-[#145A45] flex items-center justify-center shrink-0 border border-[#145A45]/12 group-hover:scale-105 group-hover:bg-[#145A45] group-hover:text-white transition-all duration-200">
              <ClipboardList className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-bold text-[#16201A] group-hover:text-[#145A45] leading-tight transition-colors">
                {lang === "hi" ? "लिस्ट पेस्ट करें" : "Paste List"}
              </p>
              <p className="hidden sm:block text-[10px] text-[#6A756F] leading-tight mt-0.5">
                {lang === "hi" ? "WhatsApp या डायरी से" : "From WhatsApp/Notes"}
              </p>
            </div>
          </button>

          {/* 3. Voice Order (Equal Visual Weight & Matching Icon System) */}
          <button
            type="button"
            onClick={() => onOpenModal("voice")}
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 p-2 sm:py-2.5 sm:px-3 rounded-xl bg-[#FAF8F4] hover:bg-white border border-[#E0DACF] hover:border-[#145A45]/40 hover:shadow-xs text-center sm:text-left transition-all cursor-pointer active:scale-97 group"
          >
            <div className="size-8 rounded-lg bg-[#EAF3ED] text-[#145A45] flex items-center justify-center shrink-0 border border-[#145A45]/12 group-hover:scale-105 group-hover:bg-[#145A45] group-hover:text-white transition-all duration-200">
              <Mic className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-bold text-[#16201A] group-hover:text-[#145A45] leading-tight transition-colors">
                {lang === "hi" ? "बोलकर मंगाएं" : "Voice Order"}
              </p>
              <p className="hidden sm:block text-[10px] text-[#6A756F] leading-tight mt-0.5">
                {lang === "hi" ? "माइक दबाकर नाम बोलें" : "Speak items into mic"}
              </p>
            </div>
          </button>
        </div>

      </div>
    </section>
  );
}
