import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  AlertCircle,
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
import { customerOrdersQuery, type Order } from "@/lib/queries";
import { inr, formatDate, ORDER_STATUS_LABEL } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Customer Account & Orders" },
      {
        name: "description",
        content:
          "Manage your grocery orders, 1-click reorder staples, saved delivery addresses, and customer profile at Arun Gopal Traders.",
      },
    ],
  }),
  component: AccountPage,
});

type CustomerAddress = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  house: string | null;
  area: string | null;
  landmark: string | null;
  city: string;
  pincode: string | null;
  is_default: boolean;
  created_at: string;
};

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { add } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { lang, t } = useLanguage();

  // Login Flow State
  const [loginPhone, setLoginPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientPhone, setNewRecipientPhone] = useState("");
  const [newHouse, setNewHouse] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newPin, setNewPin] = useState("273303");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Sync profile details into form
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name ?? "");
      setEditEmail(profile.email ?? user?.email ?? "");
    }
  }, [profile, user]);

  // Fetch customer saved addresses from Supabase
  const loadAddresses = async (userId: string) => {
    setAddressesLoading(true);
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses((data as unknown as CustomerAddress[]) ?? []);
    } catch (err) {
      console.warn("Could not load addresses from Supabase:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      void loadAddresses(user.id);
    } else {
      setAddresses([]);
    }
  }, [user?.id]);

  // Customer Orders Query
  const effectivePhone = user?.phone || profile?.phone;
  const {
    data: orders,
    isLoading: ordersLoading,
  } = useQuery(customerOrdersQuery(user?.id, effectivePhone));

  // Extract unique purchased items for Buy Again tab
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

  // Step 1: Send Mobile OTP via Supabase Auth
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    const clean = loginPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setAuthError(
        lang === "hi"
          ? "कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें"
          : "Please enter a valid 10-digit Indian mobile number",
      );
      return;
    }

    setIsSendingOtp(true);
    try {
      const fullPhone = `+91${clean}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        setAuthError(error.message);
        toast.error(error.message);
        return;
      }

      setOtpSent(true);
      setCountdown(45);
      toast.success(
        lang === "hi"
          ? `+91 ${clean} पर 6 अंकों का OTP भेज दिया गया है!`
          : `OTP sent to +91 ${clean}!`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  }

  // Step 2: Verify 6-Digit OTP via Supabase Auth
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 4) {
      setAuthError(
        lang === "hi"
          ? "कृपया 6 अंकों का सही OTP दर्ज करें"
          : "Please enter the 6-digit OTP received via SMS",
      );
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const clean = loginPhone.replace(/\D/g, "").slice(-10);
      const fullPhone = `+91${clean}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: cleanOtp,
        type: "sms",
      });

      if (error) {
        setAuthError(error.message);
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Ensure profile row exists in public.profiles linked to auth.uid()
        try {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              phone: data.user.phone ?? fullPhone,
              email: data.user.email ?? null,
            },
            { onConflict: "id" },
          );
        } catch (profileErr) {
          console.warn("Profile sync warning:", profileErr);
        }

        await refreshProfile();
        void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        void queryClient.invalidateQueries({ queryKey: ["user-addresses"] });

        toast.success(
          lang === "hi"
            ? "लॉगिन सफल! आपके खाते में स्वागत है।"
            : "Signed in successfully! Welcome back.",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  // Handle Logout via Supabase Auth
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setOtpSent(false);
      setOtpCode("");
      setLoginPhone("");
      setAuthError(null);
      void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      toast.info(lang === "hi" ? "आप सफलतापूर्वक लॉगआउट हो गए हैं।" : "Logged out successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Logout failed";
      toast.error(msg);
    }
  }

  // Handle Profile Update in public.profiles
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim() || null,
          email: editEmail.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(
        lang === "hi" ? "प्रोफ़ाइल विवरण अपडेट हो गया!" : "Profile updated successfully!",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Handle Add Address in public.addresses
  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!newHouse.trim() || !newArea.trim()) {
      toast.error(
        lang === "hi"
          ? "कृपया मकान/दुकान नंबर और मोहल्ला/सड़क दर्ज करें"
          : "Please provide house/shop number and area",
      );
      return;
    }

    setIsSavingAddress(true);
    try {
      const recipientName = newRecipientName.trim() || profile?.full_name || "Self";
      const recipientPhone = newRecipientPhone.trim() || user.phone || "";

      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        name: recipientName,
        phone: recipientPhone,
        house: newHouse.trim(),
        area: newArea.trim(),
        landmark: newLandmark.trim() || null,
        city: "Maharajganj",
        pincode: newPin.trim() || "273303",
        is_default: addresses.length === 0,
      });

      if (error) throw error;

      await loadAddresses(user.id);
      setNewHouse("");
      setNewArea("");
      setNewLandmark("");
      setNewRecipientName("");
      setNewRecipientPhone("");
      setShowAddAddress(false);
      toast.success(
        lang === "hi" ? "नया पता सफलतापूर्वक सहेजा गया!" : "Delivery address saved successfully!",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address";
      toast.error(msg);
    } finally {
      setIsSavingAddress(false);
    }
  }

  // Handle Delete Address
  async function handleDeleteAddress(addressId: string) {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", user.id);

      if (error) throw error;
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      toast.success(lang === "hi" ? "पता हटा दिया गया" : "Address removed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete address";
      toast.error(msg);
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
          variantLabel: item.variant_label ?? "1 pack",
          price: Number(item.price),
          mrp: Number(item.mrp || item.price),
          imageUrl: getProductImage({ name: item.name, image_url: item.image_url }),
          stock: 99,
        },
        item.qty,
      );
      addedCount++;
    });

    toast.success(`Added ${addedCount} items from Order ${order.order_no} to basket!`);
    void navigate({ to: "/cart" });
  }

  // 1. LOADING STATE
  if (authLoading) {
    return (
      <div className="container-page py-12 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // 2. UNAUTHENTICATED GUEST LOGIN SCREEN
  if (!user) {
    return (
      <div className="container-page py-8 sm:py-12 max-w-md mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#E6EFE8] text-[#0F4A38] border border-[#145A45]/20 shadow-2xs">
            <Smartphone className="size-6 text-[#0F4A38]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#16201A]">
            {lang === "hi" ? "मोबाइल नंबर से लॉगिन करें" : "Sign In with Mobile Number"}
          </h1>
          <p className="text-xs text-[#5A655F] max-w-xs mx-auto">
            {lang === "hi"
              ? "अपने ऑर्डर, 1-क्लिक राशन रीऑर्डर और सेव्ड पते देखने के लिए जारी रखें"
              : "Access your order history, instant grocery reordering, and saved addresses"}
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          {authError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">{lang === "hi" ? "लॉगिन त्रुटि" : "Authentication Notice"}</p>
                <p className="text-[11px] leading-relaxed mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          {otpSent ? (
            /* STEP 2: 6-DIGIT OTP INPUT SCREEN */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-xl bg-[#E6EFE8]/70 border border-[#145A45]/20 p-3 text-center">
                <p className="text-xs font-bold text-[#0F4A38]">
                  {lang === "hi"
                    ? `+91 ${loginPhone.slice(-10)} पर 6 अंकों का OTP भेजा गया`
                    : `6-digit OTP sent to +91 ${loginPhone.slice(-10)}`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode("");
                    setAuthError(null);
                  }}
                  className="mt-1 text-[11px] font-semibold text-[#145A45] underline hover:text-[#0A3628]"
                >
                  {lang === "hi" ? "मोबाइल नंबर बदलें" : "Change Mobile Number"}
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otp-input" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "6 अंकों का OTP दर्ज करें" : "Enter 6-Digit OTP"}
                </Label>
                <Input
                  id="otp-input"
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="h-12 rounded-xl text-center font-mono text-2xl tracking-[0.4em] border-[#E5E0D5] bg-white focus-visible:border-[#145A45] shadow-2xs font-black text-[#145A45]"
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length < 4}
                className="w-full h-11 rounded-xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-98 transition-all"
              >
                <CheckCircle2 className="mr-2 size-4" />
                {isVerifyingOtp
                  ? (lang === "hi" ? "सत्यापित हो रहा है..." : "Verifying OTP…")
                  : (lang === "hi" ? "सत्यापित करें व लॉगिन करें" : "Verify & Sign In")}
              </Button>

              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <p className="text-xs text-[#5A655F] flex items-center justify-center gap-1">
                    <Clock className="size-3.5 text-[#145A45]" />
                    {lang === "hi" ? `OTP दोबारा भेजें (${countdown}s)` : `Resend OTP in ${countdown}s`}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-xs font-bold text-[#145A45] hover:underline"
                  >
                    {isSendingOtp
                      ? (lang === "hi" ? "भेज रहा है..." : "Sending OTP…")
                      : (lang === "hi" ? "OTP दोबारा भेजें (Resend OTP)" : "Resend OTP")}
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* STEP 1: MOBILE NUMBER INPUT SCREEN */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-phone" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "10 अंकों का मोबाइल नंबर" : "10-Digit Mobile Number"}
                </Label>
                <div className="flex rounded-xl border border-[#E5E0D5] focus-within:ring-2 focus-within:ring-[#145A45]/30 focus-within:border-[#145A45] bg-white overflow-hidden shadow-2xs transition-all">
                  <span className="flex items-center bg-[#FAF8F2] px-3.5 text-xs font-black text-[#0F4A38] border-r border-[#E5E0D5]">
                    +91
                  </span>
                  <Input
                    id="login-phone"
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 rounded-none focus-visible:ring-0 text-sm font-bold text-[#16201A] h-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSendingOtp || loginPhone.replace(/\D/g, "").length !== 10}
                className="w-full h-11 rounded-xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-98 transition-all"
              >
                {isSendingOtp
                  ? (lang === "hi" ? "OTP भेजा जा रहा है..." : "Sending OTP…")
                  : (lang === "hi" ? "OTP भेजें (Get OTP) →" : "Send OTP →")}
              </Button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#5A655F]">
                <ShieldCheck className="size-3.5 text-[#145A45]" />
                <span>
                  {lang === "hi"
                    ? "सुरक्षित व केवल Supabase प्रमाणित लॉगिन"
                    : "Secure 100% verified Supabase login"}
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Guest Order Tracking Independent Option */}
        <div className="rounded-2xl border border-[#145A45]/20 bg-[#FAF8F2] p-4 text-center space-y-1.5">
          <p className="text-xs font-bold text-[#16201A] flex items-center justify-center gap-1.5">
            <Package className="size-4 text-[#145A45]" />
            <span>{lang === "hi" ? "क्या आपको केवल ऑर्डर ट्रैक करना है?" : "Looking to track an order?"}</span>
          </p>
          <p className="text-[11px] text-[#5A655F]">
            {lang === "hi"
              ? "बिना लॉगिन केवल ऑर्डर नंबर व मोबाइल नंबर डालकर लाइव स्टेटस देखें।"
              : "Guest order tracking is available without needing to sign in."}
          </p>
          <div className="pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg border-[#145A45] text-[#145A45] font-bold text-xs hover:bg-[#E6EFE8]"
            >
              <Link to="/track">
                {lang === "hi" ? "📦 बिना लॉगिन ऑर्डर ट्रैक करें →" : "Track Order as Guest →"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED CUSTOMER ACCOUNT SCREEN
  const customerName = profile?.full_name || (lang === "hi" ? "किराना ग्राहक" : "Valued Customer");
  const customerPhone = user.phone || profile?.phone || "";

  return (
    <div className="container-page py-6 sm:py-8 pb-28 lg:pb-12">
      {/* Customer Header Card */}
      <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="grid size-12 sm:size-14 place-items-center rounded-2xl bg-[#145A45] font-sans text-xl sm:text-2xl font-bold text-white shadow-2xs">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-xl sm:text-2xl font-black text-[#16201A]">
                  {customerName}
                </h1>
                <span className="rounded-full bg-[#E6EFE8] px-2 py-0.5 text-[10px] font-bold text-[#145A45]">
                  {lang === "hi" ? "सत्यापित ग्राहक" : "Verified Customer"}
                </span>
              </div>
              <p className="flex items-center gap-2 text-xs text-[#5A655F] mt-0.5">
                {customerPhone && (
                  <span className="flex items-center gap-1 font-semibold text-[#16201A]">
                    <Phone className="size-3 text-[#145A45]" /> {customerPhone}
                  </span>
                )}
                {profile?.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-[#145A45]" /> {profile.email}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 text-xs font-bold border-[#E5E0D5] text-[#5A655F] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>{lang === "hi" ? "लॉगआउट" : "Logout"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Tabs */}
      <div className="mt-6">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid h-11 w-full grid-cols-5 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-1">
            <TabsTrigger
              value="orders"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <Package className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "ऑर्डर" : "Orders"} ({orders?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="buy-again"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <RotateCcw className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "रीऑर्डर" : "Buy Again"} ({uniquePurchasedItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <MapPin className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पते" : "Addresses"} ({addresses.length})
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <Heart className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पसंद" : "Wishlist"} ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1"
            >
              <User className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "प्रोफ़ाइल" : "Profile"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MY ORDERS */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DA] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-black text-sm text-[#16201A]">
                          #{order.order_no}
                        </span>
                        <span className="rounded-full bg-[#E6EFE8] px-2.5 py-0.5 text-[11px] font-bold text-[#145A45]">
                          {ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5A655F]">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleReorder(order)}
                        size="sm"
                        className="h-8 rounded-xl gap-1 text-xs font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628]"
                      >
                        <RotateCcw className="size-3.5" /> {lang === "hi" ? "पुनः खरीदें" : "Buy Again"}
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl text-xs font-semibold border-[#E5E0D5] text-[#16201A] hover:bg-[#FAF8F2]"
                      >
                        <Link
                          to="/track"
                          search={{ orderNo: order.order_no, phone: order.customer_phone } as never}
                        >
                          {lang === "hi" ? "ट्रैक करें" : "Track Live"}
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {(order.order_items ?? []).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <img
                          src={getProductImage({
                            name: item.name,
                            image_url: item.image_url,
                          })}
                          alt={item.name}
                          className="size-9 rounded-md object-contain bg-transparent p-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#16201A]">{item.name}</p>
                          <p className="text-[10px] text-[#5A655F]">
                            {item.variant_label} × {item.qty} ({inr(item.price * item.qty)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E8E4DA] pt-2 text-xs">
                    <span className="text-[#5A655F] capitalize">
                      {order.order_type === "delivery" ? "होम डिलीवरी" : "दुकान से पिकअप"} • {order.payment_method?.toUpperCase()}
                    </span>
                    <span className="font-bold text-[#16201A]">
                      {lang === "hi" ? "कुल राशि: " : "Total: "}
                      <span className="text-[#145A45] font-black text-sm">{inr(order.total)}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-10 text-center bg-white">
                <ShoppingBag className="mx-auto size-12 text-[#5A655F]" />
                <h3 className="mt-3 font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "अभी तक कोई ऑर्डर नहीं" : "No orders found"}
                </h3>
                <p className="mt-1 text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "आपके खाते में अभी कोई पुराना ऑर्डर दर्ज नहीं है।"
                    : "You haven't placed any orders with this account yet."}
                </p>
                <Button asChild className="mt-4 rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0A3628]">
                  <Link to="/shop">{lang === "hi" ? "दुकान देखें" : "Start Shopping"}</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: BUY AGAIN (Previously Purchased Items) */}
          <TabsContent value="buy-again" className="space-y-4">
            <div>
              <h3 className="font-sans text-base font-bold text-[#16201A]">
                {lang === "hi" ? "आपने पहले ये सामान मंगाया था" : "Previously Purchased Staples"}
              </h3>
              <p className="text-xs text-[#5A655F]">
                {lang === "hi"
                  ? "अपने पसंदीदा दैनिक राशन को 1-क्लिक में दोबारा कार्ट में जोड़ें।"
                  : "Easily reorder your daily grocery essentials with a single click."}
              </p>
            </div>

            {uniquePurchasedItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {uniquePurchasedItems.map((item, idx) => (
                  <div
                    key={item.variantId || idx}
                    className="card-base flex flex-col justify-between overflow-hidden bg-white p-3 border border-[#E8E4DA] rounded-2xl"
                  >
                    <div className="flex aspect-square w-full items-center justify-center p-2">
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
                        <h4 className="line-clamp-2 text-xs font-bold text-[#16201A]">{item.name}</h4>
                        <p className="text-[11px] text-[#5A655F]">{item.variantLabel}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-[#16201A]">{inr(item.price)}</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            add({
                              variantId: item.variantId,
                              productId: item.productId,
                              slug: item.name.toLowerCase().replace(/\s+/g, "-"),
                              name: item.name,
                              variantLabel: item.variantLabel,
                              price: item.price,
                              mrp: item.mrp,
                              imageUrl: item.imageUrl ?? null,
                              stock: 99,
                            });
                            toast.success(`${item.name} ${t.added.toLowerCase()}`);
                          }}
                          className="h-8 rounded-xl bg-[#145A45] px-3 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0A3628] active:scale-95"
                        >
                          <Plus className="mr-1 size-3" /> {lang === "hi" ? "खरीदें" : "Buy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-10 text-center bg-white">
                <RotateCcw className="mx-auto size-12 text-[#5A655F]" />
                <h3 className="mt-3 font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "कोई पिछला ऑर्डर नहीं मिला" : "No purchase history yet"}
                </h3>
                <p className="mt-1 text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "जब आप राशन ऑर्डर करेंगे, तो वे सामान यहाँ तुरंत दिखाई देंगे।"
                    : "Items you order in the future will automatically appear here for fast reordering."}
                </p>
                <Button asChild className="mt-4 rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0A3628]">
                  <Link to="/shop">{lang === "hi" ? "सामान खरीदें" : "Start Shopping"}</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: SAVED ADDRESSES */}
          <TabsContent value="addresses" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "डिलीवरी पते" : "Saved Delivery Addresses"}
                </h3>
                <p className="text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "महाराजगंज में अपने घर, दुकान या दफ्तर का पता प्रबंधित करें।"
                    : "Manage your delivery addresses in Maharajganj, UP."}
                </p>
              </div>
              <Button
                onClick={() => setShowAddAddress(!showAddAddress)}
                size="sm"
                className="rounded-xl gap-1 text-xs font-bold bg-[#145A45] text-white hover:bg-[#0A3628]"
              >
                <Plus className="size-3.5" /> {lang === "hi" ? "नया पता जोड़ें" : "Add Address"}
              </Button>
            </div>

            {showAddAddress && (
              <form
                onSubmit={handleAddAddress}
                className="rounded-2xl border border-[#145A45]/30 bg-[#FAF8F2] p-5 space-y-3.5 animate-in fade-in duration-150"
              >
                <h4 className="font-bold text-xs sm:text-sm text-[#0F4A38] flex items-center gap-1.5">
                  <MapPin className="size-4 text-[#145A45]" />
                  <span>{lang === "hi" ? "नया डिलीवरी पता दर्ज करें" : "Enter New Delivery Address"}</span>
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    required
                    placeholder={lang === "hi" ? "प्राप्तकर्ता का नाम" : "Recipient Full Name"}
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    placeholder={lang === "hi" ? "मोबाइल नंबर (10 अंक)" : "Mobile Number (10 digits)"}
                    value={newRecipientPhone}
                    onChange={(e) => setNewRecipientPhone(e.target.value.replace(/\D/g, ""))}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                  <Input
                    required
                    placeholder={lang === "hi" ? "मकान / दुकान नं." : "House / Shop / Flat No."}
                    value={newHouse}
                    onChange={(e) => setNewHouse(e.target.value)}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                  <Input
                    required
                    placeholder={lang === "hi" ? "मोहल्ला / गली / सड़क" : "Area / Mohalla / Road Name"}
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                  <Input
                    placeholder={lang === "hi" ? "नजदीकी लैंडमार्क (वैकल्पिक)" : "Nearby Landmark (Optional)"}
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                  <Input
                    placeholder="पिन कोड (273303)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isSavingAddress}
                    size="sm"
                    className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0A3628]"
                  >
                    {isSavingAddress ? "सहेज रहा है..." : "पता सहेजें (Save Address)"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#E5E0D5] text-[#5A655F]"
                  >
                    रद्द करें (Cancel)
                  </Button>
                </div>
              </form>
            )}

            {addressesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : addresses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-xs flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#16201A]">
                          <MapPin className="size-4 text-[#145A45]" />
                          <span>{addr.name}</span>
                          <span className="font-normal text-[#5A655F]">({addr.phone})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-[#5A655F] hover:text-red-600 p-1 rounded-md transition-colors"
                          title="Delete address"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#16201A]">
                        {addr.house}, {addr.area}
                        {addr.landmark ? `, लैंडमार्क: ${addr.landmark}` : ""}
                        <br />
                        {addr.city}, UP - {addr.pincode || "273303"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-8 text-center bg-white">
                <MapPin className="mx-auto size-10 text-[#5A655F]" />
                <p className="mt-2 text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "कोई सहेजा गया पता नहीं मिला। ऊपर दिए बटन से नया पता जोड़ें।"
                    : "No saved addresses. Click Add Address to save your location."}
                </p>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: WISHLIST */}
          <TabsContent value="wishlist">
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8E4DA] p-10 text-center bg-white">
                <Heart className="mx-auto size-12 text-[#5A655F]" />
                <h3 className="mt-3 font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "विशलिस्ट खाली है" : "Wishlist is empty"}
                </h3>
                <p className="mt-1 text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "किसी भी उत्पाद पर दिल (Heart) आइकन दबाकर उसे यहाँ सहेजें।"
                    : "Tap the heart on any product to save it here for later."}
                </p>
                <Button asChild className="mt-4 rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0A3628]">
                  <Link to="/shop">{lang === "hi" ? "कैटलॉग देखें" : "Browse Catalogue"}</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 5: PROFILE SETTINGS */}
          <TabsContent value="profile">
            <div className="max-w-xl rounded-2xl border border-[#E8E4DA] bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "व्यक्तिगत जानकारी" : "Personal Information"}
                </h3>
                <p className="text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "अपना नाम और संपर्क ईमेल अपडेट करें।"
                    : "Update your customer name and contact email."}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="prof-name" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "पूरा नाम" : "Full Name"}
                  </Label>
                  <Input
                    id="prof-name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="उदा. रमेश कुमार"
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prof-phone" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "सत्यापित मोबाइल नंबर" : "Verified Mobile Number"}
                  </Label>
                  <Input
                    id="prof-phone"
                    disabled
                    value={user.phone || profile?.phone || ""}
                    className="rounded-xl border-[#E5E0D5] bg-[#FAF8F2] text-xs font-bold text-[#145A45]"
                  />
                  <p className="text-[10px] text-[#5A655F]">
                    {lang === "hi"
                      ? "मोबाइल नंबर केवल OTP लॉगिन द्वारा सुरक्षित रूप से लिंक रहता है।"
                      : "Mobile number is verified and authenticated via Supabase OTP."}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prof-email" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "ईमेल आईडी (वैकल्पिक)" : "Email Address (Optional)"}
                  </Label>
                  <Input
                    id="prof-email"
                    type="email"
                    placeholder="name@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="rounded-xl border-[#E5E0D5] bg-white text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs"
                >
                  {isSavingProfile ? "सहेज रहा है..." : "बदलाव सहेजें (Save Changes)"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
