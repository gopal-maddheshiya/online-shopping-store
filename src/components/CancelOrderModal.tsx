import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { cancelOrderAsCustomer } from "@/lib/orders";
import type { Order } from "@/lib/queries";

const CANCEL_REASONS = [
  {
    id: "wrong_item",
    hi: "गलती से दूसरा सामान या पैक साइज़ चुन लिया",
    en: "Ordered wrong item or pack size by mistake",
  },
  {
    id: "change_address",
    hi: "डिलीवरी पता या मोबाइल नंबर बदलना है",
    en: "Need to change delivery address or contact number",
  },
  {
    id: "not_needed",
    hi: "सामान की अब आवश्यकता नहीं है",
    en: "Items are no longer needed",
  },
  {
    id: "duplicate",
    hi: "गलती से दो बार ऑर्डर हो गया",
    en: "Placed duplicate order by mistake",
  },
  {
    id: "other",
    hi: "अन्य कारण (कारण लिखें)",
    en: "Other reason (please specify)",
  },
] as const;

interface CancelOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSuccess?: () => void;
}

export function CancelOrderModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: CancelOrderModalProps) {
  const { lang } = useLanguage();
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0].id);
  const [customReason, setCustomReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  if (!order) return null;

  const handleConfirmCancel = async () => {
    let finalReason = "";
    const matched = CANCEL_REASONS.find((r) => r.id === selectedReason);

    if (selectedReason === "other") {
      finalReason = customReason.trim() || (lang === "hi" ? "अन्य कारण" : "Other reason");
    } else if (matched) {
      finalReason = lang === "hi" ? matched.hi : matched.en;
    } else {
      finalReason = lang === "hi" ? "ग्राहक द्वारा रद्द किया गया" : "Cancelled by customer";
    }

    setIsCancelling(true);
    try {
      const itemsSnapshot = (order.order_items || []).map((it) => ({
        variant_id: it.variant_id,
        qty: it.qty,
      }));

      const res = await cancelOrderAsCustomer({
        orderId: order.id,
        orderNo: order.order_no,
        customerPhone: order.customer_phone,
        reason: finalReason,
        items: itemsSnapshot,
      });

      if (res.success) {
        toast.success(
          lang === "hi"
            ? `ऑर्डर #${order.order_no} सफलतापूर्वक रद्द कर दिया गया है।`
            : `Order #${order.order_no} has been cancelled successfully.`
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || (lang === "hi" ? "ऑर्डर रद्द नहीं हो सका" : "Could not cancel order"));
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error(lang === "hi" ? "ऑर्डर रद्द करने में त्रुटि हुई" : "Error cancelling order");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 border border-[#E8E4DA] bg-white shadow-xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200 shrink-0">
              <XCircle className="size-6" />
            </div>
            <div>
              <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                {lang === "hi" ? "ऑर्डर रद्द करें" : "Cancel Order"}
              </DialogTitle>
              <p className="text-xs text-[#6B746F]">
                {lang === "hi" ? "ऑर्डर क्रमांक:" : "Order No:"} <span className="font-mono font-bold text-[#1F2924]">#{order.order_no}</span>
              </p>
            </div>
          </div>
          <DialogDescription className="text-xs text-[#6B746F] pt-1">
            {lang === "hi"
              ? "कृपया ऑर्डर रद्द करने का कारण चुनें। रद्द करने के बाद दुकान से यह सामान डिलीवर नहीं होगा और स्टॉक वापस जुड़ जाएगा।"
              : "Please select the reason for cancellation. Once cancelled, this order will not be delivered and stock will be restored."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#1F2924]">
              {lang === "hi" ? "रद्द करने का कारण:" : "Reason for cancellation:"}
            </Label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 border cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#145A45] bg-[#E6EFE8]/40 text-[#145A45] font-semibold"
                        : "border-[#E8E4DA] bg-white text-[#1F2924] hover:bg-[#FAF8F2]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={r.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 accent-[#145A45]"
                    />
                    <span className="leading-snug">{lang === "hi" ? r.hi : r.en}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-1.5 animate-fadeIn">
              <Label className="text-xs font-semibold text-[#1F2924]">
                {lang === "hi" ? "कारण का विवरण:" : "Specify reason:"}
              </Label>
              <Textarea
                rows={2}
                placeholder={lang === "hi" ? "कृपया कारण लिखें..." : "Please describe..."}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="rounded-xl text-xs border-[#E8E4DA]"
              />
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              {lang === "hi"
                ? "नोट: यदि आपने ऑनलाइन भुगतान किया था, तो स्टोर से रिफंड या क्रेडिट के लिए संपर्क किया जाएगा।"
                : "Note: If you already made an online payment, store staff will contact you regarding refund processing."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
          <Button
            type="button"
            variant="outline"
            disabled={isCancelling}
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-semibold border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-9"
          >
            {lang === "hi" ? "नहीं, ऑर्डर रखें" : "Keep Order"}
          </Button>

          <Button
            type="button"
            disabled={isCancelling}
            onClick={handleConfirmCancel}
            className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white h-9 shadow-xs"
          >
            {isCancelling ? (
              <span>{lang === "hi" ? "रद्द हो रहा है..." : "Cancelling..."}</span>
            ) : (
              <span>{lang === "hi" ? "हाँ, ऑर्डर रद्द करें" : "Yes, Cancel Order"}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
