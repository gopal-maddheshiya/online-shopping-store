import { useState, useEffect } from "react";
import { Save, Store, Clock, Phone, MapPin, Truck, Sparkles, RefreshCw, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { broadcastSettingsSync } from "@/lib/realtime-sync";
import type { StoreSettings } from "@/lib/queries";

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
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(30);
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

  // Business Hours Map
  const [businessHours, setBusinessHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >({});

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name ?? "Arun Gopal Traders");
      setTagline(settings.tagline ?? "Your Trusted Local Grocery Store");
      setPhone(settings.phone ?? "+916388354988");
      setWhatsapp(settings.whatsapp ?? "916388354988");
      setEmail(settings.email ?? "gopalmaddheshiya138@gmail.com");
      setAddress(settings.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh");
      setMapsLink(settings.maps_link ?? "");
      setAnnouncement(
        settings.announcement ?? "Free home delivery in Maharajganj on orders above ₹499",
      );
      setHeroTitle(settings.hero_title ?? "Arun Gopal Traders");
      setHeroSubtitle(
        settings.hero_subtitle ?? "Quality products • Genuine prices • Easy ordering",
      );
      setDeliveryFee(Number(settings.delivery_fee ?? 30));
      setFreeDeliveryThreshold(Number(settings.free_delivery_threshold ?? 499));
      setMinOrderValue(Number(settings.min_order_value ?? 99));
      setBusinessHours(settings.business_hours ?? {});

      // Billing settings
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
    }
  }, [settings]);

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
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: storeName.trim(),
          tagline: tagline.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          address: address.trim(),
          maps_link: mapsLink.trim(),
          announcement: announcement.trim() || null,
          hero_title: heroTitle.trim() || null,
          hero_subtitle: heroSubtitle.trim() || null,
          delivery_fee: Number(deliveryFee),
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
        })
        .eq("id", 1);

      if (error) throw error;
      toast.success("Store settings & billing configurations updated successfully!");
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
    <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-6 max-w-4xl">
      {/* Basic Store Information */}
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

      {/* Delivery & Pricing Rules */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
            <Truck className="size-5 text-[#145A45]" /> Delivery Charges &amp; Thresholds
          </h3>
          <p className="text-xs text-[#6B746F] mt-1">
            Rules applied automatically at cart and checkout for Maharajganj deliveries.
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

      {/* Homepage & Announcement Banner */}
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
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#1F2924]">Top Announcement Bar Text</Label>
            <Input
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="rounded-xl text-xs border-[#E8E4DA] h-9"
            />
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
        </div>
      </div>

      {/* Billing, GST & Invoice Configuration */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E8E4DA] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="flex items-center gap-2 font-sans text-base sm:text-lg font-bold text-[#1F2924]">
            <Receipt className="size-5 text-[#145A45]" /> Billing, Tax (GST) &amp; Invoice Settings
          </h3>
          <p className="text-xs text-[#6B746F] mt-1">
            Configure legal business details, GSTIN, tax calculations, invoice prefix, and return policies.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 pt-1">
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

        {/* GST / Tax Enable Checkbox */}
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

