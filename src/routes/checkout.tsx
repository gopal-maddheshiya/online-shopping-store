import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Truck,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Info,
  MapPin,
  Plus,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import {
  settingsQuery,
  couponsQuery,
  userAddressesQuery,
  type Coupon,
  type CustomerAddress,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { inr, telHref } from "@/lib/format";
import { registerPlacedOrder } from "@/lib/orders";
import { broadcastNewOrder } from "@/lib/realtime-sync";



export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Checkout" },
      {
        name: "description",
        content: "Complete your grocery order with home delivery in Maharajganj or store pickup.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, subtotal, clear, hydrated } = useCart();
  const { user, profile } = useAuth();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();
  const { data: settings } = useQuery(settingsQuery);
  const { data: coupons } = useQuery(couponsQuery);
  const { data: savedAddresses = [] } = useQuery(userAddressesQuery(user?.id));

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [house, setHouse] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Maharajganj");
  const [pincode, setPincode] = useState("273303");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Address selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveNewAddressToProfile, setSaveNewAddressToProfile] = useState(true);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill customer details if user is authenticated or has stored info
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setName((prev) => prev || profile.full_name || "");
      if (profile.phone) setPhone((prev) => prev || profile.phone?.replace(/\D/g, "").slice(-10) || "");
      if (profile.email) setEmail((prev) => prev || profile.email || "");
    } else {
      const storedPhone = localStorage.getItem("agt.last_phone");
      const storedName = localStorage.getItem("agt.last_name");
      if (storedPhone) setPhone((prev) => prev || storedPhone);
      if (storedName) setName((prev) => prev || storedName);
    }
  }, [profile]);

  // Synchronize saved addresses from profile
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const currentSelected = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!isCustomAddress && (!selectedAddressId || !currentSelected)) {
        const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setHouse(defaultAddr.house || "");
          setArea(defaultAddr.area || "");
          setLandmark(defaultAddr.landmark || "");
          setCity(defaultAddr.city || "Maharajganj");
          setPincode(defaultAddr.pincode || "273303");
          if (defaultAddr.name) setName(defaultAddr.name);
          if (defaultAddr.phone) setPhone(defaultAddr.phone.replace(/\D/g, "").slice(-10));
        }
      }
    } else if (!user) {
      const storedAddress = localStorage.getItem("agt.last_address");
      if (storedAddress && !house && !area) {
        try {
          const addr = JSON.parse(storedAddress);
          if (addr.house) setHouse(addr.house);
          if (addr.area) setArea(addr.area);
          if (addr.landmark) setLandmark(addr.landmark);
          if (addr.pincode) setPincode(addr.pincode);
        } catch {
          // Ignore JSON parse failure for last address
        }
      }
    }
  }, [savedAddresses, user, isCustomAddress, selectedAddressId]);


  // Calculations
  const freeDeliveryThreshold = Number(settings?.free_delivery_threshold ?? 499);
  const standardDeliveryFee = Number(settings?.delivery_fee ?? 30);
  const minOrderValue = Number(settings?.min_order_value ?? 99);

  const deliveryFee =
    orderType === "pickup" || subtotal >= freeDeliveryThreshold ? 0 : standardDeliveryFee;

  // Calculate discount when subtotal or coupon changes
  useEffect(() => {
    if (!appliedCoupon) {
      setCouponDiscount(0);
      return;
    }
    if (subtotal < appliedCoupon.min_order) {
      toast.error(`Coupon requires minimum order of ${inr(appliedCoupon.min_order)}`);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }
    let disc = 0;
    if (appliedCoupon.discount_type === "percent") {
      disc = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.max_discount) disc = Math.min(disc, appliedCoupon.max_discount);
    } else {
      disc = appliedCoupon.value;
    }
    setCouponDiscount(Math.min(disc, subtotal));
  }, [appliedCoupon, subtotal]);

  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    const found = (coupons ?? []).find((c) => c.code.toUpperCase() === code && c.is_active);
    if (!found) {
      // Fallback predefined promo codes
      if (code === "WELCOME50" && subtotal >= 300) {
        setAppliedCoupon({
          id: "promo-1",
          code: "WELCOME50",
          description: "Flat ₹50 OFF on orders above ₹300",
          discount_type: "flat",
          value: 50,
          min_order: 300,
          max_discount: 50,
          starts_at: null,
          ends_at: null,
          usage_limit: null,
          used_count: 0,
          is_active: true,
        });
        toast.success("Coupon WELCOME50 applied! You saved ₹50.");
        return;
      }
      toast.error("Invalid or expired coupon code");
      return;
    }

    if (subtotal < found.min_order) {
      toast.error(`Minimum order value of ${inr(found.min_order)} required for this coupon`);
      return;
    }

    setAppliedCoupon(found);
    toast.success(`Coupon ${found.code} applied successfully!`);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!name.trim()) {
      toast.error("Please provide your full name");
      return;
    }
    if (orderType === "delivery" && (!area.trim() || !house.trim())) {
      toast.error("Please provide your delivery address (house/shop no and area)");
      return;
    }
    if (subtotal < minOrderValue) {
      toast.error(`Minimum order amount is ${inr(minOrderValue)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        user_id: user?.id ?? null,
        customer_name: name.trim(),
        customer_phone: cleanPhone,
        customer_email: email.trim() || null,
        order_type: orderType,
        address:
          orderType === "delivery"
            ? {
                house: house.trim(),
                area: area.trim(),
                landmark: landmark.trim(),
                city: city.trim(),
                pincode: pincode.trim(),
                instructions: instructions.trim(),
              }
            : { note: "Store Pickup at Ramnagar, Adda Bazar Road, Maharajganj" },
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code ?? null,
        subtotal: subtotal,
        discount: couponDiscount,
        delivery_fee: deliveryFee,
        total: grandTotal,
        notes: instructions.trim() || null,
      };

      const itemsPayload = items.map((item) => ({
        product_id: item.productId?.startsWith("temp-") ? null : item.productId,
        variant_id: item.variantId?.startsWith("temp-") ? null : item.variantId,
        name: item.name,
        name_en: item.name_en || item.name,
        name_hi: item.name_hi || null,
        variant_label: item.variantLabel,
        variant_label_en: item.variantLabel_en || item.variantLabel,
        variant_label_hi: item.variantLabel_hi || null,
        image_url: item.imageUrl,
        mrp: item.mrp,
        price: item.price,
        qty: item.qty,
      }));

      let orderNo = `AGT-${Date.now().toString().slice(-4)}`;

      // 1. Try atomic place_order RPC procedure first
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as Function)("place_order", {
        _order_payload: orderPayload,
        _items_payload: itemsPayload,
      });

      if (!rpcErr && rpcRes && typeof rpcRes === "object" && "order_no" in rpcRes) {
        orderNo = String((rpcRes as { order_no: string }).order_no);
      } else {
        // Fallback: Direct table insertion
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert(orderPayload as never)
          .select("id, order_no")
          .maybeSingle();

        if (orderError) throw orderError;
        if (orderData?.order_no) orderNo = orderData.order_no;

        if (orderData?.id) {
          const itemsWithOrderId = itemsPayload.map((it) => ({
            ...it,
            order_id: orderData.id,
          }));
          await supabase.from("order_items").insert(itemsWithOrderId as never);
        }
      }

      // Register order for admin manifest and broadcast in realtime
      registerPlacedOrder({ order_no: orderNo, phone: cleanPhone });
      broadcastNewOrder({
        orderId: orderNo,
        orderNo,
        total: grandTotal,
        customerName: name.trim(),
        createdAt: new Date().toISOString(),
      });



      // Save customer info locally for instant future checkout
      localStorage.setItem("agt.last_phone", cleanPhone);
      localStorage.setItem("agt.last_name", name.trim());
      if (orderType === "delivery") {
        localStorage.setItem(
          "agt.last_address",
          JSON.stringify({
            house: house.trim(),
            area: area.trim(),
            landmark: landmark.trim(),
            pincode: pincode.trim(),
          }),
        );

        // Save newly entered address to profile if option is checked
        if (user?.id && (isCustomAddress || !selectedAddressId) && saveNewAddressToProfile) {
          try {
            await supabase.from("addresses").insert({
              user_id: user.id,
              name: name.trim(),
              phone: cleanPhone,
              house: house.trim(),
              area: area.trim(),
              landmark: landmark.trim() || null,
              city: city.trim() || "Maharajganj",
              pincode: pincode.trim() || "273303",
              is_default: savedAddresses.length === 0,
            });
            void queryClient.invalidateQueries({ queryKey: ["user-addresses", user.id] });
          } catch (saveErr) {
            console.warn("Could not save new address to profile:", saveErr);
          }
        }

        // If user profile is missing phone or name, sync it now
        try {
          const profileUpdates: { phone?: string; full_name?: string } = {};
          if (!profile?.phone && cleanPhone) {
            profileUpdates.phone = `+91${cleanPhone}`;
          }
          if (!profile?.full_name && name.trim()) {
            profileUpdates.full_name = name.trim();
          }
          if (user?.id && Object.keys(profileUpdates).length > 0) {
            await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
          }
        } catch (syncErr) {
          console.warn("Could not sync phone/name to profile:", syncErr);
        }
      }


      // Clear the shopping cart
      clear();

      toast.success(
        lang === "hi"
          ? `ऑर्डर सफलतापूर्वक दर्ज हो गया! (ऑर्डर नं. ${orderNo})`
          : `Order Placed Successfully! (Order No. ${orderNo})`,
      );

      // Navigate to order confirmation / tracking page
      void navigate({
        to: "/track",
        search: { orderNo, phone: cleanPhone } as never,
      });
    } catch (err: unknown) {
      console.error("Order placement failed:", err);
      const msg = err instanceof Error ? err.message : "Could not place order";
      toast.error(`Order failed: ${msg}. You can also call us at +91 6388354988 to place it.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#FAF8F2] text-[#145A45]">
          <ShoppingBag className="size-8" />
        </div>
        <h1 className="mt-4 font-sans text-2xl font-bold text-[#1F2924]">Your basket is empty</h1>
        <p className="mt-2 text-sm text-[#6B746F]">
          Add items to your cart before proceeding to checkout.
        </p>
        <Button asChild className="mt-6 rounded-full bg-[#145A45] text-white hover:bg-[#0E4333]">
          <Link to="/shop">Browse Catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8 pb-28 lg:pb-12">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between border-b border-[#E8E4DA] pb-4">
        <div>
          <Link
            to="/cart"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#145A45] hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to Cart
          </Link>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[#1F2924] sm:text-3xl mt-1">
            {lang === "hi" ? "चेकआउट व ऑर्डर" : "Checkout"}
          </h1>
        </div>
        <a
          href={telHref(settings?.phone ?? "+916388354988")}
          className="flex items-center gap-1.5 rounded-full border border-[#145A45]/30 bg-[#FAF8F2] px-3 py-1.5 text-xs font-semibold text-[#145A45] hover:bg-[#DCEBDD]"
        >
          <PhoneCall className="size-3.5" /> {lang === "hi" ? "फोन पर ऑर्डर?" : "Order on Phone?"}
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Left Form Column */}
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          {/* Guest One-Click Google Login Banner */}
          {!user && (
            <div className="rounded-2xl border border-[#145A45]/20 bg-[#FAF8F2] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white border border-[#E5E0D5] grid place-items-center shrink-0 shadow-2xs">
                  <svg className="size-4.5 shrink-0" viewBox="0 0 24 24">
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
                </div>
                <div>
                  <p className="text-xs font-bold text-[#16201A]">
                    {lang === "hi" ? "सहेजे गए पते और तेज़ चेकआउट के लिए" : "Have an account with saved addresses?"}
                  </p>
                  <p className="text-[11px] text-[#5A655F]">
                    {lang === "hi"
                      ? "Google या मोबाइल से लॉगिन करें (गेस्ट ऑर्डर भी खुला है)"
                      : "Sign in with Google or mobile (or continue as guest)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/checkout`,
                      },
                    });
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl border border-[#E5E0D5] bg-white text-xs font-bold text-[#16201A] hover:bg-[#FAF8F2] shadow-2xs cursor-pointer active:scale-98 transition-all"
                >
                  <span>{lang === "hi" ? "Google से लॉगिन" : "Sign in with Google"}</span>
                </button>
                <Link
                  to="/account"
                  className="flex-1 sm:flex-none flex items-center justify-center h-9 px-3 rounded-xl text-xs font-bold text-[#145A45] hover:bg-[#E6EFE8] transition-colors"
                >
                  {lang === "hi" ? "मोबाइल लॉगिन" : "Mobile Login"}
                </Link>
              </div>
            </div>
          )}

          {/* Section 1: Customer Contact Info */}
          <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-[#16201A]">
              <span className="grid size-6 place-items-center rounded-lg bg-[#0F4A38] text-xs font-bold text-white">
                1
              </span>
              {t.customerContactDetails}
            </h2>
            <p className="mt-1 text-xs text-[#5A655F]">
              {t.customerContactSubtitle}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name" className="text-xs font-semibold text-[#16201A]">
                  {t.fullName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-name"
                  required
                  placeholder={lang === "hi" ? "उदा. रमेश कुमार" : "e.g. Ramesh Kumar"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border-[#E5E0D5] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-xs font-semibold text-[#16201A]">
                  {t.mobileNumber10} <span className="text-red-500">*</span>
                </Label>
                <div className="flex rounded-lg border border-[#E5E0D5] focus-within:ring-1 focus-within:ring-[#145A45]">
                  <span className="flex items-center bg-[#FAF8F2] px-3 text-xs font-bold text-[#5A655F] rounded-l-lg border-r border-[#E5E0D5]">
                    +91
                  </span>
                  <Input
                    id="cust-phone"
                    required
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 rounded-l-none rounded-r-lg focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cust-email" className="text-xs font-semibold text-[#16201A]">
                  {t.emailAddress}{" "}
                  <span className="text-[#5A655F] font-normal">
                    {t.optionalInvoiceCopy}
                  </span>
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border-[#E5E0D5] bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fulfillment & Delivery */}
          <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-[#16201A]">
              <span className="grid size-6 place-items-center rounded-lg bg-[#0F4A38] text-xs font-bold text-white">
                2
              </span>
              {t.orderFulfillmentMethod}
            </h2>

            <RadioGroup
              value={orderType}
              onValueChange={(v) => setOrderType(v as "delivery" | "pickup")}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <div
                onClick={() => setOrderType("delivery")}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  orderType === "delivery"
                    ? "border-[#145A45] bg-[#E6EFE8]/40 ring-1 ring-[#145A45]/30"
                    : "border-[#E5E0D5] hover:bg-[#FAF8F2]"
                }`}
              >
                <RadioGroupItem value="delivery" id="type-delivery" className="mt-1 text-[#145A45]" />
                <div>
                  <Label
                    htmlFor="type-delivery"
                    className="flex items-center gap-1.5 font-bold cursor-pointer text-[#16201A]"
                  >
                    <Truck className="size-4 text-[#145A45]" /> {t.homeDelivery}
                  </Label>
                  <p className="mt-0.5 text-xs text-[#5A655F]">
                    {t.homeDeliveryDesc}
                  </p>
                  <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#0F4A38]">
                    {deliveryFee === 0 ? t.freeDeliveryTitle : `${t.deliveryFee}: ₹${standardDeliveryFee}`}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setOrderType("pickup")}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  orderType === "pickup"
                    ? "border-[#145A45] bg-[#E6EFE8]/40 ring-1 ring-[#145A45]/30"
                    : "border-[#E5E0D5] hover:bg-[#FAF8F2]"
                }`}
              >
                <RadioGroupItem value="pickup" id="type-pickup" className="mt-1 text-[#145A45]" />
                <div>
                  <Label
                    htmlFor="type-pickup"
                    className="flex items-center gap-1.5 font-bold cursor-pointer text-[#16201A]"
                  >
                    <Store className="size-4 text-[#145A45]" /> {t.storePickupTitle}
                  </Label>
                  <p className="mt-0.5 text-xs text-[#5A655F]">
                    {t.storePickupDesc}
                  </p>
                  <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#15803D]">
                    {t.freeZeroWaiting}
                  </span>
                </div>
              </div>
            </RadioGroup>

            {/* Address fields if Home Delivery */}
            {orderType === "delivery" ? (
              <div className="mt-5 space-y-4 border-t border-[#E5E0D5] pt-4">

                {/* 1. Saved Addresses Selection (Logged In Customer) */}
                {user && savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#145A45]">
                        <MapPin className="size-3.5" />
                        {lang === "hi" ? "सहेजे गए पते से चुनें" : "Select from Saved Addresses"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomAddress(true);
                          setSelectedAddressId(null);
                          setShowAddressForm(true);
                          setHouse("");
                          setArea("");
                          setLandmark("");
                          setPincode("273303");
                        }}
                        className={`text-xs font-bold transition-all ${
                          isCustomAddress
                            ? "text-[#145A45] underline"
                            : "text-[#D97706] hover:text-[#B45309] hover:underline"
                        }`}
                      >
                        + {lang === "hi" ? "नया पता दर्ज करें" : "Enter New Address"}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id && !isCustomAddress;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setIsCustomAddress(false);
                              setShowAddressForm(false);
                              setHouse(addr.house || "");
                              setArea(addr.area || "");
                              setLandmark(addr.landmark || "");
                              setCity(addr.city || "Maharajganj");
                              setPincode(addr.pincode || "273303");
                              if (addr.name) setName(addr.name);
                              if (addr.phone) setPhone(addr.phone.replace(/\D/g, "").slice(-10));
                            }}
                            className={`group relative cursor-pointer rounded-xl border p-3.5 transition-all ${
                              isSelected
                                ? "border-[#145A45] bg-[#E6EFE8]/50 ring-2 ring-[#145A45] shadow-xs"
                                : "border-[#E5E0D5] bg-white hover:border-[#145A45]/40 hover:bg-[#FAF8F2]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`grid size-5 place-items-center rounded-full ${
                                    isSelected
                                      ? "bg-[#145A45] text-white"
                                      : "bg-[#145A45]/10 text-[#145A45]"
                                  }`}
                                >
                                  <MapPin className="size-3" />
                                </span>
                                <span className="text-xs font-bold text-[#16201A]">
                                  {addr.name || (lang === "hi" ? "घर" : "Home")}
                                </span>
                                {addr.is_default && (
                                  <span className="rounded-full bg-[#145A45]/10 px-2 py-0.2 text-[10px] font-bold text-[#145A45]">
                                    {lang === "hi" ? "डिफ़ॉल्ट" : "Default"}
                                  </span>
                                )}
                              </div>
                              <div
                                className={`grid size-4 place-items-center rounded-full border transition-all ${
                                  isSelected
                                    ? "border-[#145A45] bg-[#145A45] text-white"
                                    : "border-[#D1C9BC] bg-white group-hover:border-[#145A45]"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="size-3.5" />}
                              </div>
                            </div>

                            <p className="mt-2 text-xs font-medium text-[#2C3E35] leading-relaxed">
                              {[addr.house, addr.area, addr.landmark].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-[11px] text-[#5A655F]">
                              {addr.city || "Maharajganj"} - {addr.pincode || "273303"}
                            </p>

                            {addr.phone && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-[#5A655F]">
                                <PhoneCall className="size-2.5" /> +91 {addr.phone}
                              </p>
                            )}

                            {isSelected && (
                              <div className="mt-2.5 flex items-center justify-between border-t border-[#145A45]/20 pt-2 text-[11px] font-bold text-[#145A45]">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="size-3 text-emerald-600" />
                                  {lang === "hi" ? "इस पते पर डिलीवरी होगी" : "Delivering to this address"}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAddressForm((prev) => !prev);
                                  }}
                                  className="flex items-center gap-0.5 text-[11px] font-semibold text-[#145A45] hover:underline"
                                >
                                  {showAddressForm
                                    ? (lang === "hi" ? "छुपाएं" : "Hide")
                                    : (lang === "hi" ? "बदलें" : "Edit")}
                                  {showAddressForm ? (
                                    <ChevronUp className="size-3" />
                                  ) : (
                                    <ChevronDown className="size-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* + Add New Address Tile */}
                      <div
                        onClick={() => {
                          setIsCustomAddress(true);
                          setSelectedAddressId(null);
                          setShowAddressForm(true);
                          setHouse("");
                          setArea("");
                          setLandmark("");
                          setPincode("273303");
                        }}
                        className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all ${
                          isCustomAddress
                            ? "border-[#145A45] bg-[#E6EFE8]/40 ring-2 ring-[#145A45]"
                            : "border-[#D1C9BC] bg-[#FAF8F2]/60 hover:bg-[#FAF8F2] hover:border-[#145A45]"
                        }`}
                      >
                        <Plus
                          className={`size-5 ${
                            isCustomAddress ? "text-[#145A45]" : "text-[#5A655F]"
                          }`}
                        />
                        <span
                          className={`mt-1 text-xs font-bold ${
                            isCustomAddress ? "text-[#145A45]" : "text-[#16201A]"
                          }`}
                        >
                          {lang === "hi" ? "+ नया पता जोड़ें" : "+ Add New Address"}
                        </span>
                        <span className="text-[10px] text-[#5A655F]">
                          {lang === "hi" ? "अलग स्थान पर मंगाने हेतु" : "For delivery elsewhere"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Address Input Fields (Expanded if no saved addresses, custom address selected, or edit toggled) */}
                {(!user || savedAddresses.length === 0 || isCustomAddress || showAddressForm) && (
                  <div className="space-y-4 rounded-xl border border-[#E5E0D5] bg-[#FAF8F2]/40 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A655F]">
                        {isCustomAddress
                          ? (lang === "hi" ? "नया डिलीवरी पता" : "New Delivery Address")
                          : (lang === "hi" ? "डिलीवरी पता विवरण" : "Delivery Address Details")}
                      </h3>
                      {user && savedAddresses.length > 0 && (
                        <span className="text-[11px] text-[#5A655F]">
                          {isCustomAddress
                            ? (lang === "hi" ? "अलग पता दर्ज करें" : "Entering new address")
                            : (lang === "hi" ? "चुना गया पता संपादित करें" : "Editing selected address")}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="addr-house" className="text-xs font-semibold text-[#16201A]">
                          {lang === "hi" ? "मकान / दुकान / फ्लैट नं." : "House / Flat / Shop No."} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="addr-house"
                          required
                          placeholder={lang === "hi" ? "उदा. मकान नं. 42 या एसबीआई के पीछे" : "e.g. House No. 42 or Behind SBI"}
                          value={house}
                          onChange={(e) => setHouse(e.target.value)}
                          className="rounded-lg border-[#E5E0D5] bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr-area" className="text-xs font-semibold text-[#16201A]">
                          {lang === "hi" ? "मोहल्ला / गली / वार्ड" : "Area / Mohalla / Road"} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="addr-area"
                          required
                          placeholder={lang === "hi" ? "उदा. अड्डा बाजार रोड, वार्ड नं. 5" : "e.g. Adda Bazar Road, Ward No. 5"}
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="rounded-lg border-[#E5E0D5] bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr-landmark" className="text-xs font-semibold text-[#16201A]">
                          {lang === "hi" ? "नजदीकी लैंडमार्क / पहचान" : "Nearby Landmark"}{" "}
                          <span className="text-[#5A655F] font-normal">
                            {lang === "hi" ? "(डिलीवरी में आसानी के लिए)" : "(Helpful for delivery boy)"}
                          </span>
                        </Label>
                        <Input
                          id="addr-landmark"
                          placeholder={lang === "hi" ? "उदा. दुर्गा मंदिर के पास / अड्डा चौक" : "e.g. Near Durga Mandir / Adda Chowk"}
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="rounded-lg border-[#E5E0D5] bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="addr-city" className="text-xs font-semibold text-[#16201A]">
                            {lang === "hi" ? "शहर / कस्बा" : "City / Town"}
                          </Label>
                          <Input
                            id="addr-city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="rounded-lg bg-[#FAF8F2] border-[#E5E0D5]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="addr-pin" className="text-xs font-semibold text-[#16201A]">
                            PIN Code
                          </Label>
                          <Input
                            id="addr-pin"
                            maxLength={6}
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="rounded-lg border-[#E5E0D5] bg-white"
                          />
                        </div>
                      </div>

                      {user && (isCustomAddress || savedAddresses.length === 0) && (
                        <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                          <input
                            type="checkbox"
                            id="save-addr-profile"
                            checked={saveNewAddressToProfile}
                            onChange={(e) => setSaveNewAddressToProfile(e.target.checked)}
                            className="size-4 rounded border-[#E5E0D5] text-[#145A45] focus:ring-[#145A45]"
                          />
                          <Label htmlFor="save-addr-profile" className="text-xs font-semibold cursor-pointer text-[#16201A]">
                            {lang === "hi" ? "इस पते को मेरे प्रोफाइल में सहेजें (भविष्य के ऑर्डर्स के लिए)" : "Save this address to my profile for future orders"}
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="space-y-1.5">
                  <Label htmlFor="addr-notes" className="text-xs font-semibold text-[#16201A]">
                    {lang === "hi" ? "डिलीवरी के लिए विशेष निर्देश" : "Special Delivery Instructions"}{" "}
                    <span className="text-[#5A655F] font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="addr-notes"
                    rows={2}
                    placeholder={lang === "hi" ? "उदा. शाम 5 बजे से पहले पहुंचाएं या आने पर कॉल करें" : "e.g. Please deliver before 5 PM, or call when near Adda Bazar"}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="rounded-lg border-[#E5E0D5] bg-white"
                  />
                </div>
              </div>

            ) : (
              <div className="mt-4 rounded-xl bg-[#FAF8F2] border border-[#E5E0D5] p-4 text-xs text-[#5A655F]">
                📍 <strong>{lang === "hi" ? "पिकअप स्थान:" : "Pickup Location:"}</strong> {t.storeName}, {t.storeAddressShort}.
                <br />
                {lang === "hi"
                  ? "आपका ऑर्डर 30-45 मिनट में पैक करके तैयार रखा जाएगा।"
                  : "Your items will be packed and kept ready for you within 30-45 minutes."}
              </div>
            )}
          </div>


          {/* Section 3: Payment Method */}
          <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-[#16201A]">
              <span className="grid size-6 place-items-center rounded-lg bg-[#0F4A38] text-xs font-bold text-white">
                3
              </span>
              {lang === "hi" ? "भुगतान का तरीका" : "Payment Method"}
            </h2>

            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="mt-4 space-y-3"
            >
              <div
                onClick={() => setPaymentMethod("cod")}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  paymentMethod === "cod"
                    ? "border-[#145A45] bg-[#E6EFE8]/40 ring-1 ring-[#145A45]/30"
                    : "border-[#E5E0D5] hover:bg-[#FAF8F2]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="cod" id="pay-cod" className="text-[#145A45]" />
                  <Label
                    htmlFor="pay-cod"
                    className="flex items-center gap-2 font-bold cursor-pointer text-[#16201A]"
                  >
                    <Banknote className="size-4 text-[#15803D]" /> {lang === "hi" ? "कैश ऑन डिलीवरी (COD)" : "Cash on Delivery (COD)"}
                  </Label>
                </div>
                <span className="text-xs text-[#5A655F]">
                  {lang === "hi" ? "सामान मिलने पर नकद दें" : "Pay cash to delivery person"}
                </span>
              </div>

              <div
                onClick={() => setPaymentMethod("upi")}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  paymentMethod === "upi"
                    ? "border-[#145A45] bg-[#E6EFE8]/40 ring-1 ring-[#145A45]/30"
                    : "border-[#E5E0D5] hover:bg-[#FAF8F2]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="upi" id="pay-upi" className="text-[#145A45]" />
                  <Label
                    htmlFor="pay-upi"
                    className="flex items-center gap-2 font-bold cursor-pointer text-[#16201A]"
                  >
                    <QrCode className="size-4 text-[#145A45]" /> {lang === "hi" ? "UPI / गूगल पे / फोनपे / पेटीएम" : "UPI / Google Pay / PhonePe / Paytm"}
                  </Label>
                </div>
                <span className="text-xs text-[#5A655F]">
                  {lang === "hi" ? "डिलीवरी पर QR स्कैन करें" : "Pay via UPI QR on delivery/pickup"}
                </span>
              </div>

              {orderType === "pickup" ? (
                <div
                  onClick={() => setPaymentMethod("pay_at_store")}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    paymentMethod === "pay_at_store"
                      ? "border-[#145A45] bg-[#E6EFE8]/40 ring-1 ring-[#145A45]/30"
                      : "border-[#E5E0D5] hover:bg-[#FAF8F2]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="pay_at_store" id="pay-store" className="text-[#145A45]" />
                    <Label
                      htmlFor="pay-store"
                      className="flex items-center gap-2 font-bold cursor-pointer text-[#16201A]"
                    >
                      <Store className="size-4 text-[#145A45]" /> {lang === "hi" ? "दुकान काउंटर पर भुगतान" : "Pay at Store Counter"}
                    </Label>
                  </div>
                  <span className="text-xs text-[#5A655F]">
                    {lang === "hi" ? "नकद या UPI दुकान पर" : "Cash/UPI at shop counter"}
                  </span>
                </div>
              ) : null}
            </RadioGroup>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || items.length === 0}
            className="w-full rounded-lg py-4 text-base font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0A3628] lg:hidden"
          >
            {isSubmitting ? "Placing Order…" : `Place Order • ${inr(grandTotal)}`}
          </Button>
        </form>

        {/* Right Order Summary Column */}
        <aside className="space-y-6">
          <div className="rounded-2xl p-5 shadow-xs lg:sticky lg:top-24 bg-white border border-[#E5E0D5]">
            <h2 className="font-sans text-lg font-bold text-[#16201A]">
              {lang === "hi" ? "ऑर्डर का विवरण" : "Order Summary"}
            </h2>
            <p className="text-xs text-[#5A655F]">
              {items.length} {lang === "hi" ? "सामान आपके ऑर्डर में" : "items in your order"}
            </p>

            {/* Items mini list */}
            <div className="mt-4 max-h-56 space-y-2.5 overflow-y-auto pr-1 border-b border-[#E5E0D5] pb-4">
              {items.map((i) => (
                <div key={i.variantId} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#16201A]">
                      {getProductName(i)}
                    </p>
                    <p className="text-[11px] text-[#5A655F]">
                      {getVariantLabel(i)} × {i.qty}
                    </p>
                  </div>
                  <span className="font-bold text-[#16201A]">{inr(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Application */}
            <div className="mt-4 border-b border-[#E5E0D5] pb-4">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input
                  placeholder="Coupon code (e.g. WELCOME50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-9 rounded-lg text-xs border-[#E5E0D5] bg-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="h-9 rounded-lg text-xs font-semibold bg-[#FAF8F2] border border-[#E5E0D5] text-[#0F4A38] hover:bg-[#E6EFE8]"
                >
                  Apply
                </Button>
              </form>
              {appliedCoupon ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-[#E6EFE8] px-2.5 py-1.5 text-xs text-[#0F4A38]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Tag className="size-3" /> {appliedCoupon.code} (-{inr(couponDiscount)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                    }}
                    className="text-[11px] font-bold underline hover:opacity-75"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            {/* Price Calculations */}
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#5A655F]">
                <dt>{t.itemSubtotal}</dt>
                <dd className="font-medium text-[#16201A]">{inr(subtotal)}</dd>
              </div>

              {couponDiscount > 0 ? (
                <div className="flex justify-between text-[#15803D]">
                  <dt>Coupon Discount</dt>
                  <dd className="font-bold">-{inr(couponDiscount)}</dd>
                </div>
              ) : null}

              <div className="flex justify-between text-[#5A655F]">
                <dt>{t.deliveryFee}</dt>
                <dd className="font-medium text-[#16201A]">
                  {deliveryFee === 0 ? (
                    <span className="text-[#15803D] font-bold">FREE</span>
                  ) : (
                    inr(deliveryFee)
                  )}
                </dd>
              </div>

              {subtotal > 0 && subtotal < freeDeliveryThreshold && orderType === "delivery" ? (
                <div className="rounded-lg bg-[#FAF8F2] border border-[#E5E0D5] p-2 text-[11px] text-[#5A655F]">
                  💡 Add <strong>{inr(freeDeliveryThreshold - subtotal)}</strong> more for{" "}
                  <strong>FREE Delivery</strong>!
                </div>
              ) : null}

              <div className="flex justify-between border-t border-[#E5E0D5] pt-3 text-base font-bold text-[#16201A]">
                <dt>{t.totalAmount}</dt>
                <dd className="text-[#0F4A38] font-sans text-lg font-black">{inr(grandTotal)}</dd>
              </div>
            </dl>

            <Button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || items.length === 0}
              size="lg"
              className="mt-5 hidden w-full rounded-full py-6 font-bold shadow-md lg:flex bg-[#145A45] text-white hover:bg-[#0E4333]"
            >
              {isSubmitting ? "Placing Order…" : `Confirm & Place Order • ${inr(grandTotal)}`}
            </Button>

            <div className="mt-4 space-y-1.5 text-center text-[11px] text-[#6B746F]">
              <p className="flex items-center justify-center gap-1">
                <ShieldCheck className="size-3.5 text-[#145A45]" /> 100% शुद्ध राशन • अरुण गोपाल ट्रेडर्स
              </p>
              <p>
                Need help ordering? Call{" "}
                <a
                  href={telHref(settings?.phone ?? "+916388354988")}
                  className="font-semibold text-[#145A45] hover:underline"
                >
                  +91 6388354988
                </a>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
