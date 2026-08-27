import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { settingsQuery, couponsQuery, type Coupon } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { inr, telHref } from "@/lib/format";

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
  const { items, subtotal, clear, hydrated } = useCart();
  const { user, profile } = useAuth();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();
  const { data: settings } = useQuery(settingsQuery);
  const { data: coupons } = useQuery(couponsQuery);

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

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill customer details if user is authenticated or has stored info
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.email) setEmail(profile.email);
    } else {
      const storedPhone = localStorage.getItem("agt.last_phone");
      const storedName = localStorage.getItem("agt.last_name");
      const storedAddress = localStorage.getItem("agt.last_address");
      if (storedPhone) setPhone(storedPhone);
      if (storedName) setName(storedName);
      if (storedAddress) {
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
  }, [profile]);

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
        variant_label: item.variantLabel,
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
          {/* Section 1: Customer Contact */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-[#1F2924]">
              <span className="grid size-6 place-items-center rounded-full bg-[#145A45] text-xs font-bold text-white">
                1
              </span>
              {lang === "hi" ? "ग्राहक जानकारी" : "Customer Information"}
            </h2>
            <p className="mt-1 text-xs text-[#6B746F]">
              {lang === "hi"
                ? "ऑर्डर अपडेट और डिलीवरी के लिए कृपया सही मोबाइल नंबर दर्ज करें।"
                : "We use your mobile number to send order updates and identify your delivery history."}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name" className="text-xs font-semibold text-[#1F2924]">
                  {lang === "hi" ? "पूरा नाम" : "Full Name"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-name"
                  required
                  placeholder={lang === "hi" ? "उदा. रमेश कुमार" : "e.g. Ramesh Kumar"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-xs font-semibold text-[#1F2924]">
                  {lang === "hi" ? "मोबाइल नंबर (10 अंक)" : "Mobile Number (10 digits)"} <span className="text-red-500">*</span>
                </Label>
                <div className="flex rounded-xl border border-[#E8E4DA] focus-within:ring-2 focus-within:ring-[#145A45]/20">
                  <span className="flex items-center bg-[#FAF8F2] px-3 text-xs font-bold text-[#6B746F] rounded-l-xl border-r border-[#E8E4DA]">
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
                    className="border-0 rounded-l-none rounded-r-xl focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cust-email" className="text-xs font-semibold text-[#1F2924]">
                  {lang === "hi" ? "ईमेल पता" : "Email Address"}{" "}
                  <span className="text-[#6B746F] font-normal">
                    {lang === "hi" ? "(वैकल्पिक - बिल कॉपी के लिए)" : "(Optional for invoice copy)"}
                  </span>
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fulfillment & Delivery */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-[#1F2924]">
              <span className="grid size-6 place-items-center rounded-full bg-[#145A45] text-xs font-bold text-white">
                2
              </span>
              {lang === "hi" ? "डिलीवरी का प्रकार" : "Order Fulfillment Method"}
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
                    ? "border-[#145A45] bg-[#DCEBDD]/30 ring-1 ring-[#145A45]/30"
                    : "border-[#E8E4DA] hover:bg-[#FAF8F2]"
                }`}
              >
                <RadioGroupItem value="delivery" id="type-delivery" className="mt-1 text-[#145A45]" />
                <div>
                  <Label
                    htmlFor="type-delivery"
                    className="flex items-center gap-1.5 font-bold cursor-pointer text-[#1F2924]"
                  >
                    <Truck className="size-4 text-[#145A45]" /> {lang === "hi" ? "होम डिलीवरी" : "Home Delivery"}
                  </Label>
                  <p className="mt-0.5 text-xs text-[#6B746F]">
                    {lang === "hi"
                      ? "महाराजगंज नगर व आसपास के क्षेत्रों में 30-मिनट डिलीवरी।"
                      : "Doorstep delivery across Maharajganj town and nearby areas."}
                  </p>
                  <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#145A45]">
                    {deliveryFee === 0 ? "FREE Delivery" : `Delivery Fee: ₹${standardDeliveryFee}`}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setOrderType("pickup")}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  orderType === "pickup"
                    ? "border-[#145A45] bg-[#DCEBDD]/30 ring-1 ring-[#145A45]/30"
                    : "border-[#E8E4DA] hover:bg-[#FAF8F2]"
                }`}
              >
                <RadioGroupItem value="pickup" id="type-pickup" className="mt-1 text-[#145A45]" />
                <div>
                  <Label
                    htmlFor="type-pickup"
                    className="flex items-center gap-1.5 font-bold cursor-pointer text-[#1F2924]"
                  >
                    <Store className="size-4 text-[#145A45]" /> {lang === "hi" ? "दुकान से पिकअप" : "Store Pickup"}
                  </Label>
                  <p className="mt-0.5 text-xs text-[#6B746F]">
                    {lang === "hi"
                      ? "रामनगर, अड्डा बाजार रोड दुकान काउंटर से पैक सामान लें।"
                      : "Collect ready order at Ramnagar, Adda Bazar Road store."}
                  </p>
                  <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#15803D]">
                    {lang === "hi" ? "100% फ्री • तुरंत पैकिंग" : "FREE • Zero Waiting"}
                  </span>
                </div>
              </div>
            </RadioGroup>

            {/* Address fields if Home Delivery */}
            {orderType === "delivery" ? (
              <div className="mt-5 space-y-4 border-t border-[#E8E4DA] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B746F]">
                  {lang === "hi" ? "डिलीवरी का पता (महाराजगंज)" : "Delivery Address in Maharajganj"}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-house" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "मकान / दुकान / फ्लैट नं." : "House / Flat / Shop No."} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="addr-house"
                      required
                      placeholder={lang === "hi" ? "उदा. मकान नं. 42 या एसबीआई के पीछे" : "e.g. House No. 42 or Behind SBI"}
                      value={house}
                      onChange={(e) => setHouse(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="addr-area" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "मोहल्ला / गली / वार्ड" : "Area / Mohalla / Road"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="addr-area"
                      required
                      placeholder={lang === "hi" ? "उदा. अड्डा बाजार रोड, वार्ड नं. 5" : "e.g. Adda Bazar Road, Ward No. 5"}
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="addr-landmark" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "नजदीकी लैंडमार्क / पहचान" : "Nearby Landmark"}{" "}
                      <span className="text-[#6B746F] font-normal">
                        {lang === "hi" ? "(डिलीवरी में आसानी के लिए)" : "(Helpful for delivery boy)"}
                      </span>
                    </Label>
                    <Input
                      id="addr-landmark"
                      placeholder={lang === "hi" ? "उदा. दुर्गा मंदिर के पास / अड्डा चौक" : "e.g. Near Durga Mandir / Adda Chowk"}
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="addr-city" className="text-xs font-semibold text-[#1F2924]">
                        {lang === "hi" ? "शहर / कस्बा" : "City / Town"}
                      </Label>
                      <Input
                        id="addr-city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-xl bg-[#FAF8F2] border-[#E8E4DA]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addr-pin" className="text-xs font-semibold text-[#1F2924]">
                        PIN Code
                      </Label>
                      <Input
                        id="addr-pin"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="rounded-xl border-[#E8E4DA] bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="addr-notes" className="text-xs font-semibold text-[#1F2924]">
                      {lang === "hi" ? "डिलीवरी के लिए विशेष निर्देश" : "Special Delivery Instructions"}{" "}
                      <span className="text-[#6B746F] font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="addr-notes"
                      rows={2}
                      placeholder={lang === "hi" ? "उदा. शाम 5 बजे से पहले पहुंचाएं या आने पर कॉल करें" : "e.g. Please deliver before 5 PM, or call when near Adda Bazar"}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="rounded-xl border-[#E8E4DA] bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-4 text-xs text-[#6B746F]">
                📍 <strong>{lang === "hi" ? "पिकअप स्थान:" : "Pickup Location:"}</strong> Arun Gopal Traders, Ramnagar, Adda Bazar Road,
                Maharajganj, UP.
                <br />
                {lang === "hi"
                  ? "आपका ऑर्डर 30-45 मिनट में पैक करके तैयार रखा जाएगा।"
                  : "Your items will be packed and kept ready for you within 30-45 minutes."}
              </div>
            )}
          </div>

          {/* Section 3: Payment Method */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold text-[#1F2924]">
              <span className="grid size-6 place-items-center rounded-full bg-[#145A45] text-xs font-bold text-white">
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
                    ? "border-[#145A45] bg-[#DCEBDD]/30 ring-1 ring-[#145A45]/30"
                    : "border-[#E8E4DA] hover:bg-[#FAF8F2]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="cod" id="pay-cod" className="text-[#145A45]" />
                  <Label
                    htmlFor="pay-cod"
                    className="flex items-center gap-2 font-bold cursor-pointer text-[#1F2924]"
                  >
                    <Banknote className="size-4 text-[#15803D]" /> {lang === "hi" ? "कैश ऑन डिलीवरी (COD)" : "Cash on Delivery (COD)"}
                  </Label>
                </div>
                <span className="text-xs text-[#6B746F]">
                  {lang === "hi" ? "सामान मिलने पर नकद दें" : "Pay cash to delivery person"}
                </span>
              </div>

              <div
                onClick={() => setPaymentMethod("upi")}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  paymentMethod === "upi"
                    ? "border-[#145A45] bg-[#DCEBDD]/30 ring-1 ring-[#145A45]/30"
                    : "border-[#E8E4DA] hover:bg-[#FAF8F2]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="upi" id="pay-upi" className="text-[#145A45]" />
                  <Label
                    htmlFor="pay-upi"
                    className="flex items-center gap-2 font-bold cursor-pointer text-[#1F2924]"
                  >
                    <QrCode className="size-4 text-[#145A45]" /> {lang === "hi" ? "UPI / गूगल पे / फोनपे / पेटीएम" : "UPI / Google Pay / PhonePe / Paytm"}
                  </Label>
                </div>
                <span className="text-xs text-[#6B746F]">
                  {lang === "hi" ? "डिलीवरी पर QR स्कैन करें" : "Pay via UPI QR on delivery/pickup"}
                </span>
              </div>

              {orderType === "pickup" ? (
                <div
                  onClick={() => setPaymentMethod("pay_at_store")}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    paymentMethod === "pay_at_store"
                      ? "border-[#145A45] bg-[#DCEBDD]/30 ring-1 ring-[#145A45]/30"
                      : "border-[#E8E4DA] hover:bg-[#FAF8F2]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="pay_at_store" id="pay-store" className="text-[#145A45]" />
                    <Label
                      htmlFor="pay-store"
                      className="flex items-center gap-2 font-bold cursor-pointer text-[#1F2924]"
                    >
                      <Store className="size-4 text-[#145A45]" /> {lang === "hi" ? "दुकान काउंटर पर भुगतान" : "Pay at Store Counter"}
                    </Label>
                  </div>
                  <span className="text-xs text-[#6B746F]">
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
            className="w-full rounded-full py-6 text-base font-bold shadow-md bg-[#145A45] text-white hover:bg-[#0E4333] lg:hidden"
          >
            {isSubmitting ? "Placing Order…" : `Place Order • ${inr(grandTotal)}`}
          </Button>
        </form>

        {/* Right Order Summary Column */}
        <aside className="space-y-6">
          <div className="rounded-2xl p-5 shadow-xs lg:sticky lg:top-24 bg-white border border-[#E8E4DA]">
            <h2 className="font-sans text-lg font-bold text-[#1F2924]">
              {lang === "hi" ? "ऑर्डर का विवरण" : "Order Summary"}
            </h2>
            <p className="text-xs text-[#6B746F]">
              {items.length} {lang === "hi" ? "सामान आपके ऑर्डर में" : "items in your order"}
            </p>

            {/* Items mini list */}
            <div className="mt-4 max-h-56 space-y-2.5 overflow-y-auto pr-1 border-b border-[#E8E4DA] pb-4">
              {items.map((i) => (
                <div key={i.variantId} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#1F2924]">
                      {getProductName(i.name, i.slug)}
                    </p>
                    <p className="text-[11px] text-[#6B746F]">
                      {getVariantLabel(i.variantLabel)} × {i.qty}
                    </p>
                  </div>
                  <span className="font-bold text-[#1F2924]">{inr(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Application */}
            <div className="mt-4 border-b border-[#E8E4DA] pb-4">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input
                  placeholder="Coupon code (e.g. WELCOME50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-9 rounded-lg text-xs border-[#E8E4DA] bg-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="h-9 rounded-lg text-xs font-semibold bg-[#FAF8F2] border border-[#E8E4DA] text-[#145A45] hover:bg-[#DCEBDD]"
                >
                  Apply
                </Button>
              </form>
              {appliedCoupon ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-[#DCEBDD] px-2.5 py-1.5 text-xs text-[#145A45]">
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
              <div className="flex justify-between text-[#6B746F]">
                <dt>{t.itemSubtotal}</dt>
                <dd className="font-medium text-[#1F2924]">{inr(subtotal)}</dd>
              </div>

              {couponDiscount > 0 ? (
                <div className="flex justify-between text-[#15803D]">
                  <dt>Coupon Discount</dt>
                  <dd className="font-bold">-{inr(couponDiscount)}</dd>
                </div>
              ) : null}

              <div className="flex justify-between text-[#6B746F]">
                <dt>{t.deliveryFee}</dt>
                <dd className="font-medium text-[#1F2924]">
                  {deliveryFee === 0 ? (
                    <span className="text-[#15803D] font-bold">FREE</span>
                  ) : (
                    inr(deliveryFee)
                  )}
                </dd>
              </div>

              {subtotal > 0 && subtotal < freeDeliveryThreshold && orderType === "delivery" ? (
                <div className="rounded-lg bg-[#FAF8F2] border border-[#E8E4DA] p-2 text-[11px] text-[#6B746F]">
                  💡 Add <strong>{inr(freeDeliveryThreshold - subtotal)}</strong> more for{" "}
                  <strong>FREE Delivery</strong>!
                </div>
              ) : null}

              <div className="flex justify-between border-t border-[#E8E4DA] pt-3 text-base font-bold text-[#1F2924]">
                <dt>{t.totalAmount}</dt>
                <dd className="text-[#145A45] font-sans text-lg">{inr(grandTotal)}</dd>
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
