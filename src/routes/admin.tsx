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
      { title: "Arun Gopal Traders | Admin" },
      {
        name: "description",
        content: "Owner dashboard for products, inventory, orders, customers, and store settings.",
      },
      {
        name: "robots",
        content: "noindex, nofollow, noarchive, nosnippet",
      },
      {
        name: "googlebot",
        content: "noindex, nofollow",
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isAuthorizedAdmin = isUnlocked || isAdmin;

  // Queries - only execute when authenticated/unlocked
  const { data: products = [], refetch: refetchProducts } = useQuery({
    ...productsQuery({ activeOnly: false }),
    enabled: isAuthorizedAdmin,
  });
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    ...categoriesQuery,
    enabled: isAuthorizedAdmin,
  });
  const { data: settings, refetch: refetchSettings } = useQuery({
    ...settingsQuery,
    enabled: isAuthorizedAdmin,
  });
  const { data: coupons = [], refetch: refetchCoupons } = useQuery({
    ...couponsQuery,
    enabled: isAuthorizedAdmin,
  });

  // Load orders directly for admin
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  async function loadAllOrders() {
    if (!isAuthorizedAdmin) return;
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
    if (!isAuthorizedAdmin) return;

    void loadAllOrders();

    // Realtime subscription for live order updates
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          void loadAllOrders();
          if (payload.eventType === "INSERT") {
            toast.success("🔔 New Customer Order Received!");
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthorizedAdmin]);

  // Check stored admin session
  useEffect(() => {
    const sessionToken =
      sessionStorage.getItem("agt.admin_session") || localStorage.getItem("agt.admin_session");
    if (sessionToken === "unlocked" || isAdmin) {
      setIsUnlocked(true);
    }
  }, [isAdmin]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    const pin = adminPin.trim();
    if (
      pin === "6388" ||
      pin === "6388354988" ||
      pin === "9621" ||
      pin === "9621617360"
    ) {
      setIsUnlocked(true);
      sessionStorage.setItem("agt.admin_session", "unlocked");
      localStorage.setItem("agt.admin_session", "unlocked");
      setAdminPin("");
      toast.success("Welcome back to Arun Gopal Traders Admin!");
      await refreshProfile();
    } else {
      toast.error("Incorrect Admin PIN or Passcode. Access denied.");
    }
  }



  async function handleLock() {
    setIsUnlocked(false);
    sessionStorage.removeItem("agt.admin_session");
    localStorage.removeItem("agt.admin_session");
    setMobileDrawerOpen(false);
    if (user) {
      await supabase.auth.signOut();
    }
    toast.info("Admin portal locked successfully");
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
      <div className="container-page min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#FAF8F2] text-[#0F4A38] border border-[#E5E0D5] shadow-2xs">
              <Lock className="size-7 text-[#145A45]" />
            </div>
            <h1 className="mt-4 font-sans text-2xl font-bold text-[#16201A]">
              Store Management Portal
            </h1>
            <p className="mt-1 text-xs text-[#5A655F]">
              Restricted owner authentication for Arun Gopal Traders.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#16201A]">Store Passcode / PIN</label>
              <Input
                type="password"
                required
                autoFocus
                placeholder="••••"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="h-12 rounded-lg text-center font-mono text-xl tracking-widest border-[#E5E0D5] bg-white focus-visible:border-[#145A45]"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-lg font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-95 transition-all text-sm"
            >
              Unlock Dashboard <ShieldCheck className="ml-2 size-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center min-h-[44px] px-3 text-xs font-semibold text-[#145A45] hover:underline"
            >
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
    <div className="min-h-screen bg-[#FAF8F2] overflow-x-hidden">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E5E0D5] bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open Admin Navigation"
              className="flex size-10 items-center justify-center rounded-lg border border-[#E5E0D5] bg-[#FAF8F2] text-[#16201A] lg:hidden active:scale-95 transition-all"
            >
              <LayoutDashboard className="size-5 text-[#145A45]" />
            </button>

            <span className="hidden sm:grid size-9 place-items-center rounded-lg bg-[#145A45] font-sans text-base font-bold text-white shadow-2xs">
              🌾
            </span>
            <div>
              <h2 className="font-sans font-bold text-sm sm:text-base leading-tight text-[#16201A]">
                Arun Gopal Traders Admin
              </h2>
              <span className="text-[11px] text-[#5A655F] hidden sm:inline">
                Store Control &amp; Inventory Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshAllData}
              title="Refresh Data"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E5E0D5] bg-white px-3 text-xs font-semibold text-[#16201A] hover:bg-[#FAF8F2] active:scale-95 transition-all shadow-2xs"
            >
              <RefreshCw className="size-3.5 text-[#145A45]" />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              to="/"
              className="hidden md:flex h-9 items-center justify-center rounded-lg border border-[#E5E0D5] bg-white px-3 text-xs font-semibold text-[#145A45] hover:bg-[#FAF8F2] active:scale-95 transition-all shadow-2xs gap-1"
            >
              <Store className="size-3.5" /> <span>View Store</span> <ExternalLink className="size-3" />
            </Link>

            <button
              type="button"
              onClick={handleLock}
              title="Lock Admin Portal"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 text-xs font-bold text-red-700 hover:bg-red-100 active:scale-95 transition-all shadow-2xs"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex w-80 max-w-[85vw] flex-col bg-white border-r border-[#E5E0D5] p-5 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#145A45] text-white font-bold text-sm">
                  🌾
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#0F4A38]">Admin Portal</h3>
                  <p className="text-[10px] text-[#5A655F]">Arun Gopal Traders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg border border-[#E5E0D5] text-[#5A655F]"
              >
                ✕
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "orders") setSelectedOrder(null);
                      setMobileDrawerOpen(false);
                    }}
                    className={`flex w-full min-h-[40px] items-center justify-between rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#145A45] text-white shadow-xs font-bold"
                        : "text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#16201A]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4" />
                      {tab.label}
                    </span>

                    {tab.id === "orders" && pendingOrdersCount > 0 ? (
                      <span
                        className={`grid size-5 place-items-center rounded-md text-[10px] font-bold ${
                          isActive
                            ? "bg-[#E3B341] text-[#16201A]"
                            : "bg-[#E3B341]/30 text-[#16201A]"
                        }`}
                      >
                        {pendingOrdersCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-[#E5E0D5] pt-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[#E5E0D5] bg-[#FAF8F2] px-3 text-xs font-bold text-[#0F4A38]"
              >
                <Store className="size-4" /> View Customer Store
              </Link>
              <button
                type="button"
                onClick={handleLock}
                className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-700"
              >
                <LogOut className="size-4" /> Lock Admin Portal
              </button>
            </div>
          </div>
        </div>
      )}

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
                className={`shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                  isActive
                    ? "bg-[#145A45] text-white"
                    : "border border-[#E5E0D5] bg-white text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label.split(" ")[0]}</span>
                {tab.id === "orders" && pendingOrdersCount > 0 ? (
                  <span className="rounded-md bg-[#E3B341] px-1.5 py-0.2 text-[9px] font-black text-[#16201A]">
                    {pendingOrdersCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block rounded-2xl border border-[#E5E0D5] bg-white p-3 shadow-xs lg:sticky lg:top-24 h-fit">
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
                    className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#145A45] text-white shadow-xs font-bold"
                        : "text-[#5A655F] hover:bg-[#FAF8F2] hover:text-[#16201A]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4" />
                      {tab.label}
                    </span>

                    {tab.id === "orders" && pendingOrdersCount > 0 ? (
                      <span
                        className={`grid size-5 place-items-center rounded-md text-[10px] font-bold ${
                          isActive
                            ? "bg-[#E3B341] text-[#16201A]"
                            : "bg-[#E3B341]/30 text-[#16201A]"
                        }`}
                      >
                        {pendingOrdersCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-[#E5E0D5] pt-4 px-2 text-[11px] text-[#5A655F]">
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
