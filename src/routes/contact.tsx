import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, MessageCircle, Clock, Send, CheckCircle2, Store } from "lucide-react";
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

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Contact" },
      {
        name: "description",
        content:
          "Need help with grocery delivery, product inquiries, or store pickup? Call +91 6388354988 or visit Arun Gopal Traders at Ramnagar, Adda Bazar Road, Maharajganj.",
      },
      { property: "og:title", content: "Arun Gopal Traders | Contact" },
      {
        property: "og:description",
        content: "Call +91 6388354988 or message on WhatsApp for instant local kirana assistance.",
      },
    ],
  }),
  component: ContactPage,
});

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function ContactPage() {
  const { data: s } = useQuery(settingsQuery);
  const status = isOpenNow(s);

  const phone = s?.phone ?? "+91 6388354988";
  const cleanPhone = phone.replace(/\s+/g, "");
  const whatsapp = s?.whatsapp ?? "916388354988";
  const email = s?.email ?? "gopalmaddheshiya138@gmail.com";
  const address = s?.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh";

  // Help Request Form
  const [name, setName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [topic, setTopic] = useState("Order Inquiry");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !customerPhone.trim() || !message.trim()) {
      toast.error("Please fill your name, phone number, and message");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("help_requests").insert({
        name: name.trim(),
        phone: customerPhone.trim(),
        problem_type: topic,
        message: message.trim(),
      });

      if (error) throw error;
      setIsSuccess(true);
      toast.success("Help request submitted! Our store team will call you shortly.");
      setName("");
      setCustomerPhone("");
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container-page py-6 sm:py-12 pb-28 lg:pb-12 space-y-10 sm:space-y-12">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <h1 className="font-sans text-3xl sm:text-4xl font-bold text-[#16201A]">
          We're here to help.
        </h1>
        <p className="text-xs sm:text-sm text-[#5A655F]">
          Having trouble finding a product or placing an order? Talk to our Ramnagar store team
          directly.
        </p>
      </div>

      {/* 4 Clean Contact Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Call Us */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[#E5E0D5]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-lg bg-[#FAF8F2] text-[#145A45] border border-[#E5E0D5]">
              <Phone className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#16201A]">Call Us</h3>
            <p className="text-xs text-[#5A655F]">{phone}</p>
          </div>
          <Button
            asChild
            className="mt-6 rounded-lg bg-[#145A45] text-xs font-bold text-white shadow-xs hover:bg-[#0A3628]"
          >
            <a href={telHref(cleanPhone)}>Call Now</a>
          </Button>
        </div>

        {/* Card 2: WhatsApp */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[#E5E0D5]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-lg bg-[#FAF8F2] text-[#145A45] border border-[#E5E0D5]">
              <MessageCircle className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#16201A]">WhatsApp</h3>
            <p className="text-xs text-[#5A655F]">Send your kirana list</p>
          </div>
          <Button
            asChild
            className="mt-6 rounded-lg bg-[#145A45] text-xs font-bold text-white shadow-xs hover:bg-[#0A3628]"
          >
            <a
              href={waHref(
                whatsapp,
                "Namaste Arun Gopal Traders, I want to inquire about groceries.",
              )}
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
          </Button>
        </div>

        {/* Card 3: Email */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[#E5E0D5]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-lg bg-[#FAF8F2] text-[#145A45] border border-[#E5E0D5]">
              <Mail className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#16201A]">Email</h3>
            <p className="text-xs text-[#5A655F] truncate">{email}</p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-6 rounded-lg border-[#E5E0D5] text-[#0F4A38] text-xs font-semibold hover:bg-[#E6EFE8]"
          >
            <a href={`mailto:${email}`}>Email Us</a>
          </Button>
        </div>

        {/* Card 4: Store Location */}
        <div className="card-base flex flex-col justify-between p-6 bg-white border border-[#E5E0D5]">
          <div className="space-y-2">
            <div className="grid size-10 place-items-center rounded-lg bg-[#FAF8F2] text-[#145A45] border border-[#E5E0D5]">
              <MapPin className="size-5" />
            </div>
            <h3 className="font-sans text-base font-bold text-[#16201A]">Visit Store</h3>
            <p className="text-xs text-[#5A655F] line-clamp-2">
              Ramnagar, Adda Bazar Road, Maharajganj
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-6 rounded-lg border-[#E5E0D5] text-[#0F4A38] text-xs font-semibold hover:bg-[#E6EFE8]"
          >
            <a
              href={
                s?.maps_link ??
                "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
              }
              target="_blank"
              rel="noreferrer"
            >
              Get Directions
            </a>
          </Button>
        </div>
      </div>

      {/* Main Support Grid: Help Ticket + Business Hours */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Help Form */}
        <div className="card-base p-6 sm:p-8 bg-white border border-[#E5E0D5]">
          <h2 className="font-sans text-xl font-bold text-[#16201A]">Send us a message</h2>
          <p className="mt-1 text-xs text-[#5A655F]">
            Need a product not listed on the website? Submit your request and we will arrange it.
          </p>

          {isSuccess ? (
            <div className="mt-6 rounded-xl bg-[#E6EFE8] p-6 text-center border border-[#145A45]/20">
              <CheckCircle2 className="mx-auto size-8 text-[#145A45]" />
              <h3 className="mt-2 font-bold text-[#0F4A38]">Message Received!</h3>
              <p className="mt-1 text-xs text-[#5A655F]">
                We'll call you at your provided phone number shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuccess(false)}
                className="mt-4 rounded-lg text-xs border-[#145A45] text-[#0F4A38]"
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#16201A]">Your Full Name</Label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg text-xs border-[#E5E0D5] bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#16201A]">10-Digit Mobile Number</Label>
                  <Input
                    required
                    type="tel"
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-lg text-xs border-[#E5E0D5] bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#16201A]">Topic / Inquiry Type</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="rounded-lg text-xs border-[#E5E0D5] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Order Inquiry">Order Inquiry / Help</SelectItem>
                    <SelectItem value="Product Request">Request unlisted grocery item</SelectItem>
                    <SelectItem value="Delivery Question">Delivery Area &amp; Timings</SelectItem>
                    <SelectItem value="Store Pickup">Store Pickup Confirmation</SelectItem>
                    <SelectItem value="Other">Other Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#16201A]">Your Message / Item List</Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Describe your requirement or list items you need..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-lg text-xs border-[#E5E0D5] bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#145A45] py-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#0A3628]"
              >
                <Send className="mr-2 size-4" /> {isSubmitting ? "Sending..." : "Submit Inquiry"}
              </Button>
            </form>
          )}
        </div>

        {/* Store Timings & Address */}
        <div className="card-base p-6 sm:p-8 space-y-6 bg-white border border-[#E5E0D5]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F4A38]">
              Store Schedule
            </span>
            <h2 className="font-sans text-xl font-bold text-[#16201A] mt-0.5">
              Weekly Business Hours
            </h2>
            <p className="mt-1 text-xs text-[#5A655F]">
              Current status:{" "}
              <strong className="text-[#0F4A38]">{status.text || "Open Daily"}</strong>
            </p>
          </div>

          <div className="divide-y divide-[#E5E0D5] text-xs">
            {DAYS.map(({ key, label }) => {
              const h = s?.business_hours?.[key] ?? {
                open: "07:00",
                close: "21:00",
                closed: false,
              };
              return (
                <div key={key} className="flex items-center justify-between py-2.5">
                  <span className="font-medium text-[#16201A]">{label}</span>
                  <span className="text-[#5A655F]">
                    {h.closed ? (
                      <span className="text-red-600 font-semibold">Closed</span>
                    ) : (
                      `${h.open} – ${h.close}`
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#E5E0D5] pt-4 text-xs text-[#5A655F] space-y-1">
            <p className="font-bold text-[#16201A]">📍 Arun Gopal Traders</p>
            <p>{address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
