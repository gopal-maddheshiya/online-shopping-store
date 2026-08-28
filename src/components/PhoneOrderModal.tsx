import { Phone, MessageCircle, ShoppingBag, MapPin, Clock, Sparkles, Send, PhoneCall } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/queries";
import { inr, telHref, waHref } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";

type PhoneOrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PhoneOrderModal({ open, onOpenChange }: PhoneOrderModalProps) {
  const { items, subtotal } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const { t, lang } = useLanguage();

  const phone = settings?.phone ?? "+91 6388354988";
  const cleanPhone = phone.replace(/\s+/g, "");
  const whatsapp = settings?.whatsapp ?? "916388354988";

  let waMessage =
    lang === "hi"
      ? `नमस्ते ${t.storeName}, मुझे किराने का सामान ऑर्डर करना है:`
      : `Namaste ${t.storeName}, I want to place a grocery order:`;

  if (items.length > 0) {
    waMessage += lang === "hi" ? `\n\n*कार्ट का सामान:*` : `\n\n*Cart Items:*`;
    items.forEach((item, idx) => {
      waMessage += `\n${idx + 1}. ${item.name} (${item.variantLabel}) - Qty: ${item.qty} (${inr(item.price * item.qty)})`;
    });
    waMessage +=
      lang === "hi"
        ? `\n\n*अनुमानित कुल राशि:* ${inr(subtotal)}`
        : `\n\n*Estimated Subtotal:* ${inr(subtotal)}`;
    waMessage +=
      lang === "hi"
        ? `\n\nकृपया महाराजगंज के लिए उपलब्धता और डिलीवरी का समय बताएं।`
        : `\n\nPlease confirm availability and delivery time for Maharajganj.`;
  } else {
    waMessage +=
      lang === "hi"
        ? `\n\nकृपया महाराजगंज होम डिलीवरी/पिकअप के लिए नवीनतम किराना लिस्ट साझा करें।`
        : `\n\nPlease share the latest grocery list or help me place an order for Maharajganj delivery/pickup.`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-3xl border border-[#E5E0D5] bg-white shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          {/* Top Cute Badge */}
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#E6EFE8] px-2.5 py-0.5 text-[11px] font-bold text-[#0F4A38]">
            <Sparkles className="size-3 text-[#145A45]" />
            <span>
              {lang === "hi" ? "त्वरित सहायता व आसान ऑर्डर" : "Direct Store Ordering & Support"}
            </span>
          </div>

          <DialogTitle className="font-sans text-xl sm:text-2xl font-black tracking-tight text-[#16201A]">
            {t.quickOrderTitle}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-[#5A655F]">
            {t.quickOrderDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 pt-2">
          {/* Cart Basket Preview (if items present) */}
          {items.length > 0 ? (
            <div className="rounded-2xl border border-[#145A45]/20 bg-[#FAF8F2] p-3.5 text-xs text-[#16201A] space-y-1 shadow-2xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-[#0F4A38]">
                  <ShoppingBag className="size-4 text-[#145A45]" /> {t.currentBasketLabel} (
                  {items.length} {lang === "hi" ? "सामान" : "items"})
                </span>
                <span className="font-black text-[#0F4A38] text-sm">{inr(subtotal)}</span>
              </div>
              <p className="text-[11px] text-[#5A655F]">
                {t.cartAutoFormatNote}
              </p>
            </div>
          ) : null}

          {/* Action Cards */}
          <div className="grid gap-2.5">
            {/* 1. Direct Phone Call Card */}
            <a
              href={telHref(cleanPhone)}
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-[#145A45]/20 bg-linear-to-br from-white via-[#FAF8F2] to-[#E6EFE8]/40 p-3.5 sm:p-4 transition-all duration-200 hover:border-[#145A45]/50 hover:shadow-md active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#145A45] text-white shadow-md shadow-[#145A45]/20 group-hover:scale-105 transition-transform">
                  <Phone className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[#16201A] group-hover:text-[#145A45] transition-colors truncate">
                    {t.callStoreDirectly}
                  </h4>
                  <p className="text-xs font-bold text-[#145A45] mt-0.5 tracking-wide">
                    {phone}
                  </p>
                  <p className="text-[10px] text-[#5A655F] mt-0.5">
                    {lang === "hi" ? "दुकानदार से सीधे बात करें" : "Speak directly with store owner"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 ml-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#145A45] px-3.5 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-[#0A3628] transition-colors">
                  <span>{t.callNow}</span>
                  <PhoneCall className="size-3.5" />
                </span>
              </div>
            </a>

            {/* 2. WhatsApp List / Chat Card */}
            <a
              href={waHref(whatsapp, waMessage)}
              target="_blank"
              rel="noreferrer"
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-[#25D366]/30 bg-linear-to-br from-white via-[#FAF8F2] to-[#25D366]/10 p-3.5 sm:p-4 transition-all duration-200 hover:border-[#25D366]/60 hover:shadow-md active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/25 group-hover:scale-105 transition-transform">
                  <MessageCircle className="size-5 fill-white text-[#25D366]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[#16201A] group-hover:text-[#15803D] transition-colors truncate">
                    {t.orderOnWhatsapp}
                  </h4>
                  <p className="text-xs text-[#5A655F] mt-0.5 truncate">
                    {t.instantChatList}
                  </p>
                  <p className="text-[10px] text-[#15803D] font-semibold mt-0.5">
                    {lang === "hi" ? "फोटो या लिस्ट भेजकर ऑर्डर करें" : "Share list, photo or voice note"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 ml-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-[#1EBE5D] transition-colors">
                  <span>{t.sendList}</span>
                  <Send className="size-3.5" />
                </span>
              </div>
            </a>
          </div>

          {/* Location & Hours Strip */}
          <div className="rounded-2xl border border-[#E5E0D5] bg-[#FAF8F2] p-3.5 space-y-2 text-xs text-[#16201A] shadow-2xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 shrink-0 text-[#145A45] mt-0.5" />
              <div className="leading-tight">
                <span className="font-bold text-[#16201A]">{t.storeLocationLabel}: </span>
                <span className="text-[#5A655F]">{t.storeAddressShort}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-[#E5E0D5]/70 pt-2">
              <Clock className="size-4 shrink-0 text-[#145A45] mt-0.5" />
              <div className="leading-tight">
                <span className="font-bold text-[#16201A]">{t.storeHoursLabel}: </span>
                <span className="text-[#5A655F]">{t.storeHoursValue}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
