import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Package,
  MapPin,
  Heart,
  Phone,
  Mail,
  LogOut,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { customerOrdersQuery, type Order, type Product } from "@/lib/queries";
import { inr, formatDate, ORDER_STATUS_LABEL, telHref } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Customer Account — Arun Gopal Traders" },
      {
        name: "description",
        content:
          "View order history, reorder past grocery items, manage addresses, and update profile.",
      },
    ],
  }),
  component: AccountPage,
});

type CustomerAddress = {
  id: string;
  house: string;
  area: string;
  landmark?: string | undefined;
  city: string;
  pincode: string;
};

function AccountPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { add } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();

  // Guest / Phone identification state
  const [identifiedPhone, setIdentifiedPhone] = useState<string>("");
  const [identifiedName, setIdentifiedName] = useState<string>("");

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");

  // Profile edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [newHouse, setNewHouse] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newPin, setNewPin] = useState("273303");
  const [showAddAddress, setShowAddAddress] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("agt.last_phone");
    const savedName = localStorage.getItem("agt.last_name");
    const savedAddress = localStorage.getItem("agt.last_address");

    if (savedPhone) setIdentifiedPhone(savedPhone);
    if (savedName) setIdentifiedName(savedName);

    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setAddresses([
          {
            id: "addr-local",
            house: parsed.house ?? "Primary Location",
            area: parsed.area ?? "Adda Bazar Road",
            landmark: parsed.landmark,
            city: "Maharajganj",
            pincode: parsed.pincode ?? "273303",
          },
        ]);
      } catch {
        // Ignore JSON parse failure for legacy address
      }
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name ?? "");
      setEditEmail(profile.email ?? "");
      setEditPhone(profile.phone ?? identifiedPhone);
      if (profile.phone) setIdentifiedPhone(profile.phone);
      if (profile.full_name) setIdentifiedName(profile.full_name);
    } else {
      setEditName(identifiedName);
      setEditPhone(identifiedPhone);
    }
  }, [profile, identifiedPhone, identifiedName]);

  // Query customer orders
  const effectivePhone = user?.phone || profile?.phone || identifiedPhone;
  const {
    data: orders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(customerOrdersQuery(user?.id, effectivePhone));

  // Extract unique purchased items across past orders for Buy Again tab
  const uniquePurchasedItems = useMemo(() => {
    const map = new Map<
      string,
      {
        variantId: string;
        productId: string;
        name: string;
        variantLabel: string;
        price: number;
        mrp: number;
        imageUrl: string | null;
      }
    >();
    (orders ?? []).forEach((order) => {
      (order.order_items ?? []).forEach((item) => {
        const key = item.variant_id || item.name;
        if (!map.has(key)) {
          map.set(key, {
            variantId: item.variant_id || "",
            productId: item.product_id || "",
            name: item.name,
            variantLabel: item.variant_label ?? "1 pack",
            price: Number(item.price),
            mrp: Number(item.mrp || item.price),
            imageUrl: item.image_url ?? null,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [orders]);

  // Handle Phone Identification (Fast Login for local customers)
  function handlePhoneIdentify(e: React.FormEvent) {
    e.preventDefault();
    const clean = loginPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setIdentifiedPhone(clean);
    if (loginName.trim()) setIdentifiedName(loginName.trim());
    localStorage.setItem("agt.last_phone", clean);
    if (loginName.trim()) localStorage.setItem("agt.last_name", loginName.trim());
    toast.success(`Welcome! Loaded order history for +91 ${clean}`);
  }

  // Handle Supabase Auth (Email / Password)
  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Please enter your email and password");
      return;
    }
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword.trim(),
      });
      if (error) throw error;
      toast.success("Signed in successfully!");
      void refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg);
    } finally {
      setIsSigningIn(false);
    }
  }

  // Handle 1-Click Buy Again / Reorder
  function handleReorder(order: Order) {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error("No items found in this order to reorder");
      return;
    }

    let addedCount = 0;
    order.order_items.forEach((item) => {
      add(
        {
          variantId: item.variant_id ?? `temp-${item.id}`,
          productId: item.product_id ?? item.id,
          slug: item.name.toLowerCase().replace(/\s+/g, "-"),
          name: item.name,
          variantLabel: item.variant_label ?? "Standard",
          price: Number(item.price),
          mrp: Number(item.mrp || item.price),
          imageUrl: getProductImage({ name: item.name, image_url: item.image_url }),
          stock: 99,
        },
        item.qty,
      );
      addedCount++;
    });

    toast.success(`Added ${addedCount} items from Order ${order.order_no} to your cart!`);
    void navigate({ to: "/cart" });
  }

  // Handle Profile Update
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: editName.trim(),
            phone: editPhone.trim(),
          })
          .eq("id", user.id);
        if (error) throw error;
        await refreshProfile();
      }

      setIdentifiedName(editName.trim());
      setIdentifiedPhone(editPhone.trim());
      localStorage.setItem("agt.last_name", editName.trim());
      localStorage.setItem("agt.last_phone", editPhone.trim());
      toast.success("Profile details updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Handle Add Address
  function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!newHouse.trim() || !newArea.trim()) {
      toast.error("Please fill house number and area");
      return;
    }

    const newAddr = {
      id: `addr-${Date.now()}`,
      house: newHouse.trim(),
      area: newArea.trim(),
      landmark: newLandmark.trim() || undefined,
      city: "Maharajganj",
      pincode: newPin.trim() || "273303",
    };

    setAddresses((prev) => [...prev, newAddr]);
    localStorage.setItem("agt.last_address", JSON.stringify(newAddr));
    setNewHouse("");
    setNewArea("");
    setNewLandmark("");
    setShowAddAddress(false);
    toast.success("Delivery address saved!");
  }

  function handleLogout() {
    if (user) void supabase.auth.signOut();
    setIdentifiedPhone("");
    setIdentifiedName("");
    localStorage.removeItem("agt.last_phone");
    localStorage.removeItem("agt.last_name");
    toast.info("Logged out successfully");
  }

  const isIdentified = Boolean(user || identifiedPhone);

  // If not logged in & no stored phone -> Show Customer Identification / Login Screen
  if (!isIdentified && !authLoading) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-[#E8E4DA] bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#FAF8F2] text-[#145A45] border border-[#E8E4DA]">
              <User className="size-6" />
            </div>
            <h1 className="mt-3 font-sans text-2xl font-bold text-[#1F2924]">
              Customer Account
            </h1>
            <p className="mt-1 text-xs text-[#6B746F]">
              Sign in with your mobile number to view past grocery orders, track deliveries, and
              reorder quickly.
            </p>
          </div>

          <div className="mt-6 flex rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-1 text-xs font-semibold">
            <button
              onClick={() => setAuthMode("phone")}
              className={`flex-1 rounded-lg py-2 transition-all ${
                authMode === "phone" ? "bg-white text-[#145A45] font-bold shadow-xs" : "text-[#6B746F]"
              }`}
            >
              Mobile Number (Instant)
            </button>
            <button
              onClick={() => setAuthMode("email")}
              className={`flex-1 rounded-lg py-2 transition-all ${
                authMode === "email" ? "bg-white text-[#145A45] font-bold shadow-xs" : "text-[#6B746F]"
              }`}
            >
              Email / Password
            </button>
          </div>

          {authMode === "phone" ? (
            <form onSubmit={handlePhoneIdentify} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-phone" className="text-xs font-semibold text-[#1F2924]">
                  Enter 10-Digit Mobile Number
                </Label>
                <div className="flex rounded-xl border border-[#E8E4DA] focus-within:ring-2 focus-within:ring-[#145A45]/20">
                  <span className="flex items-center bg-[#FAF8F2] px-3 text-xs font-bold text-[#6B746F] rounded-l-xl border-r border-[#E8E4DA]">
                    +91
                  </span>
                  <Input
                    id="login-phone"
                    required
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 rounded-l-none rounded-r-xl focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-name" className="text-xs font-semibold text-[#1F2924]">
                  Your Full Name{" "}
                  <span className="text-[#6B746F] font-normal">(Optional)</span>
                </Label>
                <Input
                  id="login-name"
                  placeholder="e.g. Ramesh Kumar"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white"
                />
              </div>

              <Button type="submit" className="w-full rounded-full py-6 font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333]">
                Continue to My Orders <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleEmailSignIn} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold text-[#1F2924]">
                  Email Address
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-pwd" className="text-xs font-semibold text-[#1F2924]">
                  Password
                </Label>
                <Input
                  id="auth-pwd"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-full py-6 font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333]"
              >
                <Lock className="mr-2 size-4" /> {isSigningIn ? "Signing In…" : "Sign In"}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-[#E8E4DA] pt-4 text-center text-xs text-[#6B746F]">
            Want to track an existing order without logging in?{" "}
            <Link to="/track" className="font-semibold text-[#145A45] hover:underline">
              Track Order here →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || identifiedName || "Valued Customer";
  const displayPhone = profile?.phone || identifiedPhone;

  return (
    <div className="container-page py-6 sm:py-8 pb-28 lg:pb-12">
      {/* Account Profile Header Bar */}
      <div className="rounded-3xl border border-[#E8E4DA] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-[#145A45] font-sans text-2xl font-bold text-white shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-sans text-2xl font-bold text-[#1F2924] sm:text-3xl">
                {displayName}
              </h1>
              <p className="flex items-center gap-2 text-xs text-[#6B746F]">
                <Phone className="size-3.5 text-[#145A45]" /> +91 {displayPhone}
                {profile?.email ? (
                  <>
                    <span>•</span>
                    <Mail className="size-3.5 text-[#145A45]" /> {profile.email}
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 text-xs border-[#E8E4DA] text-[#6B746F] hover:bg-[#FAF8F2]"
            >
              <LogOut className="size-3.5" /> Switch / Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Account Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid h-12 w-full grid-cols-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-1">
            <TabsTrigger
              value="orders"
              className="rounded-xl text-xs font-semibold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <Package className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "ऑर्डर" : "Orders"} ({orders?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="buy-again"
              className="rounded-xl text-xs font-semibold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <RotateCcw className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पुनः खरीदें" : "Buy Again"} ({uniquePurchasedItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="rounded-xl text-xs font-semibold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <MapPin className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पते" : "Addresses"}
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="rounded-xl text-xs font-semibold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <Heart className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पसंद" : "Wishlist"} ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-xl text-xs font-semibold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <User className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "प्रोफ़ाइल" : "Profile"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MY ORDERS */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-xs transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DA] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-[#1F2924]">
                          {order.order_no}
                        </span>
                        <span className="rounded-full bg-[#DCEBDD] px-2.5 py-0.5 text-[11px] font-bold text-[#145A45]">
                          {ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B746F]">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleReorder(order)}
                        size="sm"
                        variant="default"
                        className="h-8 rounded-full gap-1 text-xs font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0E4333]"
                      >
                        <RotateCcw className="size-3.5" /> Buy Again
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full text-xs font-semibold border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
                      >
                        <Link
                          to="/track"
                          search={{ orderNo: order.order_no, phone: order.customer_phone } as never}
                        >
                          Track Live
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {(order.order_items ?? []).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <img
                          src={getProductImage({
                            name: item.name,
                            image_url: item.image_url,
                          })}
                          alt={item.name}
                          className="size-9 rounded-md object-contain bg-[#FAF8F2] border border-[#E8E4DA] p-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#1F2924]">{item.name}</p>
                          <p className="text-[10px] text-[#6B746F]">
                            {item.variant_label} × {item.qty} ({inr(item.price * item.qty)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#E8E4DA] pt-2 text-xs">
                    <span className="text-[#6B746F] capitalize">
                      {order.order_type} in Maharajganj • {order.payment_method.toUpperCase()}
                    </span>
                    <span className="font-bold text-[#1F2924]">
                      Total:{" "}
                      <span className="text-[#145A45] font-sans text-sm">{inr(order.total)}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-12 text-center bg-white">
                <ShoppingBag className="mx-auto size-12 text-[#6B746F]" />
                <h3 className="mt-3 font-sans text-lg font-bold text-[#1F2924]">
                  No orders yet
                </h3>
                <p className="mt-1 text-xs text-[#6B746F]">
                  You haven't placed any orders with phone +91 {displayPhone} yet.
                </p>
                <Button asChild className="mt-4 rounded-full font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]">
                  <Link to="/shop">Start Shopping</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB: BUY AGAIN (Previously Purchased Items) */}
          <TabsContent value="buy-again" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-sans text-lg font-bold text-[#1F2924]">
                  {lang === "hi" ? "आपने पहले ये सामान खरीदा था" : "Previously Purchased Items"}
                </h3>
                <p className="text-xs text-[#6B746F]">
                  {lang === "hi"
                    ? "अपने पसंदीदा दैनिक राशन को 1-क्लिक में दोबारा कार्ट में जोड़ें।"
                    : "Easily reorder your daily grocery essentials with a single click."}
                </p>
              </div>
            </div>

            {uniquePurchasedItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {uniquePurchasedItems.map((item, idx) => (
                  <div
                    key={item.variantId || idx}
                    className="card-base flex flex-col justify-between overflow-hidden bg-white p-3 border border-[#E8E4DA] rounded-2xl"
                  >
                    <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-[#FAF8F2] p-2 border border-[#E8E4DA]">
                      <img
                        src={getProductImage({
                          name: item.name,
                          image_url: item.imageUrl,
                        })}
                        alt={item.name}
                        className="size-full max-h-[110px] object-contain"
                      />
                    </div>
                    <div className="mt-2 flex flex-1 flex-col justify-between space-y-1">
                      <div>
                        <h4 className="line-clamp-2 text-xs font-bold text-[#1F2924]">{item.name}</h4>
                        <p className="text-[11px] text-[#6B746F]">{item.variantLabel}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-[#1F2924]">{inr(item.price)}</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            add({
                              variantId: item.variantId,
                              productId: item.productId,
                              slug: "",
                              name: item.name,
                              variantLabel: item.variantLabel,
                              price: item.price,
                              mrp: item.mrp,
                              imageUrl: item.imageUrl ?? null,
                              stock: 99,
                            });
                            toast.success(`${item.name} ${t.added.toLowerCase()}`);
                          }}
                          className="h-8 rounded-full bg-[#145A45] px-3 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0E4333] active:scale-95"
                        >
                          <Plus className="mr-1 size-3" /> {lang === "hi" ? "फिर से खरीदें" : "Buy Again"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-12 text-center bg-white">
                <RotateCcw className="mx-auto size-12 text-[#6B746F]" />
                <h3 className="mt-3 font-sans text-lg font-bold text-[#1F2924]">
                  {lang === "hi" ? "कोई पिछला ऑर्डर नहीं मिला" : "No purchase history yet"}
                </h3>
                <p className="mt-1 text-xs text-[#6B746F]">
                  {lang === "hi"
                    ? "जब आप राशन ऑर्डर करेंगे, तो वे सामान यहाँ तुरंत दिखाई देंगे।"
                    : "Items you order in the future will automatically appear here for fast reordering."}
                </p>
                <Button asChild className="mt-4 rounded-full font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]">
                  <Link to="/shop">{lang === "hi" ? "सामान खरीदें" : "Start Shopping"}</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: SAVED ADDRESSES */}
          <TabsContent value="addresses" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-sans text-lg font-bold text-[#1F2924]">
                  Saved Delivery Locations
                </h3>
                <p className="text-xs text-[#6B746F]">
                  Manage your home, shop, or office addresses in Maharajganj.
                </p>
              </div>
              <Button
                onClick={() => setShowAddAddress(!showAddAddress)}
                size="sm"
                className="rounded-full gap-1 text-xs font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]"
              >
                <Plus className="size-3.5" /> Add Address
              </Button>
            </div>

            {showAddAddress ? (
              <form
                onSubmit={handleAddAddress}
                className="rounded-2xl border border-[#E8E4DA] bg-white p-5 space-y-4"
              >
                <h4 className="font-semibold text-sm text-[#1F2924]">New Delivery Address</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    required
                    placeholder="House / Shop No."
                    value={newHouse}
                    onChange={(e) => setNewHouse(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] bg-white"
                  />
                  <Input
                    required
                    placeholder="Area / Mohalla / Road"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] bg-white"
                  />
                  <Input
                    placeholder="Nearby Landmark (Optional)"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] bg-white"
                  />
                  <Input
                    placeholder="PIN Code (273303)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="rounded-full font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]">
                    Save Address
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#E8E4DA] text-[#6B746F]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-[#145A45]" />
                      <span className="font-bold text-xs text-[#1F2924]">Home / Delivery</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#1F2924]">
                    {addr.house}, {addr.area}
                    {addr.landmark ? `, Landmark: ${addr.landmark}` : ""}
                    <br />
                    {addr.city}, UP - {addr.pincode}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: WISHLIST */}
          <TabsContent value="wishlist">
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-12 text-center bg-white">
                <Heart className="mx-auto size-12 text-[#6B746F]" />
                <h3 className="mt-3 font-sans text-lg font-bold text-[#1F2924]">
                  Wishlist is empty
                </h3>
                <p className="mt-1 text-xs text-[#6B746F]">
                  Tap the heart on any product to save it here.
                </p>
                <Button asChild className="mt-4 rounded-full font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]">
                  <Link to="/shop">Browse Catalogue</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: PROFILE SETTINGS */}
          <TabsContent value="profile">
            <div className="max-w-xl rounded-2xl border border-[#E8E4DA] bg-white p-6 shadow-xs">
              <h3 className="font-sans text-lg font-bold text-[#1F2924]">
                Personal Information
              </h3>
              <p className="mt-0.5 text-xs text-[#6B746F]">
                Update your name and primary phone number.
              </p>

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name" className="text-xs font-semibold text-[#1F2924]">
                    Full Name
                  </Label>
                  <Input
                    id="prof-name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-phone" className="text-xs font-semibold text-[#1F2924]">
                    Mobile Number (10 digits)
                  </Label>
                  <Input
                    id="prof-phone"
                    required
                    type="tel"
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                    className="rounded-xl border-[#E8E4DA] bg-white"
                  />
                </div>

                {user ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email" className="text-xs font-semibold text-[#1F2924]">
                      Email Address
                    </Label>
                    <Input
                      id="prof-email"
                      type="email"
                      disabled
                      value={editEmail}
                      className="rounded-xl bg-[#FAF8F2] border-[#E8E4DA]"
                    />
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-full font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]"
                >
                  {isSavingProfile ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
