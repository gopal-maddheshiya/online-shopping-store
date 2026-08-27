export function inr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

export function discountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function telHref(phone: string): string {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

export function waHref(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function prettyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return "+91 " + digits;
}

export const ORDER_STATUS_FLOW = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  preparing: "Preparing",
  ready: "Ready for Delivery / Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
  returned: "Returned",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on Delivery",
  pay_at_store: "Pay at Store",
  upi: "UPI",
  online: "Online Payment",
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
