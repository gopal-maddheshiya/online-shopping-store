import {
  ShoppingBag,
  Clock,
  AlertTriangle,
  Users,
  IndianRupee,
  Package,
  Plus,
  Boxes,
  Tag,
  ArrowRight,
  Eye,
  Phone,
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
} from "recharts";
import { inr, formatDate, ORDER_STATUS_LABEL, telHref } from "@/lib/format";
import type { Order, Product } from "@/lib/queries";

type AdminOverviewProps = {
  orders: Order[];
  products: Product[];
  onSelectOrder: (order: Order) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAddProduct?: () => void;
};

export function AdminOverview({
  orders,
  products,
  onSelectOrder,
  onNavigateTab,
  onOpenAddProduct,
}: AdminOverviewProps) {
  // Compute analytics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const pendingOrders = orders.filter((o) =>
    ["placed", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status),
  );

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
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      sales,
      orders: dayOrders.length,
    };
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Pending Orders Notice Alert */}
      {pendingOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 sm:p-4 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-2xs">
              <ShoppingBag className="size-4 sm:size-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm sm:text-base text-amber-950">
                {pendingOrders.length} Pending {pendingOrders.length === 1 ? "Order" : "Orders"} Need Packing / Delivery
              </h4>
              <p className="text-xs text-amber-800/90 leading-tight">
                Review and dispatch local grocery orders for Maharajganj customers.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigateTab("orders")}
            size="sm"
            className="w-full sm:w-auto shrink-0 rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-8 text-xs shadow-xs"
          >
            Manage Orders <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        </div>
      )}

      {/* 1. KPI Metric Cards (Compact & Responsive: 2x2 on Mobile/Tablet, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B746F]">Today's Sales</span>
            <div className="grid size-7 sm:size-8.5 place-items-center rounded-xl bg-[#145A45]/10 text-[#145A45]">
              <IndianRupee className="size-3.5 sm:size-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 font-sans text-lg sm:text-2xl font-bold text-[#1F2924] tracking-tight">
            {inr(todaySales)}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#6B746F] truncate">
            {todayOrders.length} {todayOrders.length === 1 ? "order" : "orders"} today
          </p>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B746F]">Pending Orders</span>
            <div className="grid size-7 sm:size-8.5 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="size-3.5 sm:size-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 font-sans text-lg sm:text-2xl font-bold text-[#1F2924] tracking-tight">
            {pendingOrders.length}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#6B746F] truncate">
            Needs packing / dispatch
          </p>
        </div>

        {/* Total Customers */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B746F]">Total Customers</span>
            <div className="grid size-7 sm:size-8.5 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="size-3.5 sm:size-4" />
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 font-sans text-lg sm:text-2xl font-bold text-[#1F2924] tracking-tight">
            {uniquePhones.size}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#6B746F] truncate">
            Unique phone numbers
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B746F]">Low Stock Alerts</span>
            <div className="grid size-7 sm:size-8.5 place-items-center rounded-xl bg-red-500/10 text-red-600">
              <AlertTriangle className="size-3.5 sm:size-4" />
            </div>
          </div>
          <p className={`mt-1.5 sm:mt-2 font-sans text-lg sm:text-2xl font-bold tracking-tight ${lowStockItems.length > 0 ? "text-red-600" : "text-[#1F2924]"}`}>
            {lowStockItems.length}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#6B746F] truncate">
            {lowStockItems.length > 0 ? "Items below threshold" : "All items stocked"}
          </p>
        </div>
      </div>

      {/* 2. Quick Actions Bar (Compact 2-col on Mobile, 4-col on Desktop) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B746F]">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <button
            onClick={() => {
              if (onOpenAddProduct) {
                onOpenAddProduct();
              } else {
                onNavigateTab("products");
              }
            }}
            className="flex items-center gap-2.5 rounded-xl border border-[#E8E4DA] bg-white p-3 text-left transition-all hover:border-[#145A45] hover:bg-[#FAF8F2] shadow-2xs group"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#145A45]/10 text-[#145A45] group-hover:bg-[#145A45] group-hover:text-white transition-colors">
              <Plus className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">+ Add Product</p>
              <p className="text-[10px] text-[#6B746F] truncate">New catalogue item</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("orders")}
            className="flex items-center gap-2.5 rounded-xl border border-[#E8E4DA] bg-white p-3 text-left transition-all hover:border-[#145A45] hover:bg-[#FAF8F2] shadow-2xs group"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ShoppingBag className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">Manage Orders</p>
              <p className="text-[10px] text-[#6B746F] truncate">{orders.length} total orders</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("inventory")}
            className="flex items-center gap-2.5 rounded-xl border border-[#E8E4DA] bg-white p-3 text-left transition-all hover:border-[#145A45] hover:bg-[#FAF8F2] shadow-2xs group"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Boxes className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">Update Stock</p>
              <p className="text-[10px] text-[#6B746F] truncate">Fast inventory count</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("coupons")}
            className="flex items-center gap-2.5 rounded-xl border border-[#E8E4DA] bg-white p-3 text-left transition-all hover:border-[#145A45] hover:bg-[#FAF8F2] shadow-2xs group"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-purple-500/10 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Tag className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F2924] truncate">Add Offer / Coupon</p>
              <p className="text-[10px] text-[#6B746F] truncate">Discounts &amp; codes</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Sales Performance Chart & Low Stock Alert Container */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Responsive Sales Chart */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E4DA] pb-3">
            <div>
              <h3 className="font-sans text-sm sm:text-base font-bold text-[#1F2924]">
                7-Day Sales Performance
              </h3>
              <p className="text-[11px] text-[#6B746F]">
                Revenue trend for Arun Gopal Traders
              </p>
            </div>
            <div className="rounded-lg bg-[#FAF8F2] px-2.5 py-1 border border-[#E8E4DA]">
              <span className="text-[11px] font-bold text-[#145A45]">
                Total: {inr(totalRevenue)}
              </span>
            </div>
          </div>

          <div className="mt-4 h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#6B746F" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#6B746F" }}
                  axisLine={{ stroke: "#E8E4DA" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B746F" }}
                  axisLine={{ stroke: "#E8E4DA" }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [inr(Number(val ?? 0)), "Sales"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #E8E4DA",
                    fontSize: "12px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#145A45"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Quick Table / List */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
              <div>
                <h3 className="font-sans text-sm sm:text-base font-bold text-[#1F2924]">
                  Restock Needed
                </h3>
                <p className="text-[11px] text-[#6B746F]">Critical stock alerts</p>
              </div>
              <Button
                onClick={() => onNavigateTab("inventory")}
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-bold text-[#145A45] hover:bg-[#FAF8F2] px-2"
              >
                View All →
              </Button>
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#1F2924]">{item.product.name}</p>
                      <p className="text-[10px] text-[#6B746F]">{item.variantLabel}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.stock === 0 ? "Out of Stock" : `${item.stock} left`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#6B746F]">
                  <p className="text-xl">✅</p>
                  <p className="mt-1 font-semibold text-[#1F2924]">All products stocked</p>
                  <p className="text-[11px]">No items below threshold</p>
                </div>
              )}
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <Button
              onClick={() => onNavigateTab("inventory")}
              variant="outline"
              size="sm"
              className="mt-3 w-full rounded-xl text-xs font-bold border-[#E8E4DA] text-[#145A45] hover:bg-[#FAF8F2]"
            >
              Update Inventory Stock ({lowStockItems.length} items)
            </Button>
          )}
        </div>
      </div>

      {/* 4. Recent Customer Orders (Responsive Table on Desktop, Compact Cards on Mobile) */}
      <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E4DA] pb-3">
          <div>
            <h3 className="font-sans text-sm sm:text-base font-bold text-[#1F2924]">
              Recent Customer Orders
            </h3>
            <p className="text-[11px] text-[#6B746F]">
              Latest grocery orders placed online
            </p>
          </div>
          <Button
            onClick={() => onNavigateTab("orders")}
            variant="outline"
            size="sm"
            className="h-8 rounded-xl text-xs font-bold border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
          >
            All Orders ({orders.length}) →
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B746F]">
            <ShoppingBag className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
            <p className="font-bold text-[#1F2924]">No orders placed yet</p>
            <p className="text-[11px] text-[#6B746F]">When customers order, they will appear here live.</p>
          </div>
        ) : (
          <>
            {/* Mobile View (< sm): Compact Order Cards */}
            <div className="mt-3 space-y-2.5 sm:hidden">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-[#E8E4DA] bg-[#FAF8F2]/40 p-3 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#1F2924]">
                        {order.order_no}
                      </span>
                      <p className="text-[10px] text-[#6B746F]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#145A45]/10 px-2 py-0.5 text-[10px] font-bold text-[#145A45]">
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E8E4DA]/60">
                    <div>
                      <p className="font-medium text-[#1F2924]">{order.customer_name}</p>
                      <p className="text-[10px] text-[#6B746F]">
                        {order.order_items?.length ?? 1} items • {inr(order.total)}
                      </p>
                    </div>
                    <Button
                      onClick={() => onSelectOrder(order)}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-bold rounded-lg border-[#E8E4DA] bg-white text-[#145A45] hover:bg-[#FAF8F2] px-2.5"
                    >
                      <Eye className="mr-1 size-3" /> View
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View (>= sm): Structured Data Table */}
            <div className="mt-3 hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E4DA] text-[#6B746F]">
                    <th className="py-2.5 pr-3 font-semibold">Order ID</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Phone</th>
                    <th className="py-2.5 px-3 font-semibold">Items</th>
                    <th className="py-2.5 px-3 font-semibold">Total</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 pl-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DA]">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF8F2]/70 transition-colors">
                      <td className="py-2.5 pr-3 font-mono font-bold text-[#1F2924]">
                        {order.order_no}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#1F2924]">{order.customer_name}</td>
                      <td className="py-2.5 px-3 text-[#6B746F]">
                        <a
                          href={telHref(order.customer_phone)}
                          className="hover:text-[#145A45] hover:underline"
                        >
                          +91 {order.customer_phone}
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-[#6B746F]">{order.order_items?.length ?? 1} items</td>
                      <td className="py-2.5 px-3 font-bold text-[#1F2924]">{inr(order.total)}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block rounded-full bg-[#145A45]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#145A45]">
                          {ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <Button
                          onClick={() => onSelectOrder(order)}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs font-semibold text-[#145A45] hover:bg-[#FAF8F2]"
                        >
                          <Eye className="mr-1 size-3.5" /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

