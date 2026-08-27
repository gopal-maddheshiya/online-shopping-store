import { useState } from "react";
import {
  Search,
  Filter,
  Phone,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  Eye,
  ShoppingBag,
  MapPin,
  RefreshCw,
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
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID (AGT-1001), Customer Name, or Phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="icon"
            className="rounded-xl"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Order ID &amp; Date</th>
                <th className="py-3 px-4 font-semibold">Customer Details</th>
                <th className="py-3 px-4 font-semibold">Fulfillment</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Amount &amp; Payment</th>
                <th className="py-3 px-4 font-semibold">Current Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-foreground">{order.order_no}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{order.customer_name}</p>
                      <a
                        href={telHref(order.customer_phone)}
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <Phone className="size-3" /> +91 {order.customer_phone}
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold capitalize text-foreground">
                        {order.order_type}
                      </span>
                      <p className="line-clamp-1 max-w-[160px] text-[10px] text-muted-foreground">
                        {order.order_type === "delivery"
                          ? `${order.address?.house ?? ""}, ${order.address?.area ?? ""}`
                          : "Store Pickup"}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold">{order.order_items?.length ?? 1} items</span>
                      <p className="line-clamp-1 max-w-[140px] text-[10px] text-muted-foreground">
                        {order.order_items?.map((i) => i.name).join(", ") || "Groceries"}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-display font-bold text-foreground">{inr(order.total)}</p>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {order.payment_method}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Select
                        value={order.status}
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                        disabled={updatingId === order.id}
                      >
                        <SelectTrigger className="h-7 w-36 rounded-lg text-[11px] font-bold">
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
                        className="h-7 rounded-lg text-xs font-semibold"
                      >
                        <Eye className="mr-1 size-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No orders match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Dialog */}
      {selectedOrder ? (
        <Dialog
          open={Boolean(selectedOrder)}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-display text-xl">
                    {selectedOrder.order_no}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1 text-xs"
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

              <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-muted/40 p-4 text-xs">
                <div>
                  <h4 className="font-bold text-foreground">Customer &amp; Contact</h4>
                  <p className="mt-1 font-semibold">{selectedOrder.customer_name}</p>
                  <a
                    href={telHref(selectedOrder.customer_phone)}
                    className="flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <Phone className="size-3" /> +91 {selectedOrder.customer_phone}
                  </a>
                  {selectedOrder.customer_email ? <p>{selectedOrder.customer_email}</p> : null}
                </div>

                <div>
                  <h4 className="font-bold text-foreground">Delivery Information</h4>
                  <p className="mt-1 font-medium capitalize">
                    {selectedOrder.order_type} in Maharajganj
                  </p>
                  {selectedOrder.order_type === "delivery" && selectedOrder.address ? (
                    <p className="text-muted-foreground">
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
                    <p className="text-muted-foreground">Store Pickup Counter</p>
                  )}
                  {selectedOrder.notes ? (
                    <p className="mt-1 italic text-primary">Note: {selectedOrder.notes}</p>
                  ) : null}
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-xl border border-border divide-y divide-border">
                {(selectedOrder.order_items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getProductImage({
                          name: item.name,
                          image_url: item.image_url,
                        })}
                        alt={item.name}
                        className="size-10 rounded-md object-cover bg-muted"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-muted-foreground">
                          {item.variant_label} × {item.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">{inr(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <dl className="space-y-1.5 rounded-xl border border-border p-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal:</dt>
                  <dd className="font-semibold text-foreground">{inr(selectedOrder.subtotal)}</dd>
                </div>
                {selectedOrder.discount > 0 ? (
                  <div className="flex justify-between text-success">
                    <dt>Discount ({selectedOrder.coupon_code ?? "Promo"}):</dt>
                    <dd className="font-bold">-{inr(selectedOrder.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted-foreground">
                  <dt>Delivery Charges:</dt>
                  <dd className="font-semibold text-foreground">
                    {selectedOrder.delivery_fee === 0 ? "FREE" : inr(selectedOrder.delivery_fee)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
                  <dt>Grand Total:</dt>
                  <dd className="text-primary font-display">{inr(selectedOrder.total)}</dd>
                </div>
              </dl>

              {/* Status updater */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold">Change Order Status:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["confirmed", "preparing", "out_for_delivery", "delivered"].map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={selectedOrder.status === st ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className="h-7 text-xs capitalize"
                    >
                      {ORDER_STATUS_LABEL[st] ?? st}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
