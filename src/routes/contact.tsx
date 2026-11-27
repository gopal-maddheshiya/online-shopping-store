import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, MessageCircle, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, isOpenNow } from "@/lib/queries";
import { telHref, waHref } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/site-config";
import { getBreadcrumbSchema, getStoreSchema, LOCAL_GEO_META, PUBLIC_ROBOTS_META } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => ({
    links: [
      { rel: "canonical", href: `${SITE_URL}/contact` },
    ],
    meta: [
      { title: "संपर्क करें एवं दुकान का पता | Arun Gopal Traders Maharajganj" },
      {
        name: "description",
        content:
          "किराना सामान डिलीवरी, आर्डर या दुकान पिकअप सहायता के लिए +91 6388354988 पर कॉल करें या रामनगर चौराहा, अड्डा बाजार रोड, महराजगंज स्थित दुकान पर आएं।",
      },
      ...PUBLIC_ROBOTS_META,
      ...LOCAL_GEO_META,
      { property: "og:site_name", content: "अरुण गोपाल ट्रेडर्स — Arun Gopal Traders" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/contact` },
      { property: "og:title", content: "संपर्क करें एवं दुकान का पता | Arun Gopal Traders" },
      {
        property: "og:description",
        content: "कॉल करें या WhatsApp पर तुरंत सहायता प्राप्त करें। रामनगर चौराहा, महराजगंज।",
      },
      {
        property: "og:image",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "संपर्क करें एवं दुकान का पता | Arun Gopal Traders" },
      {
        name: "twitter:description",
        content: "कॉल करें या WhatsApp पर तुरंत सहायता प्राप्त करें। रामनगर चौराहा, महराजगंज।",
      },
      {
        name: "twitter:image",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ContactPage",
              "@id": `${SITE_URL}/contact#webpage`,
              url: `${SITE_URL}/contact`,
              name: "Contact Arun Gopal Traders Maharajganj",
              description: "Customer service, store phone, WhatsApp ordering, and location in Ramnagar Chauraha, Maharajganj.",
            },
            getStoreSchema(null),
            getBreadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Contact", url: "/contact" },
            ]),
          ],
        }),
      },
    ],
  }),
  component: ContactPage,
});

const DAYS = [
  { key: "mon", labelEn: "Monday", labelHi: "सोमवार" },
  { key: "tue", labelEn: "Tuesday", labelHi: "मंगलवार" },
  { key: "wed", labelEn: "Wednesday", labelHi: "बुधवार" },
  { key: "thu", labelEn: "Thursday", labelHi: "गुरुवार" },
  { key: "fri", labelEn: "Friday", labelHi: "शुक्रवार" },
  { key: "sat", labelEn: "Saturday", labelHi: "शनिवार" },
  { key: "sun", labelEn: "Sunday", labelHi: "रविवार" },
];

