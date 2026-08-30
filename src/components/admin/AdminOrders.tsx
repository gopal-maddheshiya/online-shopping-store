import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Phone,
  MessageCircle,
  Printer,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Check,
  XCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  UserCheck,
  Receipt,
  RotateCcw,
  DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { inr, formatDate, telHref, waHref, ORDER_STATUS_LABEL } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import type { Order } from "@/lib/queries";
import { OrderTimeline } from "@/components/OrderTimeline";
import { updateOrderStatus, updatePaymentStatus, subscribeToOrderRealtime } from "@/lib/orders";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceView } from "@/components/InvoiceView";
import type { Invoice } from "@/lib/billing";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdminOrdersProps = {
  orders: Order[];
  onRefresh: () => void;
  selectedOrder?: Order | null;
  setSelectedOrder?: React.Dispatch<React.SetStateAction<Order | null>>;
};


const STATUS_FILTERS = [
  { value: "all", label: "All Statuses (सभी स्थितियां)" },
  { value: "placed", label: "Order Placed (प्राप्त)" },
  { value: "confirmed", label: "Confirmed (स्वीकृत)" },
  { value: "preparing", label: "Preparing (पैकिंग)" },
  { value: "ready", label: "Ready for Delivery" },
  { value: "out_for_delivery", label: "Out for Delivery (रास्ते में)" },
  { value: "delivered", label: "Delivered (डिलीवर)" },
  { value: "cancelled", label: "Cancelled (रद्द)" },
];

