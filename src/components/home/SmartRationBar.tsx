import { useState } from "react";
import {
  Store,
  HelpCircle,
  Camera,
  Mic,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SmartRationBarProps {
  onOpenModal: (mode?: "photo" | "text" | "voice") => void;
}

export function SmartRationBar({ onOpenModal }: SmartRationBarProps) {
  const { lang } = useLanguage();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <>
      <section className="md:hidden bg-white border-b border-[#E5E7EB] shadow-xs">
        <div className="container-page py-2">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
            
            {/* 1. AI सहायक ("thoda lamba sa" Elongated Capsule with Store Icon) */}
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="group flex items-center gap-2 rounded-2xl bg-[#EDF8F1] border border-[#DDF3E4] hover:bg-[#E4F7EA] hover:border-[#CEEED8] px-2.5 py-1.5 text-left transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title={lang === "hi" ? "AI राशन सहायक कैसे काम करता है? देखें" : "How AI Grocery Assistant Works"}
            >
              {/* Clean White Elevated Tile with Store Icon (No Sparkle) */}
              <div className="grid size-8 place-items-center rounded-xl bg-white border border-[#DDF3E4] text-[#145A45] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Store className="size-4.5" strokeWidth={2.2} />
              </div>

              {/* Text Info */}
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-sans text-[11px] font-extrabold text-[#145A45] tracking-tight whitespace-nowrap">
                    {lang === "hi" ? "AI सहायक" : "AI Assistant"}
                  </span>
                  <span className="text-[7.5px] font-black text-[#145A45] bg-white/90 border border-[#DDF3E4] px-1 py-0.2 rounded-full leading-none shadow-2xs">
                    10s
                  </span>
                </div>
                <span className="text-[9.5px] font-semibold text-[#2D5A43] flex items-center gap-0.5 mt-0.5 whitespace-nowrap">
                  <span>{lang === "hi" ? "कैसे काम करता है?" : "How it works"}</span>
                  <span className="text-[8.5px] font-bold">ⓘ</span>
                </span>
              </div>
            </button>

            {/* Subtle Vertical Divider */}
            <div className="h-7.5 w-px bg-[#E5E7EB] shrink-0 mx-0.5" />

            {/* 3 Quick Action Items (Right) */}
            <div className="flex items-center justify-around flex-1 gap-1">
              
              {/* 1. पर्ची (Camera) */}
              <button
                type="button"
                onClick={() => onOpenModal("photo")}
                className="group flex flex-col items-center justify-center flex-1 py-1 rounded-xl hover:bg-[#F8FAF9] transition-all cursor-pointer select-none text-center active:scale-95"
                title={lang === "hi" ? "पर्ची की फोटो भेजें" : "Upload Slip"}
              >
                <div className="size-8 flex items-center justify-center text-[#16201A] group-hover:text-[#145A45] group-hover:scale-110 transition-transform">
                  <Camera className="size-5" strokeWidth={2.1} />
                </div>
                <span className="mt-0.5 font-sans text-xs font-semibold text-[#16201A] group-hover:text-[#145A45] tracking-tight leading-none">
                  {lang === "hi" ? "पर्ची" : "Slip"}
                </span>
              </button>

              {/* 2. बोलें (Mic) */}
              <button
                type="button"
                onClick={() => onOpenModal("voice")}
                className="group flex flex-col items-center justify-center flex-1 py-1 rounded-xl hover:bg-[#F8FAF9] transition-all cursor-pointer select-none text-center active:scale-95"
                title={lang === "hi" ? "बोलकर सामान मंगाएं" : "Speak Items"}
              >
                <div className="size-8 flex items-center justify-center text-[#16201A] group-hover:text-[#145A45] group-hover:scale-110 transition-transform">
                  <Mic className="size-5" strokeWidth={2.1} />
                </div>
                <span className="mt-0.5 font-sans text-xs font-semibold text-[#16201A] group-hover:text-[#145A45] tracking-tight leading-none">
                  {lang === "hi" ? "बोलें" : "Voice"}
                </span>
              </button>

              {/* 3. लिस्ट (ClipboardList) */}
              <button
                type="button"
                onClick={() => onOpenModal("text")}
                className="group flex flex-col items-center justify-center flex-1 py-1 rounded-xl hover:bg-[#F8FAF9] transition-all cursor-pointer select-none text-center active:scale-95"
                title={lang === "hi" ? "सामान की लिस्ट लिखें या पेस्ट करें" : "Type/Paste List"}
              >
                <div className="size-8 flex items-center justify-center text-[#16201A] group-hover:text-[#145A45] group-hover:scale-110 transition-transform">
                  <ClipboardList className="size-5" strokeWidth={2.1} />
                </div>
                <span className="mt-0.5 font-sans text-xs font-semibold text-[#16201A] group-hover:text-[#145A45] tracking-tight leading-none">
                  {lang === "hi" ? "लिस्ट" : "List"}
                </span>
              </button>

            </div>

            {/* Right Help Pill for Tablet */}
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#5A655F] hover:text-[#145A45] px-2.5 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#145A45]/30 bg-[#FAF8F5] hover:bg-white shadow-2xs transition-all cursor-pointer shrink-0 ml-1"
            >
              <HelpCircle className="size-3.5 text-[#145A45]" />
              <span>{lang === "hi" ? "कैसे काम करता है?" : "How it works?"}</span>
            </button>

          </div>
        </div>
      </section>

      {/* ═══ "How It Works" Clean Popup Dialog ═══ */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-md sm:max-w-lg p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB]">
          <DialogHeader className="text-left space-y-1 pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Store className="size-5 sm:size-6 text-[#145A45] shrink-0" strokeWidth={2.2} />
              <DialogTitle className="text-base sm:text-lg font-black text-[#16201A]">
                {lang === "hi" ? "AI राशन सहायक कैसे काम करता है?" : "How AI Grocery Assistant Works"}
              </DialogTitle>
            </div>
            <p className="text-xs text-[#5A655F]">
              {lang === "hi"
                ? "दुकान में सामान खोजने का झंझट खत्म — 3 आसान तरीकों से 100% सही रेट पर ऑर्डर!"
                : "Skip searching shelf by shelf — fill your cart in 3 quick steps!"}
            </p>
          </DialogHeader>

          <div className="space-y-2.5 py-2 text-xs">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F0F7F2] border border-[#D6EADB]">
              <div className="size-7 rounded-xl bg-[#145A45] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div>
                <p className="font-bold text-[#145A45] text-xs sm:text-sm">
                  {lang === "hi" ? "पर्ची फोटो, आवाज या लिस्ट दें" : "Slip, Voice or Text"}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3D4841] leading-relaxed mt-0.5">
                  {lang === "hi"
                    ? "कागज पर लिखी पर्ची की फोटो खींचें, माइक दबाकर सामान बोलें, या WhatsApp लिस्ट पेस्ट करें।"
                    : "Snap a photo of your handwritten paper slip, tap the mic to speak items, or paste a list from WhatsApp."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F2F6FF] border border-[#D3E2FD]">
              <div className="size-7 rounded-xl bg-[#1D4ED8] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                2
              </div>
              <div>
                <p className="font-bold text-[#1D4ED8] text-xs sm:text-sm">
                  {lang === "hi" ? "AI दुकान से मैच करेगा" : "AI Matches Live Store Items"}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3D4841] leading-relaxed mt-0.5">
                  {lang === "hi"
                    ? "Gemini AI हर सामान का सही वजन, ब्रांड और दुकान का 100% असली रेट अपने आप सेट कर देगा।"
                    : "Gemini AI automatically detects quantities, packs, and maps them to Arun Gopal Traders live inventory."}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFF8EE] border border-[#F6DCBA]">
              <div className="size-7 rounded-xl bg-[#D97706] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                3
              </div>
              <div>
                <p className="font-bold text-[#D97706] text-xs sm:text-sm">
                  {lang === "hi" ? "सीधा थैला तैयार व 1-क्लिक ऑर्डर" : "Instant Cart & Fast Delivery"}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3D4841] leading-relaxed mt-0.5">
                  {lang === "hi"
                    ? "पूरा सामान कार्ट में जुड़ जाएगा। घर बैठे होम डिलीवरी पाएं या दुकान से सीधा पिकअप लें।"
                    : "Review your items and checkout with fast home delivery or in-store pickup."}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowHowItWorks(false);
                onOpenModal("photo");
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#145A45] to-[#258B6D] hover:from-[#0F4A38] hover:to-[#1E7259] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <span>{lang === "hi" ? "अभी आज़माएं (पर्चा फोटो या बोलकर)" : "Try AI Now"}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
