import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Package,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Printer,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { inr, formatDate, ORDER_STATUS_LABEL, PAYMENT_LABEL, telHref, waHref } from "@/lib/format";
import { settingsQuery, type Order } from "@/lib/queries";
import { OrderTimeline } from "@/components/OrderTimeline";
import { getProductImage } from "@/lib/product-images";
import { fetchOrderForTracking, subscribeToOrderRealtime } from "@/lib/orders";

type TrackSearchParams = {
  orderNo?: string;
  phone?: string;
};

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): TrackSearchParams => ({
    orderNo: typeof search.orderNo === "string" ? search.orderNo : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Grocery Order | Arun Gopal Traders Maharajganj" },
      {
        name: "description",
        content:
          "Track your grocery delivery or store pickup in Maharajganj. Live status updates from Arun Gopal Traders.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { t, language } = useLanguage();
  const search = Route.useSearch();
  const { data: settings } = useQuery(settingsQuery);

  const [orderNoInput, setOrderNoInput] = useState(search.orderNo ?? "");
  const [phoneInput, setPhoneInput] = useState(search.phone ?? "");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const storePhone = settings?.phone ?? "+91 6388354988";
  const storeWhatsApp = settings?.whatsapp ?? "916388354988";

  async function fetchOrder(orderNo: string, phone: string) {
    if (!orderNo.trim() || !phone.trim()) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const { order, error } = await fetchOrderForTracking(orderNo, phone);
      if (error || !order) {
        setErrorMsg(
          language === "hi"
            ? "इस ऑर्डर नंबर और मोबाइल नंबर से कोई ऑर्डर नहीं मिला। कृपया नंबर जांचें।"
            : "No order found matching this Order Number and Mobile Number. Please check and try again."
        );
        setSearchedOrder(null);
      } else {
        setSearchedOrder(order);
      }
    } catch (err: unknown) {
      console.error("Order lookup error:", err);
      setErrorMsg(
        language === "hi"
          ? "ऑर्डर की जानकारी लोड करने में समस्या हुई। कृपया स्टोर से सीधे संपर्क करें: +91 6388354988"
          : "Unable to fetch order details. Please contact the store directly at +91 6388354988."
      );
      setSearchedOrder(null);
    } finally {
      setLoading(false);
    }
  }

  // Subscribe to Realtime Status updates
  useEffect(() => {
    if (!searchedOrder?.id) return;

    const unsub = subscribeToOrderRealtime(searchedOrder.id, (partial) => {
      setSearchedOrder((prev) => {
        if (!prev) return null;
        const newStatus = partial.status ?? prev.status;
        if (newStatus !== prev.status) {
          toast.info(
            language === "hi"
              ? `🔔 ऑर्डर स्थिति अपडेट: ${ORDER_STATUS_LABEL[newStatus] ?? newStatus}`
              : `🔔 Order status updated: ${ORDER_STATUS_LABEL[newStatus] ?? newStatus}`
          );
        }
        return { ...prev, ...partial };
      });

      // Refetch full order with updated timeline events
      if (orderNoInput && phoneInput) {
        void fetchOrderForTracking(orderNoInput, phoneInput).then(({ order }) => {
          if (order) setSearchedOrder(order);
        });
      }
    });

    return unsub;
  }, [searchedOrder?.id, language, orderNoInput, phoneInput]);

  useEffect(() => {
    if (search.orderNo && search.phone) {
      void fetchOrder(search.orderNo, search.phone);
    } else {
      const lastPhone = localStorage.getItem("agt.last_phone");
      if (lastPhone) {
        setPhoneInput((prev) => prev || lastPhone);
      }
    }
  }, [search.orderNo, search.phone]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNoInput.trim()) {
      setErrorMsg(language === "hi" ? "कृपया अपना ऑर्डर नंबर दर्ज करें (उदा. AGT-1001)" : "Please enter your Order Number (e.g. AGT-1001)");
      return;
    }
    if (!phoneInput.trim()) {
      setErrorMsg(language === "hi" ? "कृपया अपना 10 अंकों का मोबाइल नंबर दर्ज करें" : "Please enter your 10-digit mobile number");
      return;
    }
    void fetchOrder(orderNoInput, phoneInput);
  }

  return (
    <div className="container-page py-6 sm:py-8 pb-28 lg:pb-12">
      {/* Title */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-[#145A45]/10 px-3.5 py-1 text-xs font-bold text-[#145A45]">
          {language === "hi" ? "लाइव ऑर्डर ट्रैकिंग" : "Live Order Status"}
        </span>
        <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-[#1F2924] sm:text-4xl">
          {language === "hi" ? "अपने किराना ऑर्डर को ट्रैक करें" : "Track Your Grocery Order"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#6B746F]">
          {language === "hi"
            ? "अपना ऑर्डर नंबर और मोबाइल नंबर दर्ज करें और लाइव डिलीवरी व पैकिंग स्थिति देखें।"
            : "Enter your Order Number and Mobile Number below to see live preparation & delivery updates."}
        </p>
      </div>

      {/* Lookup Form */}
      <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs">
        <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="track-order-no" className="text-xs font-bold text-[#1F2924]">
              {language === "hi" ? "ऑर्डर आईडी / नंबर" : "Order ID / Number"}
            </Label>
            <Input
              id="track-order-no"
              placeholder="e.g. AGT-1001"
              value={orderNoInput}
              onChange={(e) => setOrderNoInput(e.target.value.toUpperCase())}
              className="rounded-xl font-mono text-sm border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="track-phone" className="text-xs font-bold text-[#1F2924]">
              {language === "hi" ? "पंजीकृत मोबाइल नंबर" : "Registered Mobile Number"}
            </Label>
            <Input
              id="track-phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="rounded-xl text-sm border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl font-bold sm:col-span-2 bg-[#145A45] text-white hover:bg-[#0E4333] h-11 shadow-xs"
          >
            <Search className="mr-2 size-4" />{" "}
            {loading
              ? language === "hi"
                ? "खोज रहे हैं…"
                : "Searching…"
              : language === "hi"
              ? "ऑर्डर की स्थिति देखें"
              : "Track Order Status"}
          </Button>
        </form>

        {errorMsg ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-[#E8E4DA]/50" />
          <Skeleton className="h-64 w-full rounded-2xl bg-[#E8E4DA]/50" />
        </div>
      ) : null}

      {/* Order Result View */}
      {searchedOrder && !loading ? (
        <div className="mx-auto mt-10 max-w-3xl space-y-6">
          {/* Order Header Card */}
          <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E4DA] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-2xl font-bold text-[#1F2924]">
                    {searchedOrder.order_no}
                  </h2>
                  <span className="rounded-full bg-[#145A45]/10 px-3 py-0.5 text-xs font-bold text-[#145A45]">
                    {ORDER_STATUS_LABEL[searchedOrder.status] ?? searchedOrder.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6B746F]">
                  {language === "hi" ? "ऑर्डर दिनांक:" : "Placed on"} {formatDate(searchedOrder.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-xl gap-1.5 text-xs font-semibold border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-9"
                >
                  <Printer className="size-3.5" /> Print Receipt
                </Button>
                <a
                  href={waHref(
                    storeWhatsApp,
                    `नमस्ते अरुण गोपाल ट्रेडर्स, मैं अपने ऑर्डर *${searchedOrder.order_no}* (राशि: ₹${searchedOrder.total}) की डिलीवरी स्थिति के बारे में पूछना चाहता हूँ।`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] text-white px-3.5 py-2 text-xs font-bold shadow-xs hover:bg-[#1EBE5B]"
                >
                  <MessageCircle className="size-3.5" /> WhatsApp Support
                </a>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="mt-4">
              <OrderTimeline
                currentStatus={searchedOrder.status}
                events={searchedOrder.order_events}
              />
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fulfillment & Address */}
            <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 shadow-2xs">
              <h3 className="flex items-center gap-2 font-sans text-base font-bold text-[#1F2924]">
                <MapPin className="size-4 text-[#145A45]" /> Delivery &amp; Contact Info
              </h3>

              <div className="mt-4 space-y-2 text-xs">
                <div>
                  <span className="text-[#6B746F]">Customer Name:</span>
                  <p className="font-semibold text-[#1F2924]">{searchedOrder.customer_name}</p>
                </div>
                <div>
                  <span className="text-[#6B746F]">Contact Phone:</span>
                  <p className="font-semibold text-[#1F2924]">
                    +91 {searchedOrder.customer_phone}
                  </p>
                </div>
                <div>
                  <span className="text-[#6B746F]">Order Type:</span>
                  <p className="font-semibold capitalize text-[#1F2924]">
                    {searchedOrder.order_type === "delivery" ? "Home Delivery (महाराजगंज)" : "Store Pickup"}
                  </p>
                </div>
                {searchedOrder.order_type === "delivery" && searchedOrder.address ? (
                  <div>
                    <span className="text-[#6B746F]">Delivery Address:</span>
                    <p className="font-medium text-[#1F2924]">
                      {[
                        searchedOrder.address.house,
                        searchedOrder.address.area,
                        searchedOrder.address.landmark
                          ? `(Landmark: ${searchedOrder.address.landmark})`
                          : null,
                        searchedOrder.address.city ?? "Maharajganj",
                        searchedOrder.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-[#6B746F]">Store Pickup Address:</span>
                    <p className="font-medium text-[#1F2924]">
                      {t.storeName}, Ramnagar, Adda Bazar Road, Maharajganj, UP
                    </p>
                  </div>
                )}
                {searchedOrder.notes ? (
                  <div className="pt-2">
                    <span className="text-[#6B746F]">Instructions:</span>
                    <p className="rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-2.5 italic text-[#1F2924]">
                      {searchedOrder.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 shadow-2xs">
              <h3 className="flex items-center gap-2 font-sans text-base font-bold text-[#1F2924]">
                <Package className="size-4 text-[#145A45]" /> Bill &amp; Payment Summary
              </h3>

              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Payment Method:</dt>
                  <dd className="font-semibold text-[#1F2924]">
                    {PAYMENT_LABEL[searchedOrder.payment_method] ?? searchedOrder.payment_method}
                  </dd>
                </div>
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Items Subtotal:</dt>
                  <dd className="font-medium text-[#1F2924]">{inr(searchedOrder.subtotal)}</dd>
                </div>
                {searchedOrder.discount > 0 ? (
                  <div className="flex justify-between text-[#145A45]">
                    <dt>
                      Coupon Discount{" "}
                      {searchedOrder.coupon_code ? `(${searchedOrder.coupon_code})` : ""}:
                    </dt>
                    <dd className="font-bold">-{inr(searchedOrder.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Delivery Fee:</dt>
                  <dd className="font-medium text-[#1F2924]">
                    {searchedOrder.delivery_fee === 0 ? "FREE" : inr(searchedOrder.delivery_fee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#E8E4DA] pt-2 text-base font-bold text-[#1F2924]">
                  <dt>Total Amount:</dt>
                  <dd className="font-sans font-bold text-[#145A45]">{inr(searchedOrder.total)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Ordered Items List */}
          {(() => {
            const itemsList =
              searchedOrder.order_items && searchedOrder.order_items.length > 0
                ? searchedOrder.order_items
                : (searchedOrder as unknown as { items?: typeof searchedOrder.order_items }).items &&
                    (searchedOrder as unknown as { items?: typeof searchedOrder.order_items }).items!
                      .length > 0
                  ? (searchedOrder as unknown as { items?: typeof searchedOrder.order_items }).items!
                  : (searchedOrder.address as unknown as { items?: typeof searchedOrder.order_items })
                        ?.items ?? [];

            return (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 shadow-2xs">
                <h3 className="font-sans text-base font-bold text-[#1F2924]">
                  Items Ordered ({itemsList.length})
                </h3>

                <div className="mt-4 divide-y divide-[#E8E4DA]">
                  {itemsList.map((item, idx) => (
                    <div
                      key={item.id ?? `item-${idx}`}
                      className="flex items-center justify-between gap-4 py-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImage({
                            name: item.name,
                            image_url: item.image_url,
                          })}
                          alt={item.name}
                          className="size-12 rounded-xl object-contain bg-[#FAF8F2] p-1 border border-[#E8E4DA]"
                        />
                        <div>
                          <p className="font-semibold text-[#1F2924]">{item.name}</p>
                          <p className="text-[#6B746F]">
                            {item.variant_label} × {item.qty}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1F2924]">{inr(item.price * item.qty)}</p>
                        <p className="text-[10px] text-[#6B746F]">{inr(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Assistance Card */}
          <div className="rounded-3xl border border-[#145A45]/20 bg-[#FAF8F2] p-6 text-center shadow-2xs">
            <h4 className="font-sans text-lg font-bold text-[#1F2924]">
              {language === "hi" ? "कोई प्रश्न है या त्वरित सहायता चाहिए?" : "Have Questions or Need Quick Delivery?"}
            </h4>
            <p className="mx-auto mt-1 max-w-md text-xs text-[#6B746F]">
              {language === "hi"
                ? "महाराजगंज में त्वरित किराना सहायता के लिए अरुण गोपाल ट्रेडर्स से सीधे संपर्क करें।"
                : "Call Arun Gopal Traders directly or connect on WhatsApp for immediate grocery assistance in Maharajganj."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] shadow-xs">
                <a href={telHref(storePhone)}>
                  <Phone className="mr-1.5 size-4" /> Call {storePhone}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-[#E8E4DA] text-[#145A45] bg-white hover:bg-[#FAF8F2]"
              >
                <Link to="/shop">
                  Continue Shopping <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
