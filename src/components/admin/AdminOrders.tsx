import { useState } from "react";
import {
  Search,
  Phone,
  Printer,
  ShoppingBag,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr, formatDate, ORDER_STATUS_LABEL, PAYMENT_LABEL, telHref } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import { OrderTimeline } from "@/components/OrderTimeline";
import type { Order } from "@/lib/queries";

type AdminOrdersProps = {
  orders: Order[];
  onRefresh: () => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
};

const STATUS_FILTERS = [
  { value: "all", label: "All Orders" },
  { value: "placed", label: "New / Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function AdminOrders({
  orders,
  onRefresh,
  selectedOrder,
  setSelectedOrder,
}: AdminOrdersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNo = o.order_no.toLowerCase().includes(q);
      const matchName = o.customer_name.toLowerCase().includes(q);
      const matchPhone = o.customer_phone.includes(q);
      return matchNo || matchName || matchPhone;
    }
    return true;
  });

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as never })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Order status updated to "${ORDER_STATUS_LABEL[newStatus] ?? newStatus}"`);
      onRefresh();

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6B746F]" />
          <Input
            placeholder="Search by Order ID (#AGT-1001), Customer, or Phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9.5 rounded-xl text-xs border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl text-xs font-semibold border-[#E8E4DA] bg-[#FAF8F2]/60 h-11">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="icon"
            className="rounded-xl border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-11 w-11 shrink-0"
            aria-label="Refresh orders"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Orders List: Mobile Cards + Desktop Table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-xs text-[#6B746F]">
          <ShoppingBag className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
          <p className="font-bold text-[#1F2924]">No orders found matching filter</p>
          <p className="text-[11px] text-[#6B746F] mt-1">Try clearing search or changing the status filter.</p>
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
                      {order.payment_method}
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
                        <SelectItem value="placed">Order Placed</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <th className="py-3 px-4 font-semibold">Order ID &amp; Date</th>
                    <th className="py-3 px-4 font-semibold">Customer Details</th>
                    <th className="py-3 px-4 font-semibold">Fulfillment</th>
                    <th className="py-3 px-4 font-semibold">Items</th>
                    <th className="py-3 px-4 font-semibold">Amount &amp; Payment</th>
                    <th className="py-3 px-4 font-semibold">Current Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DA]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF8F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#1F2924]">
                          {order.order_no}
                        </span>
                        <p className="text-[10px] text-[#6B746F]">
                          {formatDate(order.created_at)}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#1F2924]">{order.customer_name}</p>
                        <a
                          href={telHref(order.customer_phone)}
                          className="flex items-center gap-1 text-[11px] text-[#145A45] hover:underline"
                        >
                          <Phone className="size-3" /> +91 {order.customer_phone}
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold capitalize text-[#1F2924]">
                          {order.order_type}
                        </span>
                        <p className="line-clamp-1 max-w-[160px] text-[10px] text-[#6B746F]">
                          {order.order_type === "delivery"
                            ? `${order.address?.house ?? ""}, ${order.address?.area ?? ""}`
                            : "Store Pickup"}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#1F2924]">
                          {order.order_items?.length ?? 1} items
                        </span>
                        <p className="line-clamp-1 max-w-[140px] text-[10px] text-[#6B746F]">
                          {order.order_items?.map((i) => i.name).join(", ") || "Groceries"}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-sans font-bold text-[#1F2924]">{inr(order.total)}</p>
                        <span className="text-[10px] text-[#6B746F] uppercase">
                          {order.payment_method}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleStatusChange(order.id, val)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="h-7 w-36 rounded-lg text-[11px] font-bold border-[#E8E4DA] bg-[#FAF8F2]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="placed">Order Placed</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg text-xs font-semibold border-[#E8E4DA] text-[#145A45] hover:bg-[#FAF8F2]"
                        >
                          <Eye className="mr-1 size-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Order Details Dialog (Mobile Responsive Modal) */}
      {selectedOrder && (
        <Dialog
          open={Boolean(selectedOrder)}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
            <DialogHeader className="border-b border-[#E8E4DA] pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                    {selectedOrder.order_no}
                  </DialogTitle>
                  <p className="text-xs text-[#6B746F]">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1 text-xs border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-8"
                >
                  <Printer className="size-3.5" /> Print Bill
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <OrderTimeline
                currentStatus={selectedOrder.status}
                events={selectedOrder.order_events}
              />

              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-3.5 sm:p-4 text-xs">
                <div>
                  <h4 className="font-bold text-[#1F2924]">Customer &amp; Contact</h4>
                  <p className="mt-1 font-semibold text-[#1F2924]">{selectedOrder.customer_name}</p>
                  <a
                    href={telHref(selectedOrder.customer_phone)}
                    className="flex items-center gap-1 text-[#145A45] font-bold hover:underline mt-0.5"
                  >
                    <Phone className="size-3" /> +91 {selectedOrder.customer_phone}
                  </a>
                  {selectedOrder.customer_email && (
                    <p className="text-[#6B746F] mt-0.5">{selectedOrder.customer_email}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-[#1F2924]">Delivery Information</h4>
                  <p className="mt-1 font-medium capitalize text-[#1F2924]">
                    {selectedOrder.order_type} in Maharajganj
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
                    <p className="text-[#6B746F] mt-0.5">Store Pickup Counter</p>
                  )}
                  {selectedOrder.notes && (
                    <p className="mt-1 italic text-[#145A45]">Note: {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-2xl border border-[#E8E4DA] divide-y divide-[#E8E4DA] overflow-hidden bg-white">
                {(selectedOrder.order_items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 text-xs">
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
                          {item.variant_label} × {item.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#1F2924] shrink-0 ml-2">{inr(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <dl className="space-y-1.5 rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/50 p-3.5 text-xs">
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Subtotal:</dt>
                  <dd className="font-semibold text-[#1F2924]">{inr(selectedOrder.subtotal)}</dd>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-[#145A45]">
                    <dt>Discount ({selectedOrder.coupon_code ?? "Promo"}):</dt>
                    <dd className="font-bold">-{inr(selectedOrder.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#6B746F]">
                  <dt>Delivery Charges:</dt>
                  <dd className="font-semibold text-[#1F2924]">
                    {selectedOrder.delivery_fee === 0 ? "FREE" : inr(selectedOrder.delivery_fee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#E8E4DA] pt-2 text-sm font-bold text-[#1F2924]">
                  <dt>Grand Total:</dt>
                  <dd className="text-[#145A45] font-sans">{inr(selectedOrder.total)}</dd>
                </div>
              </dl>

              {/* Status updater */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-[#1F2924] block mb-2">Update Order Status:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={selectedOrder.status === st ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`h-7.5 text-xs capitalize rounded-xl ${
                        selectedOrder.status === st
                          ? "bg-[#145A45] text-white"
                          : "border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
                      }`}
                    >
                      {ORDER_STATUS_LABEL[st] ?? st}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

