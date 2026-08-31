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
  Pencil,
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
  Receipt,
  ExternalLink,
  ChevronRight,
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
import { customerOrdersQuery, type Order } from "@/lib/queries";
import { inr, formatDate, ORDER_STATUS_LABEL } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import { InvoiceView } from "@/components/InvoiceView";
import type { Invoice } from "@/lib/billing";

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

export function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, isAdmin, refreshProfile, loading: authLoading } = useAuth();
  const { add } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();

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
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
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

  // Edit Address State
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editRecipientPhone, setEditRecipientPhone] = useState("");
  const [editHouse, setEditHouse] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [editPin, setEditPin] = useState("273303");
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  // Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null);

  // Synchronize profile data into edit form
  useEffect(() => {
    if (profile) {
      setEditName(
        profile.full_name ||
          (user?.user_metadata?.["full_name"] as string) ||
          (user?.user_metadata?.["name"] as string) ||
          "",
      );
      setEditEmail(profile.email || user?.email || "");
      setEditPhone(profile.phone ? profile.phone.replace(/\D/g, "").slice(-10) : "");
    } else if (user) {
      setEditName(
        (user.user_metadata?.["full_name"] as string) ||
          (user.user_metadata?.["name"] as string) ||
          "",
      );
      setEditEmail(user.email || "");
      setEditPhone(user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "");
    }
  }, [profile, user]);

  // Fetch customer saved addresses strictly for authenticated user
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

  // Customer Orders Query strictly scoped to user
  const { data: orders, isLoading: ordersLoading } = useQuery(
    customerOrdersQuery(user?.id, user?.phone || profile?.phone),
  );

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

  async function handleViewInvoice(order: Order) {
    setInvoiceLoadingId(order.id);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();

      if (data && !error) {
        setActiveInvoice(data as unknown as Invoice);
        setInvoiceModalOpen(true);
        return;
      }

      const { data: rpcData, error: rpcErr } = await supabase.rpc("generate_invoice_for_order", {
        p_order_id: order.id,
      });

      if (rpcErr || !rpcData) {
        throw new Error(rpcErr?.message || "Could not generate invoice");
      }

      setActiveInvoice(rpcData as unknown as Invoice);
      setInvoiceModalOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setInvoiceLoadingId(null);
    }
  }

  // ==========================================
  // GOOGLE OAUTH SIGN IN
  // ==========================================
  async function handleGoogleSignIn() {
    setAuthErrorMessage(null);
    setIsGoogleSigningIn(true);
    try {
      const redirectTo = `${window.location.origin}/account`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setAuthErrorMessage(
          lang === "hi"
            ? `Google लॉगिन विफल: ${error.message}`
            : `Google authentication failed: ${error.message}`,
        );
        setIsGoogleSigningIn(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication failed";
      setAuthErrorMessage(msg);
      setIsGoogleSigningIn(false);
    }
  }

  // ==========================================
  // SIGN IN
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
        setAuthErrorMessage(
          lang === "hi"
            ? "गलत पासवर्ड या मोबाइल नंबर। कृपया सही पासवर्ड डालें या पासवर्ड रीसेट करें।"
            : "Incorrect password or mobile number. Please verify your credentials or reset password.",
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
  // SIGN UP
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
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("exists")
        ) {
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

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================
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

      // Method A: Check if dev_reset_password RPC is available
      if (code && code.trim().length >= 4) {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc(
          "dev_reset_password" as never,
          {
            p_phone: fullPhone,
            p_code: code.trim(),
            p_new_password: newPassword,
          } as never,
        );

        if (!rpcErr && rpcRes && typeof rpcRes === "object") {
          const resObj = rpcRes as { success?: boolean; error?: string; message?: string };
          if (resObj.success) {
            await supabase.auth.signOut();
            toast.success(
              lang === "hi"
                ? "पासवर्ड सफलतापूर्वक बदल गया! कृपया नए पासवर्ड के साथ लॉगिन करें।"
                : "Password successfully changed. Please login with your new password.",
            );
            setAuthView("signin");
            setSignInPhone(clean);
            setSignInPassword("");
            setRecoveryCode("");
            setNewPassword("");
            setConfirmNewPassword("");
            return;
          } else if (resObj.error) {
            setAuthErrorMessage(resObj.error);
            return;
          }
        }
      }

      // Method B: Supabase Auth verifyOtp + updateUser
      const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: code,
        type: "sms",
      });

      if (verifyErr || !verifyData?.session) {
        setAuthErrorMessage(
          lang === "hi" ? "अमान्य या समाप्त कोड।" : "Invalid or expired recovery code.",
        );
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setAuthErrorMessage(updateErr.message);
        await supabase.auth.signOut();
        return;
      }

      await supabase.auth.signOut();
      toast.success(
        lang === "hi"
          ? "पासवर्ड सफलतापूर्वक बदल गया! कृपया नए पासवर्ड के साथ लॉगिन करें।"
          : "Password successfully changed. Please login with your new password.",
      );

      setAuthView("signin");
      setSignInPhone(clean);
      setSignInPassword("");
      setRecoveryCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      setAuthErrorMessage(msg);
    } finally {
      setIsResettingPassword(false);
    }
  }

  // ==========================================
  // LOGOUT
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
  // PROFILE MUTATION
  // ==========================================
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const updates: { full_name: string | null; email: string | null; phone?: string | null } = {
        full_name: editName.trim() || null,
        email: editEmail.trim() || null,
      };

      if (!profile?.phone && editPhone.trim()) {
        const cleanPhone = editPhone.replace(/\D/g, "").slice(-10);
        if (cleanPhone.length === 10) {
          updates.phone = `+91${cleanPhone}`;
        }
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

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

  // ==========================================
  // ADDRESS MUTATIONS
  // ==========================================
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

  function startEditAddress(addr: CustomerAddress) {
    setEditingAddressId(addr.id);
    setEditRecipientName(addr.name || "");
    setEditRecipientPhone(addr.phone || "");
    setEditHouse(addr.house || "");
    setEditArea(addr.area || "");
    setEditLandmark(addr.landmark || "");
    setEditPin(addr.pincode || "273303");
    setShowAddAddress(false);
  }

  function cancelEditAddress() {
    setEditingAddressId(null);
  }

  async function handleUpdateAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editingAddressId) return;

    if (!editHouse.trim() || !editArea.trim()) {
      toast.error(
        lang === "hi"
          ? "कृपया मकान/दुकान नंबर और मोहल्ला/सड़क दर्ज करें"
          : "Please provide house/shop number and area",
      );
      return;
    }

    setIsUpdatingAddress(true);
    try {
      const recipientName = editRecipientName.trim() || profile?.full_name || "Self";
      const recipientPhone = editRecipientPhone.trim() || user.phone || "";

      const { error } = await supabase
        .from("addresses")
        .update({
          name: recipientName,
          phone: recipientPhone,
          house: editHouse.trim(),
          area: editArea.trim(),
          landmark: editLandmark.trim() || null,
          city: "Maharajganj",
          pincode: editPin.trim() || "273303",
        })
        .eq("id", editingAddressId)
        .eq("user_id", user.id);

      if (error) throw error;

      await loadAddresses(user.id);
      setEditingAddressId(null);
      toast.success(
        lang === "hi"
          ? "डिलीवरी पता सफलतापूर्वक अपडेट हो गया!"
          : "Delivery address updated successfully!",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update address";
      toast.error(msg);
    } finally {
      setIsUpdatingAddress(false);
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
      toast.error(
        lang === "hi" ? "इस ऑर्डर में कोई सामग्री नहीं मिली" : "No items found in this order to reorder",
      );
      return;
    }

    let addedCount = 0;
    order.order_items.forEach((item) => {
      add(
        {
          variantId: item.variant_id ?? `temp-${item.id}`,
          productId: item.product_id ?? item.id,
          slug: item.name.toLowerCase().replace(/\s+/g, "-"),
          name: getProductName(item),
          name_en: item.name_en || item.name,
          name_hi: item.name_hi || null,
          variantLabel: getVariantLabel(item) || "1 pack",
          variantLabel_en: item.variant_label_en || item.variant_label || "1 pack",
          variantLabel_hi: item.variant_label_hi || null,
          price: Number(item.price),
          mrp: Number(item.mrp || item.price),
          imageUrl: getProductImage({ name: item.name, image_url: item.image_url }),
          stock: 99,
        },
        item.qty,
      );
      addedCount++;
    });

    toast.success(
      lang === "hi"
        ? `ऑर्डर #${order.order_no} से ${addedCount} सामान बास्केट में जोड़े गए!`
        : `Added ${addedCount} items from Order #${order.order_no} to basket!`,
    );
    void navigate({ to: "/cart" });
  }

  // ==========================================
  // 1. LOADING STATE
  // ==========================================
  if (authLoading) {
    return (
      <div className="container-page py-12 max-w-lg mx-auto space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // ==========================================
  // 2. GUEST / UNAUTHENTICATED PORTAL (CLEAN & MODERN)
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center py-8 sm:py-14 px-4">
        <div className="w-full max-w-md space-y-5">
          {/* Brand Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#145A45]/10 px-3 py-1 text-xs font-bold text-[#145A45] mb-1">
              <Sparkles className="size-3.5" />
              <span>{lang === "hi" ? "ग्राहक खाता पोर्टल" : "Customer Portal"}</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-black text-[#16201A] tracking-tight">
              {authView === "signup"
                ? lang === "hi"
                  ? "नया खाता बनाएं"
                  : "Create Account"
                : authView === "forgot"
                  ? lang === "hi"
                    ? "पासवर्ड रीसेट करें"
                    : "Reset Password"
                  : lang === "hi"
                    ? "खाते में लॉगिन करें"
                    : "Welcome Back"}
            </h1>
            <p className="text-xs sm:text-sm text-[#5A655F]">
              {authView === "signup"
                ? lang === "hi"
                  ? "ऑर्डर हिस्ट्री और 1-क्लिक रीऑर्डर का लाभ उठाएं"
                  : "Track orders, reorder staples, and manage addresses"
                : authView === "forgot"
                  ? lang === "hi"
                    ? "मोबाइल नंबर पर प्राप्त कोड से पासवर्ड बदलें"
                    : "Enter your mobile number to reset your password"
                  : lang === "hi"
                    ? "अपने राशन ऑर्डर और पते प्रबंधित करें"
                    : "Sign in to access your orders and saved details"}
            </p>
          </div>

          {/* Clean Auth Card */}
          <div className="rounded-3xl border border-[#E8E4DA] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            {/* Segmented Switcher */}
            {authView !== "forgot" && (
              <div className="flex rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("signin");
                    setAuthErrorMessage(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
                    authView === "signin"
                      ? "bg-[#145A45] text-white shadow-xs"
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
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all cursor-pointer ${
                    authView === "signup"
                      ? "bg-[#145A45] text-white shadow-xs"
                      : "text-[#5A655F] hover:text-[#16201A]"
                  }`}
                >
                  <UserPlus className="size-3.5" />
                  <span>{lang === "hi" ? "नया खाता" : "Sign Up"}</span>
                </button>
              </div>
            )}

            {/* Fast 1-Tap Google Login */}
            {authView !== "forgot" && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn || isSigningIn || isSigningUp}
                  className="w-full flex items-center justify-center gap-2.5 h-11 px-4 rounded-2xl border border-[#E8E4DA] bg-white text-[#16201A] font-bold text-xs sm:text-sm hover:bg-[#FAF8F2] hover:border-[#145A45]/40 active:scale-[0.99] transition-all shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isGoogleSigningIn ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-[#145A45] border-t-transparent" />
                  ) : (
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {isGoogleSigningIn
                      ? lang === "hi"
                        ? "Google से जुड़ रहे हैं..."
                        : "Connecting..."
                      : lang === "hi"
                        ? "Google के साथ जारी रखें"
                        : "Continue with Google"}
                  </span>
                </button>

                {/* Subtle Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-[#E8E4DA]" />
                  <span className="absolute bg-white px-2.5 text-[10px] font-bold text-[#7A8680] uppercase tracking-wider">
                    {lang === "hi" ? "या मोबाइल द्वारा" : "OR WITH MOBILE"}
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {authErrorMessage && (
              <div className="rounded-2xl bg-red-50/80 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">{authErrorMessage}</p>
              </div>
            )}

            {/* VIEW 1: SIGN IN */}
            {authView === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-phone" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "मोबाइल नंबर" : "Mobile Number"}
                  </Label>
                  <div className="flex rounded-2xl border border-[#E8E4DA] focus-within:ring-2 focus-within:ring-[#145A45]/20 focus-within:border-[#145A45] bg-white overflow-hidden transition-all">
                    <span className="flex items-center bg-[#FAF8F2] px-3.5 text-xs font-bold text-[#0F4A38] border-r border-[#E8E4DA]">
                      +91
                    </span>
                    <Input
                      id="signin-phone"
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder={lang === "hi" ? "10 अंकों का नंबर" : "10-digit number"}
                      value={signInPhone}
                      onChange={(e) => setSignInPhone(e.target.value.replace(/\D/g, ""))}
                      className="border-0 rounded-none focus-visible:ring-0 text-sm font-semibold text-[#16201A] h-10.5 placeholder:text-[#A8B2AC] placeholder:font-normal placeholder:text-xs"
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
                      {lang === "hi" ? "पासवर्ड भूल गए?" : "Forgot?"}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      required
                      type={showSignInPassword ? "text" : "password"}
                      placeholder={lang === "hi" ? "पासवर्ड दर्ज करें" : "Enter password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="h-10.5 rounded-2xl border-[#E8E4DA] pr-10 text-sm focus-visible:border-[#145A45] placeholder:text-[#A8B2AC] placeholder:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#16201A]"
                    >
                      {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSigningIn || signInPhone.replace(/\D/g, "").length !== 10 || !signInPassword}
                  className="w-full h-11 rounded-2xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-[0.99] transition-all cursor-pointer text-xs sm:text-sm"
                >
                  {isSigningIn
                    ? lang === "hi"
                      ? "लॉगिन हो रहा है..."
                      : "Signing in…"
                    : lang === "hi"
                      ? "लॉगिन करें"
                      : "Sign In"}
                </Button>
              </form>
            )}

            {/* VIEW 2: SIGN UP */}
            {authView === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
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
                    className="h-10 rounded-2xl border-[#E8E4DA] text-xs font-medium placeholder:text-[#A8B2AC]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-phone" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "10 अंकों का मोबाइल नंबर" : "Mobile Number"}
                  </Label>
                  <div className="flex rounded-2xl border border-[#E8E4DA] focus-within:ring-2 focus-within:ring-[#145A45]/20 focus-within:border-[#145A45] bg-white overflow-hidden transition-all">
                    <span className="flex items-center bg-[#FAF8F2] px-3.5 text-xs font-bold text-[#0F4A38] border-r border-[#E8E4DA]">
                      +91
                    </span>
                    <Input
                      id="signup-phone"
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder={lang === "hi" ? "10 अंकों का नंबर" : "10-digit number"}
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, ""))}
                      className="border-0 rounded-none focus-visible:ring-0 text-sm font-semibold text-[#16201A] h-10 placeholder:text-[#A8B2AC] placeholder:text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs font-bold text-[#16201A]">
                      {lang === "hi" ? "पासवर्ड (min 6)" : "Password (min 6)"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        required
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="h-10 rounded-2xl border-[#E8E4DA] pr-8 text-xs font-medium placeholder:text-[#A8B2AC]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A655F]"
                      >
                        {showSignUpPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-confirm-password" className="text-xs font-bold text-[#16201A]">
                      {lang === "hi" ? "कन्फर्म पासवर्ड" : "Confirm"}
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      required
                      type="password"
                      placeholder="••••••"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className="h-10 rounded-2xl border-[#E8E4DA] text-xs font-medium placeholder:text-[#A8B2AC]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSigningUp || signUpPhone.replace(/\D/g, "").length !== 10 || !signUpPassword}
                  className="w-full h-11 rounded-2xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-[0.99] transition-all cursor-pointer text-xs sm:text-sm mt-1"
                >
                  {isSigningUp
                    ? lang === "hi"
                      ? "खाता बन रहा है..."
                      : "Creating account…"
                    : lang === "hi"
                      ? "खाता बनाएं"
                      : "Create Account"}
                </Button>
              </form>
            )}

            {/* VIEW 3: FORGOT PASSWORD */}
            {authView === "forgot" && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="forgot-phone" className="text-xs font-bold text-[#16201A]">
                      {lang === "hi" ? "पंजीकृत मोबाइल नंबर" : "Mobile Number"}
                    </Label>
                    <button
                      type="button"
                      disabled={isSendingRecoveryOtp || forgotPhone.replace(/\D/g, "").length !== 10}
                      onClick={handleSendRecoveryCode}
                      className="text-[11px] font-bold text-[#145A45] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingRecoveryOtp
                        ? lang === "hi"
                          ? "भेज रहा है..."
                          : "Sending..."
                        : lang === "hi"
                          ? "OTP भेजें"
                          : "Send OTP"}
                    </button>
                  </div>
                  <div className="flex rounded-2xl border border-[#E8E4DA] bg-white overflow-hidden">
                    <span className="flex items-center bg-[#FAF8F2] px-3.5 text-xs font-bold text-[#0F4A38] border-r border-[#E8E4DA]">
                      +91
                    </span>
                    <Input
                      id="forgot-phone"
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ""))}
                      className="border-0 rounded-none focus-visible:ring-0 text-sm font-semibold text-[#16201A] h-10 placeholder:text-[#A8B2AC] placeholder:text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="recovery-code" className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "रिकवरी कोड (OTP)" : "Recovery OTP"}
                  </Label>
                  <Input
                    id="recovery-code"
                    required
                    placeholder="6-digit code"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="h-10 rounded-2xl border-[#E8E4DA] font-mono text-xs font-bold"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="new-password" className="text-xs font-bold text-[#16201A]">
                      {lang === "hi" ? "नया पासवर्ड" : "New Password"}
                    </Label>
                    <Input
                      id="new-password"
                      required
                      type="password"
                      placeholder="••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 rounded-2xl border-[#E8E4DA] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-new-password" className="text-xs font-bold text-[#16201A]">
                      {lang === "hi" ? "कन्फर्म करें" : "Confirm"}
                    </Label>
                    <Input
                      id="confirm-new-password"
                      required
                      type="password"
                      placeholder="••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="h-10 rounded-2xl border-[#E8E4DA] text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isResettingPassword || forgotPhone.replace(/\D/g, "").length !== 10 || !newPassword}
                  className="w-full h-11 rounded-2xl font-bold shadow-xs bg-[#145A45] text-white hover:bg-[#0E4333] active:scale-[0.99] transition-all cursor-pointer text-xs sm:text-sm mt-1"
                >
                  {isResettingPassword
                    ? lang === "hi"
                      ? "अपडेट हो रहा है..."
                      : "Updating…"
                    : lang === "hi"
                      ? "पासवर्ड अपडेट करें"
                      : "Update Password"}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("signin");
                      setAuthErrorMessage(null);
                    }}
                    className="text-xs font-bold text-[#145A45] hover:underline cursor-pointer"
                  >
                    {lang === "hi" ? "← लॉगिन पर वापस जाएं" : "← Back to Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Subdued Guest Tracking Link */}
          <div className="text-center pt-1">
            <Link
              to="/track"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A655F] hover:text-[#145A45] transition-colors"
            >
              <Package className="size-3.5" />
              <span>
                {lang === "hi" ? "बिना लॉगिन केवल ऑर्डर ट्रैक करें →" : "Looking to track an order as guest? →"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. AUTHENTICATED CUSTOMER DASHBOARD (CLEAN & MODERN)
  // ==========================================
  const customerName =
    profile?.full_name ||
    (user.user_metadata?.["full_name"] as string) ||
    (lang === "hi" ? "सम्मानित ग्राहक" : "Valued Customer");

  const rawPhone =
    user.phone ||
    profile?.phone ||
    (user.user_metadata?.["phone"] as string) ||
    "";
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const customerPhone =
    digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly || rawPhone;

  const customerEmail =
    profile?.email ||
    user.email ||
    (user.user_metadata?.["email"] as string) ||
    "";

  return (
    <div className="container-page py-4 sm:py-8 pb-24 lg:pb-12 max-w-4xl mx-auto space-y-6">
      {/* Sleek Profile Header Card */}
      <div className="rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid size-12 sm:size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#145A45] to-[#0A3628] font-sans text-xl sm:text-2xl font-black text-white shadow-xs shrink-0">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-lg sm:text-xl font-black text-[#16201A] truncate">
                  {customerName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6EFE8] px-2 py-0.5 text-[10px] font-bold text-[#145A45] shrink-0">
                  <ShieldCheck className="size-3" />
                  <span>{lang === "hi" ? "सत्यापित" : "Verified"}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5A655F]">
                {customerPhone && (
                  <span className="flex items-center gap-1 font-semibold text-[#16201A]">
                    <Phone className="size-3 text-[#145A45]" />
                    <span>+91 {customerPhone}</span>
                  </span>
                )}
                {customerEmail && (
                  <span className="flex items-center gap-1 font-normal text-[#5A655F] truncate max-w-xs">
                    <Mail className="size-3 text-[#145A45]" />
                    <span className="truncate">{customerEmail}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isAdmin && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-xl border-[#145A45]/30 text-[#145A45] bg-[#E6EFE8]/50 hover:bg-[#145A45] hover:text-white font-bold text-xs h-8.5 px-3"
              >
                <Link to="/admin">
                  <span>{lang === "hi" ? "दुकान एडमिन" : "Admin Panel"}</span>
                </Link>
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 text-xs font-bold border-[#E8E4DA] text-[#5A655F] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors h-8.5 px-3"
            >
              <LogOut className="size-3.5" />
              <span>{lang === "hi" ? "लॉगआउट" : "Logout"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabbed Sections */}
      <Tabs defaultValue="orders" className="space-y-5">
        <TabsList className="grid grid-cols-4 h-11 w-full rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-1 gap-1 shadow-2xs">
          <TabsTrigger
            value="orders"
            className="rounded-xl text-[11px] sm:text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 sm:px-3 py-1.5 cursor-pointer transition-all data-[state=active]:shadow-xs"
          >
            <Package className="mr-1 size-3.5 hidden sm:inline" />
            <span>{lang === "hi" ? "ऑर्डर" : "Orders"}</span>
            <span className="ml-1 opacity-80 text-[10px]">({orders?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger
            value="buy-again"
            className="rounded-xl text-[11px] sm:text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 sm:px-3 py-1.5 cursor-pointer transition-all data-[state=active]:shadow-xs"
          >
            <RotateCcw className="mr-1 size-3.5 hidden sm:inline" />
            <span>{lang === "hi" ? "रीऑर्डर" : "Reorder"}</span>
            <span className="ml-1 opacity-80 text-[10px]">({uniquePurchasedItems.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="rounded-xl text-[11px] sm:text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 sm:px-3 py-1.5 cursor-pointer transition-all data-[state=active]:shadow-xs"
          >
            <MapPin className="mr-1 size-3.5 hidden sm:inline" />
            <span>{lang === "hi" ? "पते" : "Address"}</span>
            <span className="ml-1 opacity-80 text-[10px]">({addresses.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="rounded-xl text-[11px] sm:text-xs font-bold data-[state=active]:bg-[#145A45] data-[state=active]:text-white truncate px-1 sm:px-3 py-1.5 cursor-pointer transition-all data-[state=active]:shadow-xs"
          >
            <User className="mr-1 size-3.5 hidden sm:inline" />
            <span>{lang === "hi" ? "प्रोफ़ाइल" : "Profile"}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ORDERS (CLEAN STREAMLINED CARDS) */}
        <TabsContent value="orders" className="space-y-4">
          {ordersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5"
              >
                {/* Card Top: Order No, Date & Status Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E4DA]/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#16201A]">
                        #{order.order_no}
                      </span>
                      <span className="rounded-full bg-[#E6EFE8] px-2.5 py-0.5 text-[10px] font-bold text-[#145A45]">
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A655F] mt-0.5">
                      {formatDate(order.created_at)} •{" "}
                      {order.order_type === "delivery"
                        ? lang === "hi"
                          ? "होम डिलीवरी"
                          : "Delivery"
                        : lang === "hi"
                          ? "दुकान से पिकअप"
                          : "Store Pickup"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-[#5A655F] block">
                      {lang === "hi" ? "कुल राशि" : "Grand Total"}
                    </span>
                    <span className="font-sans font-black text-base text-[#145A45]">
                      {inr(order.total)}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Clean Compact Items List */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 bg-[#FAF8F2]/60 rounded-2xl p-2.5 border border-[#E8E4DA]/60">
                  {(order.order_items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 min-w-0">
                      <img
                        src={getProductImage({
                          name: item.name,
                          image_url: item.image_url,
                        })}
                        alt={getProductName(item)}
                        className="size-8 rounded-lg object-contain bg-white p-0.5 border border-[#E8E4DA]/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#16201A]">
                          {getProductName(item)}
                        </p>
                        <p className="text-[10px] text-[#5A655F]">
                          {getVariantLabel(item)} × {item.qty} ({inr(item.price * item.qty)})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Bottom: Clean Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-medium text-[#5A655F] uppercase tracking-wide">
                    {order.payment_method?.toUpperCase()} • {order.payment_status === "paid" ? "PAID" : "PENDING"}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleViewInvoice(order)}
                      disabled={invoiceLoadingId === order.id}
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl text-xs font-bold border-[#E8E4DA] text-[#16201A] hover:bg-[#FAF8F2] cursor-pointer"
                    >
                      <Receipt className="size-3.5 mr-1 text-[#145A45]" />
                      <span>{lang === "hi" ? "बिल देखें" : "Invoice"}</span>
                    </Button>

                    <Button
                      onClick={() => handleReorder(order)}
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl text-xs font-bold border-[#E8E4DA] text-[#16201A] hover:bg-[#FAF8F2] cursor-pointer"
                    >
                      <RotateCcw className="size-3 mr-1 text-[#145A45]" />
                      <span>{lang === "hi" ? "रीऑर्डर" : "Reorder"}</span>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="h-8 rounded-xl text-xs font-bold bg-[#145A45] text-white hover:bg-[#0E4333] shadow-2xs"
                    >
                      <Link
                        to="/track"
                        search={{ orderNo: order.order_no, phone: order.customer_phone } as never}
                      >
                        <span>{lang === "hi" ? "ट्रैक करें →" : "Track →"}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-[#E8E4DA] p-10 text-center bg-white space-y-3">
              <ShoppingBag className="mx-auto size-12 text-[#A8B2AC]" />
              <div className="space-y-1">
                <h3 className="font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "अभी तक कोई ऑर्डर नहीं" : "No orders found"}
                </h3>
                <p className="text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "आपके खाते में अभी कोई पुराना ऑर्डर दर्ज नहीं है।"
                    : "You haven't placed any orders with this account yet."}
                </p>
              </div>
              <Button asChild className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333]">
                <Link to="/shop">{lang === "hi" ? "सामान खरीदें →" : "Start Shopping →"}</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: BUY AGAIN (CLEAN STAPLES GRID) */}
        <TabsContent value="buy-again" className="space-y-4">
          <div>
            <h3 className="font-sans text-base font-bold text-[#16201A]">
              {lang === "hi" ? "पिछले पसंदीदा राशन" : "Frequently Ordered Staples"}
            </h3>
            <p className="text-xs text-[#5A655F]">
              {lang === "hi"
                ? "1-क्लिक में अपने दैनिक जरूरी सामान दोबारा बास्केट में जोड़ें।"
                : "Quickly add your daily groceries back to your basket."}
            </p>
          </div>

          {uniquePurchasedItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {uniquePurchasedItems.map((item, idx) => (
                <div
                  key={item.variantId || idx}
                  className="flex flex-col justify-between overflow-hidden bg-white p-3 border border-[#E8E4DA] rounded-3xl shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex aspect-square w-full items-center justify-center p-2 bg-[#FAF8F2]/50 rounded-2xl">
                    <img
                      src={getProductImage({
                        name: item.name,
                        image_url: item.imageUrl,
                      })}
                      alt={item.name}
                      className="size-full max-h-[100px] object-contain"
                    />
                  </div>
                  <div className="mt-2 flex flex-1 flex-col justify-between space-y-1.5">
                    <div>
                      <h4 className="line-clamp-2 text-xs font-bold text-[#16201A]">{item.name}</h4>
                      <p className="text-[10px] text-[#5A655F]">{item.variantLabel}</p>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-xs font-black text-[#145A45]">{inr(item.price)}</span>
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
                        className="h-7.5 rounded-xl bg-[#145A45] px-2.5 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0E4333]"
                      >
                        <Plus className="mr-0.5 size-3" /> {lang === "hi" ? "जोड़ें" : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#E8E4DA] p-10 text-center bg-white space-y-3">
              <RotateCcw className="mx-auto size-12 text-[#A8B2AC]" />
              <div className="space-y-1">
                <h3 className="font-sans text-base font-bold text-[#16201A]">
                  {lang === "hi" ? "कोई पिछला ऑर्डर नहीं" : "No purchase history yet"}
                </h3>
                <p className="text-xs text-[#5A655F]">
                  {lang === "hi"
                    ? "जब आप राशन ऑर्डर करेंगे, तो वे सामान यहाँ तुरंत दिखाई देंगे।"
                    : "Items you order will automatically appear here for fast reordering."}
                </p>
              </div>
              <Button asChild className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333]">
                <Link to="/shop">{lang === "hi" ? "दुकान देखें →" : "Shop Catalogue →"}</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: SAVED ADDRESSES */}
        <TabsContent value="addresses" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-sans text-base font-bold text-[#16201A]">
                {lang === "hi" ? "सहेजे गए पते" : "Delivery Addresses"}
              </h3>
              <p className="text-xs text-[#5A655F]">
                {lang === "hi" ? "महाराजगंज में अपने डिलीवरी पते प्रबंधित करें" : "Manage delivery locations"}
              </p>
            </div>
            <Button
              onClick={() => setShowAddAddress(!showAddAddress)}
              size="sm"
              className="rounded-xl gap-1 text-xs font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-8.5"
            >
              <Plus className="size-3.5" />
              <span>{lang === "hi" ? "नया पता" : "Add Address"}</span>
            </Button>
          </div>

          {/* Add Address Form */}
          {showAddAddress && (
            <form
              onSubmit={handleAddAddress}
              className="rounded-3xl border border-[#145A45]/30 bg-[#FAF8F2] p-5 space-y-3.5 animate-in fade-in duration-150"
            >
              <h4 className="font-bold text-xs sm:text-sm text-[#0F4A38] flex items-center gap-1.5">
                <MapPin className="size-4 text-[#145A45]" />
                <span>{lang === "hi" ? "नया डिलीवरी पता जोड़ें" : "New Address Details"}</span>
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  required
                  placeholder={lang === "hi" ? "प्राप्तकर्ता का नाम" : "Recipient Full Name"}
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs"
                />
                <Input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder={lang === "hi" ? "मोबाइल नंबर (10 अंक)" : "10-digit Phone"}
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs"
                />
                <Input
                  required
                  placeholder={lang === "hi" ? "मकान / दुकान नं." : "House/Flat No."}
                  value={newHouse}
                  onChange={(e) => setNewHouse(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs"
                />
                <Input
                  required
                  placeholder={lang === "hi" ? "मोहल्ला / सड़क" : "Area / Road"}
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs"
                />
                <Input
                  placeholder={lang === "hi" ? "लैंडमार्क (वैकल्पिक)" : "Landmark (Optional)"}
                  value={newLandmark}
                  onChange={(e) => setNewLandmark(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs"
                />
                <Input
                  placeholder="273303"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white text-xs"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={isSavingAddress}
                  size="sm"
                  className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-8.5"
                >
                  {isSavingAddress ? "सहेज रहा है..." : lang === "hi" ? "सहेजें" : "Save Address"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#E8E4DA] text-[#5A655F] text-xs h-8.5"
                >
                  {lang === "hi" ? "रद्द करें" : "Cancel"}
                </Button>
              </div>
            </form>
          )}

          {/* Address Cards Grid */}
          {addressesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-3xl border border-[#E8E4DA] bg-white p-4 shadow-2xs flex flex-col justify-between space-y-2.5"
                >
                  {editingAddressId === addr.id ? (
                    <form onSubmit={handleUpdateAddress} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-1.5">
                        <span className="text-xs font-bold text-[#145A45] flex items-center gap-1.5">
                          <Pencil className="size-3.5" />
                          <span>{lang === "hi" ? "पता बदलें" : "Edit Address"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={cancelEditAddress}
                          className="text-xs text-[#5A655F] hover:text-[#16201A]"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          required
                          value={editRecipientName}
                          onChange={(e) => setEditRecipientName(e.target.value)}
                          className="rounded-xl border-[#E8E4DA] bg-white text-xs h-8.5"
                          placeholder="Recipient Name"
                        />
                        <Input
                          required
                          type="tel"
                          maxLength={10}
                          value={editRecipientPhone}
                          onChange={(e) => setEditRecipientPhone(e.target.value.replace(/\D/g, ""))}
                          className="rounded-xl border-[#E8E4DA] bg-white text-xs h-8.5"
                          placeholder="Phone"
                        />
                        <Input
                          required
                          value={editHouse}
                          onChange={(e) => setEditHouse(e.target.value)}
                          className="rounded-xl border-[#E8E4DA] bg-white text-xs h-8.5"
                          placeholder="House No."
                        />
                        <Input
                          required
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="rounded-xl border-[#E8E4DA] bg-white text-xs h-8.5"
                          placeholder="Area / Road"
                        />
                        <Input
                          value={editLandmark}
                          onChange={(e) => setEditLandmark(e.target.value)}
                          className="rounded-xl border-[#E8E4DA] bg-white text-xs h-8.5"
                          placeholder="Landmark"
                        />
                        <Input
                          value={editPin}
                          onChange={(e) => setEditPin(e.target.value)}
                          className="rounded-xl border-[#E8E4DA] bg-white text-xs h-8.5"
                          placeholder="Pin"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={isUpdatingAddress}
                          size="sm"
                          className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-8"
                        >
                          {isUpdatingAddress ? "सहेज रहा है..." : "बदलाव सहेजें"}
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelEditAddress}
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-[#E8E4DA] text-[#5A655F] text-xs h-8"
                        >
                          रद्द करें
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#16201A]">
                            <MapPin className="size-3.5 text-[#145A45]" />
                            <span>{addr.name}</span>
                            <span className="font-normal text-[#5A655F]">({addr.phone})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditAddress(addr)}
                              className="text-[#5A655F] hover:text-[#145A45] p-1.5 rounded-lg hover:bg-[#E6EFE8] transition-colors"
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-[#5A655F] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#5A655F]">
                          {addr.house}, {addr.area}
                          {addr.landmark ? `, ${addr.landmark}` : ""}
                          <br />
                          {addr.city}, UP - {addr.pincode || "273303"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#E8E4DA] p-8 text-center bg-white space-y-2">
              <MapPin className="mx-auto size-10 text-[#A8B2AC]" />
              <p className="text-xs text-[#5A655F]">
                {lang === "hi"
                  ? "कोई सहेजा गया पता नहीं मिला। ऊपर दिए बटन से नया पता जोड़ें।"
                  : "No saved addresses. Click Add Address to save your location."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB 4: PROFILE & SETTINGS */}
        <TabsContent value="profile">
          <div className="max-w-xl rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
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

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-name" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "पूरा नाम" : "Full Name"}
                </Label>
                <Input
                  id="prof-name"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  className="rounded-2xl border-[#E8E4DA] bg-white text-xs h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-phone" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "मोबाइल नंबर (10 अंक)" : "Mobile Number (10 digits)"}
                </Label>
                {profile?.phone ? (
                  <>
                    <Input
                      id="prof-phone"
                      disabled
                      value={customerPhone}
                      className="rounded-2xl border-[#E8E4DA] bg-[#FAF8F2] text-xs font-bold text-[#145A45] h-10"
                    />
                    <p className="text-[10px] text-[#5A655F]">
                      {lang === "hi"
                        ? "पंजीकृत मोबाइल नंबर आपके खाते की सुरक्षित पहचान है।"
                        : "Registered mobile number is your secure login identity."}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex rounded-2xl border border-[#E8E4DA] focus-within:ring-2 focus-within:ring-[#145A45]/20 focus-within:border-[#145A45] bg-white overflow-hidden">
                      <span className="flex items-center bg-[#FAF8F2] px-3.5 text-xs font-bold text-[#0F4A38] border-r border-[#E8E4DA]">
                        +91
                      </span>
                      <Input
                        id="prof-phone"
                        type="tel"
                        maxLength={10}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="Add 10-digit mobile number"
                        className="border-0 rounded-none focus-visible:ring-0 text-xs font-semibold text-[#16201A] h-10"
                      />
                    </div>
                    <p className="text-[10px] text-[#145A45] font-medium">
                      {lang === "hi"
                        ? "ऑर्डर डिलीवरी व WhatsApp अपडेट के लिए मोबाइल नंबर जोड़ें।"
                        : "Add your mobile number for delivery updates."}
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-email" className="text-xs font-bold text-[#16201A]">
                  {lang === "hi" ? "ईमेल आईडी (वैकल्पिक)" : "Email Address (Optional)"}
                </Label>
                <Input
                  id="prof-email"
                  type="email"
                  placeholder="name@example.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="rounded-2xl border-[#E8E4DA] bg-white text-xs h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-2xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] shadow-xs cursor-pointer text-xs h-10 px-6"
              >
                {isSavingProfile ? "सहेज रहा है..." : lang === "hi" ? "बदलाव सहेजें" : "Save Changes"}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Official Invoice Modal */}
      <InvoiceView
        invoice={activeInvoice}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        lang={lang as "hi" | "en"}
      />
    </div>
  );
}
