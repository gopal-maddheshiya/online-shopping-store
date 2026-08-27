import { useState, useEffect } from "react";
import { Save, Store, Clock, Phone, MapPin, Truck, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
        })
        .eq("id", 1);

      if (error) throw error;
      toast.success("Store settings & timings updated successfully!");
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update store settings";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSaveSettings} className="space-y-8 max-w-4xl">
      {/* Basic Store Information */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Store className="size-5 text-primary" /> Store Identity &amp; Contact Details
        </h3>
        <p className="text-xs text-muted-foreground">
          These details are displayed in the header, footer, contact page, and receipt bills across
          the website.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Store Name</Label>
            <Input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Store Tagline / Slogan</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Primary Contact Phone Number</Label>
            <Input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              WhatsApp Number (with country code, no +)
            </Label>
            <Input
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">Store Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">Physical Store Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">Google Maps URL / Location Link</Label>
            <Input
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Delivery & Pricing Rules */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Truck className="size-5 text-primary" /> Delivery Charges &amp; Thresholds
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Standard Delivery Fee (₹)</Label>
            <Input
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Free Delivery Above (₹)</Label>
            <Input
              type="number"
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Minimum Order Value (₹)</Label>
            <Input
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(Number(e.target.value))}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Homepage & Announcement Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Sparkles className="size-5 text-primary" /> Homepage Content &amp; Announcement Bar
        </h3>

        <div className="grid gap-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Top Announcement Bar Text</Label>
            <Input
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hero Heading</Label>
              <Input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hero Subtitle</Label>
              <Input
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours Schedule */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Clock className="size-5 text-primary" /> Weekly Business Timings
        </h3>
        <p className="text-xs text-muted-foreground">
          Configure store opening and closing times for each day of the week.
        </p>

        <div className="divide-y divide-border pt-2 text-xs">
          {DAYS.map(({ key, label }) => {
            const h = businessHours[key] ?? { open: "07:00", close: "21:00", closed: false };

            return (
              <div key={key} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <span className="w-24 font-bold text-foreground">{label}</span>

                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    disabled={h.closed}
                    value={h.open}
                    onChange={(e) => updateDayHour(key, "open", e.target.value)}
                    className="h-8 w-28 rounded-lg text-xs"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    disabled={h.closed}
                    value={h.close}
                    onChange={(e) => updateDayHour(key, "close", e.target.value)}
                    className="h-8 w-28 rounded-lg text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <Checkbox
                    checked={h.closed}
                    onCheckedChange={(c) => updateDayHour(key, "closed", Boolean(c))}
                  />
                  <span>Closed</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          size="lg"
          className="rounded-2xl font-bold shadow-md px-8"
        >
          <Save className="mr-2 size-4" />{" "}
          {isSaving ? "Saving Settings…" : "Save All Store Settings"}
        </Button>
      </div>
    </form>
  );
}
