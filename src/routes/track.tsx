import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Package,
  Phone,
  MessageCircle,
  Printer,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTimeline } from "@/components/OrderTimeline";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type Order } from "@/lib/queries";
import { inr, telHref, waHref, ORDER_STATUS_LABEL, PAYMENT_LABEL, formatDate } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";

type TrackSearch = {
  orderNo?: string | undefined;
  phone?: string | undefined;
};

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): TrackSearch => ({
    orderNo: typeof search["orderNo"] === "string" ? search["orderNo"] : undefined,
    phone: typeof search["phone"] === "string" ? search["phone"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | My Orders & Track" },
      {
        name: "description",
        content:
          "Track live status, dispatch timeline, and delivery of your grocery order from Arun Gopal Traders, Maharajganj.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const search = Route.useSearch();
  const { data: settings } = useQuery(settingsQuery);

  const [orderNoInput, setOrderNoInput] = useState(search.orderNo ?? "");
  const [phoneInput, setPhoneInput] = useState(search.phone ?? "");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const storePhone = settings?.phone ?? "+916388354988";
  const storeWhatsApp = settings?.whatsapp ?? "916388354988";

  async function fetchOrder(orderNo: string, phone: string) {
    if (!orderNo.trim() || !phone.trim()) return;

    setLoading(true);
    setErrorMsg("");
    try {
      // First attempt RPC lookup
      const { data: rpcData, error: rpcError } = await supabase.rpc("lookup_order", {
        _order_no: orderNo.trim(),
        _phone: phone.trim(),
      });

      if (!rpcError && rpcData) {
        setSearchedOrder(rpcData as unknown as Order);
        return;
      }

      // Fallback query if RPC differs
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_events(*)")
        .ilike("order_no", orderNo.trim())
        .ilike("customer_phone", `%${cleanPhone}%`)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setErrorMsg(
          "No order found matching this Order Number and Mobile Number. Please check and try again.",
        );
        setSearchedOrder(null);
      } else {
        setSearchedOrder(data as unknown as Order);
      }
    } catch (err: unknown) {
      console.error("Order lookup error:", err);
      setErrorMsg(
        "Unable to fetch order details. Please contact the store directly at +91 6388354988.",
      );
      setSearchedOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (search.orderNo && search.phone) {
      void fetchOrder(search.orderNo, search.phone);
    } else {
      // Check if last order exists in localStorage
      const lastPhone = localStorage.getItem("agt.last_phone");
      if (lastPhone) {
        setPhoneInput((prev) => prev || lastPhone);
      }
    }
  }, [search.orderNo, search.phone]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNoInput.trim()) {
      setErrorMsg("Please enter your Order Number (e.g. AGT-1001)");
      return;
    }
    if (!phoneInput.trim()) {
      setErrorMsg("Please enter your 10-digit mobile number");
      return;
    }
    void fetchOrder(orderNoInput, phoneInput);
  }

  return (
    <div className="container-page py-6 sm:py-8 pb-28 lg:pb-12">
      {/* Title */}
      <div className="text-center">
        <span className="inline-block rounded-md bg-[#E6EFE8] px-3 py-1 text-xs font-bold text-[#0F4A38]">
          Live Order Status
        </span>
        <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-[#16201A] sm:text-4xl">
          Track Your Grocery Order
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#5A655F]">
          Enter your Order Number and Mobile Number below to see live preparation &amp; delivery
          updates.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-xs">
        <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="track-order-no" className="text-xs font-semibold text-[#16201A]">
              Order ID / Number
            </Label>
            <Input
              id="track-order-no"
              placeholder="e.g. AGT-1001"
              value={orderNoInput}
              onChange={(e) => setOrderNoInput(e.target.value.toUpperCase())}
              className="rounded-lg font-mono text-sm border-[#E5E0D5] bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="track-phone" className="text-xs font-semibold text-[#16201A]">
              Registered Mobile Number
            </Label>
            <Input
              id="track-phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="rounded-lg text-sm border-[#E5E0D5] bg-white"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="rounded-lg font-bold sm:col-span-2 bg-[#145A45] text-white hover:bg-[#0A3628] h-10 shadow-xs"
          >
            <Search className="mr-2 size-4" /> {loading ? "Searching…" : "Track Order Status"}
          </Button>
        </form>

        {errorMsg ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-[#E5E0D5]/50" />
          <Skeleton className="h-64 w-full rounded-2xl bg-[#E5E0D5]/50" />
        </div>
      ) : null}

      {/* Order Result View */}
      {searchedOrder && !loading ? (
        <div className="mx-auto mt-10 max-w-3xl space-y-6">
          {/* Order Header Card */}
          <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-2xl font-bold text-[#16201A]">
                    {searchedOrder.order_no}
                  </h2>
                  <span className="rounded-md bg-[#E6EFE8] px-2.5 py-0.5 text-xs font-bold text-[#0F4A38]">
                    {ORDER_STATUS_LABEL[searchedOrder.status] ?? searchedOrder.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5A655F]">
                  Placed on {formatDate(searchedOrder.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-lg gap-1.5 text-xs font-semibold border-[#E5E0D5] text-[#16201A]"
                >
                  <Printer className="size-3.5" /> Print Receipt
                </Button>
                <a
                  href={waHref(
                    storeWhatsApp,
                    `Namaste Arun Gopal Traders, I am checking on my Order *${searchedOrder.order_no}* for ₹${searchedOrder.total}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#145A45] text-white px-3.5 py-2 text-xs font-bold shadow-xs hover:bg-[#0A3628]"
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
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-xs">
              <h3 className="flex items-center gap-2 font-sans text-base font-bold text-[#16201A]">
                <MapPin className="size-4 text-[#145A45]" /> Delivery &amp; Contact Info
              </h3>

              <div className="mt-4 space-y-2 text-xs">
                <div>
                  <span className="text-[#5A655F]">Customer Name:</span>
                  <p className="font-semibold text-[#16201A]">{searchedOrder.customer_name}</p>
                </div>
                <div>
                  <span className="text-[#5A655F]">Contact Phone:</span>
                  <p className="font-semibold text-[#16201A]">
                    +91 {searchedOrder.customer_phone}
                  </p>
                </div>
                <div>
                  <span className="text-[#5A655F]">Order Type:</span>
                  <p className="font-semibold capitalize text-[#16201A]">
                    {searchedOrder.order_type} in Maharajganj
                  </p>
                </div>
                {searchedOrder.order_type === "delivery" && searchedOrder.address ? (
                  <div>
                    <span className="text-[#5A655F]">Delivery Address:</span>
                    <p className="font-medium text-[#16201A]">
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
                    <span className="text-[#5A655F]">Store Pickup Address:</span>
                    <p className="font-medium text-[#16201A]">
                      Arun Gopal Traders, Ramnagar, Adda Bazar Road, Maharajganj, UP
                    </p>
                  </div>
                )}
                {searchedOrder.notes ? (
                  <div className="pt-2">
                    <span className="text-[#5A655F]">Instructions:</span>
                    <p className="rounded-lg bg-[#FAF8F2] border border-[#E5E0D5] p-2 italic text-[#16201A]">
                      {searchedOrder.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-xs">
              <h3 className="flex items-center gap-2 font-sans text-base font-bold text-[#16201A]">
                <Package className="size-4 text-[#145A45]" /> Bill &amp; Payment Summary
              </h3>

              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#5A655F]">
                  <dt>Payment Method:</dt>
                  <dd className="font-semibold text-[#16201A]">
                    {PAYMENT_LABEL[searchedOrder.payment_method] ?? searchedOrder.payment_method}
                  </dd>
                </div>
                <div className="flex justify-between text-[#5A655F]">
                  <dt>Items Subtotal:</dt>
                  <dd className="font-medium text-[#16201A]">{inr(searchedOrder.subtotal)}</dd>
                </div>
                {searchedOrder.discount > 0 ? (
                  <div className="flex justify-between text-[#15803D]">
                    <dt>
                      Coupon Discount{" "}
                      {searchedOrder.coupon_code ? `(${searchedOrder.coupon_code})` : ""}:
                    </dt>
                    <dd className="font-bold">-{inr(searchedOrder.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-[#5A655F]">
                  <dt>Delivery Fee:</dt>
                  <dd className="font-medium text-[#16201A]">
                    {searchedOrder.delivery_fee === 0 ? "FREE" : inr(searchedOrder.delivery_fee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#E5E0D5] pt-2 text-base font-bold text-[#16201A]">
                  <dt>Total Amount Paid / Due:</dt>
                  <dd className="font-sans font-black text-[#0F4A38]">{inr(searchedOrder.total)}</dd>
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
              <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-xs">
                <h3 className="font-sans text-base font-bold text-[#16201A]">
                  Items Ordered ({itemsList.length})
                </h3>

                <div className="mt-4 divide-y divide-[#E5E0D5]">
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
                          className="size-12 rounded-lg object-contain bg-white p-0.5"
                        />
                        <div>
                          <p className="font-semibold text-[#16201A]">{item.name}</p>
                          <p className="text-[#5A655F]">
                            {item.variant_label} × {item.qty}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#16201A]">{inr(item.price * item.qty)}</p>
                        <p className="text-[10px] text-[#5A655F]">{inr(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Bottom Store Assistance Card */}
          <div className="rounded-2xl border border-[#145A45]/20 bg-[#FAF8F2] p-6 text-center shadow-xs">
            <h4 className="font-sans text-lg font-bold text-[#16201A]">
              Have Questions or Need Quick Delivery?
            </h4>
            <p className="mx-auto mt-1 max-w-md text-xs text-[#5A655F]">
              Call Arun Gopal Traders directly or connect on WhatsApp for immediate grocery
              assistance in Maharajganj.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-lg font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs">
                <a href={telHref(storePhone)}>
                  <Phone className="mr-1.5 size-4" /> Call {storePhone}
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-lg border-[#E5E0D5] text-[#0F4A38] bg-white hover:bg-[#E6EFE8]"
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
