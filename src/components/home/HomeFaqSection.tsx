import { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/lib/i18n";
import { CORE_FAQ_ITEMS } from "@/lib/seo";
import { waHref, telHref } from "@/lib/format";
import { cn } from "@/lib/utils";

interface HomeFaqSectionProps {
  storePhone?: string | undefined;
  storeWhatsApp?: string | undefined;
}

export function HomeFaqSection({
  storePhone = "+91 6388354988",
  storeWhatsApp = "916388354988",
}: HomeFaqSectionProps) {
  const { lang } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [openItem, setOpenItem] = useState<string>("");

  const isHindi = lang === "hi";

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className="container-page py-3 sm:py-4"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div
        className={cn(
          "rounded-2xl sm:rounded-3xl border border-[#E2E8E4] bg-gradient-to-br from-[#FCFBF8] via-white to-[#F0F5F1]/40 shadow-[0_2px_12px_-2px_rgba(20,90,69,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-300",
          isExpanded ? "p-4 sm:p-7" : "p-3 sm:p-4 hover:border-[#145A45]/30 hover:shadow-sm"
        )}
      >
        {/* Compact Header Bar (Always Visible & Clickable) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          className="flex items-center justify-between gap-3 cursor-pointer select-none group"
          aria-expanded={isExpanded}
        >
          {/* Left Title & Description */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="flex size-8.5 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] border border-[#CADBCF] text-[#145A45] shadow-2xs group-hover:scale-105 transition-transform">
              <HelpCircle className="size-4 sm:size-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-xs sm:text-base font-extrabold text-[#16201A] tracking-tight group-hover:text-[#145A45] transition-colors truncate">
                  {isHindi
                    ? "अक्सर पूछे जाने वाले सवाल (FAQ)"
                    : "Frequently Asked Questions (FAQ)"}
                </h3>
                <span className="hidden xs:inline-flex items-center rounded-full bg-[#145A45]/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#145A45]">
                  {CORE_FAQ_ITEMS.length} {isHindi ? "सवाल" : "Q&As"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#5A655F] truncate mt-0.5">
                {isHindi
                  ? "डिलीवरी, दुकान समय, शुद्धता व आर्डर से जुड़ी जानकारी"
                  : "Quick answers about delivery, store hours & online orders"}
              </p>
            </div>
          </div>

          {/* Right Action Trigger Pill */}
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs pointer-events-none",
                isExpanded
                  ? "bg-[#EAF3ED] text-[#145A45] border border-[#CADBCF]"
                  : "bg-[#145A45] text-white hover:bg-[#0E4333]"
              )}
            >
              <span>
                {isExpanded
                  ? (isHindi ? "सवाल छुपाएं" : "Hide")
                  : (isHindi ? "सवाल देखें" : "View FAQs")}
              </span>
              {isExpanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5 group-hover:translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Content Area */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#E8ECE9] animate-in fade-in-50 duration-200">
            {/* 2-Column FAQ Grid on Desktop, 1-Column on Mobile */}
            <Accordion
              type="single"
              collapsible
              value={openItem}
              onValueChange={setOpenItem}
              className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 items-start"
            >
              {CORE_FAQ_ITEMS.map((item, index) => {
                const question = isHindi ? item.q_hi : item.q_en;
                const answer = isHindi ? item.a_hi : item.a_en;
                const valueKey = `faq-${index}`;

                return (
                  <AccordionItem
                    key={index}
                    value={valueKey}
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                    className="rounded-xl border border-[#E5EAE6] bg-white px-3.5 sm:px-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-[#145A45]/30 data-[state=open]:border-[#145A45] data-[state=open]:shadow-[0_2px_8px_rgba(20,90,69,0.06)]"
                  >
                    <AccordionTrigger className="hover:no-underline py-2.5 sm:py-3 text-left font-bold text-xs sm:text-sm text-[#16201A] group">
                      <span
                        itemProp="name"
                        className="flex items-center gap-2 group-hover:text-[#145A45] transition-colors pr-2"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[#F0F5F1] text-[10px] font-extrabold text-[#145A45] group-data-[state=open]:bg-[#145A45] group-data-[state=open]:text-white transition-colors">
                          {index + 1}
                        </span>
                        <span className="leading-snug">{question}</span>
                      </span>
                    </AccordionTrigger>

                    <AccordionContent
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                      className="pt-0 pb-3 text-xs sm:text-[13px] text-[#4A5550] leading-relaxed border-t border-[#F0F2F0]"
                    >
                      <div itemProp="text" className="pl-7 pt-2">
                        {answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Quick Contact & Collapse Bar */}
            <div className="mt-4 pt-3.5 border-t border-[#E8ECE9] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="text-[11px] sm:text-xs text-[#5A655F]">
                {isHindi
                  ? "कोई अन्य सवाल है? हमसे तुरंत WhatsApp या फ़ोन पर पूछें:"
                  : "Have another question? Ask us directly on WhatsApp or call:"}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={waHref(storeWhatsApp, "Namaste! I have a question about grocery order.")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#145A45] hover:bg-[#0E4333] px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95 transition-all"
                >
                  <MessageCircle className="size-3.5 fill-white text-[#145A45]" />
                  <span>{isHindi ? "WhatsApp" : "WhatsApp"}</span>
                </a>
                <a
                  href={telHref(storePhone)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5E0D5] bg-white hover:bg-[#F4F7F4] px-3 py-1.5 text-xs font-bold text-[#16201A] shadow-2xs active:scale-95 transition-all"
                >
                  <Phone className="size-3.5 text-[#145A45]" />
                  <span>{isHindi ? "कॉल करें" : "Call"}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-transparent hover:border-[#D5E0D5] px-2.5 py-1.5 text-xs font-semibold text-[#5A655F] hover:text-[#16201A] transition-all"
                >
                  <ChevronUp className="size-3.5" />
                  <span>{isHindi ? "छुपाएं" : "Close"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
