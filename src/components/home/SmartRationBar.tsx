import { useState, useEffect } from "react";
import { Camera, FileText, Mic, Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export interface SmartRationBarProps {
  onOpenModal: (mode?: "photo" | "text" | "voice") => void;
}

const ROTATING_MESSAGES = [
  {
    mode: "photo" as const,
    badge_hi: "📸 पर्चा फोटो स्कैनर",
    badge_en: "📸 Slip Photo Scanner",
    title_hi: "हाथ से लिखी राशन पर्ची की फोटो अपलोड करें",
    desc_hi: "AI पर्चे का हर सामान पढ़कर सीधे अरुण गोपाल ट्रेडर्स के सही रेट और पैकिंग में आपके थैले में जोड़ देगा।",
    title_en: "Upload handwritten grocery slip photo",
    desc_en: "AI automatically reads items from your photo and adds matching products to your cart with live store rates.",
    btn_hi: "पर्चा फोटो",
    btn_en: "Photo Scan",
  },
  {
    mode: "voice" as const,
    badge_hi: "🎙️ बोलकर राशन मंगाएं",
    badge_en: "🎙️ Order by Voice",
    title_hi: "माइक दबाकर बोलें — '2 किलो चीनी, 1L तेल, 1kg चना दाल'",
    desc_hi: "आपकी बोलचाल सुनकर पूरी राशन लिस्ट सिर्फ 10 सेकंड में आपके थैले में तैयार हो जाएगी।",
    title_en: "Tap mic and speak — '2kg sugar, 1L oil, 1kg dal'",
    desc_en: "Speaks Hindi & local terms to quickly build your full month grocery order.",
    btn_hi: "बोलकर मंगाएं",
    btn_en: "Speak List",
  },
  {
    mode: "text" as const,
    badge_hi: "✍️ राशन लिस्ट पेस्ट करें",
    badge_en: "✍️ Paste Grocery List",
    title_hi: "WhatsApp या डायरी की राशन लिस्ट यहाँ पेस्ट करें",
    desc_hi: "पूरी लिस्ट एक बार में टाइप या पेस्ट करें, 1 क्लिक में पूरा सामान थैले में जुड़ जाएगा।",
    title_en: "Paste your grocery list from WhatsApp or notes",
    desc_en: "Paste raw grocery text and let AI convert it into an instant shopping cart.",
    btn_hi: "लिस्ट लिखें",
    btn_en: "Paste List",
  },
  {
    mode: "photo" as const,
    badge_hi: "✨ 1-क्लिक थैला भरें",
    badge_en: "✨ 1-Click Ration Order",
    title_hi: "दुकान के शुद्ध सामान और लाइव रेट से 100% सटीक मैच",
    desc_hi: "बाजार जाने या घंटों सामान ढूंढने की जरूरत नहीं — घर बैठे सेकंडों में अपना राशन थैला भरें।",
    title_en: "100% matched to store inventory & live fair rates",
    desc_en: "Skip the market queues — order fresh ration from Arun Gopal Traders in Maharajganj in seconds.",
    btn_hi: "थैला भरें",
    btn_en: "Start Now",
  },
];

export function SmartRationBar({ onOpenModal }: SmartRationBarProps) {
  const { lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Relaxed reading interval: 6.8 seconds + Pause when user hovers/interacts
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
        setIsFading(false);
      }, 250);
    }, 6800);

    return () => clearInterval(interval);
  }, [isPaused, currentIndex]);

  const current = ROTATING_MESSAGES[currentIndex] || ROTATING_MESSAGES[0]!;

  return (
    <section className="container-page pt-2 sm:pt-3">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#145A45]/20 bg-gradient-to-br from-[#FCFBF8] via-white to-[#F5F2EB] p-3.5 sm:p-5 shadow-[0_3px_14px_rgba(20,90,69,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#145A45]/35 transition-all"
      >
        {/* Soft Ambient Brand Flare */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#145A45]/5 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 size-40 rounded-full bg-[#E3B341]/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          {/* TOP / LEFT: Full-width Breathing Room for Text (NO CUTOFF, NO SQUEEZE) */}
          <div
            onClick={() => onOpenModal(current.mode)}
            className="flex-1 min-w-0 cursor-pointer select-none"
          >
            {/* Badge & Dots Row */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E6EFE8] border border-[#145A45]/20 px-2.5 py-0.5 text-[11px] font-black text-[#145A45] tracking-wide shadow-2xs">
                <span>{lang === "hi" ? current.badge_hi : current.badge_en}</span>
              </span>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5 pr-1">
                {ROTATING_MESSAGES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? "w-5 bg-[#145A45]"
                        : "w-1.5 bg-[#145A45]/20 hover:bg-[#145A45]/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Rotating Title & Full Description */}
            <div
              className={`transition-all duration-220 ease-out ${
                isFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
              }`}
            >
              <h3 className="font-sans text-sm sm:text-base font-extrabold text-[#16201A] leading-snug">
                {lang === "hi" ? current.title_hi : current.title_en}
              </h3>
              <p className="font-sans text-xs sm:text-[13px] text-[#5A655F] leading-relaxed mt-1">
                {lang === "hi" ? current.desc_hi : current.desc_en}
              </p>
            </div>
          </div>

          {/* BOTTOM / RIGHT: Action Buttons with Generous Touch Targets */}
          <div className="flex items-center gap-2 shrink-0 pt-0.5 md:pt-0">
            {/* 1. Photo Slip Button */}
            <button
              type="button"
              onClick={() => onOpenModal("photo")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                current.mode === "photo"
                  ? "bg-[#145A45] text-white hover:bg-[#0E4333] shadow-[0_2px_8px_rgba(20,90,69,0.25)]"
                  : "bg-white border border-[#DCD6CA] text-[#16201A] hover:bg-[#FAF8F2] hover:border-[#145A45]/40"
              }`}
            >
              <Camera className="size-4" />
              <span>{lang === "hi" ? "पर्चा फोटो" : "Slip Photo"}</span>
            </button>

            {/* 2. Paste List Button */}
            <button
              type="button"
              onClick={() => onOpenModal("text")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                current.mode === "text"
                  ? "bg-[#145A45] text-white hover:bg-[#0E4333] shadow-[0_2px_8px_rgba(20,90,69,0.25)]"
                  : "bg-white border border-[#DCD6CA] text-[#16201A] hover:bg-[#FAF8F2] hover:border-[#145A45]/40"
              }`}
            >
              <FileText className="size-4" />
              <span>{lang === "hi" ? "लिस्ट लिखें" : "Write List"}</span>
            </button>

            {/* 3. Voice Button */}
            <button
              type="button"
              onClick={() => onOpenModal("voice")}
              className={`inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                current.mode === "voice"
                  ? "bg-[#145A45] text-white hover:bg-[#0E4333] shadow-[0_2px_8px_rgba(20,90,69,0.25)]"
                  : "bg-white border border-[#DCD6CA] text-[#145A45] hover:bg-[#FAF8F2] hover:border-[#145A45]/40"
              }`}
              title={lang === "hi" ? "बोलकर मंगाएं" : "Speak to Order"}
            >
              <Mic className="size-4" />
              <span className="hidden xs:inline">{lang === "hi" ? "बोलें" : "Voice"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