export function AdminOrders({
  orders,
  onRefresh,
  selectedOrder: controlledSelectedOrder,
  setSelectedOrder: controlledSetSelectedOrder,
}: AdminOrdersProps) {
  const { lang, language = lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQueueTab, setActiveQueueTab] = useState<
    "active" | "placed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled" | "all"
  >("active");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [internalSelectedOrder, setInternalSelectedOrder] = useState<Order | null>(null);

  const selectedOrder = controlledSelectedOrder !== undefined ? controlledSelectedOrder : internalSelectedOrder;
  const setSelectedOrder = controlledSetSelectedOrder || setInternalSelectedOrder;

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState<string | null>(null);

  // Billing & Invoice State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Refund Dialog State
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");

  // Queue Counts
  const activeCount = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
  const placedCount = orders.filter((o) => o.status === "placed").length;
  const preparingCount = orders.filter(
    (o) => o.status === "confirmed" || o.status === "preparing" || o.status === "ready",
  ).length;
  const outCount = orders.filter((o) => o.status === "out_for_delivery").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const totalCount = orders.length;

  // Subscribe to realtime changes for the active selected order
  useEffect(() => {
    if (!selectedOrder?.id) return;
    const unsub = subscribeToOrderRealtime(selectedOrder.id, (partial) => {
      setSelectedOrder((prev) => (prev ? { ...prev, ...partial } : null));
      onRefresh();
    });
    return unsub;
  }, [selectedOrder?.id, onRefresh]);

  // Open Invoice Viewer
  async function handleOpenInvoice(order: Order) {
    setInvoiceLoading(true);
    try {
      // 1. Try to fetch existing invoice snapshot
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();

      if (data && !error) {
        setActiveInvoice(data as unknown as Invoice);
        setInvoiceModalOpen(true);
        return;
      }

      // 2. If missing, auto-generate via idempotent procedure
      const { data: rpcData, error: rpcErr } = await supabase.rpc("generate_invoice_for_order", {
        p_order_id: order.id,
      });

      if (rpcErr || !rpcData) {
        throw new Error(rpcErr?.message || "Could not generate invoice");
      }

      setActiveInvoice(rpcData as unknown as Invoice);
      setInvoiceModalOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setInvoiceLoading(false);
    }
  }

  // Handle Refund Submission
  async function handleProcessRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundOrderId) return;
    setUpdatingId(refundOrderId);
    try {
      const targetOrder = orders.find((o) => o.id === refundOrderId);
      const refundVal = Number(refundAmount);
      if (refundVal <= 0) {
        toast.error("Please enter a valid refund amount greater than 0");
        return;
      }

      const maxPaid = targetOrder?.payment_status === "paid" ? targetOrder.total : targetOrder?.total || 0;
      if (refundVal > maxPaid) {
        toast.error(`Refund amount cannot exceed ₹${maxPaid}`);
        return;
      }

      const { data, error } = await supabase.rpc("admin_update_payment_and_refund", {
        p_order_id: refundOrderId,
        p_payment_status: "refunded",
        p_amount_paid: Math.max(maxPaid - refundVal, 0),
        p_refund_amount: refundVal,
        p_refund_reason: refundReason.trim() || "Refund requested by customer",
      });

      const res = data as { success?: boolean; error?: string } | null;
      if (error || !res?.success) {
        throw new Error(error?.message || res?.error || "Failed to record refund");
      }

      toast.success(`Refund of ₹${refundVal} processed & logged in billing audit!`);
      setRefundDialogOpen(false);
      setRefundAmount(0);
      setRefundReason("");
      onRefresh();

      if (selectedOrder && selectedOrder.id === refundOrderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                payment_status: "refunded",
                refund_amount: refundVal,
                refund_reason: refundReason,
              }
            : null
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Refund submission failed");
    } finally {
      setUpdatingId(null);
    }
  }

  // Filter & Sort orders based on Active Queue Tab and search
  const filteredOrders = orders
    .filter((o) => {
      // 1. Queue Tab Filtering
      if (activeQueueTab === "active") {
        if (o.status === "delivered" || o.status === "cancelled") return false;
      } else if (activeQueueTab === "placed") {
        if (o.status !== "placed") return false;
      } else if (activeQueueTab === "preparing") {
        if (o.status !== "confirmed" && o.status !== "preparing" && o.status !== "ready") return false;
      } else if (activeQueueTab === "out_for_delivery") {
        if (o.status !== "out_for_delivery") return false;
      } else if (activeQueueTab === "delivered") {
        if (o.status !== "delivered") return false;
      } else if (activeQueueTab === "cancelled") {
        if (o.status !== "cancelled") return false;
      }

      // 2. Specific status sub-filter
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = o.order_no.toLowerCase().includes(q);
        const matchName = o.customer_name.toLowerCase().includes(q);
        const matchPhone = o.customer_phone.includes(q);
        const matchInv = o.invoice_no?.toLowerCase().includes(q) || false;
        return matchNo || matchName || matchPhone || matchInv;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "highest") return b.total - a.total;
      if (sortBy === "lowest") return a.total - b.total;
      return 0;
    });

  async function handleStatusChange(orderId: string, newStatus: string, note?: string) {
    if (newStatus === "cancelled" && !confirmCancelOpen) {
      setPendingCancelOrderId(orderId);
      setConfirmCancelOpen(true);
      return;
    }

    setUpdatingId(orderId);
    const targetOrder = orders.find((o) => o.id === orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus, note, targetOrder?.order_no);
      if (!res.success) {
        throw new Error(res.error || "Failed to update order status in database");
      }

      toast.success(
        language === "hi"
          ? `ऑर्डर स्थिति बदलकर "${ORDER_STATUS_LABEL[newStatus] ?? newStatus}" कर दी गई!`
          : `Order status updated to "${ORDER_STATUS_LABEL[newStatus] ?? newStatus}"`
      );

      setAdminNote("");
      onRefresh();

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus, notes: note || prev.notes } : null));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
      setConfirmCancelOpen(false);
      setPendingCancelOrderId(null);
    }
  }

  async function handlePaymentStatusChange(orderId: string, paymentStatus: "pending" | "paid" | "failed" | "refunded") {
    if (paymentStatus === "refunded") {
      const target = orders.find((o) => o.id === orderId);
      setRefundOrderId(orderId);
      setRefundAmount(target?.total ?? 0);
      setRefundReason("Admin processed refund");
      setRefundDialogOpen(true);
      return;
    }

    setUpdatingId(orderId);
    try {
      const { data, error } = await supabase.rpc("admin_update_payment_and_refund", {
        p_order_id: orderId,
        p_payment_status: paymentStatus,
        p_amount_paid: paymentStatus === "paid" ? (orders.find((o) => o.id === orderId)?.total ?? 0) : 0,
        p_refund_amount: 0,
        p_refund_reason: null,
      });

      const rpcResult = data as { success?: boolean; error?: string } | null;
      if (error || !rpcResult?.success) {
        // Fallback to updatePaymentStatus
        const res = await updatePaymentStatus(orderId, paymentStatus);
        if (!res.success) throw new Error(res.error || "Failed to update payment status");
      }

      toast.success(`Payment status marked as ${paymentStatus.toUpperCase()}`);
      onRefresh();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, payment_status: paymentStatus } : null));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Queue Tabs Navigation */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E8E4DA] bg-white p-2.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveQueueTab("active")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "active"
              ? "bg-[#145A45] text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#1F2924] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            {language === "hi" ? "सक्रिय ऑर्डर (कार्रवाई योग्य)" : "Active Orders (Action Needed)"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              activeQueueTab === "active" ? "bg-white/20 text-white" : "bg-[#145A45]/10 text-[#145A45]"
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab("placed")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "placed"
              ? "bg-[#D97706] text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#5A655F] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span>📥 {language === "hi" ? "नए ऑर्डर" : "New / Placed"}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeQueueTab === "placed" ? "bg-white/20 text-white" : "bg-[#D97706]/10 text-[#D97706]"
            }`}
          >
            {placedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab("preparing")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "preparing"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#5A655F] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span>🍳 {language === "hi" ? "तैयारी / पैकिंग" : "Preparing & Ready"}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeQueueTab === "preparing" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}
          >
            {preparingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab("out_for_delivery")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "out_for_delivery"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#5A655F] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span>🚚 {language === "hi" ? "रास्ते में" : "Out for Delivery"}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeQueueTab === "out_for_delivery" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
            }`}
          >
            {outCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab("delivered")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "delivered"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#5A655F] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span>✅ {language === "hi" ? "सफल / डिलीवर" : "Delivered (Completed)"}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeQueueTab === "delivered" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {deliveredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab("cancelled")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "cancelled"
              ? "bg-red-600 text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#5A655F] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span>❌ {language === "hi" ? "रद्द" : "Cancelled"}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeQueueTab === "cancelled" ? "bg-white/20 text-white" : "bg-red-100 text-red-800"
            }`}
          >
            {cancelledCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveQueueTab("all")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            activeQueueTab === "all"
              ? "bg-[#1F2924] text-white shadow-xs"
              : "bg-[#FAF8F2] text-[#5A655F] hover:bg-[#E8E4DA]/60"
          }`}
        >
          <span>📋 {language === "hi" ? "सभी ऑर्डर" : "All Orders"}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeQueueTab === "all" ? "bg-white/20 text-white" : "bg-[#1F2924]/10 text-[#1F2924]"
            }`}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* Filters & Search Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6B746F]" />
            <Input
              placeholder={language === "hi" ? "ऑर्डर आईडी (#AGT-1001), ग्राहक या मोबाइल नंबर खोजें…" : "Search Order ID (#AGT-1001), Customer, or Phone…"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 rounded-xl text-xs border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
            />
          </div>


          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl text-xs font-semibold border-[#E8E4DA] bg-[#FAF8F2]/60 h-11">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-36 sm:w-36 rounded-xl text-xs font-semibold border-[#E8E4DA] bg-[#FAF8F2]/60 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">Newest (नवीनतम)</SelectItem>
                <SelectItem value="oldest" className="text-xs">Oldest (पुराना)</SelectItem>
                <SelectItem value="highest" className="text-xs">Highest Total</SelectItem>
                <SelectItem value="lowest" className="text-xs">Lowest Total</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onRefresh}
              variant="outline"
              size="icon"
              className="rounded-xl border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-11 w-11 shrink-0"
              aria-label="Refresh orders"
              title="Refresh database orders"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Orders List: Mobile Cards + Desktop Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-xs text-[#6B746F]">
          <ShoppingBag className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
          <p className="font-bold text-[#1F2924]">
            {language === "hi" ? "कोई मेल खाता ऑर्डर नहीं मिला" : "No orders found matching filter"}
          </p>
          <p className="text-[11px] text-[#6B746F] mt-1">
            {language === "hi" ? "कृपया फ़िल्टर बदलें या सर्च साफ़ करें।" : "Try clearing search or changing the status filter."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Order Cards View (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
                  <div>
                    <span className="font-mono font-bold text-[#1F2924] text-xs sm:text-sm">
                      {order.order_no}
                    </span>
                    <p className="text-[10px] text-[#6B746F]">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-sans font-bold text-[#145A45] text-sm sm:text-base">
                      {inr(order.total)}
                    </span>
                    <span className="block text-[9px] uppercase font-bold text-[#6B746F]">
                      {order.payment_method} • {order.payment_status ?? "pending"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B746F] uppercase font-bold">
                      Customer
                    </span>
                    <p className="font-semibold text-[#1F2924] truncate">{order.customer_name}</p>
                    <a
                      href={telHref(order.customer_phone)}
                      className="inline-flex items-center gap-1 font-mono text-xs text-[#145A45] font-bold py-1 hover:underline"
                    >
                      <Phone className="size-3.5" /> +91 {order.customer_phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#6B746F] uppercase font-bold">
                      Fulfillment
                    </span>
                    <p className="font-semibold capitalize text-[#1F2924]">{order.order_type}</p>
                    <span className="text-[10px] text-[#6B746F]">
                      {order.order_items?.length ?? 1} items
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E4DA]">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                      disabled={updatingId === order.id}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl text-xs font-bold border-[#E8E4DA] bg-[#FAF8F2]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placed">1. Placed (प्राप्त)</SelectItem>
                        <SelectItem value="confirmed">2. Confirmed (स्वीकृत)</SelectItem>
                        <SelectItem value="preparing">3. Preparing (पैकिंग)</SelectItem>
                        <SelectItem value="ready">4. Ready (तैयार)</SelectItem>
                        <SelectItem value="out_for_delivery">5. Out for Delivery</SelectItem>
                        <SelectItem value="delivered">6. Delivered (सफल)</SelectItem>
                        <SelectItem value="cancelled">❌ Cancelled (रद्द)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => setSelectedOrder(order)}
                    variant="outline"
                    className="h-11 rounded-xl text-xs font-semibold px-4 border-[#E8E4DA] bg-white text-[#145A45] hover:bg-[#FAF8F2] min-w-[70px]"
                  >
                    <Eye className="mr-1 size-3.5" /> View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E4DA] bg-[#FAF8F2]/60 text-[#6B746F]">
                    <th className="py-3.5 px-4 font-semibold">Order ID &amp; Date</th>
                    <th className="py-3.5 px-4 font-semibold">Customer Details</th>
                    <th className="py-3.5 px-4 font-semibold">Fulfillment</th>
                    <th className="py-3.5 px-4 font-semibold">Items</th>
                    <th className="py-3.5 px-4 font-semibold">Amount &amp; Payment</th>
                    <th className="py-3.5 px-4 font-semibold">Current Status</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DA]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF8F2]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#1F2924]">
                          {order.order_no}
                        </span>
                        <p className="text-[10px] text-[#6B746F]">
                          {formatDate(order.created_at)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#1F2924]">{order.customer_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={telHref(order.customer_phone)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#145A45] font-bold hover:underline"
                          >
                            <Phone className="size-3" /> +91 {order.customer_phone}
                          </a>
                          <a
                            href={waHref(
                              order.customer_phone,
                              `नमस्ते ${order.customer_name}, अरुण गोपाल ट्रेडर्स से आपके ऑर्डर ${order.order_no} (राशि: ${inr(order.total)}) की स्थिति: ${ORDER_STATUS_LABEL[order.status] ?? order.status}`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#25D366] hover:opacity-80"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold capitalize text-[#1F2924]">
                          {order.order_type}
                        </span>
                        <p className="line-clamp-1 max-w-[160px] text-[10px] text-[#6B746F]">
                          {order.order_type === "delivery"
                            ? `${order.address?.house ?? ""}, ${order.address?.area ?? ""}`
                            : "Store Pickup"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1F2924]">
                          {order.order_items?.length ?? 1} items
                        </span>
                        <p className="line-clamp-1 max-w-[140px] text-[10px] text-[#6B746F]">
                          {order.order_items?.map((i) => i.name).join(", ") || "Groceries"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-sans font-bold text-[#1F2924]">{inr(order.total)}</p>
                        <span className="text-[10px] text-[#6B746F] uppercase">
                          {order.payment_method} • {order.payment_status ?? "pending"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleStatusChange(order.id, val)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="h-8.5 w-40 rounded-xl text-xs font-bold border-[#E8E4DA] bg-[#FAF8F2]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="placed" className="text-xs font-medium">1. Placed (प्राप्त)</SelectItem>
                            <SelectItem value="confirmed" className="text-xs font-medium">2. Confirmed (स्वीकृत)</SelectItem>
                            <SelectItem value="preparing" className="text-xs font-medium">3. Preparing (पैकिंग)</SelectItem>
                            <SelectItem value="ready" className="text-xs font-medium">4. Ready (तैयार)</SelectItem>
                            <SelectItem value="out_for_delivery" className="text-xs font-medium">5. Out for Delivery</SelectItem>
                            <SelectItem value="delivered" className="text-xs font-medium text-[#145A45] font-bold">6. Delivered (सफल)</SelectItem>
                            <SelectItem value="cancelled" className="text-xs font-medium text-destructive">❌ Cancelled (रद्द)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleOpenInvoice(order)}
                            disabled={invoiceLoading}
                            variant="outline"
                            size="sm"
                            title="View Official Invoice / बिल देखें"
                            className="h-8 rounded-xl text-xs font-bold border-[#145A45]/30 text-[#145A45] bg-[#E6EFE8]/40 hover:bg-[#145A45] hover:text-white transition-all"
                          >
                            <Receipt className="mr-1 size-3.5" /> {language === "hi" ? "बिल" : "Invoice"}
                          </Button>
                          <Button
                            onClick={() => setSelectedOrder(order)}
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl text-xs font-semibold border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
                          >
                            <Eye className="mr-1 size-3.5" /> Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Order Details Modal (Full Audit + Timeline + Item Breakdown) */}
      {selectedOrder && (
        <Dialog
          open={Boolean(selectedOrder)}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
            <DialogHeader className="border-b border-[#E8E4DA] pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
                    <span>{selectedOrder.order_no}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#145A45]/10 text-[#145A45] font-bold">
                      {ORDER_STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status}
                    </span>
                    {selectedOrder.refund_amount && selectedOrder.refund_amount > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                        Refunded: {inr(selectedOrder.refund_amount)}
                      </span>
                    ) : null}
                  </DialogTitle>
                  <p className="text-xs text-[#6B746F]">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <Button
                  onClick={() => handleOpenInvoice(selectedOrder)}
                  disabled={invoiceLoading}
                  variant="default"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs h-8.5"
                >
                  <Receipt className="size-3.5" /> {language === "hi" ? "इनवॉइस देखें / प्रिंट" : "Official Invoice"}
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Order Timeline Visual */}
              <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-3">
                <h4 className="text-[11px] font-bold text-[#6B746F] uppercase mb-1">Live Order Lifecycle</h4>
                <OrderTimeline
                  currentStatus={selectedOrder.status}
                  events={selectedOrder.order_events}
                />
              </div>

              {/* Customer & Delivery Information */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-3.5 sm:p-4 text-xs">
                <div>
                  <h4 className="font-bold text-[#1F2924] flex items-center gap-1.5">
                    <UserCheck className="size-3.5 text-[#145A45]" /> Customer Details
                  </h4>
                  <p className="mt-1 font-semibold text-[#1F2924]">{selectedOrder.customer_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <a
                      href={telHref(selectedOrder.customer_phone)}
                      className="inline-flex items-center gap-1 text-[#145A45] font-bold hover:underline"
                    >
                      <Phone className="size-3" /> +91 {selectedOrder.customer_phone}
                    </a>
                    <a
                      href={waHref(
                        selectedOrder.customer_phone,
                        `नमस्ते ${selectedOrder.customer_name}, अरुण गोपाल ट्रेडर्स से आपके ऑर्डर ${selectedOrder.order_no} की जानकारी:`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#25D366] font-bold hover:underline"
                    >
                      <MessageCircle className="size-3" /> WhatsApp
                    </a>
                  </div>
                  {selectedOrder.customer_email && (
                    <p className="text-[#6B746F] mt-1">{selectedOrder.customer_email}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-[#1F2924] flex items-center gap-1.5">
                    <Truck className="size-3.5 text-[#145A45]" /> Delivery Address
                  </h4>
                  <p className="mt-1 font-medium capitalize text-[#1F2924]">
                    {selectedOrder.order_type === "delivery" ? "Home Delivery (महाराजगंज)" : "Store Pickup"}
                  </p>
                  {selectedOrder.order_type === "delivery" && selectedOrder.address ? (
                    <p className="text-[#6B746F] mt-0.5">
                      {[
                        selectedOrder.address.house,
                        selectedOrder.address.area,
                        selectedOrder.address.landmark,
                        selectedOrder.address.city,
                        selectedOrder.address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="text-[#6B746F] mt-0.5">Store Pickup: Ramnagar Adda Bazar Road, Maharajganj</p>
                  )}
                  {selectedOrder.notes && (
                    <p className="mt-1 italic text-[#145A45] bg-white p-1.5 rounded-lg border border-[#E8E4DA]">
                      Customer Note: {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items List (Historical Price Snapshot) */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#1F2924]">Ordered Items ({selectedOrder.order_items?.length ?? 1})</h4>
                <div className="rounded-2xl border border-[#E8E4DA] divide-y divide-[#E8E4DA] overflow-hidden bg-white">
                  {(selectedOrder.order_items ?? []).map((item, idx) => (
                    <div key={item.id ?? `item-${idx}`} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={getProductImage({
                            name: item.name,
                            image_url: item.image_url,
                          })}
                          alt={item.name}
                          className="size-10 rounded-lg object-cover bg-[#FAF8F2] shrink-0 border border-[#E8E4DA]"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F2924] truncate">{item.name}</p>
                          <p className="text-[#6B746F]">
                            {item.variant_label} • {inr(item.price)} × {item.qty}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#1F2924] shrink-0 ml-2">{inr(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <dl className="space-y-1.5 rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/50 p-3.5 text-xs">
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Item Subtotal:</dt>
                  <dd className="font-semibold text-[#1F2924]">{inr(selectedOrder.subtotal)}</dd>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-[#145A45]">
                    <dt>Discount ({selectedOrder.coupon_code ?? "Promo"}):</dt>
                    <dd className="font-bold">-{inr(selectedOrder.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Delivery Fee:</dt>
                  <dd className="font-semibold text-[#1F2924]">
                    {selectedOrder.delivery_fee === 0 ? "FREE" : inr(selectedOrder.delivery_fee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#E8E4DA] pt-2 text-sm font-bold text-[#1F2924]">
                  <dt>Grand Total:</dt>
                  <dd className="text-[#145A45] font-sans">{inr(selectedOrder.total)}</dd>
                </div>
              </dl>

              {/* Payment Status Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-[#E8E4DA] bg-white text-xs">
                <div>
                  <span className="font-bold text-[#1F2924] block">Payment Method & Status</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[#6B746F] uppercase font-semibold">{selectedOrder.payment_method}</span>
                    {selectedOrder.refund_amount && selectedOrder.refund_amount > 0 ? (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                        Refunded: {inr(selectedOrder.refund_amount)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={selectedOrder.payment_status === "pending" ? "default" : "outline"}
                    onClick={() => handlePaymentStatusChange(selectedOrder.id, "pending")}
                    className={`h-7 text-[11px] font-bold rounded-lg uppercase ${
                      selectedOrder.payment_status === "pending"
                        ? "bg-amber-600 text-white"
                        : "border-[#E8E4DA] text-[#6B746F]"
                    }`}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.payment_status === "paid" ? "default" : "outline"}
                    onClick={() => handlePaymentStatusChange(selectedOrder.id, "paid")}
                    className={`h-7 text-[11px] font-bold rounded-lg uppercase ${
                      selectedOrder.payment_status === "paid"
                        ? "bg-[#145A45] text-white"
                        : "border-[#E8E4DA] text-[#6B746F]"
                    }`}
                  >
                    Paid
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.payment_status === "failed" ? "default" : "outline"}
                    onClick={() => handlePaymentStatusChange(selectedOrder.id, "failed")}
                    className={`h-7 text-[11px] font-bold rounded-lg uppercase ${
                      selectedOrder.payment_status === "failed"
                        ? "bg-red-600 text-white"
                        : "border-[#E8E4DA] text-[#6B746F]"
                    }`}
                  >
                    Failed
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedOrder.payment_status === "refunded" ? "default" : "outline"}
                    onClick={() => handlePaymentStatusChange(selectedOrder.id, "refunded")}
                    className={`h-7 text-[11px] font-bold rounded-lg uppercase ${
                      selectedOrder.payment_status === "refunded"
                        ? "bg-purple-700 text-white"
                        : "border-[#E8E4DA] text-purple-700 hover:bg-purple-50"
                    }`}
                  >
                    <RotateCcw className="size-3 mr-1" /> Refund
                  </Button>
                </div>
              </div>

              {/* Status Update Quick Action Bar */}
              <div className="p-3.5 rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2] space-y-2.5">
                <span className="text-xs font-bold text-[#1F2924] block">
                  Update Order Lifecycle Status:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "confirmed", label: "Confirm Order" },
                    { id: "preparing", label: "Start Packing" },
                    { id: "ready", label: "Ready" },
                    { id: "out_for_delivery", label: "Out for Delivery" },
                    { id: "delivered", label: "Mark Delivered" },
                  ].map((btn) => (
                    <Button
                      key={btn.id}
                      size="sm"
                      variant={selectedOrder.status === btn.id ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedOrder.id, btn.id, adminNote)}
                      disabled={updatingId === selectedOrder.id}
                      className={`h-8 text-xs font-bold rounded-xl ${
                        selectedOrder.status === btn.id
                          ? "bg-[#145A45] text-white shadow-sm"
                          : "border-[#E8E4DA] bg-white text-[#1F2924] hover:bg-[#FAF8F2]"
                      }`}
                    >
                      {btn.label}
                    </Button>
                  ))}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setPendingCancelOrderId(selectedOrder.id);
                      setConfirmCancelOpen(true);
                    }}
                    className="h-8 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Order
                  </Button>
                </div>

                <div className="pt-2">
                  <Input
                    placeholder="Add internal admin note (e.g. Dispatched with delivery boy Rahul)…"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="text-xs h-9 bg-white border-[#E8E4DA] rounded-xl"
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Cancelling Order */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-[#E8E4DA] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-base">
              <AlertTriangle className="size-5" /> Confirm Cancellation
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[#6B746F] leading-relaxed">
            Are you sure you want to cancel this order? This status change will be recorded in the order audit history and the customer will be notified on their tracking page.
          </p>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCancelOpen(false)}
              className="rounded-xl border-[#E8E4DA] text-xs h-9"
            >
              No, Keep Order
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (pendingCancelOrderId) {
                  handleStatusChange(pendingCancelOrderId, "cancelled", adminNote || "Cancelled by store owner");
                }
              }}
              className="rounded-xl text-xs h-9"
            >
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Processing Modal */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-[#E8E4DA] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#16201A] font-bold text-base">
              <RotateCcw className="size-5 text-purple-700" /> Process Customer Refund
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProcessRefund} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-[#1F2924]">Refund Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="rounded-xl border-[#E8E4DA] text-xs font-bold h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-[#1F2924]">Reason for Refund / Note</Label>
              <Textarea
                rows={2}
                required
                placeholder="e.g. Item out of stock or customer requested order return"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="rounded-xl border-[#E8E4DA] text-xs bg-[#FAF8F2]"
              />
            </div>

            <p className="text-[11px] text-[#5A655F]">
              Refund status and amount will be logged into the permanent billing audit history.
            </p>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRefundDialogOpen(false)}
                className="rounded-xl border-[#E8E4DA] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-9"
              >
                Record Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Official Invoice Modal */}
      <InvoiceView
        invoice={activeInvoice}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        lang={language as "hi" | "en"}
      />
    </div>
  );
}
