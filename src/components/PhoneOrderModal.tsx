import { Phone, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const phone = settings?.phone ?? "+916388354988";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t.quickOrderTitle}
          </DialogTitle>
          <DialogDescription>
            {t.quickOrderDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {items.length > 0 ? (
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="size-4 text-primary" /> {t.currentBasketLabel} ({items.length}{" "}
                  {lang === "hi" ? "सामान" : "items"})
                </span>
                <span>{inr(subtotal)}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {t.cartAutoFormatNote}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3">
            <a
              href={telHref(phone)}
              className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Phone className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t.callStoreDirectly}</h4>
                  <p className="text-xs text-muted-foreground">{phone}</p>
                </div>
              </div>
              <Button size="sm">{t.callNow}</Button>
            </a>

            <a
              href={waHref(whatsapp, waMessage)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 p-4 transition-colors hover:bg-success/10"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-success text-success-foreground">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t.orderOnWhatsapp}</h4>
                  <p className="text-xs text-muted-foreground">{t.instantChatList}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-success/40 text-success hover:bg-success/10"
              >
                {t.sendList}
              </Button>
            </a>
          </div>

          <div className="rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
            📍 <strong>{t.storeLocationLabel}:</strong> {t.storeAddressShort}
            <br />
            🕒 <strong>{t.storeHoursLabel}:</strong> {t.storeHoursValue}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
