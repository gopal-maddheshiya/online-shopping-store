import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-foreground">
              Customer Account
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in with your mobile number to view past grocery orders, track deliveries, and
              reorder quickly.
            </p>
          </div>

          <div className="mt-6 flex rounded-xl bg-muted p-1 text-xs font-semibold">
            <button
              onClick={() => setAuthMode("phone")}
              className={`flex-1 rounded-lg py-2 transition-all ${
                authMode === "phone" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Mobile Number (Instant)
            </button>
            <button
              onClick={() => setAuthMode("email")}
              className={`flex-1 rounded-lg py-2 transition-all ${
                authMode === "email" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Email / Password
            </button>
          </div>

          {authMode === "phone" ? (
            <form onSubmit={handlePhoneIdentify} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-phone" className="text-xs font-semibold">
                  Enter 10-Digit Mobile Number
                </Label>
                <div className="flex rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="flex items-center bg-muted px-3 text-xs font-bold text-muted-foreground rounded-l-xl">
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
                <Label htmlFor="login-name" className="text-xs font-semibold">
                  Your Full Name{" "}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="login-name"
                  placeholder="e.g. Ramesh Kumar"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl py-6 font-bold shadow-md">
                Continue to My Orders <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleEmailSignIn} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-pwd" className="text-xs font-semibold">
                  Password
                </Label>
                <Input
                  id="auth-pwd"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded-xl py-6 font-bold shadow-md"
              >
                <Lock className="mr-2 size-4" /> {isSigningIn ? "Signing In…" : "Sign In"}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Want to track an existing order without logging in?{" "}
            <Link to="/track" className="font-semibold text-primary hover:underline">
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
    <div className="container-page py-8">
      {/* Account Profile Header Bar */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 font-display text-2xl font-bold text-primary-foreground shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {displayName}
              </h1>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="size-3.5 text-primary" /> +91 {displayPhone}
                {profile?.email ? (
                  <>
                    <span>•</span>
                    <Mail className="size-3.5" /> {profile.email}
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
              className="rounded-xl gap-1.5 text-xs"
            >
              <LogOut className="size-3.5" /> Switch / Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Account Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid h-12 w-full grid-cols-4 rounded-2xl bg-muted p-1">
            <TabsTrigger value="orders" className="rounded-xl text-xs font-semibold">
              <Package className="mr-1.5 size-4" /> My Orders ({orders?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-xl text-xs font-semibold">
              <MapPin className="mr-1.5 size-4" /> Addresses
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-xl text-xs font-semibold">
              <Heart className="mr-1.5 size-4" /> Wishlist ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl text-xs font-semibold">
              <User className="mr-1.5 size-4" /> Profile
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
                  className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-foreground">
                          {order.order_no}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                          {ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleReorder(order)}
                        size="sm"
                        variant="default"
                        className="h-8 rounded-lg gap-1 text-xs font-bold shadow-xs"
                      >
                        <RotateCcw className="size-3.5" /> Buy Again
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs font-semibold"
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
                          className="size-9 rounded-md object-cover bg-muted"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.variant_label} × {item.qty} ({inr(item.price * item.qty)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-2 text-xs">
                    <span className="text-muted-foreground capitalize">
                      {order.order_type} in Maharajganj • {order.payment_method.toUpperCase()}
                    </span>
                    <span className="font-bold text-foreground">
                      Total:{" "}
                      <span className="text-primary font-display text-sm">{inr(order.total)}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <ShoppingBag className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  No orders yet
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You haven't placed any orders with phone +91 {displayPhone} yet.
                </p>
                <Button asChild className="mt-4 rounded-xl font-semibold">
                  <Link to="/shop">Start Shopping</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: SAVED ADDRESSES */}
          <TabsContent value="addresses" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Saved Delivery Locations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your home, shop, or office addresses in Maharajganj.
                </p>
              </div>
              <Button
                onClick={() => setShowAddAddress(!showAddAddress)}
                size="sm"
                className="rounded-xl gap-1 text-xs font-semibold"
              >
                <Plus className="size-3.5" /> Add Address
              </Button>
            </div>

            {showAddAddress ? (
              <form
                onSubmit={handleAddAddress}
                className="rounded-2xl border border-border bg-card p-5 space-y-4"
              >
                <h4 className="font-semibold text-sm">New Delivery Address</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    required
                    placeholder="House / Shop No."
                    value={newHouse}
                    onChange={(e) => setNewHouse(e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    required
                    placeholder="Area / Mohalla / Road"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Nearby Landmark (Optional)"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="PIN Code (273303)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="rounded-xl font-semibold">
                    Save Address
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
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
                  className="rounded-2xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      <span className="font-bold text-xs">Home / Delivery</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground">
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
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <Heart className="mx-auto size-12 text-muted-foreground" />
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  Wishlist is empty
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tap the heart on any product to save it here.
                </p>
                <Button asChild className="mt-4 rounded-xl font-semibold">
                  <Link to="/shop">Browse Catalogue</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: PROFILE SETTINGS */}
          <TabsContent value="profile">
            <div className="max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xs">
              <h3 className="font-display text-lg font-bold text-foreground">
                Personal Information
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Update your name and primary phone number.
              </p>

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="prof-name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-phone" className="text-xs font-semibold">
                    Mobile Number (10 digits)
                  </Label>
                  <Input
                    id="prof-phone"
                    required
                    type="tel"
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                    className="rounded-xl"
                  />
                </div>

                {user ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="prof-email"
                      type="email"
                      disabled
                      value={editEmail}
                      className="rounded-xl bg-muted"
                    />
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl font-semibold"
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
