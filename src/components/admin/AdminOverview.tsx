import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  IndianRupee,
  ArrowUpRight,
  Package,
  Phone,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { inr, formatDate, ORDER_STATUS_LABEL, telHref } from "@/lib/format";
import type { Order, Product } from "@/lib/queries";

type AdminOverviewProps = {
  orders: Order[];
  products: Product[];
  onSelectOrder: (order: Order) => void;
  onNavigateTab: (tab: string) => void;
};

export function AdminOverview({
  orders,
  products,
  onSelectOrder,
  onNavigateTab,
}: AdminOverviewProps) {
  // Compute analytics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const pendingOrders = orders.filter((o) =>
    ["placed", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status),
  );
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled" || o.status === "rejected");

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "rejected")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Unique customer count
  const uniquePhones = new Set(orders.map((o) => o.customer_phone.replace(/\D/g, "").slice(-10)));

  // Low stock and out of stock variants
  const lowStockItems: Array<{
    product: Product;
    variantLabel: string;
    stock: number;
    threshold: number;
  }> = [];
  products.forEach((p) => {
    (p.product_variants ?? []).forEach((v) => {
      if (v.stock <= v.low_stock_threshold) {
        lowStockItems.push({
          product: p,
          variantLabel: v.label,
          stock: v.stock,
          threshold: v.low_stock_threshold,
        });
      }
    });
  });

  // Recent 7 days chart data
  const daysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter(
      (o) => o.created_at.startsWith(dStr) && o.status !== "cancelled",
    );
    const sales = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      sales,
      orders: dayOrders.length,
    };
  });

  return (
    <div className="space-y-8">
      {/* Pending Orders Notice Alert */}
      {pendingOrders.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground">
                {pendingOrders.length} Pending {pendingOrders.length === 1 ? "Order" : "Orders"}{" "}
                Need Action!
              </h4>
              <p className="text-xs text-muted-foreground">
                Confirm and dispatch local grocery orders for Maharajganj customers.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigateTab("orders")}
            size="sm"
            className="rounded-xl font-bold"
          >
            View Pending Orders →
          </Button>
        </div>
      ) : null}

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Today's Sales</span>
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{inr(todaySales)}</p>
          <span className="text-[11px] text-muted-foreground">
            {todayOrders.length} orders placed today
          </span>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Active / Pending Orders
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-warning/10 text-warning">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {pendingOrders.length}
          </p>
          <span className="text-[11px] text-muted-foreground">Needs packing or delivery</span>
        </div>

        {/* Total Customers */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Customers</span>
            <div className="grid size-9 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {uniquePhones.size}
          </p>
          <span className="text-[11px] text-muted-foreground">Unique phone numbers</span>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Low Stock Alerts</span>
            <div className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-destructive">
            {lowStockItems.length}
          </p>
          <span className="text-[11px] text-muted-foreground">Items below threshold</span>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                7-Day Sales Performance
              </h3>
              <p className="text-xs text-muted-foreground">
                Revenue and orders trend for Arun Gopal Traders
              </p>
            </div>
            <span className="text-xs font-bold text-primary">Total: {inr(totalRevenue)}</span>
          </div>

          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [inr(Number(val ?? 0)), "Sales"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #ddd",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="currentColor"
                  className="text-primary"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Quick Table */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Restock Needed</h3>
              <p className="text-xs text-muted-foreground">Critical inventory alerts</p>
            </div>
            <Button
              onClick={() => onNavigateTab("inventory")}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-primary"
            >
              View All
            </Button>
          </div>

          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{item.product.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.variantLabel}</p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 font-bold ${item.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                  >
                    {item.stock === 0 ? "Out of Stock" : `${item.stock} left`}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-muted-foreground">
                All items sufficiently stocked! ✅
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Recent Customer Orders
            </h3>
            <p className="text-xs text-muted-foreground">
              Latest orders placed online or via phone
            </p>
          </div>
          <Button
            onClick={() => onNavigateTab("orders")}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold"
          >
            All Orders ({orders.length}) →
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2.5 pr-4 font-semibold">Order ID</th>
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th className="py-2.5 px-4 font-semibold">Phone</th>
                <th className="py-2.5 px-4 font-semibold">Items</th>
                <th className="py-2.5 px-4 font-semibold">Total</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 pl-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 6).map((order) => (
                <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-foreground">
                    {order.order_no}
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">{order.customer_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <a
                      href={telHref(order.customer_phone)}
                      className="hover:text-primary hover:underline"
                    >
                      +91 {order.customer_phone}
                    </a>
                  </td>
                  <td className="py-3 px-4">{order.order_items?.length ?? 1} items</td>
                  <td className="py-3 px-4 font-bold text-foreground">{inr(order.total)}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <Button
                      onClick={() => onSelectOrder(order)}
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-semibold"
                    >
                      <Eye className="mr-1 size-3.5" /> Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
