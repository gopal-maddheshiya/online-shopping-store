import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Receipt,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  RotateCcw,
  Plus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { inr, formatDate, ORDER_STATUS_LABEL, PAYMENT_LABEL, telHref, waHref } from "@/lib/format";
import { settingsQuery, type Order } from "@/lib/queries";
import { OrderTimeline } from "@/components/OrderTimeline";
import { getProductImage } from "@/lib/product-images";
import { fetchOrderForTracking, subscribeToOrderRealtime } from "@/lib/orders";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceView } from "@/components/InvoiceView";
import { CancelOrderModal } from "@/components/CancelOrderModal";
import type { Invoice } from "@/lib/billing";

type TrackSearchParams = {
  orderNo?: string | undefined;
  phone?: string | undefined;
};

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): TrackSearchParams => ({
    orderNo: typeof search["orderNo"] === "string" ? (search["orderNo"] as string) : undefined,
    phone: typeof search["phone"] === "string" ? (search["phone"] as string) : undefined,
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
  const { t, lang, language = lang, getProductName, getVariantLabel } = useLanguage();
  const { add, addMultiple } = useCart();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data: settings } = useQuery(settingsQuery);

  const [orderNoInput, setOrderNoInput] = useState(search.orderNo ?? "");
  const [phoneInput, setPhoneInput] = useState(search.phone ?? "");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reorder state
  const [reorderLoading, setReorderLoading] = useState(false);
  const [singleAddingId, setSingleAddingId] = useState<string | null>(null);

  // Billing Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const storePhone = settings?.phone ?? "+91 6388354988";
  const storeWhatsApp = settings?.whatsapp ?? "916388354988";

  async function handleRepeatOrder(order: Order) {
    const itemsList =
      order.order_items && order.order_items.length > 0
        ? order.order_items
        : (order as unknown as { items?: typeof order.order_items }).items &&
            (order as unknown as { items?: typeof order.order_items }).items!.length > 0
          ? (order as unknown as { items?: typeof order.order_items }).items!
          : (order.address as unknown as { items?: typeof order.order_items })?.items ?? [];

    if (itemsList.length === 0) {
      toast.error(
        language === "hi" ? "इस ऑर्डर में कोई सामग्री नहीं मिली" : "No items found in this order to reorder",
      );
      return;
    }

    setReorderLoading(true);
    try {
      const variantIds = itemsList
        .map((i) => i.variant_id)
        .filter((id): id is string => Boolean(id));

      const liveStockMap = new Map<string, { stock: number; price: number; isActive: boolean }>();
      if (variantIds.length > 0) {
        const { data: variants } = await supabase
          .from("product_variants")
          .select("id, stock, price, is_active")
          .in("id", variantIds);

        if (variants) {
          variants.forEach((v) => {
            liveStockMap.set(v.id, {
              stock: Number(v.stock ?? 99),
              price: Number(v.price),
              isActive: v.is_active !== false,
            });
          });
        }
      }

      const itemsToAdd: Array<{
        item: {
          variantId: string;
          productId: string;
          slug: string;
          name: string;
          name_en?: string | null;
          name_hi?: string | null;
          variantLabel: string;
          variantLabel_en?: string | null;
          variantLabel_hi?: string | null;
          price: number;
          mrp: number;
          imageUrl: string | null;
          stock: number;
        };
        qty: number;
      }> = [];

      let outOfStockCount = 0;

      for (const item of itemsList) {
        const vId = item.variant_id ?? `temp-${item.id}`;
        const liveInfo = item.variant_id ? liveStockMap.get(item.variant_id) : null;

        if (liveInfo && (!liveInfo.isActive || liveInfo.stock <= 0)) {
          outOfStockCount++;
          continue;
        }

        const effectiveStock = liveInfo ? liveInfo.stock : 99;
        const effectivePrice = liveInfo ? liveInfo.price : Number(item.price);

        itemsToAdd.push({
          item: {
            variantId: vId,
            productId: item.product_id ?? item.id ?? "",
            slug: (item.name || "").toLowerCase().replace(/\s+/g, "-"),
            name: getProductName(item),
            name_en: item.name_en || item.name,
            name_hi: item.name_hi || null,
            variantLabel: getVariantLabel(item) || "1 pack",
            variantLabel_en: item.variant_label_en || item.variant_label || "1 pack",
            variantLabel_hi: item.variant_label_hi || null,
            price: effectivePrice,
            mrp: Number(item.mrp || effectivePrice),
            imageUrl: getProductImage({ name: item.name, image_url: item.image_url }),
            stock: effectiveStock,
          },
          qty: Math.min(item.qty || 1, effectiveStock),
        });
      }

      if (itemsToAdd.length === 0) {
        toast.error(
          language === "hi"
            ? "इस ऑर्डर के सभी सामान अभी आउट-ऑफ़-स्टॉक हैं"
            : "All items from this order are currently out of stock",
        );
        return;
      }

      addMultiple(itemsToAdd);

      if (outOfStockCount > 0) {
        toast.success(
          language === "hi"
            ? `ऑर्डर #${order.order_no} से ${itemsToAdd.length} सामान बास्केट में जोड़े गए (${outOfStockCount} सामान आउट-ऑफ़-स्टॉक था)`
            : `Added ${itemsToAdd.length} items from Order #${order.order_no} (${outOfStockCount} was out of stock)`,
        );
      } else {
        toast.success(
          language === "hi"
            ? `ऑर्डर #${order.order_no} के सभी ${itemsToAdd.length} सामान बास्केट में जोड़े गए!`
            : `All ${itemsToAdd.length} items from Order #${order.order_no} added to basket!`,
        );
      }

      void navigate({ to: "/cart" });
    } catch (err) {
      console.error("Repeat order error:", err);
      toast.error(language === "hi" ? "रीऑर्डर करने में समस्या हुई" : "Failed to repeat order");
    } finally {
      setReorderLoading(false);
    }
  }

  async function handleAddSingleItem(item: NonNullable<Order["order_items"]>[number]) {
    const key = item.variant_id || item.id || item.name;
    setSingleAddingId(key);
    try {
      let stock = 99;
      let price = Number(item.price);

      if (item.variant_id) {
        const { data: v } = await supabase
          .from("product_variants")
          .select("id, stock, price, is_active")
          .eq("id", item.variant_id)
          .maybeSingle();

        if (v) {
          if (v.is_active === false || Number(v.stock ?? 0) <= 0) {
            toast.error(
              language === "hi"
                ? `${getProductName(item)} अभी आउट-ऑफ़-स्टॉक है`
                : `${getProductName(item)} is currently out of stock`,
            );
            return;
          }
          stock = Number(v.stock ?? 99);
          price = Number(v.price);
        }
      }

      add(
        {
          variantId: item.variant_id ?? `temp-${item.id}`,
          productId: item.product_id ?? item.id ?? "",
          slug: (item.name || "").toLowerCase().replace(/\s+/g, "-"),
          name: getProductName(item),
          name_en: item.name_en || item.name,
          name_hi: item.name_hi || null,
          variantLabel: getVariantLabel(item) || "1 pack",
          variantLabel_en: item.variant_label_en || item.variant_label || "1 pack",
          variantLabel_hi: item.variant_label_hi || null,
          price,
          mrp: Number(item.mrp || price),
          imageUrl: getProductImage({ name: item.name, image_url: item.image_url }),
          stock,
        },
        1,
      );

      toast.success(
        language === "hi"
          ? `${getProductName(item)} बास्केट में जोड़ा गया!`
          : `Added ${getProductName(item)} to basket!`,
      );
    } catch (e) {
      console.error("Add single item error:", e);
      toast.error(language === "hi" ? "सामान जोड़ने में विफल" : "Failed to add item");
    } finally {
      setSingleAddingId(null);
    }
  }

  async function handleOpenInvoice(order: Order) {
    setInvoiceLoading(true);
    try {
      const { data, error } = await supabase.rpc("lookup_order_invoice", {
        p_order_no: order.order_no,
        p_phone: order.customer_phone,
      });

      if (error || !data) {
        throw new Error(error?.message || "Could not load verified invoice");
      }

      setActiveInvoice(data as unknown as Invoice);
      setInvoiceModalOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load receipt");
    } finally {
      setInvoiceLoading(false);
    }
  }

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
    if (!searchedOrder?.id && !searchedOrder?.order_no) return;

    const targetId = searchedOrder.id;
    const targetNo = searchedOrder.order_no;

    const unsub = subscribeToOrderRealtime(
      targetId,
      (partial) => {
        setSearchedOrder((prev) => {
          if (!prev) return null;
          const newStatus = partial.status ?? prev.status;
          if (newStatus && newStatus !== prev.status) {
            toast.info(
              language === "hi"
                ? `🔔 ऑर्डर स्थिति अपडेट: ${ORDER_STATUS_LABEL[newStatus] ?? newStatus}`
                : `🔔 Order status updated: ${ORDER_STATUS_LABEL[newStatus] ?? newStatus}`
            );
          }
          return {
            ...prev,
            ...partial,
            status: partial.status || prev.status,
            notes: partial.notes !== undefined ? partial.notes : prev.notes,
            payment_status: (partial.payment_status ?? prev.payment_status ?? null) as string | null,
          };
        });

        // Refetch full order in background while preserving the latest realtime status
        const activeOrderNo = targetNo || orderNoInput;
        const activePhone = phoneInput || searchedOrder.customer_phone;
        if (activeOrderNo && activePhone) {
          void fetchOrderForTracking(activeOrderNo, activePhone).then(({ order }) => {
            if (order) {
              setSearchedOrder((curr) => {
                if (!curr) return order;
                return {
                  ...order,
                  status: partial.status || curr.status || order.status,
                  notes: partial.notes !== undefined ? partial.notes : (curr.notes ?? null),
                  payment_status: (partial.payment_status ?? curr.payment_status ?? null) as string | null,
                };
              });
            }
          });
        }
      },
      targetNo
    );

    return unsub;
  }, [searchedOrder?.id, searchedOrder?.order_no, language, orderNoInput, phoneInput]);


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
      <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-[#E4DFD5] bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)]">
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
              className="rounded-xl font-mono text-sm border-[#E4DFD5] bg-[#FAF8F2]/60 focus:bg-white h-11 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
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
              className="rounded-xl text-sm border-[#E4DFD5] bg-[#FAF8F2]/60 focus:bg-white h-11 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl font-bold sm:col-span-2 bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] text-white hover:from-[#0F4A38] hover:to-[#07271D] h-11 shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
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
          <Skeleton className="h-28 w-full rounded-2xl bg-[#E4DFD5]/50" />
          <Skeleton className="h-64 w-full rounded-2xl bg-[#E4DFD5]/50" />
        </div>
      ) : null}

      {/* Order Result View */}
      {searchedOrder && !loading ? (
        <div className="mx-auto mt-10 max-w-3xl space-y-6">
          {/* Order Header Card */}
          <div className="rounded-3xl border border-[#E4DFD5] bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DFD5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-2xl font-bold text-[#1F2924]">
                    {searchedOrder.order_no}
                  </h2>
                  <span className="rounded-full bg-[#145A45]/10 border border-[#145A45]/20 px-3 py-0.5 text-xs font-bold text-[#145A45]">
                    {ORDER_STATUS_LABEL[searchedOrder.status] ?? searchedOrder.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6B746F]">
                  {language === "hi" ? "ऑर्डर दिनांक:" : "Placed on"} {formatDate(searchedOrder.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={reorderLoading}
                  onClick={() => handleRepeatOrder(searchedOrder)}
                  className="rounded-xl gap-1.5 text-xs font-bold bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white h-9 shadow-[0_2px_6px_rgba(20,90,69,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                >
                  <RotateCcw className={`size-3.5 ${reorderLoading ? "animate-spin" : ""}`} />
                  {language === "hi" ? "यही सामान फिर से मंगवाएं" : "Repeat Order"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={invoiceLoading}
                  onClick={() => handleOpenInvoice(searchedOrder)}
                  className="rounded-xl gap-1.5 text-xs font-bold border-[#145A45]/30 text-[#145A45] bg-[#E6EFE8]/70 hover:bg-[#145A45] hover:text-white h-9 shadow-[0_1px_2px_rgba(20,90,69,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all cursor-pointer"
                >
                  <Receipt className="size-3.5" />
                  {language === "hi" ? "बिल व रसीद देखें / प्रिंट" : "Official Invoice"}
                </Button>

                {searchedOrder.status === "placed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelModalOpen(true)}
                    className="rounded-xl gap-1.5 text-xs font-bold border-red-200 text-red-700 bg-red-50/70 hover:bg-red-600 hover:text-white h-9 shadow-[0_1px_2px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all cursor-pointer"
                  >
                    <XCircle className="size-3.5" />
                    {language === "hi" ? "ऑर्डर रद्द करें" : "Cancel Order"}
                  </Button>
                )}

                <a
                  href={waHref(
                    storeWhatsApp,
                    `नमस्ते अरुण गोपाल ट्रेडर्स, मैं अपने ऑर्डर *${searchedOrder.order_no}* (राशि: ₹${searchedOrder.total}) की डिलीवरी स्थिति के बारे में पूछना चाहता हूँ।`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#15803D] text-white px-3.5 py-2 text-xs font-bold shadow-[0_2px_6px_rgba(37,211,102,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-[#1EBE5D] hover:to-[#166534] transition-all cursor-pointer"
                >
                  <MessageCircle className="size-3.5" /> WhatsApp Support
                </a>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="mt-4">
              <OrderTimeline
                currentStatus={searchedOrder.status}
                orderType={searchedOrder.order_type}
                events={searchedOrder.order_events}
              />
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fulfillment & Address */}
            <div className="rounded-3xl border border-[#E4DFD5] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)]">
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
                    <p className="rounded-xl bg-[#FAF8F2] border border-[#E4DFD5] p-2.5 italic text-[#1F2924] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      {searchedOrder.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="rounded-3xl border border-[#E4DFD5] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)]">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-sans text-base font-bold text-[#1F2924]">
                  <Package className="size-4 text-[#145A45]" /> Bill &amp; Payment Summary
                </h3>
                {searchedOrder.payment_status === "paid" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 shadow-[0_1px_2px_rgba(16,185,129,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <CheckCircle2 className="size-3" /> {t.paymentStatusPaid}
                  </span>
                ) : searchedOrder.payment_status === "failed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700 shadow-[0_1px_2px_rgba(239,68,68,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <AlertCircle className="size-3" /> {t.paymentStatusFailed}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-[0_1px_2px_rgba(245,158,11,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <Clock className="size-3" /> {t.paymentStatusPending}
                  </span>
                )}
              </div>

              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Payment Mode:</dt>
                  <dd className="font-semibold text-[#1F2924]">
                    {PAYMENT_LABEL[searchedOrder.payment_method] ?? searchedOrder.payment_method.toUpperCase()}
                  </dd>
                </div>

                {searchedOrder.transaction_id || (searchedOrder as { gateway_payment_id?: string }).gateway_payment_id ? (
                  <div className="flex justify-between text-[#6B746F]">
                    <dt>Transaction Ref:</dt>
                    <dd className="font-mono text-[11px] font-bold text-[#0F4A38]">
                      {searchedOrder.transaction_id || (searchedOrder as { gateway_payment_id?: string }).gateway_payment_id}
                    </dd>
                  </div>
                ) : null}

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
                <div className="flex justify-between border-t border-[#E4DFD5] pt-2 text-base font-bold text-[#1F2924]">
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
              <div className="rounded-3xl border border-[#E4DFD5] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4DFD5] pb-3">
                  <div>
                    <h3 className="font-sans text-base font-bold text-[#1F2924]">
                      {language === "hi"
                        ? `ऑर्डर की गई सामग्री (${itemsList.length})`
                        : `Items Ordered (${itemsList.length})`}
                    </h3>
                    <p className="text-[11px] text-[#6B746F]">
                      {language === "hi"
                        ? "आप पूरा राशन एक साथ या अपनी पसंद का एक-एक सामान बास्केट में जोड़ सकते हैं।"
                        : "Reorder the entire basket or add individual items."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={reorderLoading}
                    onClick={() => handleRepeatOrder(searchedOrder)}
                    className="rounded-xl gap-1.5 text-xs font-bold bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white h-8 shadow-[0_2px_6px_rgba(20,90,69,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
                  >
                    <RotateCcw className={`size-3 ${reorderLoading ? "animate-spin" : ""}`} />
                    {language === "hi" ? "पूरा राशन रीऑर्डर करें" : "Reorder All"}
                  </Button>
                </div>

                <div className="mt-3 divide-y divide-[#E4DFD5]">
                  {itemsList.map((item, idx) => {
                    const itemKey = item.variant_id || item.id || `${idx}`;
                    const isAddingThis = singleAddingId === itemKey;

                    return (
                      <div
                        key={item.id ?? `item-${idx}`}
                        className="flex items-center justify-between gap-3 py-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage({
                              name: item.name,
                              image_url: item.image_url,
                            })}
                            alt={getProductName(item)}
                            className="size-12 rounded-xl object-contain bg-[#FAF8F2] p-1 border border-[#E4DFD5] shadow-[inset_0_1px_0_rgba(255,255,255,1)]"
                          />
                          <div>
                            <p className="font-semibold text-[#1F2924]">{getProductName(item)}</p>
                            <p className="text-[#6B746F]">
                              {getVariantLabel(item)} × {item.qty}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-[#1F2924]">{inr(item.price * item.qty)}</p>
                            <p className="text-[10px] text-[#6B746F]">{inr(item.price)} each</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAddingThis}
                            onClick={() => handleAddSingleItem(item)}
                            className="h-8 rounded-xl border-[#145A45]/30 text-[#145A45] bg-[#E6EFE8]/70 hover:bg-[#145A45] hover:text-white px-3 text-xs font-bold cursor-pointer shadow-[0_1px_2px_rgba(20,90,69,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all shrink-0"
                          >
                            <Plus className="mr-1 size-3" />
                            {language === "hi" ? "जोड़ें" : "Add"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Assistance Card */}
          <div className="rounded-3xl border border-[#145A45]/20 bg-[#FAF8F2] p-6 text-center shadow-[0_2px_8px_rgba(20,90,69,0.03),inset_0_1px_0_rgba(255,255,255,0.9)]">
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

      {/* Official Verified Invoice View Dialog */}
      <InvoiceView
        invoice={activeInvoice}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        lang={language as "hi" | "en"}
      />

      {/* Customer Cancellation Dialog */}
      <CancelOrderModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        order={searchedOrder}
        onSuccess={() => {
          if (searchedOrder) {
            setSearchedOrder({
              ...searchedOrder,
              status: "cancelled",
              updated_at: new Date().toISOString(),
            });
          }
        }}
      />
    </div>
  );
}
