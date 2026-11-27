import { useState, useEffect } from "react";
import {
  HelpCircle,
  Phone,
  RefreshCw,
  Search,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, telHref, waHref } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import type { HelpRequest } from "@/lib/queries";

export function AdminHelpRequests() {
  const { lang } = useLanguage();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadHelpRequests() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("help_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data ?? []) as unknown as HelpRequest[]);
    } catch (err: unknown) {
      console.error("Failed to load help requests:", err);
      toast.error(
        lang === "hi"
          ? "सहायता अनुरोध लोड करने में समस्या आई"
          : "Failed to load support inquiries",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHelpRequests();
  }, []);

  async function toggleStatus(req: HelpRequest) {
    const nextStatus = req.status === "open" ? "resolved" : "open";
    try {
      const { error } = await supabase
        .from("help_requests")
        .update({ status: nextStatus })
        .eq("id", req.id);

      if (error) throw error;
      toast.success(
        lang === "hi"
          ? nextStatus === "resolved"
            ? "अनुरोध हल हो गया (Resolved)"
            : "अनुरोध पुनः खोला गया (Open)"
          : `Request marked as ${nextStatus}`,
      );
      void loadHelpRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.order_no ?? "").toLowerCase().includes(q) ||
        r.problem_type.toLowerCase().includes(q) ||
        (r.message ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = requests.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-sans font-bold text-base sm:text-lg text-[#1F2924]">
            {lang === "hi"
              ? "ग्राहक सहायता व पूछताछ (Support Inquiries)"
              : "Customer Support & Order Inquiries"}
          </h3>
          <p className="text-xs text-[#6B746F]">
            {lang === "hi"
              ? "महराजगंज ग्राहकों द्वारा संपर्क फ़ॉर्म से भेजे गए सवाल और अनुरोध।"
              : "Inquiries and assistance tickets submitted by Maharajganj customers."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            variant={filter === "open" ? "default" : "outline"}
            onClick={() => setFilter("open")}
            className={`rounded-xl text-xs h-10 px-3.5 ${
              filter === "open"
                ? "bg-[#145A45] text-white font-bold"
                : openCount > 0
                  ? "border-amber-300 text-amber-800 bg-amber-50"
                  : "border-[#E8E4DA] text-[#1F2924]"
            }`}
          >
            {lang === "hi" ? "खुले" : "Open"} ({openCount})
          </Button>
          <Button
            variant={filter === "resolved" ? "default" : "outline"}
            onClick={() => setFilter("resolved")}
            className={`rounded-xl text-xs h-10 px-3.5 ${
              filter === "resolved"
                ? "bg-[#145A45] text-white font-bold"
                : "border-[#E8E4DA] text-[#1F2924]"
            }`}
          >
            {lang === "hi" ? "हल हो चुके" : "Resolved"} ({requests.length - openCount})
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={`rounded-xl text-xs h-10 px-3.5 ${
              filter === "all"
                ? "bg-[#145A45] text-white font-bold"
                : "border-[#E8E4DA] text-[#1F2924]"
            }`}
          >
            {lang === "hi" ? "सभी" : "All"} ({requests.length})
          </Button>
          <Button
            onClick={loadHelpRequests}
            variant="outline"
            size="icon"
            disabled={loading}
            className="rounded-xl border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-10 w-10 shrink-0"
            aria-label={lang === "hi" ? "रीफ्रेश करें" : "Refresh"}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8C827A]" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            lang === "hi"
              ? "नाम, मोबाइल नंबर, ऑर्डर नंबर या संदेश से खोजें..."
              : "Search by name, phone, order #, or message..."
          }
          className="pl-9 h-10 rounded-xl border-[#E8E4DA] bg-white text-xs"
        />
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((req) => (
            <div
              key={req.id}
              className={`rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all space-y-3 ${
                req.status === "open"
                  ? "border-amber-300 bg-white"
                  : "border-[#E8E4DA] bg-white opacity-85"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm sm:text-base text-[#1F2924]">
                      {req.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        req.status === "open"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {req.status === "open"
                        ? lang === "hi"
                          ? "कॉल आवश्यक (Open)"
                          : "Open Needs Call"
                        : lang === "hi"
                          ? "सुलझाया गया"
                          : "Resolved"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#6B746F]">
                    <a
                      href={telHref(req.phone)}
                      className="inline-flex items-center gap-1 font-bold text-[#145A45] hover:underline"
                    >
                      <Phone className="size-3.5" /> +91 {req.phone}
                    </a>
                    {req.order_no && (
                      <span>
                        • Order:{" "}
                        <strong className="font-mono text-[#1F2924]">{req.order_no}</strong>
                      </span>
                    )}
                    <span>• {formatDate(req.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild className="h-10 rounded-xl text-xs font-bold bg-[#145A45] text-white hover:bg-[#0E4333] shadow-xs px-4">
                    <a href={telHref(req.phone)}>
                      <Phone className="size-3.5 mr-1" /> {lang === "hi" ? "कॉल करें" : "Call Customer"}
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-10 rounded-xl text-xs font-bold border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3.5">
                    <a
                      href={waHref(
                        `91${req.phone.replace(/\D/g, "").slice(-10)}`,
                        `नमस्ते ${req.name} जी, अरुण गोपाल ट्रेडर्स की ओर से आपके अनुरोध (${req.problem_type}) के संबंध में:`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-3.5 mr-1" /> WhatsApp
                    </a>
                  </Button>
                  <Button
                    onClick={() => toggleStatus(req)}
                    variant="outline"
                    className="h-10 rounded-xl text-xs font-semibold px-4 border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
                  >
                    {req.status === "open"
                      ? lang === "hi"
                        ? "हल चिह्नित करें"
                        : "Mark Resolved"
                      : lang === "hi"
                        ? "पुनः खोलें"
                        : "Re-open"}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-3 text-xs space-y-1">
                <p className="font-bold text-[#1F2924]">Issue Category: {req.problem_type}</p>
                {req.message && (
                  <p className="text-[#6B746F] leading-relaxed italic">{req.message}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-[#6B746F] text-xs">
            <HelpCircle className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
            <p className="font-bold text-[#1F2924]">No support inquiries found in this view</p>
            <p className="text-[11px] text-[#6B746F] mt-1">Customer inquiries from the contact form will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

