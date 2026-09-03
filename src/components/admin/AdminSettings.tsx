import { useState, useEffect } from "react";
import {
  Save,
  Store,
  Clock,
  Phone,
  MapPin,
  Truck,
  Sparkles,
  RefreshCw,
  Receipt,
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Lock,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { broadcastSettingsSync } from "@/lib/realtime-sync";
import type { StoreSettings } from "@/lib/queries";
import { generateUpiUri, generateQrCodeUrl } from "@/lib/payment-gateway";
import { inr } from "@/lib/format";
import { compressAndOptimizeImage } from "@/lib/image-upload";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
import { HeroImageUploader } from "@/components/admin/HeroImageUploader";

type AdminSettingsProps = {
  settings: StoreSettings | undefined;
  onRefresh: () => void;
};

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function AdminSettings({ settings, onRefresh }: AdminSettingsProps) {
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("");

  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [announcementHi, setAnnouncementHi] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [hero2ImageUrl, setHero2ImageUrl] = useState("");
  const [hero3ImageUrl, setHero3ImageUrl] = useState("");
  const [hero4ImageUrl, setHero4ImageUrl] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(499);
  const [minOrderValue, setMinOrderValue] = useState(99);

  // Billing & Invoicing Configuration
  const [legalName, setLegalName] = useState("Arun Gopal Traders");
  const [gstin, setGstin] = useState("");
  const [state, setState] = useState("Uttar Pradesh");
  const [stateCode, setStateCode] = useState("09");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [invoicePrefix, setInvoicePrefix] = useState("AGT-INV");
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(
    "Thank you for shopping with Arun Gopal Traders! For inquiries/support, call +91 6388354988."
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Goods once sold can only be returned within 24 hours in original packed condition.\n2. Please retain this invoice for any verification.\n3. All disputes subject to Maharajganj jurisdiction."
  );

  // Payment Gateway & Receiving Accounts Configuration
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>([
    "upi",
    "card",
    "qr",
    "cod",
    "pay_at_store",
  ]);
  const [upiVpa, setUpiVpa] = useState("6388354988@okbizaxis");
  const [upiMerchantName, setUpiMerchantName] = useState("Arun Gopal Traders");
  const [upiRegisteredPhone, setUpiRegisteredPhone] = useState("6388354988");
  const [bankAccountHolder, setBankAccountHolder] = useState("Arun Gopal Traders");
  const [bankName, setBankName] = useState("State Bank of India");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [qrCodeMode, setQrCodeMode] = useState("dynamic");
  const [qrCustomNote, setQrCustomNote] = useState("Arun Gopal Traders Grocery Order");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [testQrCopied, setTestQrCopied] = useState(false);

  // Business Hours Map
  const [businessHours, setBusinessHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >({});

  const [isSaving, setIsSaving] = useState(false);

  async function saveHeroImageToDb(url: string | null) {
    return saveHeroImageFieldToDb("hero_image_url", url);
  }

  async function saveHeroImageFieldToDb(
    field: "hero_image_url" | "hero2_image_url" | "hero3_image_url" | "hero4_image_url",
    url: string | null,
  ) {
    try {
      queryClient.setQueryData(["store-settings"], (old: StoreSettings | undefined) => {
        if (!old) return old;
        return { ...old, [field]: url };
      });

      await supabase
        .from("store_settings")
        .upsert({ id: 1, [field]: url } as never, { onConflict: "id" });

      const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "https://rvpskkgrobztgcfznawl.supabase.co";
      const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHNra2dyb2J6dGdjZnpuYXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDc0MzAsImV4cCI6MjEwMzQyMzQzMH0.FCO6H2AWcHQ_QznsOVBsAuJxOUjMLs_qTjvrnsCxK4k";
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      await fetch(`${supabaseUrl}/rest/v1/store_settings?id=eq.1`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${accessToken || supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ [field]: url }),
      });

      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      return true;
    } catch (err) {
      console.error(`Hero image ${field} save error:`, err);
      return false;
    }
  }

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name ?? "Arun Gopal Traders");
      setTagline(settings.tagline ?? "Your Trusted Local Grocery Store");
      setPhone(settings.phone ?? "+916388354988");
      setWhatsapp(settings.whatsapp ?? "916388354988");
      setEmail(settings.email ?? "gopalmaddheshiya138@gmail.com");
      setAddress(settings.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh");
      setMapsLink(settings.maps_link ?? "");
      setAnnouncement(settings.announcement ?? "");
      setAnnouncementHi(settings.announcement_hi ?? "");
      setHeroTitle(settings.hero_title ?? "Arun Gopal Traders");
      setHeroSubtitle(
        settings.hero_subtitle ?? "Quality products • Genuine prices • Easy ordering",
      );
      setHeroImageUrl(settings.hero_image_url ?? "");
      setHero2ImageUrl(settings.hero2_image_url ?? "");
      setHero3ImageUrl(settings.hero3_image_url ?? "");
      setHero4ImageUrl(settings.hero4_image_url ?? "");
      setDeliveryFee(Number(settings.delivery_fee ?? 30));
      setDeliveryEnabled(settings.delivery_enabled ?? true);
      setFreeDeliveryThreshold(Number(settings.free_delivery_threshold ?? 499));
      setMinOrderValue(Number(settings.min_order_value ?? 99));
      setBusinessHours(settings.business_hours ?? {});

      setLegalName(settings.legal_name ?? "Arun Gopal Traders");
      setGstin(settings.gstin ?? "");
      setState(settings.state ?? "Uttar Pradesh");
      setStateCode(settings.state_code ?? "09");
      setTaxEnabled(Boolean(settings.tax_enabled));
      setDefaultTaxRate(Number(settings.default_tax_rate ?? 0));
      setInvoicePrefix(settings.invoice_prefix ?? "AGT-INV");
      setInvoiceFooterNote(
        settings.invoice_footer_note ??
          "Thank you for shopping with Arun Gopal Traders! For inquiries/support, call +91 6388354988."
      );
      setTermsAndConditions(
        settings.terms_and_conditions ??
          "1. Goods once sold can only be returned within 24 hours in original packed condition.\n2. Please retain this invoice for any verification.\n3. All disputes subject to Maharajganj jurisdiction."
      );

      setOnlinePaymentEnabled(settings.online_payment_enabled !== false);
      if (settings.enabled_payment_methods && Array.isArray(settings.enabled_payment_methods)) {
        setEnabledPaymentMethods(settings.enabled_payment_methods);
      }
      setUpiVpa(settings.upi_vpa ?? "6388354988@okbizaxis");
      setUpiMerchantName(settings.upi_merchant_name ?? "Arun Gopal Traders");
      setUpiRegisteredPhone(settings.upi_registered_phone ?? "6388354988");
      setBankAccountHolder(settings.bank_account_holder ?? "");
      setBankName(settings.bank_name ?? "");
      setBankAccountNumber(settings.bank_account_number ?? "");
      setBankIfsc(settings.bank_ifsc ?? "");
      setQrCodeMode(settings.qr_code_mode ?? "dynamic");
      setQrCustomNote(settings.qr_custom_note ?? "Arun Gopal Traders Grocery Order");
      setRazorpayKeyId(settings.razorpay_key_id ?? "");
    }
  }, [settings]);

  function togglePaymentMethod(methodKey: string) {
    setEnabledPaymentMethods((prev) =>
      prev.includes(methodKey) ? prev.filter((m) => m !== methodKey) : [...prev, methodKey]
    );
  }

  function updateDayHour(
    dayKey: string,
    field: "open" | "close" | "closed",
    val: string | boolean,
  ) {
    setBusinessHours((prev) => ({
      ...prev,
      [dayKey]: {
        open: prev[dayKey]?.open ?? "07:00",
        close: prev[dayKey]?.close ?? "21:00",
        closed: false,
        ...prev[dayKey],
        [field]: val,
      },
    }));
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatePayload: Record<string, unknown> = {
        store_name: storeName.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        address: address.trim(),
        maps_link: mapsLink.trim(),
        announcement: announcement.trim() || null,
        announcement_hi: announcementHi.trim() || null,
        hero_title: heroTitle.trim() || null,
        hero_subtitle: heroSubtitle.trim() || null,
        hero_image_url: heroImageUrl.trim() || null,
        hero2_image_url: hero2ImageUrl.trim() || null,
        hero3_image_url: hero3ImageUrl.trim() || null,
        hero4_image_url: hero4ImageUrl.trim() || null,
        delivery_fee: Number(deliveryFee),
        delivery_enabled: Boolean(deliveryEnabled),
        free_delivery_threshold: Number(freeDeliveryThreshold),
        min_order_value: Number(minOrderValue),
        business_hours: businessHours,
        legal_name: legalName.trim() || "Arun Gopal Traders",
        gstin: gstin.trim() || null,
        state: state.trim() || "Uttar Pradesh",
        state_code: stateCode.trim() || "09",
        tax_enabled: Boolean(taxEnabled),
        default_tax_rate: Number(defaultTaxRate),
        invoice_prefix: invoicePrefix.trim() || "AGT-INV",
        invoice_footer_note: invoiceFooterNote.trim(),
        terms_and_conditions: termsAndConditions.trim(),
        online_payment_enabled: Boolean(onlinePaymentEnabled),
        enabled_payment_methods: enabledPaymentMethods,
        upi_vpa: upiVpa.trim() || "6388354988@okbizaxis",
        upi_merchant_name: upiMerchantName.trim() || "Arun Gopal Traders",
        upi_registered_phone: upiRegisteredPhone.trim() || "6388354988",
        bank_account_holder: bankAccountHolder.trim() || null,
        bank_name: bankName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_ifsc: bankIfsc.trim().toUpperCase() || null,
        qr_code_mode: qrCodeMode.trim() || "dynamic",
        qr_custom_note: qrCustomNote.trim() || "Arun Gopal Traders Grocery Order",
        razorpay_key_id: razorpayKeyId.trim() || null,
      };

      let { error } = await supabase
        .from("store_settings")
        .update(updatePayload as never)
        .eq("id", 1);

      // Graceful fallback if delivery_enabled or announcement_hi column is not yet created in Supabase
      if (error && (error.message?.includes("delivery_enabled") || error.message?.includes("announcement_hi"))) {
        if (error.message?.includes("delivery_enabled")) delete updatePayload["delivery_enabled"];
        if (error.message?.includes("announcement_hi")) delete updatePayload["announcement_hi"];
        const fallbackRes = await supabase
          .from("store_settings")
          .update(updatePayload as never)
          .eq("id", 1);
        error = fallbackRes.error;
        if (!error) {
          toast.info("Settings saved! Supabase SQL Editor me migration run karke new columns enable karein.");
        }
      }

      if (error) throw error;
      toast.success("Store settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      broadcastSettingsSync();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update store settings";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSaveSettings} className="w-full">
      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <TabsList className="!flex !flex-nowrap !items-center !justify-start gap-2 w-full !overflow-x-auto no-scrollbar !h-auto !bg-transparent !px-2 !py-2 !rounded-none !border-0 !shadow-none">
          <TabsTrigger value="profile" className="flex-shrink-0 h-auto px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] data-[state=active]:bg-[#145A45] data-[state=active]:text-white data-[state=active]:border-[#145A45]">
            <Store className="size-4" />
            <span>Store Profile</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex-shrink-0 h-auto px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] data-[state=active]:bg-[#145A45] data-[state=active]:text-white data-[state=active]:border-[#145A45]">
            <Truck className="size-4" />
            <span>Delivery</span>
          </TabsTrigger>
          <TabsTrigger value="homepage" className="flex-shrink-0 h-auto px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] data-[state=active]:bg-[#145A45] data-[state=active]:text-white data-[state=active]:border-[#145A45]">
            <Sparkles className="size-4" />
            <span>Homepage</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-shrink-0 h-auto px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] data-[state=active]:bg-[#145A45] data-[state=active]:text-white data-[state=active]:border-[#145A45]">
            <Smartphone className="size-4" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-shrink-0 h-auto px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] data-[state=active]:bg-[#145A45] data-[state=active]:text-white data-[state=active]:border-[#145A45]">
            <Receipt className="size-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Profile Tab */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                <Store className="size-5 text-[#145A45]" /> Store Identity &amp; Contact Details
              </h3>
              <p className="text-xs text-[#6B746F] mt-1">
                Displayed across the website header, footer, contact page, and receipt bills.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Store Name</Label>
                <Input
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Store Tagline / Slogan</Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Primary Phone Number</Label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">
                  WhatsApp Number (with country code, no +)
                </Label>
                <Input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1F2924]">Store Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1F2924]">Physical Store Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1F2924]">Google Maps URL / Location Link</Label>
                <Input
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9"
                />
              </div>
            </div>
          </div>

          {/* Business Hours Schedule */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                <Clock className="size-5 text-[#145A45]" /> Weekly Business Timings
              </h3>
              <p className="text-xs text-[#6B746F] mt-1">
                Store opening and closing times shown to customers on the Contact page.
              </p>
            </div>

            <div className="divide-y divide-[#E8E4DA] pt-1 text-xs">
              {DAYS.map(({ key, label }) => {
                const h = businessHours[key] ?? { open: "07:00", close: "21:00", closed: false };

                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 py-3">
                    <span className="w-24 font-bold text-[#1F2924]">{label}</span>

                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        disabled={h.closed}
                        value={h.open}
                        onChange={(e) => updateDayHour(key, "open", e.target.value)}
                        className="h-8 w-26 rounded-lg text-xs border-[#E8E4DA]"
                      />
                      <span className="text-[#6B746F]">to</span>
                      <Input
                        type="time"
                        disabled={h.closed}
                        value={h.close}
                        onChange={(e) => updateDayHour(key, "close", e.target.value)}
                        className="h-8 w-26 rounded-lg text-xs border-[#E8E4DA]"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1F2924]">
                      <Checkbox
                        checked={h.closed}
                        onCheckedChange={(c) => updateDayHour(key, "closed", Boolean(c))}
                      />
                      <span>Closed on this day</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4 sm:space-y-6">
          {/* Master Home Delivery Toggle Card */}
          <div className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all shadow-2xs ${
            deliveryEnabled
              ? "border-[#145A45]/30 bg-gradient-to-tr from-[#E6EFE8]/70 via-white to-white"
              : "border-amber-200 bg-gradient-to-tr from-amber-50/70 via-white to-white"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`grid size-12 place-items-center rounded-2xl shrink-0 transition-colors ${
                  deliveryEnabled ? "bg-[#145A45] text-white shadow-md shadow-[#145A45]/20" : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {deliveryEnabled ? <Truck className="size-6" /> : <Store className="size-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-sans text-base sm:text-lg font-bold text-[#16201A]">
                      Home Delivery Service (घर तक डिलीवरी सेवा)
                    </h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      deliveryEnabled
                        ? "bg-[#145A45] text-white"
                        : "bg-amber-600 text-white"
                    }`}>
                      {deliveryEnabled ? "चालू (ON)" : "बंद (OFF)"}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A655F] mt-1 leading-relaxed">
                    {deliveryEnabled
                      ? "सक्रिय: ग्राहक चेकआउट पर होम डिलीवरी या दुकान से पिकअप दोनों चुन सकते हैं।"
                      : "निष्क्रिय: होम डिलीवरी सेवा पूरे ऐप में बंद रहेगी। ग्राहक केवल दुकान पर आकर सामान ले सकेंगे (Store Pickup Only) और डिलीवरी चार्ज ₹0 रहेगा।"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <span className="text-xs font-bold text-[#16201A]">
                  {deliveryEnabled ? "Delivery Enabled" : "Pickup Only"}
                </span>
                <Switch
                  checked={deliveryEnabled}
                  onCheckedChange={setDeliveryEnabled}
                  className="data-[state=checked]:bg-[#145A45]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                <Truck className="size-5 text-[#145A45]" /> Delivery Charges &amp; Thresholds
              </h3>
              <p className="text-xs text-[#6B746F] mt-1">
                {deliveryEnabled
                  ? "Rules applied automatically at cart and checkout for Maharajganj deliveries."
                  : "नोट: वर्तमान में होम डिलीवरी बंद है, इसलिए यह शुल्क लागू नहीं होगा (स्टोर पिकअप हमेशा ₹0 रहेगा)।"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Standard Delivery Fee (₹)</Label>
                <Input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Free Delivery Above (₹)</Label>
                <Input
                  type="number"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Minimum Order Value (₹)</Label>
                <Input
                  type="number"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Homepage & Branding Tab */}
        <TabsContent value="homepage" className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                <Sparkles className="size-5 text-[#145A45]" /> Homepage Content &amp; Announcement Bar
              </h3>
              <p className="text-xs text-[#6B746F] mt-1">
                Custom banners and hero slogans displayed to customers.
              </p>
            </div>

            <div className="grid gap-3 pt-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924] flex items-center justify-between">
                    <span>Announcement Bar (English)</span>
                    <span className="text-[10px] text-[#5A655F]">English View</span>
                  </Label>
                  <Input
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="e.g. ⚡ 30-Min Express Delivery in Maharajganj • Free on ₹499+"
                    className="rounded-xl text-xs border-[#E8E4DA] h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924] flex items-center justify-between">
                    <span>Announcement Bar (हिन्दी)</span>
                    <span className="text-[10px] text-[#5A655F]">Hindi View</span>
                  </Label>
                  <Input
                    value={announcementHi}
                    onChange={(e) => setAnnouncementHi(e.target.value)}
                    placeholder="उदा. ⚡ महाराजगंज में 30 मिनट एक्सप्रेस डिलीवरी • ₹499+ पर फ्री डिलीवरी"
                    className="rounded-xl text-xs border-[#E8E4DA] h-9"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-[#0A3628] bg-gradient-to-r from-[#0F4A38] via-[#145A45] to-[#0F4A38] p-3 text-white shadow-2xs space-y-1.5">
                <p className="text-[10px] font-bold text-[#E3B341] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3" /> Live Header Preview (कस्टमर को ऐसा दिखेगा)
                </p>
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="rounded bg-white/20 px-1.5 py-0.2 text-[9px] font-bold shrink-0">EN</span>
                    <span className="truncate text-white/90">{announcement.trim() ? announcement : <em className="text-white/50">No announcement set</em>}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="rounded bg-white/20 px-1.5 py-0.2 text-[9px] font-bold shrink-0">HI</span>
                    <span className="truncate text-white/90">{announcementHi.trim() ? announcementHi : <em className="text-white/50">कोई घोषणा सेट नहीं है</em>}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">Hero Heading</Label>
                  <Input
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">Hero Subtitle</Label>
                  <Input
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#1F2924]">Hero Banner Image (1920×1080 / 16:9)</Label>
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-[#145A45]/20 bg-[#E6EFE8] hover:bg-[#D4E8DC] px-4 py-2 text-xs font-bold text-[#145A45] transition-all">
                    <Upload className="size-3.5" />
                    <span>{heroImageUrl ? "Change Image" : "Upload from Device"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          toast.loading("Uploading hero banner...", { id: "hero-upload" });
                          const { dataUrl, blob } = await compressAndOptimizeImage(file, 1920, 1080, 0.9);
                          
                          const fileName = `hero_banner_${Date.now()}.webp`;
                          const filePath = `hero/${fileName}`;
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from("product-images")
                            .upload(filePath, blob, {
                              cacheControl: "31536000",
                              upsert: true,
                              contentType: blob.type || "image/webp",
                            });
                          
                          if (!uploadError && uploadData) {
                            const { data: pubData } = supabase.storage
                              .from("product-images")
                              .getPublicUrl(filePath);
                            if (pubData?.publicUrl) {
                              setHeroImageUrl(pubData.publicUrl);
                              await saveHeroImageToDb(pubData.publicUrl);
                              toast.success("Hero banner uploaded & saved!", { id: "hero-upload" });
                              return;
                            }
                          }
                          
                          setHeroImageUrl(dataUrl);
                          await saveHeroImageToDb(dataUrl);
                          toast.success("Hero banner saved!", { id: "hero-upload" });
                        } catch {
                          toast.error("Failed to upload image", { id: "hero-upload" });
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  
                  <span className="text-[10px] text-[#6B746F]">or</span>
                  
                  <div className="flex-1">
                    <Input
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      placeholder="Paste image URL here..."
                      className="rounded-xl border-[#E8E4DA] text-xs h-9"
                    />
                  </div>
                  
                  {heroImageUrl && (
                    <button
                      type="button"
                      onClick={async () => { setHeroImageUrl(""); await saveHeroImageToDb(null); toast.success("Hero banner removed!"); }}
                      className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 p-2 text-red-500 transition-all"
                      title="Remove image"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                
                <p className="text-[10px] text-[#6B746F]">
                  Upload from your phone/computer or paste a direct image URL. Recommended: 1920×1080px (16:9).
                </p>
                
                {heroImageUrl ? (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[#E8E4DA] shadow-xs relative">
                    <img
                      src={heroImageUrl}
                      alt="Hero banner preview"
                      className="w-full aspect-video object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border-2 border-dashed border-[#E8E4DA] bg-[#FAF8F2] flex flex-col items-center justify-center py-8 gap-2">
                    <ImageIcon className="size-8 text-[#C5BEA8]" />
                    <p className="text-xs text-[#9B9585] font-medium">No hero banner image set</p>
                    <p className="text-[10px] text-[#C5BEA8]">Upload or paste a URL above</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Hero Banners (between category sections) */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                <ImageIcon className="size-5 text-[#145A45]" /> Category Section Banners
              </h3>
              <p className="text-xs text-[#6B746F] mt-1">
                These banners appear between category groups on the homepage. They are slightly shorter than the main hero (21:9 ultra-wide). Recommended: 1920×823px. Leave empty to hide.
              </p>
            </div>

            <div className="space-y-3">
              <HeroImageUploader
                label="Banner 1 (After Food & Essentials)"
                description="Shown below खाने-पीने का सामान category"
                fieldKey="hero2"
                value={hero2ImageUrl}
                onChange={setHero2ImageUrl}
                onSave={(url) => saveHeroImageFieldToDb("hero2_image_url", url)}
                onRefresh={onRefresh}
              />
              <HeroImageUploader
                label="Banner 2 (After Household & Cleaning)"
                description="Shown below घर की सफ़ाई व बर्तन category"
                fieldKey="hero3"
                value={hero3ImageUrl}
                onChange={setHero3ImageUrl}
                onSave={(url) => saveHeroImageFieldToDb("hero3_image_url", url)}
                onRefresh={onRefresh}
              />
              <HeroImageUploader
                label="Banner 3 (After Personal Care & Beauty)"
                description="Shown below पर्सनल केयर व ब्यूटी category"
                fieldKey="hero4"
                value={hero4ImageUrl}
                onChange={setHero4ImageUrl}
                onSave={(url) => saveHeroImageFieldToDb("hero4_image_url", url)}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4 sm:space-y-6">
          {/* Payment Methods */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                  <Smartphone className="size-5 text-[#145A45]" /> Payment Gateway &amp; Receiving Accounts
                </h3>
                <p className="text-xs text-[#6B746F] mt-1">
                  Control your UPI receiving ID, dynamic QR code, merchant name, bank account, and active payment methods without touching any code.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#1F2924] bg-[#FAF8F2] border border-[#E8E4DA] px-3 py-1.5 rounded-xl">
                  <Checkbox
                    checked={onlinePaymentEnabled}
                    onCheckedChange={(c) => setOnlinePaymentEnabled(Boolean(c))}
                  />
                  <span>Online Payments Enabled</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1F2924] uppercase tracking-wider">
                Customer Checkout Payment Methods
              </Label>
              <p className="text-[11px] text-[#6B746F]">
                Uncheck any method to instantly remove it from the customer checkout screen.
              </p>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    enabledPaymentMethods.includes("upi")
                      ? "border-[#145A45] bg-[#E6EFE8]/50 text-[#145A45]"
                      : "border-[#E8E4DA] bg-[#FAF8F2]/50 text-[#6B746F]"
                  }`}
                >
                  <Checkbox
                    checked={enabledPaymentMethods.includes("upi")}
                    onCheckedChange={() => togglePaymentMethod("upi")}
                  />
                  <Smartphone className="size-4" />
                  <span>Direct UPI (GPay/PhonePe)</span>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    enabledPaymentMethods.includes("card")
                      ? "border-[#145A45] bg-[#E6EFE8]/50 text-[#145A45]"
                      : "border-[#E8E4DA] bg-[#FAF8F2]/50 text-[#6B746F]"
                  }`}
                >
                  <Checkbox
                    checked={enabledPaymentMethods.includes("card")}
                    onCheckedChange={() => togglePaymentMethod("card")}
                  />
                  <CreditCard className="size-4" />
                  <span>Credit / Debit Card</span>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    enabledPaymentMethods.includes("qr")
                      ? "border-[#145A45] bg-[#E6EFE8]/50 text-[#145A45]"
                      : "border-[#E8E4DA] bg-[#FAF8F2]/50 text-[#6B746F]"
                  }`}
                >
                  <Checkbox
                    checked={enabledPaymentMethods.includes("qr")}
                    onCheckedChange={() => togglePaymentMethod("qr")}
                  />
                  <QrCode className="size-4" />
                  <span>Dynamic UPI QR Code</span>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    enabledPaymentMethods.includes("cod")
                      ? "border-[#145A45] bg-[#E6EFE8]/50 text-[#145A45]"
                      : "border-[#E8E4DA] bg-[#FAF8F2]/50 text-[#6B746F]"
                  }`}
                >
                  <Checkbox
                    checked={enabledPaymentMethods.includes("cod")}
                    onCheckedChange={() => togglePaymentMethod("cod")}
                  />
                  <Banknote className="size-4" />
                  <span>Cash on Delivery (COD)</span>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                    enabledPaymentMethods.includes("pay_at_store")
                      ? "border-[#145A45] bg-[#E6EFE8]/50 text-[#145A45]"
                      : "border-[#E8E4DA] bg-[#FAF8F2]/50 text-[#6B746F]"
                  }`}
                >
                  <Checkbox
                    checked={enabledPaymentMethods.includes("pay_at_store")}
                    onCheckedChange={() => togglePaymentMethod("pay_at_store")}
                  />
                  <Store className="size-4" />
                  <span>Pay at Store (Pickup)</span>
                </label>
              </div>
            </div>
          </div>

          {/* UPI Details + Live QR Test */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-3">
              <h4 className="font-bold text-xs text-[#1F2924] flex items-center gap-1.5">
                <QrCode className="size-4 text-[#145A45]" /> UPI Receiving Details (Direct Customer Settlements)
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">
                    UPI ID / VPA <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. 6388354988@okbizaxis"
                    className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9 bg-white"
                  />
                  <span className="text-[10px] text-[#6B746F]">
                    Where money is instantly deposited when customer scans or pays.
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">
                    Merchant / Payee Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={upiMerchantName}
                    onChange={(e) => setUpiMerchantName(e.target.value)}
                    placeholder="e.g. Arun Gopal Traders"
                    className="rounded-xl text-xs border-[#E8E4DA] h-9 bg-white"
                  />
                  <span className="text-[10px] text-[#6B746F]">
                    Business name shown inside Google Pay / PhonePe apps.
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">
                    Registered UPI Mobile No.
                  </Label>
                  <Input
                    value={upiRegisteredPhone}
                    onChange={(e) => setUpiRegisteredPhone(e.target.value)}
                    placeholder="e.g. 6388354988"
                    className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">
                    Razorpay Public Key ID (Frontend SDK)
                  </Label>
                  <Input
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_live_... or rzp_test_..."
                    className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9 bg-white"
                  />
                  <span className="text-[10px] text-[#6B746F]">
                    Public client key. Private secret keys remain server-side only.
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-xs font-semibold text-[#1F2924]">
                  QR Payment Transaction Note
                </Label>
                <Input
                  value={qrCustomNote}
                  onChange={(e) => setQrCustomNote(e.target.value)}
                  placeholder="e.g. Arun Gopal Traders Grocery Order"
                  className="rounded-xl text-xs border-[#E8E4DA] h-9 bg-white"
                />
              </div>
            </div>

            {/* Live Test QR Box */}
            <div className="lg:col-span-2 rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2] p-4 text-center space-y-2.5 flex flex-col items-center justify-center">
              <span className="rounded-full bg-[#145A45]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#145A45]">
                Live Dynamic QR Test
              </span>
              <div className="relative rounded-xl bg-white p-2 border border-[#E8E4DA] shadow-xs">
                <img
                  src={generateQrCodeUrl(
                    generateUpiUri({
                      vpa: upiVpa || "6388354988@okbizaxis",
                      payeeName: upiMerchantName || "Arun Gopal Traders",
                      amount: 100,
                      orderNo: "TEST-LIVE",
                      note: qrCustomNote || "Test payment to Arun Gopal Traders",
                    }),
                    130
                  )}
                  alt="Live UPI QR Preview"
                  className="size-32 rounded-lg object-contain"
                />
              </div>
              <div className="text-left w-full space-y-0.5">
                <p className="font-mono text-[11px] font-bold text-[#1F2924] truncate text-center">
                  {upiVpa || "6388354988@okbizaxis"}
                </p>
                <p className="text-[10px] text-[#6B746F] text-center">
                  Scan with PhonePe/GPay to test your UPI VPA
                </p>
              </div>
            </div>
          </div>

          {/* Bank Account Details Card (Protected) */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-[#1F2924] flex items-center gap-1.5">
                <Landmark className="size-4 text-[#145A45]" /> Bank Account Details (NEFT / RTGS / Settlement Records)
              </h4>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#145A45] bg-[#E6EFE8] px-2 py-0.5 rounded-full">
                <Lock className="size-3" /> Admin Protected
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Account Holder Name</Label>
                <Input
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="e.g. Arun Gopal Traders"
                  className="rounded-xl text-xs border-[#E8E4DA] h-9 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Bank Name</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="rounded-xl text-xs border-[#E8E4DA] h-9 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Account Number</Label>
                <Input
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">IFSC Code</Label>
                <Input
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9 bg-white uppercase"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#6B746F]">
              🛡️ <strong>Security Assurance:</strong> Bank account numbers are stored securely for accounting and invoice verification and are never exposed in public customer storefront scripts.
            </p>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
                <Receipt className="size-5 text-[#145A45]" /> Billing, Tax (GST) &amp; Invoice Settings
              </h3>
              <p className="text-xs text-[#6B746F] mt-1">
                Configure legal business details, GSTIN, tax calculations, invoice prefix, and return policies.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Business Legal Name</Label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Arun Gopal Traders"
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">
                  GSTIN (Optional / वैकल्पिक)
                </Label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 09ABCDE1234F1Z5"
                  className="rounded-xl border-[#E8E4DA] text-xs font-mono uppercase h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Store State</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Uttar Pradesh"
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">State Code (e.g. 09 for UP)</Label>
                <Input
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="09"
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Invoice Number Prefix</Label>
                <Input
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  placeholder="AGT-INV"
                  className="rounded-xl border-[#E8E4DA] text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Default Tax Rate (% if enabled)</Label>
                <Input
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-3.5 flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="tax-enable-toggle" className="font-bold text-xs text-[#1F2924] cursor-pointer">
                  Enable GST Tax Calculations on Invoices
                </Label>
                <p className="text-[11px] text-[#5A655F]">
                  When disabled, invoices act as authorized Retail Cash Memos. When enabled, invoices calculate CGST/SGST/IGST breakdown.
                </p>
              </div>
              <Checkbox
                id="tax-enable-toggle"
                checked={taxEnabled}
                onCheckedChange={(c) => setTaxEnabled(Boolean(c))}
                className="size-5"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">Invoice Footer Note (धन्यवाद संदेश)</Label>
              <Input
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
                className="rounded-xl border-[#E8E4DA] text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">Terms &amp; Return Policy (बिल की शर्तें)</Label>
              <Textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="rounded-xl border-[#E8E4DA] text-xs bg-white"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2 pb-6">
        <Button
          type="submit"
          disabled={isSaving}
          size="lg"
          className="w-full sm:w-auto rounded-2xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] shadow-md px-8 h-11 text-xs sm:text-sm"
        >
          <Save className="mr-2 size-4" />{" "}
          {isSaving ? "Saving Settings…" : "Save All Store Settings"}
        </Button>
      </div>
    </form>
  );
}
