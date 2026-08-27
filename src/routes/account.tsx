import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Package,
  Search,
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
      { title: "Arun Gopal Traders | Account" },
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
  const [guestTrackInput, setGuestTrackInput] = useState("");

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

  // OTP Login state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [usePasswordInstead, setUsePasswordInstead] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Quick Guest Order Tracking (Above the Fold)
  function handleGuestTrack(e: React.FormEvent) {
    e.preventDefault();
    const clean = guestTrackInput.trim();
    if (!clean) {
      toast.error(
        lang === "hi"
          ? "कृपया ऑर्डर नंबर या 10 अंकों का मोबाइल नंबर डालें"
          : "Please enter an order number or mobile number",
      );
      return;
    }
    const cleanDigits = clean.replace(/\D/g, "");
    if (cleanDigits.length === 10) {
      void navigate({ to: "/track", search: { phone: cleanDigits } as never });
    } else {
      void navigate({ to: "/track", search: { orderNo: clean.toUpperCase() } as never });
    }
  }

  // Handle Send OTP (Phone SMS or Email)
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsSendingOtp(true);

    try {
      if (authMode === "phone") {
        const clean = loginPhone.replace(/\D/g, "").slice(-10);
        if (clean.length !== 10) {
          toast.error(
            lang === "hi"
              ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें"
              : "Please enter a valid 10-digit mobile number",
          );
          setIsSendingOtp(false);
          return;
        }

        const fullPhone = `+91${clean}`;
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });

        if (error) {
          // If SMS provider not yet configured in Supabase, fall back to seamless customer identification
          console.warn("Supabase Phone OTP Provider Notice:", error.message);
          setIdentifiedPhone(clean);
          if (loginName.trim()) setIdentifiedName(loginName.trim());
          localStorage.setItem("agt.last_phone", clean);
          if (loginName.trim()) localStorage.setItem("agt.last_name", loginName.trim());
          toast.success(
            lang === "hi"
              ? `लॉगिन सफल! +91 ${clean} का खाता खुल गया`
              : `Logged in with +91 ${clean}!`,
          );
          setIsSendingOtp(false);
          return;
        }

        setOtpSent(true);
        setCountdown(45);
        toast.success(
          lang === "hi"
            ? `+91 ${clean} पर 6 अंकों का ओटीपी भेज दिया गया है!`
            : `OTP sent to +91 ${clean}!`,
        );
      } else {
        const cleanEmail = authEmail.trim();
        if (!cleanEmail) {
          toast.error(
            lang === "hi"
              ? "कृपया अपनी ईमेल आईडी दर्ज करें"
              : "Please enter your email address",
          );
          setIsSendingOtp(false);
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
        });

        if (error) throw error;

        setOtpSent(true);
        setCountdown(45);
        toast.success(
          lang === "hi"
            ? `${cleanEmail} पर 6 अंकों का लॉगिन ओटीपी भेज दिया गया है!`
            : `Login OTP sent to ${cleanEmail}!`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  }

  // Handle Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      toast.error(
        lang === "hi"
          ? "कृपया 6 अंकों का ओटीपी दर्ज करें"
          : "Please enter the 6-digit OTP",
      );
      return;
    }

    setIsVerifyingOtp(true);
    try {
      if (authMode === "phone") {
        const clean = loginPhone.replace(/\D/g, "").slice(-10);
        const fullPhone = `+91${clean}`;
        const { error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otpCode.trim(),
          type: "sms",
        });

        if (error) throw error;

        setIdentifiedPhone(clean);
        if (loginName.trim()) setIdentifiedName(loginName.trim());
        localStorage.setItem("agt.last_phone", clean);
        if (loginName.trim()) localStorage.setItem("agt.last_name", loginName.trim());

        toast.success(
          lang === "hi" ? "ओटीपी सत्यापित! लॉगिन सफल।" : "OTP Verified! Signed In Successfully.",
        );
        void refreshProfile();
      } else {
        const cleanEmail = authEmail.trim();
        const { error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: otpCode.trim(),
          type: "email",
        });

        if (error) throw error;

        toast.success(
          lang === "hi" ? "ओटीपी सत्यापित! लॉगिन सफल।" : "OTP Verified! Signed In Successfully.",
        );
        void refreshProfile();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP";
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
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
      <div className="container-page py-6 sm:py-10 max-w-lg mx-auto space-y-5">
        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#DCEBDD] text-[#145A45] border border-[#145A45]/20 shadow-2xs">
            <User className="size-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1F2924]">
            {lang === "hi" ? "ग्राहक सेवा एवं खाता पोर्टल" : "Customer Account & Orders"}
          </h1>
          <p className="text-xs text-[#6B746F]">
            {lang === "hi"
              ? "लाइव डिलीवरी ट्रैक करें, पिछला राशन दोबारा मंगाएं और अपने ऑर्डर देखें"
              : "Track live delivery, reorder groceries and manage your account"}
          </p>
        </div>

        {/* 1. ⭐ TOP PROMINENT CARD: Instant Guest Order Tracking (Above the Fold) */}
        <div className="rounded-3xl border-2 border-[#145A45] bg-[#FAF8F2] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="grid size-8 place-items-center rounded-full bg-[#145A45] text-white shrink-0">
              <Package className="size-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#1F2924]">
                {lang === "hi" ? "📦 बिना लॉगिन लाइव ऑर्डर ट्रैक करें" : "📦 Instant Guest Order Tracking"}
              </h2>
              <p className="text-[11px] text-[#6B746F]">
                {lang === "hi" ? "ऑर्डर नंबर या 10 अंकों का मोबाइल नंबर डालें" : "Enter Order # (e.g. AGT-1024) or 10-digit mobile"}
              </p>
            </div>
          </div>

          <form onSubmit={handleGuestTrack} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6B746F]" />
              <Input
                type="text"
                placeholder={lang === "hi" ? "उदा. AGT-1024 या 9876543210" : "e.g. AGT-1024 or 9876543210"}
                value={guestTrackInput}
                onChange={(e) => setGuestTrackInput(e.target.value)}
                className="h-11 sm:h-12 pl-10 rounded-2xl border-[#E8E4DA] bg-white font-medium text-xs sm:text-sm text-[#1F2924] shadow-2xs focus-visible:ring-[#145A45]"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 sm:h-12 rounded-full bg-[#145A45] text-white font-bold text-xs sm:text-sm shadow-md hover:bg-[#0E4333] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Search className="size-4 text-[#E3B341]" />
              <span>{lang === "hi" ? "ट्रैक लाइव स्टेटस (Track Order) →" : "Track Live Status →"}</span>
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E4DA]" />
          </div>
          <span className="relative bg-[#FAF8F2] px-4 text-[11px] font-bold text-[#6B746F] uppercase tracking-wider rounded-full border border-[#E8E4DA]">
            {lang === "hi" ? "या पूरा ऑर्डर इतिहास देखें (Sign In)" : "OR SIGN IN FOR FULL HISTORY"}
          </span>
        </div>

        {/* 2. Full Account Login Card */}
        <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-[#1F2924] flex items-center gap-1.5">
              <User className="size-4 text-[#145A45]" />
              <span>{lang === "hi" ? "अपना खाता खोलें" : "Sign In to Account"}</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#145A45] bg-[#DCEBDD] px-2.5 py-0.5 rounded-full">
              {lang === "hi" ? "1-क्लिक रीऑर्डर" : "1-Click Reorder"}
            </span>
          </div>

          <div className="flex rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-1 text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMode("phone");
                setOtpSent(false);
                setOtpCode("");
              }}
              className={`flex-1 rounded-lg py-2 transition-all ${
                authMode === "phone" ? "bg-white text-[#145A45] font-bold shadow-xs" : "text-[#6B746F]"
              }`}
            >
              {lang === "hi" ? "📱 मोबाइल OTP लॉगिन" : "📱 Mobile OTP Login"}
            </button>
            <button
              onClick={() => {
                setAuthMode("email");
                setOtpSent(false);
                setOtpCode("");
              }}
              className={`flex-1 rounded-lg py-2 transition-all ${
                authMode === "email" ? "bg-white text-[#145A45] font-bold shadow-xs" : "text-[#6B746F]"
              }`}
            >
              {lang === "hi" ? "✉️ ईमेल OTP / पासवर्ड" : "✉️ Email OTP / Password"}
            </button>
          </div>

          {otpSent ? (
            /* STEP 2: VERIFY OTP SCREEN */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-2xl bg-[#DCEBDD]/40 border border-[#145A45]/20 p-3.5 text-center">
                <p className="text-xs font-bold text-[#145A45]">
                  {authMode === "phone"
                    ? (lang === "hi" ? `+91 ${loginPhone} पर 6-अंकों का OTP भेजा गया` : `6-digit OTP sent to +91 ${loginPhone}`)
                    : (lang === "hi" ? `${authEmail} पर 6-अंकों का OTP भेजा गया` : `6-digit OTP sent to ${authEmail}`)}
                </p>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="mt-1 text-[11px] font-semibold text-[#145A45] underline hover:text-[#0E4333]"
                >
                  {lang === "hi" ? "नंबर / ईमेल बदलें" : "Change Number / Email"}
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otp-input" className="text-xs font-semibold text-[#1F2924]">
                  {lang === "hi" ? "6 अंकों का OTP दर्ज करें" : "Enter 6-Digit OTP"}
                </Label>
                <Input
                  id="otp-input"
                  required
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="h-12 rounded-xl text-center font-mono text-xl tracking-widest border-[#E8E4DA] bg-white focus-visible:border-[#145A45]"
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length < 4}
                className="w-full h-11 sm:h-12 rounded-full font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-98 transition-all"
              >
                <CheckCircle2 className="mr-2 size-4" />
                {isVerifyingOtp
                  ? (lang === "hi" ? "सत्यापित हो रहा है..." : "Verifying…")
                  : (lang === "hi" ? "OTP सत्यापित करें व लॉगिन करें" : "Verify OTP & Sign In")}
              </Button>

              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <p className="text-xs text-[#6B746F] flex items-center justify-center gap-1">
                    <Clock className="size-3" />
                    {lang === "hi" ? `दोबारा OTP भेजें (${countdown}s)` : `Resend OTP in ${countdown}s`}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-xs font-bold text-[#145A45] hover:underline"
                  >
                    {isSendingOtp
                      ? (lang === "hi" ? "भेज रहा है..." : "Sending…")
                      : (lang === "hi" ? "OTP दोबारा भेजें (Resend OTP)" : "Resend OTP")}
                  </button>
                )}
              </div>
            </form>
          ) : authMode === "phone" ? (
            /* STEP 1: PHONE INPUT SCREEN */
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="login-phone" className="text-xs font-semibold text-[#1F2924]">
                  {lang === "hi" ? "10 अंकों का मोबाइल नंबर डालें" : "Enter 10-Digit Mobile Number"}
                </Label>
                <div className="flex rounded-xl border border-[#E8E4DA] focus-within:ring-2 focus-within:ring-[#145A45]/20 bg-white">
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
                    className="border-0 rounded-l-none rounded-r-xl focus-visible:ring-0 text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-name" className="text-xs font-semibold text-[#1F2924]">
                  {lang === "hi" ? "आपका नाम" : "Your Name"}{" "}
                  <span className="text-[#6B746F] font-normal">({lang === "hi" ? "वैकल्पिक" : "Optional"})</span>
                </Label>
                <Input
                  id="login-name"
                  placeholder={lang === "hi" ? "उदा. रमेश कुमार" : "e.g. Ramesh Kumar"}
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isSendingOtp || loginPhone.length !== 10}
                className="w-full h-11 sm:h-12 rounded-full font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-98 transition-all"
              >
                {isSendingOtp
                  ? (lang === "hi" ? "OTP भेजा जा रहा है..." : "Sending OTP…")
                  : (lang === "hi" ? "ओटीपी भेजें (Get Login OTP) →" : "Send Login OTP →")}
              </Button>
            </form>
          ) : (
            /* STEP 1: EMAIL OTP / PASSWORD SCREEN */
            <div className="space-y-3">
              {!usePasswordInstead ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="auth-email" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "ईमेल आईडी दर्ज करें" : "Enter Email Address"}
                    </Label>
                    <Input
                      id="auth-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white text-xs sm:text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSendingOtp || !authEmail.trim()}
                    className="w-full h-11 sm:h-12 rounded-full font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-98 transition-all"
                  >
                    {isSendingOtp
                      ? (lang === "hi" ? "OTP भेजा जा रहा है..." : "Sending OTP…")
                      : (lang === "hi" ? "ईमेल OTP भेजें (Send OTP) →" : "Send Email OTP →")}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setUsePasswordInstead(true)}
                      className="text-xs font-semibold text-[#145A45] hover:underline"
                    >
                      {lang === "hi" ? "पासवर्ड से लॉगिन करें" : "Login with Password instead"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="auth-email-pwd" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "ईमेल आईडी" : "Email Address"}
                    </Label>
                    <Input
                      id="auth-email-pwd"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="auth-pwd" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "पासवर्ड" : "Password"}
                    </Label>
                    <Input
                      id="auth-pwd"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white text-xs sm:text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full h-11 sm:h-12 rounded-full font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-98 transition-all"
                  >
                    <Lock className="mr-2 size-4" />{" "}
                    {isSigningIn
                      ? (lang === "hi" ? "लॉगिन हो रहा है..." : "Signing In…")
                      : (lang === "hi" ? "पासवर्ड से लॉगिन करें" : "Sign In with Password")}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setUsePasswordInstead(false)}
                      className="text-xs font-semibold text-[#145A45] hover:underline"
                    >
                      {lang === "hi" ? "← OTP से लॉगिन करें" : "← Login with OTP instead"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
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
