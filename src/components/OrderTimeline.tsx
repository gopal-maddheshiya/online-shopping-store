import { CheckCircle2, Clock, Package, Truck, Check, XCircle, Store } from "lucide-react";
import {
  ORDER_STATUS_FLOW_DELIVERY,
  ORDER_STATUS_FLOW_PICKUP,
  getOrderStatusLabel,
} from "@/lib/format";
import { useLanguage } from "@/lib/i18n";

export type OrderTimelineProps = {
  currentStatus: string;
  orderType?: "delivery" | "pickup" | string | null | undefined;
  events?:
    Array<{ status: string; created_at: string; note?: string | null | undefined }> | undefined;
};

const STEP_ICONS: Record<string, typeof Package> = {
  placed: Clock,
  confirmed: CheckCircle2,
  preparing: Package,
  ready: Store, // Store pickup ready
  out_for_delivery: Truck,
  delivered: Check,
};

export function OrderTimeline({ currentStatus, orderType = "delivery", events }: OrderTimelineProps) {
  const { lang, language = lang } = useLanguage();
  const isCancelled = currentStatus === "cancelled" || currentStatus === "rejected";
  const isReturned = currentStatus === "returned";

  const isPickup = orderType === "pickup";
  const statusFlow = isPickup ? ORDER_STATUS_FLOW_PICKUP : ORDER_STATUS_FLOW_DELIVERY;

  if (isCancelled || isReturned) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
        <XCircle className="mx-auto size-8 text-destructive" />
        <h4 className="mt-2 font-semibold text-destructive">
          {language === "hi" ? "ऑर्डर" : "Order"} {getOrderStatusLabel(currentStatus, language, isPickup ? "pickup" : "delivery")}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {language === "hi"
            ? "यदि इस रद्दीकरण के संबंध में आपका कोई प्रश्न है, तो कृपया अरुण गोपाल ट्रेडर्स से +91 6388354988 पर संपर्क करें।"
            : "If you have questions regarding this cancellation, please contact Arun गोपाल Traders at +91 6388354988."}
        </p>
      </div>
    );
  }

  // Calculate current index in the active flow
  let currentIndex = statusFlow.indexOf(currentStatus as (typeof statusFlow)[number]);
  if (currentIndex === -1) {
    // Fallback if status is out_for_delivery on a pickup order
    if (currentStatus === "out_for_delivery") currentIndex = 3;
    else currentIndex = 0;
  }

  return (
    <div className="w-full py-4">
      {/* Desktop & Tablet Timeline */}
      <div
        className={`hidden sm:grid ${
          isPickup ? "sm:grid-cols-5" : "sm:grid-cols-6"
        } sm:gap-2`}
      >
        {statusFlow.map((status, index) => {
          const isDone = currentIndex >= index;
          const isCurrent = currentIndex === index;
          const Icon = STEP_ICONS[status] ?? Package;
          const event = events?.find((e) => e.status === status);

          return (
            <div key={status} className="flex flex-col items-center text-center">
              <div className="relative flex w-full items-center justify-center">
                {index > 0 ? (
                  <div
                    className={`absolute top-4 right-1/2 left-0 -z-10 h-0.5 -translate-y-1/2 ${
                      isDone ? "bg-primary" : "bg-border"
                    }`}
                  />
                ) : null}
                {index < statusFlow.length - 1 ? (
                  <div
                    className={`absolute top-4 left-1/2 right-0 -z-10 h-0.5 -translate-y-1/2 ${
                      currentIndex > index ? "bg-primary" : "bg-border"
                    }`}
                  />
                ) : null}
                <div
                  className={`grid size-8 place-items-center rounded-full border-2 transition-all ${
                    isDone
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                >
                  <Icon className="size-4" />
                </div>
              </div>
              <p
                className={`mt-2 text-xs font-semibold ${
                  isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {getOrderStatusLabel(status, language, isPickup ? "pickup" : "delivery")}
              </p>
              {event?.created_at ? (
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(event.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="space-y-4 sm:hidden">
        {statusFlow.map((status, index) => {
          const isDone = currentIndex >= index;
          const isCurrent = currentIndex === index;
          const Icon = STEP_ICONS[status] ?? Package;
          const event = events?.find((e) => e.status === status);

          return (
            <div key={status} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div
                  className={`grid size-7 place-items-center rounded-full border-2 ${
                    isDone
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                >
                  <Icon className="size-3.5" />
                </div>
                {index < statusFlow.length - 1 ? (
                  <div
                    className={`h-6 w-0.5 ${currentIndex > index ? "bg-primary" : "bg-border"}`}
                  />
                ) : null}
              </div>
              <div className="flex-1 pb-1">
                <p
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-primary font-semibold"
                      : isDone
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {getOrderStatusLabel(status, language, isPickup ? "pickup" : "delivery")}
                </p>
                {event?.created_at ? (
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