function ContactPage() {
  const { t, lang, formatStatus } = useLanguage();
  const { profile } = useAuth();
  const { data: s } = useQuery(settingsQuery);
  const status = isOpenNow(s);

  const phone = s?.phone ?? "+91 6388354988";
  const cleanPhone = phone.replace(/\s+/g, "");
  const whatsapp = s?.whatsapp ?? "916388354988";
  const email = s?.email ?? "gopalmaddheshiya138@gmail.com";
  const address = lang === "hi" ? t.storeAddress : (s?.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh");

  // Help Request Form
  const [name, setName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [topic, setTopic] = useState("Order Inquiry");
  const [message, setMessage] = useState("");
  const [formErrorCode, setFormErrorCode] = useState<"missing_name" | "invalid_phone" | "missing_msg" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setName((prev) => prev || profile.full_name || "");
    }
    const profileDigits = (profile?.phone || "").replace(/\D/g, "").slice(-10);
    if (profileDigits.length === 10) {
      setCustomerPhone((prev) => prev || profileDigits);
    } else if (typeof window !== "undefined") {
      const savedPhone = (localStorage.getItem("agt.last_phone") || "").replace(/\D/g, "").slice(-10);
      if (savedPhone.length === 10) {
        setCustomerPhone((prev) => prev || savedPhone);
      }
    }
  }, [profile?.full_name, profile?.phone]);

  const formErrorMsg =
    formErrorCode === "missing_name"
      ? lang === "hi"
        ? "कृपया अपना पूरा नाम लिखें।"
        : "Please enter your name."
      : formErrorCode === "invalid_phone"
        ? lang === "hi"
          ? "कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile number."
        : formErrorCode === "missing_msg"
          ? lang === "hi"
            ? "कृपया अपना संदेश या सामान का विवरण लिखें।"
            : "Please enter your message or item details."
          : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrorCode(null);

    if (!name.trim()) {
      setFormErrorCode("missing_name");
      document.getElementById("contact-name")?.focus();
      return;
    }

    const digits = customerPhone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setFormErrorCode("invalid_phone");
      document.getElementById("contact-phone")?.focus();
      return;
    }

    if (!message.trim()) {
      setFormErrorCode("missing_msg");
      document.getElementById("contact-message")?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("help_requests").insert({
        name: name.trim(),
        phone: digits,
        problem_type: topic,
        message: message.trim(),
      });

      if (error) throw error;
      setIsSuccess(true);
      toast.success(
        lang === "hi"
          ? "सहायता अनुरोध भेज दिया गया है! हमारी दुकान टीम जल्द कॉल करेगी।"
          : "Help request submitted! Our store team will call you shortly."
      );
      setName("");
      setCustomerPhone("");
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === "hi" ? "अनुरोध भेजने में समस्या आई" : "Failed to submit request");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="container-page py-6 sm:py-12 pb-28 lg:pb-12 space-y-10 sm:space-y-12">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[#1F2A24]">
          {t.weAreHereToHelp}
        </h1>
        <p className="text-xs sm:text-sm text-[#66746C]">
          {lang === "hi"
            ? "सामान खोजने या ऑर्डर करने में कोई समस्या? हमारी रामनगर दुकान टीम से सीधे बात करें।"
            : "Having trouble finding a product or placing an order? Talk to our Ramnagar store team directly."}
        </p>
      </div>

      {/* 4 Clean Contact Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Call Us */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[rgba(20,90,69,0.12)] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-[#FAF8F2] to-[#F1EFEA] text-[#145A45] border border-[rgba(20,90,69,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <Phone className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#1F2A24]">
              {lang === "hi" ? "फोन पर बात करें" : "Talk on Phone"}
            </h3>
            <p className="text-xs text-[#66746C]">{phone}</p>
          </div>
          <Button
            asChild
            className="mt-6 rounded-lg bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] text-xs font-bold text-white shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-[#0F4A38] hover:to-[#07271D] cursor-pointer"
          >
            <a href={telHref(cleanPhone)}>{t.callNow}</a>
          </Button>
        </div>

        {/* Card 2: WhatsApp */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[rgba(20,90,69,0.12)] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-[#FAF8F2] to-[#F1EFEA] text-[#145A45] border border-[rgba(20,90,69,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <MessageCircle className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#1F2A24]">
              {t.orderOnWhatsapp}
            </h3>
            <p className="text-xs text-[#66746C]">
              {lang === "hi" ? "किराना सामान की लिस्ट भेजें" : "Send your kirana list"}
            </p>
          </div>
          <Button
            asChild
            className="mt-6 rounded-lg bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] text-xs font-bold text-white shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-[#0F4A38] hover:to-[#07271D] cursor-pointer"
          >
            <a
              href={waHref(
                whatsapp,
                lang === "hi"
                  ? `नमस्ते ${t.storeName}, मुझे किराने के सामान के बारे में जानकारी चाहिए।`
                  : `Namaste ${t.storeName}, I want to inquire about groceries.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              {lang === "hi" ? "व्हाट्सएप पर चैट करें" : "Chat on WhatsApp"}
            </a>
          </Button>
        </div>

        {/* Card 3: Email */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[rgba(20,90,69,0.12)] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-[#FAF8F2] to-[#F1EFEA] text-[#145A45] border border-[rgba(20,90,69,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <Mail className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#1F2A24]">
              {lang === "hi" ? "ईमेल" : "Email"}
            </h3>
            <p className="text-xs text-[#66746C] truncate">{email}</p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-6 rounded-lg border-[rgba(20,90,69,0.12)] bg-white text-[#0E3F31] text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-[#FBF7EF] cursor-pointer"
          >
            <a href={`mailto:${email}`}>
              {lang === "hi" ? "ईमेल भेजें" : "Email Us"}
            </a>
          </Button>
        </div>

        {/* Card 4: Store Location */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[rgba(20,90,69,0.12)] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-[#FAF8F2] to-[#F1EFEA] text-[#145A45] border border-[rgba(20,90,69,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
              <MapPin className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#1F2A24]">
              {lang === "hi" ? "दुकान पर आएं" : "Visit Store"}
            </h3>
            <p className="text-xs text-[#66746C] line-clamp-2">
              {t.storeAddressShort}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-6 rounded-lg border-[rgba(20,90,69,0.12)] bg-white text-[#0E3F31] text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-[#FBF7EF] cursor-pointer"
          >
            <a
              href={
                s?.maps_link ??
                "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
              }
              target="_blank"
              rel="noreferrer"
            >
              {lang === "hi" ? "रास्ता देखें (मैप्स)" : "Get Directions"}
            </a>
          </Button>
        </div>
      </div>

      {/* Main Support Grid: Help Ticket + Business Hours */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* Help Form */}
        <div className="card-base p-6 sm:p-8 bg-white border border-[rgba(20,90,69,0.12)] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
          <h2 className="font-sans text-xl font-bold text-[#1F2A24]">
            {lang === "hi" ? "हमें संदेश भेजें" : "Send us a message"}
          </h2>
          <p className="mt-1 text-xs text-[#66746C]">
            {lang === "hi"
              ? "कोई सामान वेबसाइट पर नहीं मिल रहा? अपनी लिस्ट या सवाल भेजें, हम व्यवस्था कर देंगे।"
              : "Need a product not listed on the website? Submit your request and we will arrange it."}
          </p>

          {isSuccess ? (
            <div className="mt-6 rounded-xl bg-[#E8F1EC] p-6 text-center border border-[#145A45]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <CheckCircle2 className="mx-auto size-8 text-[#145A45]" />
              <h3 className="mt-2 font-bold text-[#0E3F31]">
                {lang === "hi" ? "संदेश प्राप्त हुआ!" : "Message Received!"}
              </h3>
              <p className="mt-1 text-xs text-[#66746C]">
                {lang === "hi"
                  ? "हम जल्द ही आपके दिए गए मोबाइल नंबर पर कॉल करेंगे।"
                  : "We'll call you at your provided phone number shortly."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuccess(false)}
                className="mt-4 rounded-lg text-xs border-[#145A45] text-[#0E3F31] bg-white cursor-pointer"
              >
                {lang === "hi" ? "एक और संदेश भेजें" : "Send another message"}
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
              {formErrorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700"
                >
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{formErrorMsg}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-semibold text-[#1F2A24]">
                    {t.name}
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder={lang === "hi" ? "जैसे: रमेश कुमार" : "e.g. Ramesh Kumar"}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrorCode === "missing_name") setFormErrorCode(null);
                    }}
                    className="rounded-lg text-xs border-[rgba(20,90,69,0.12)] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-phone" className="text-xs font-semibold text-[#1F2A24]">
                    {lang === "hi" ? "10 अंकों का मोबाइल नंबर" : "10-Digit Mobile Number"}
                  </Label>
                  <Input
                    id="contact-phone"
                    name="phone"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    type="tel"
                    placeholder={lang === "hi" ? "10 अंकों का नंबर (जैसे 9876543210)" : "10-digit number (e.g. 9876543210)"}
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (formErrorCode === "invalid_phone") setFormErrorCode(null);
                    }}
                    className="rounded-lg text-xs border-[rgba(20,90,69,0.12)] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-topic" className="text-xs font-semibold text-[#1F2A24]">
                  {lang === "hi" ? "विषय / पूछताछ का प्रकार" : "Topic / Inquiry Type"}
                </Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger
                    id="contact-topic"
                    className="rounded-lg text-xs border-[rgba(20,90,69,0.12)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Order Inquiry">
                      {lang === "hi" ? "ऑर्डर से जुड़ी पूछताछ / सहायता" : "Order Inquiry / Help"}
                    </SelectItem>
                    <SelectItem value="Product Request">
                      {lang === "hi" ? "वेबसाइट पर न मिलने वाला सामान मंगवाएं" : "Request unlisted grocery item"}
                    </SelectItem>
                    <SelectItem value="Delivery Question">
                      {lang === "hi" ? "डिलीवरी क्षेत्र व समय की जानकारी" : "Delivery Area & Timings"}
                    </SelectItem>
                    <SelectItem value="Store Pickup">
                      {lang === "hi" ? "दुकान से पिकअप की जानकारी" : "Store Pickup Confirmation"}
                    </SelectItem>
                    <SelectItem value="Other">
                      {lang === "hi" ? "अन्य सुझाव / शिकायत" : "Other Feedback"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-message" className="text-xs font-semibold text-[#1F2A24]">
                  {t.message}
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  placeholder={
                    lang === "hi"
                      ? "अपनी जरूरत का विवरण या सामान की सूची लिखें..."
                      : "Describe your requirement or list items you need..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-lg text-xs border-[rgba(20,90,69,0.12)] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] py-3.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-[#0F4A38] hover:to-[#07271D] cursor-pointer"
              >
                <Send className="mr-2 size-4" />
                {isSubmitting ? (lang === "hi" ? "भेजा जा रहा है..." : "Sending...") : t.submitInquiry}
              </Button>
            </form>
          )}
        </div>

        {/* Store Timings & Address */}
        <div className="card-base p-6 sm:p-8 space-y-6 bg-white border border-[rgba(20,90,69,0.12)] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0E3F31]">
              {lang === "hi" ? "दुकान समय-सारणी" : "Store Schedule"}
            </span>
            <h2 className="font-sans text-xl font-bold text-[#1F2A24] mt-0.5">
              {lang === "hi" ? "साप्ताहिक दुकान खुलने का समय" : "Weekly Business Hours"}
            </h2>
            <p className="mt-1 text-xs text-[#66746C]">
              {lang === "hi" ? "वर्तमान स्थिति:" : "Current status:"}{" "}
              <strong className="text-[#0E3F31]">
                {formatStatus(status) || (lang === "hi" ? "प्रतिदिन खुली है" : "Open Daily")}
              </strong>
            </p>
          </div>

          <div className="divide-y divide-[#E4DFD5] text-xs">
            {DAYS.map(({ key, labelEn, labelHi }) => {
              const h = s?.business_hours?.[key] ?? {
                open: "07:00",
                close: "21:00",
                closed: false,
              };
              return (
                <div key={key} className="flex items-center justify-between py-2.5">
                  <span className="font-medium text-[#1F2A24]">{lang === "hi" ? labelHi : labelEn}</span>
                  <span className="text-[#66746C]">
                    {h.closed ? (
                      <span className="text-red-600 font-semibold">{lang === "hi" ? "बंद" : "Closed"}</span>
                    ) : (
                      `${h.open} – ${h.close}`
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[rgba(20,90,69,0.12)] pt-4 text-xs text-[#66746C] space-y-3">
            <div>
              <p className="font-bold text-[#1F2A24]">📍 {t.storeName}</p>
              <p className="mt-0.5">{address}</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Arun Gopal Traders, Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] text-white px-4 py-2.5 text-xs font-bold shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-[#0F4A38] hover:to-[#07271D] transition-all active:scale-95 cursor-pointer"
            >
              <MapPin className="size-3.5" />
              <span>{lang === "hi" ? "गूगल मैप्स पर दुकान का रास्ता देखें" : "Get Directions on Google Maps"}</span>
            </a>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
