import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Tag,
  HelpCircle,
  Settings,
  Store,
  Lock,
  LogOut,
  Boxes,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  productsQuery,
  categoriesQuery,
  settingsQuery,
  couponsQuery,
  type Order,
} from "@/lib/queries";

import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminInventory } from "@/components/admin/AdminInventory";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { AdminHelpRequests } from "@/components/admin/AdminHelpRequests";
import { AdminSettings } from "@/components/admin/AdminSettings";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store Management & Admin Portal — Arun Gopal Traders" },
      {
        name: "description",
        content: "Owner dashboard for products, inventory, orders, customers, and store settings.",
      },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "overview", label: "Overview & Analytics", icon: LayoutDashboard },
  { id: "orders", label: "Order Management", icon: ShoppingBag },
  { id: "products", label: "Product Catalogue", icon: Package },
  { id: "inventory", label: "Stock & Inventory", icon: Boxes },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "customers", label: "Customers Directory", icon: Users },
  { id: "coupons", label: "Offers & Coupons", icon: Tag },
  { id: "help", label: "Customer Inquiries", icon: HelpCircle },
  { id: "settings", label: "Store Settings", icon: Settings },
] as const;

function AdminPage() {
  const { user, isAdmin, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Queries
  const { data: products = [], refetch: refetchProducts } = useQuery(
    productsQuery({ activeOnly: false }),
  );
  const { data: categories = [], refetch: refetchCategories } = useQuery(categoriesQuery);
  const { data: settings, refetch: refetchSettings } = useQuery(settingsQuery);
  const { data: coupons = [], refetch: refetchCoupons } = useQuery(couponsQuery);

  // Load orders directly for admin
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  async function loadAllOrders() {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_events(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data ?? []) as unknown as Order[]);
    } catch (err: unknown) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    if (isUnlocked || isAdmin) {
      void loadAllOrders();
    }
  }, [isUnlocked, isAdmin]);

  // Check stored admin session
  useEffect(() => {
    const sessionToken = localStorage.getItem("agt.admin_session");
    if (sessionToken === "unlocked" || isAdmin) {
      setIsUnlocked(true);
    }
  }, [isAdmin]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    // Default demo PIN or password for owner access
    if (
      adminPin.trim() === "6388" ||
      adminPin.trim() === "6388354988" ||
      adminPin.trim() === "9621" ||
      adminPin.trim() === "admin123" ||
      adminPin.trim() === "9621617360"
    ) {
      setIsUnlocked(true);
      localStorage.setItem("agt.admin_session", "unlocked");
      toast.success("Welcome back, Arun Gopal Traders Manager!");
    } else {
      toast.error("Incorrect Admin PIN. Hint: Use 6388 or your store phone.");
    }
  }

  function handleLock() {
    setIsUnlocked(false);
    localStorage.removeItem("agt.admin_session");
    toast.info("Admin portal locked");
  }

  function refreshAllData() {
    void refetchProducts();
    void refetchCategories();
    void refetchSettings();
    void refetchCoupons();
    void loadAllOrders();
    toast.success("Catalogue and orders refreshed!");
  }

  // If not unlocked -> show clean Admin Security Gate
  if (!isUnlocked && !isAdmin) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-[#E8E4DA] bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FAF8F2] text-[#145A45] border border-[#E8E4DA]">
              <Lock className="size-6" />
            </div>
            <h1 className="mt-3 font-sans text-2xl font-bold text-[#1F2924]">
              Owner / Admin Access
            </h1>
            <p className="mt-1 text-xs text-[#6B746F]">
              Secure store management portal for Arun Gopal Traders, Maharajganj.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1F2924]">Store Manager PIN / Key</label>
              <Input
                type="password"
                required
                placeholder="Enter 4-digit PIN or admin key"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="rounded-xl text-center font-mono text-lg tracking-widest border-[#E8E4DA] bg-white"
              />
            </div>

            <Button type="submit" className="w-full rounded-full py-6 font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333]">
              Unlock Dashboard <ShieldCheck className="ml-2 size-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-3 text-center text-xs text-[#6B746F]">
            💡 <strong>Store PIN:</strong> <code>6388</code>, <code>9621</code> or <code>admin123</code>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs font-semibold text-[#145A45] hover:underline">
              ← Return to Customer Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) =>
    ["placed", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status),
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF8F2]">
      {/* Top Admin Header Bar */}
      <div className="sticky top-0 z-30 border-b border-[#E8E4DA] bg-white/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#145A45] font-sans text-base font-bold text-white">
              🌾
            </span>
            <div>
              <h2 className="font-sans font-bold text-base leading-tight text-[#1F2924] sm:text-lg">
                Arun Gopal Traders Admin
              </h2>
              <span className="text-[11px] text-[#6B746F]">
                Store Control &amp; Inventory Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={refreshAllData}
              variant="outline"
              size="sm"
              className="rounded-full gap-1 text-xs font-semibold border-[#E8E4DA] text-[#1F2924]"
            >
              <RefreshCw className="size-3.5" /> Refresh Live Data
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex rounded-full gap-1 text-xs text-[#145A45] hover:bg-[#FAF8F2]"
            >
              <Link to="/">
                <Store className="size-3.5" /> View Shop <ExternalLink className="size-3" />
              </Link>
            </Button>

            <Button
              onClick={handleLock}
              variant="outline"
              size="sm"
              className="rounded-full gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="size-3.5" /> Lock
            </Button>
          </div>
        </div>
      </div>

      {/* Main Admin Workspace Grid */}
      <div className="container-page py-6">
        {/* Mobile Horizontal Tabs Switcher */}
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "orders") setSelectedOrder(null);
                }}
                className={`shrink-0 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                  isActive
                    ? "bg-[#145A45] text-white"
                    : "border border-[#E8E4DA] bg-white text-[#6B746F] hover:text-[#1F2924]"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label.split(" ")[0]}</span>
                {tab.id === "orders" && pendingOrdersCount > 0 ? (
                  <span className="rounded-full bg-[#E3B341] px-1.5 py-0.2 text-[9px] font-black text-[#1F2924]">
                    {pendingOrdersCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block rounded-3xl border border-[#E8E4DA] bg-white p-3 shadow-xs lg:sticky lg:top-24 h-fit">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "orders") setSelectedOrder(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#145A45] text-white shadow-xs font-bold"
                        : "text-[#6B746F] hover:bg-[#FAF8F2] hover:text-[#1F2924]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4" />
                      {tab.label}
                    </span>

                    {tab.id === "orders" && pendingOrdersCount > 0 ? (
                      <span
                        className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-[#E3B341] text-[#1F2924]"
                            : "bg-[#E3B341]/30 text-[#1F2924]"
                        }`}
                      >
                        {pendingOrdersCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-[#E8E4DA] pt-4 px-2 text-[11px] text-[#6B746F]">
              📍 Maharajganj, Uttar Pradesh
              <br />
              📞 +91 6388354988
            </div>
          </aside>

          {/* Active Module View */}
          <main className="min-w-0">
            {activeTab === "overview" && (
              <AdminOverview
                orders={orders}
                products={products}
                onSelectOrder={(order) => {
                  setSelectedOrder(order);
                  setActiveTab("orders");
                }}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrders
                orders={orders}
                onRefresh={loadAllOrders}
                selectedOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
              />
            )}

            {activeTab === "products" && (
              <AdminProducts
                products={products}
                categories={categories}
                onRefresh={refetchProducts}
              />
            )}

            {activeTab === "inventory" && (
              <AdminInventory products={products} onRefresh={refetchProducts} />
            )}

            {activeTab === "categories" && (
              <AdminCategories categories={categories} onRefresh={refetchCategories} />
            )}

            {activeTab === "customers" && (
              <AdminCustomers
                orders={orders}
                onSelectOrder={(order) => {
                  setSelectedOrder(order);
                  setActiveTab("orders");
                }}
              />
            )}

            {activeTab === "coupons" && (
              <AdminCoupons coupons={coupons} onRefresh={refetchCoupons} />
            )}

            {activeTab === "help" && <AdminHelpRequests />}

            {activeTab === "settings" && (
              <AdminSettings settings={settings} onRefresh={refetchSettings} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
