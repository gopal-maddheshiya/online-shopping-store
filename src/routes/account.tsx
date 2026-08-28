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
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  KeyRound,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  CheckCircle2,
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

// Development-only master recovery key for password reset during testing
const DEV_RECOVERY_KEY = "AGT-RECOVER-2026";

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { add } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { lang, t } = useLanguage();

  // Auth Mode: "signin" | "signup" | "forgot"
  const [authView, setAuthView] = useState<"signin" | "signup" | "forgot">("signin");

  // Sign In Form State
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Forgot Password Form State
  const [forgotPhone, setForgotPhone] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSendingRecoveryOtp, setIsSendingRecoveryOtp] = useState(false);

  // Error Banner State
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

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

  // Sync profile details into form
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name ?? "");
      setEditEmail(profile.email ?? user?.email ?? "");
    }
  }, [profile, user]);

  // Fetch customer saved addresses strictly for the authenticated user
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

  // Customer Orders Query strictly scoped to the authenticated user ID
  const {
    data: orders,
    isLoading: ordersLoading,
  } = useQuery(customerOrdersQuery(user?.id, user?.phone || profile?.phone));

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

  // ==========================================
  // 1. SIGN IN (Phone + Password)
  // ==========================================
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthErrorMessage(null);

    const clean = signInPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setAuthErrorMessage(
        lang === "hi"
          ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें"
          : "Please enter a valid 10-digit mobile number",
      );
      return;
    }

    if (!signInPassword) {
      setAuthErrorMessage(
        lang === "hi" ? "कृपया अपना पासवर्ड दर्ज करें" : "Please enter your password",
      );
      return;
    }

    setIsSigningIn(true);
    try {
      const fullPhone = `+91${clean}`;
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: fullPhone,
        password: signInPassword,
      });

      if (error) {
        // Clear message for incorrect password or invalid credentials
        setAuthErrorMessage(
          lang === "hi"
            ? "गलत पासवर्ड या मोबाइल नंबर। कृपया सही पासवर्ड डालें या पासवर्ड रीसेट करें।"
            : "Incorrect password or mobile number. Please check your credentials or reset your password.",
        );
        return;
      }

      if (data.user) {
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
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setAuthErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  }

  // ==========================================
  // 2. SIGN UP (Name + Phone + Password)
  // ==========================================
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthErrorMessage(null);

    const fullName = signUpName.trim();
    if (!fullName) {
      setAuthErrorMessage(
        lang === "hi" ? "कृपया अपना पूरा नाम दर्ज करें" : "Please enter your full name",
      );
      return;
    }

    const clean = signUpPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setAuthErrorMessage(
        lang === "hi"
          ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें"
          : "Please enter a valid 10-digit mobile number",
      );
      return;
    }

    if (signUpPassword.length < 6) {
      setAuthErrorMessage(
        lang === "hi"
          ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए"
          : "Password must be at least 6 characters long",
      );
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setAuthErrorMessage(
        lang === "hi" ? "पासवर्ड मैच नहीं कर रहे हैं" : "Passwords do not match",
      );
      return;
    }

    setIsSigningUp(true);
    try {
      const fullPhone = `+91${clean}`;

      // Sign up via Supabase Auth Phone + Password
      const { data, error } = await supabase.auth.signUp({
        phone: fullPhone,
        password: signUpPassword,
        options: {
          data: {
            full_name: fullName,
            phone: fullPhone,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("exists")) {
          setAuthErrorMessage(
            lang === "hi"
              ? "यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।"
              : "This mobile number is already registered. Please sign in.",
          );
        } else {
          setAuthErrorMessage(error.message);
        }
        return;
      }

      if (data.user) {
        // Upsert user profile linked to auth.uid()
        try {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              full_name: fullName,
              phone: fullPhone,
            },
            { onConflict: "id" },
          );
        } catch (profErr) {
          console.warn("Profile sync note:", profErr);
        }

        await refreshProfile();
        void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        void queryClient.invalidateQueries({ queryKey: ["user-addresses"] });

        toast.success(
          lang === "hi"
            ? "खाता सफलतापूर्वक बन गया! स्वागत है।"
            : "Account created successfully! Welcome.",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      setAuthErrorMessage(msg);
    } finally {
      setIsSigningUp(false);
    }
  }

  async function handleSendRecoveryCode() {
    setAuthErrorMessage(null);
    const clean = forgotPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setAuthErrorMessage(
        lang === "hi"
          ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें"
          : "Please enter a valid 10-digit mobile number",
      );
      return;
    }

    setIsSendingRecoveryOtp(true);
    try {
      const fullPhone = `+91${clean}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: { shouldCreateUser: false },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("user not found") ||
          error.message.toLowerCase().includes("not registered")
        ) {
          setAuthErrorMessage(
            lang === "hi"
              ? "इस मोबाइल नंबर से कोई खाता नहीं मिला।"
              : "No account found with this mobile number.",
          );
        } else {
          setAuthErrorMessage(error.message);
        }
      } else {
        toast.success(
          lang === "hi"
            ? "रिकवरी कोड भेजा गया! कृपया कोड दर्ज करें।"
            : "Recovery code sent! Please enter the code below.",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      setAuthErrorMessage(msg);
    } finally {
      setIsSendingRecoveryOtp(false);
    }
  }

  // ==========================================
  // 3. FORGOT PASSWORD (Supabase Auth updateUser)
  // ==========================================
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setAuthErrorMessage(null);

    const clean = forgotPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setAuthErrorMessage(
        lang === "hi"
          ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें"
          : "Please enter a valid 10-digit mobile number",
      );
      return;
    }

    const code = recoveryCode.trim();
    if (!code) {
      setAuthErrorMessage(
        lang === "hi" ? "कृपया रिकवरी कोड दर्ज करें" : "Please enter the recovery code",
      );
      return;
    }

    if (newPassword.length < 6) {
      setAuthErrorMessage(
        lang === "hi"
          ? "नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए"
          : "New password must be at least 6 characters",
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthErrorMessage(
        lang === "hi" ? "पासवर्ड मैच नहीं कर रहे हैं" : "Passwords do not match",
      );
      return;
    }

    setIsResettingPassword(true);
    try {
      const fullPhone = `+91${clean}`;

      // 1. Establish authenticated recovery session via Supabase Auth verifyOtp
      let authSessionActive = false;
      const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: code,
        type: "sms",
      });

      if (!verifyErr && verifyData?.session) {
        authSessionActive = true;
      } else {
        const { data: recData, error: recErr } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: code,
          type: "recovery",
        });
        if (!recErr && recData?.session) {
          authSessionActive = true;
        } else {
          console.error("Supabase verifyOtp failed:", verifyErr || recErr);
          setAuthErrorMessage(
            lang === "hi"
              ? "अमान्य या समाप्त रिकवरी कोड। कृपया सही कोड दर्ज करें।"
              : "Invalid or expired recovery code. Please check and try again.",
          );
          setIsResettingPassword(false);
          return;
        }
      }

      if (!authSessionActive) {
        setAuthErrorMessage(
          lang === "hi"
            ? "रिकवरी सत्र स्थापित नहीं हो सका।"
            : "Could not establish recovery session.",
        );
        setIsResettingPassword(false);
        return;
      }

      // 2. Call supabase.auth.updateUser({ password: newPassword })
      const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      // 3. Strictly check returned { data, error }
      if (updateErr) {
        console.error("Supabase auth.updateUser error:", updateErr);
        setAuthErrorMessage(
          lang === "hi"
            ? `पासवर्ड अपडेट त्रुटि: ${updateErr.message}`
            : `Password update failed: ${updateErr.message}`,
        );
        await supabase.auth.signOut();
        setIsResettingPassword(false);
        return;
      }

      if (!updateData || !updateData.user) {
        console.error("Supabase auth.updateUser returned no user");
        setAuthErrorMessage(
          lang === "hi"
            ? "पासवर्ड अपडेट की पुष्टि नहीं हो सकी।"
            : "Password update could not be confirmed.",
        );
        await supabase.auth.signOut();
        setIsResettingPassword(false);
        return;
      }

      // 4. Password update confirmed in Supabase Auth!
      // Sign out of recovery session so the user can freshly sign in with new password
      await supabase.auth.signOut();

      toast.success(
        lang === "hi"
          ? "पासवर्ड सफलतापूर्वक बदल गया! कृपया नए पासवर्ड के साथ लॉगिन करें।"
          : "Password successfully changed. Please login with your new password.",
      );

      // Redirect to sign in view with phone prefilled
      setAuthView("signin");
      setSignInPhone(clean);
      setSignInPassword("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const msg = err instanceof Error ? err.message : "Password reset failed";
      setAuthErrorMessage(msg);
    } finally {
      setIsResettingPassword(false);
    }
  }

  // ==========================================
  // 4. LOGOUT
  // ==========================================
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setAuthView("signin");
      setSignInPhone("");
      setSignInPassword("");
      setAuthErrorMessage(null);
      void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast.info(lang === "hi" ? "आप सफलतापूर्वक लॉगआउट हो गए हैं।" : "Logged out successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Logout failed";
      toast.error(msg);
    }
  }

  // ==========================================
  // 5. PROFILE & ADDRESS MUTATIONS
  // ==========================================
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

  // 2. UNAUTHENTICATED GUEST AUTHENTICATION PORTAL (Sign In / Sign Up / Forgot Password)
  if (!user) {
    return (
      <div className="container-page py-8 sm:py-12 max-w-md mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#E6EFE8] text-[#0F4A38] border border-[#145A45]/20 shadow-2xs">
            {authView === "signup" ? (
              <UserPlus className="size-6 text-[#0F4A38]" />
            ) : authView === "forgot" ? (
              <KeyRound className="size-6 text-[#0F4A38]" />
            ) : (
              <Smartphone className="size-6 text-[#0F4A38]" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#16201A]">
            {authView === "signup"
              ? (lang === "hi" ? "नया ग्राहक खाता बनाएं" : "Create Customer Account")
              : authView === "forgot"
                ? (lang === "hi" ? "पासवर्ड रीसेट करें" : "Reset Password")
                : (lang === "hi" ? "मोबाइल नंबर से लॉगिन करें" : "Sign In with Mobile")}
          </h1>
          <p className="text-xs text-[#5A655F] max-w-xs mx-auto">
            {authView === "signup"
              ? (lang === "hi"
                  ? "ऑर्डर हिस्ट्री, 1-क्लिक राशन रीऑर्डर और पते सुरक्षित करने के लिए रजिस्टर करें"
                  : "Register for order tracking, 1-click reorder, and saved addresses")
              : authView === "forgot"
                ? (lang === "hi"
                    ? "विकास रिकवरी कोड (AGT7799) डालकर नया पासवर्ड सेट करें"
                    : "Enter your mobile number and dev recovery key to set a new password")
                : (lang === "hi"
                    ? "अपने ऑर्डर, रीऑर्डर हिस्ट्री और सेव्ड पते देखने के लिए जारी रखें"
                    : "Access your order history, instant grocery reordering, and saved addresses")}
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          {/* Navigation Toggle Tabs */}
          {authView !== "forgot" && (
            <div className="flex rounded-xl bg-[#FAF8F2] border border-[#E5E0D5] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthView("signin");
                  setAuthErrorMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
                  authView === "signin"
                    ? "bg-[#145A45] text-white shadow-2xs"
                    : "text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <LogIn className="size-3.5" />
                <span>{lang === "hi" ? "लॉगिन करें" : "Sign In"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthView("signup");
                  setAuthErrorMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
                  authView === "signup"
                    ? "bg-[#145A45] text-white shadow-2xs"
                    : "text-[#5A655F] hover:text-[#16201A]"
                }`}
              >
                <UserPlus className="size-3.5" />
                <span>{lang === "hi" ? "नया खाता बनाएं" : "Create Account"}</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {authErrorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">{lang === "hi" ? "त्रुटि (Notice)" : "Authentication Notice"}</p>
                <p className="text-[11px] leading-relaxed mt-0.5">{authErrorMessage}</p>
              </div>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {authView === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <Label htmlFor="signin-phone" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "10 अंकों का मोबाइल नंबर" : "Mobile Number"}
                </Label>
                <div className="flex rounded-xl border border-[#E5E0D5] focus-within:ring-2 focus-within:ring-[#145A45]/30 focus-within:border-[#145A45] bg-white overflow-hidden shadow-2xs transition-all">
                  <span className="flex items-center bg-[#FAF8F2] px-3.5 text-xs font-black text-[#0F4A38] border-r border-[#E5E0D5]">
                    +91
                  </span>
                  <Input
                    id="signin-phone"
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder={lang === "hi" ? "10 अंकों का नंबर दर्ज करें" : "Enter 10-digit number"}
                    value={signInPhone}
                    onChange={(e) => setSignInPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 rounded-none focus-visible:ring-0 text-sm font-bold text-[#16201A] h-11 placeholder:text-[#A8B2AC] placeholder:font-normal placeholder:text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "पासवर्ड" : "Password"}
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("forgot");
                      setForgotPhone(signInPhone);
                      setAuthErrorMessage(null);
                    }}
                    className="text-[11px] font-bold text-[#145A45] hover:underline cursor-pointer"
                  >
                    {lang === "hi" ? "पासवर्ड भूल गए?" : "Forgot Password?"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="signin-password"
                    required
                    type={showSignInPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={lang === "hi" ? "अपना पासवर्ड दर्ज करें" : "Enter your password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="h-11 rounded-xl border-[#E5E0D5] pr-10 text-sm font-medium focus-visible:border-[#145A45] placeholder:text-[#A8B2AC] placeholder:font-normal placeholder:text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#16201A]"
                  >
                    {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSigningIn || signInPhone.replace(/\D/g, "").length !== 10 || !signInPassword}
                className="w-full h-11 rounded-xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-98 transition-all cursor-pointer"
              >
                {isSigningIn
                  ? (lang === "hi" ? "लॉगिन हो रहा है..." : "Signing in…")
                  : (lang === "hi" ? "लॉगिन करें (Sign In) →" : "Sign In →")}
              </Button>

              <div className="text-center pt-1 text-xs text-[#5A655F]">
                <span>{lang === "hi" ? "खाता नहीं है?" : "Don't have an account?"}{" "}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("signup");
                    setAuthErrorMessage(null);
                  }}
                  className="font-bold text-[#145A45] underline hover:text-[#0A3628] cursor-pointer"
                >
                  {lang === "hi" ? "नया खाता बनाएं" : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: SIGN UP */}
          {authView === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <Label htmlFor="signup-name" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "पूरा नाम" : "Full Name"}
                </Label>
                <Input
                  id="signup-name"
                  required
                  placeholder={lang === "hi" ? "उदा. रमेश कुमार" : "e.g. Ramesh Kumar"}
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="h-10 rounded-xl border-[#E5E0D5] text-xs font-medium placeholder:text-[#A8B2AC] placeholder:font-normal"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-phone" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "10 अंकों का मोबाइल नंबर" : "10-Digit Mobile Number"}
                </Label>
                <div className="flex rounded-xl border border-[#E5E0D5] focus-within:ring-2 focus-within:ring-[#145A45]/30 focus-within:border-[#145A45] bg-white overflow-hidden shadow-2xs transition-all">
                  <span className="flex items-center bg-[#FAF8F2] px-3 text-xs font-black text-[#0F4A38] border-r border-[#E5E0D5]">
                    +91
                  </span>
                  <Input
                    id="signup-phone"
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder={lang === "hi" ? "10 अंकों का नंबर दर्ज करें" : "Enter 10-digit number"}
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 rounded-none focus-visible:ring-0 text-sm font-bold text-[#16201A] h-10 placeholder:text-[#A8B2AC] placeholder:font-normal placeholder:text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "पासवर्ड (कम से कम 6 अक्षर)" : "Password (min. 6 characters)"}
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    required
                    type={showSignUpPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={lang === "hi" ? "नया पासवर्ड बनाएं (कम से कम 6)" : "Create a password (min. 6)"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="h-10 rounded-xl border-[#E5E0D5] pr-10 text-xs font-medium focus-visible:border-[#145A45] placeholder:text-[#A8B2AC] placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#16201A]"
                  >
                    {showSignUpPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-confirm-password" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "पासवर्ड कन्फर्म करें" : "Confirm Password"}
                </Label>
                <Input
                  id="signup-confirm-password"
                  required
                  type="password"
                  autoComplete="new-password"
                  placeholder={lang === "hi" ? "पासवर्ड दोबारा दर्ज करें" : "Re-enter password"}
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="h-10 rounded-xl border-[#E5E0D5] text-xs font-medium focus-visible:border-[#145A45] placeholder:text-[#A8B2AC] placeholder:font-normal"
                />
              </div>

              <Button
                type="submit"
                disabled={isSigningUp || signUpPhone.replace(/\D/g, "").length !== 10 || !signUpPassword}
                className="w-full h-11 rounded-xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-98 transition-all cursor-pointer mt-2"
              >
                {isSigningUp
                  ? (lang === "hi" ? "खाता बन रहा है..." : "Creating account…")
                  : (lang === "hi" ? "खाता बनाएं (Create Account) →" : "Create Account →")}
              </Button>

              <div className="text-center pt-1 text-xs text-[#5A655F]">
                <span>{lang === "hi" ? "पहले से खाता है?" : "Already registered?"}{" "}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("signin");
                    setAuthErrorMessage(null);
                  }}
                  className="font-bold text-[#145A45] underline hover:text-[#0A3628] cursor-pointer"
                >
                  {lang === "hi" ? "लॉगिन करें" : "Sign In"}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD (DEVELOPMENT RECOVERY) */}
          {authView === "forgot" && (
            <form onSubmit={handleResetPassword} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="rounded-xl bg-[#FAF8F2] border border-[#145A45]/20 p-3 text-xs text-[#0F4A38] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-[#145A45]" />
                  <span>{lang === "hi" ? "डेवलपमेंट रिकवरी मोड" : "Development Recovery Mode"}</span>
                </p>
                <p className="text-[11px] text-[#5A655F] leading-relaxed">
                  {lang === "hi"
                    ? "परीक्षण के लिए रिकवरी कोड 'AGT7799' दर्ज करें और अपना नया पासवर्ड सेट करें।"
                    : "For development testing, use recovery code 'AGT7799' to set a new password."}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="forgot-phone" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "पंजीकृत मोबाइल नंबर" : "Registered Mobile Number"}
                  </Label>
                  <button
                    type="button"
                    disabled={isSendingRecoveryOtp || forgotPhone.replace(/\D/g, "").length !== 10}
                    onClick={handleSendRecoveryCode}
                    className="text-[11px] font-bold text-[#145A45] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingRecoveryOtp
                      ? (lang === "hi" ? "भेज रहा है..." : "Sending...")
                      : (lang === "hi" ? "कोड भेजें (Send Code)" : "Send Code")}
                  </button>
                </div>
                <div className="flex rounded-xl border border-[#E5E0D5] bg-white overflow-hidden shadow-2xs">
                  <span className="flex items-center bg-[#FAF8F2] px-3 text-xs font-black text-[#0F4A38] border-r border-[#E5E0D5]">
                    +91
                  </span>
                  <Input
                    id="forgot-phone"
                    required
                    type="tel"
                    maxLength={10}
                    placeholder={lang === "hi" ? "10 अंकों का नंबर दर्ज करें" : "Enter 10-digit number"}
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 rounded-none focus-visible:ring-0 text-sm font-bold text-[#16201A] h-10 placeholder:text-[#A8B2AC] placeholder:font-normal placeholder:text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="recovery-code" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "रिकवरी कोड (Recovery OTP / Code)" : "Recovery Code"}
                </Label>
                <Input
                  id="recovery-code"
                  required
                  placeholder={lang === "hi" ? "6 अंकों का कोड (उदा. 638858)" : "6-digit code (e.g. 638858)"}
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="h-10 rounded-xl border-[#E5E0D5] font-mono text-xs font-bold placeholder:text-[#A8B2AC] placeholder:font-normal"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-password" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "नया पासवर्ड (कम से कम 6 अक्षर)" : "New Password"}
                </Label>
                <Input
                  id="new-password"
                  required
                  type="password"
                  placeholder={lang === "hi" ? "नया पासवर्ड दर्ज करें" : "Enter new password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 rounded-xl border-[#E5E0D5] text-xs placeholder:text-[#A8B2AC] placeholder:font-normal"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-new-password" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "नया पासवर्ड कन्फर्म करें" : "Confirm New Password"}
                </Label>
                <Input
                  id="confirm-new-password"
                  required
                  type="password"
                  placeholder={lang === "hi" ? "पासवर्ड दोबारा दर्ज करें" : "Re-enter password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="h-10 rounded-xl border-[#E5E0D5] text-xs placeholder:text-[#A8B2AC] placeholder:font-normal"
                />
              </div>

              <Button
                type="submit"
                disabled={isResettingPassword || forgotPhone.replace(/\D/g, "").length !== 10 || !newPassword}
                className="w-full h-11 rounded-xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0A3628] active:scale-98 transition-all cursor-pointer mt-2"
              >
                {isResettingPassword
                  ? (lang === "hi" ? "पासवर्ड अपडेट हो रहा है..." : "Updating password…")
                  : (lang === "hi" ? "पासवर्ड अपडेट करें (Save Password)" : "Update Password")}
              </Button>

              <div className="text-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("signin");
                    setAuthErrorMessage(null);
                  }}
                  className="font-bold text-[#145A45] hover:underline cursor-pointer"
                >
                  {lang === "hi" ? "← वापस लॉगिन पर जाएं (Back to Sign In)" : "← Back to Sign In"}
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#5A655F]">
            <ShieldCheck className="size-3.5 text-[#145A45]" />
            <span>
              {lang === "hi"
                ? "सुरक्षित Supabase Phone & Password प्रमाणीकरण"
                : "Protected by Supabase Auth with RLS isolation"}
            </span>
          </div>
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

  // ==========================================
  // 3. AUTHENTICATED CUSTOMER ACCOUNT SCREEN
  // ==========================================
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
              className="rounded-xl gap-1.5 text-xs font-bold border-[#E5E0D5] text-[#5A655F] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
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
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 cursor-pointer"
            >
              <Package className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "ऑर्डर" : "Orders"} ({orders?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="buy-again"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 cursor-pointer"
            >
              <RotateCcw className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "रीऑर्डर" : "Buy Again"} ({uniquePurchasedItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 cursor-pointer"
            >
              <MapPin className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पते" : "Addresses"} ({addresses.length})
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 cursor-pointer"
            >
              <Heart className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "पसंद" : "Wishlist"} ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 cursor-pointer"
            >
              <User className="mr-1 size-3.5 hidden sm:inline" /> {lang === "hi" ? "प्रोफ़ाइल" : "Profile"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MY ORDERS (Isolated strictly by auth.uid()) */}
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

          {/* TAB 3: SAVED ADDRESSES (Isolated by user_id = auth.uid()) */}
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
                          className="text-[#5A655F] hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
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
                    {lang === "hi" ? "पंजीकृत मोबाइल नंबर" : "Registered Mobile Number"}
                  </Label>
                  <Input
                    id="prof-phone"
                    disabled
                    value={user.phone || profile?.phone || ""}
                    className="rounded-xl border-[#E5E0D5] bg-[#FAF8F2] text-xs font-bold text-[#145A45]"
                  />
                  <p className="text-[10px] text-[#5A655F]">
                    {lang === "hi"
                      ? "मोबाइल नंबर आपके खाते की मुख्य पहचान (ID) है।"
                      : "Mobile number is your unique customer login identifier."}
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
                  className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0A3628] shadow-xs cursor-pointer"
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
