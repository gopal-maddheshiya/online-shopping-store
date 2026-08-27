import { useState, useEffect } from "react";
import {
  HelpCircle,
  Phone,
  CheckCircle2,
  Clock,
  RefreshCw,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, telHref } from "@/lib/format";
import type { HelpRequest } from "@/lib/queries";

export function AdminHelpRequests() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");

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
      toast.success(`Request marked as ${nextStatus}`);
      void loadHelpRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    return true;
  });

  const openCount = requests.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">
            Customer Support &amp; Order Inquiries
          </h3>
          <p className="text-xs text-muted-foreground">
            Inquiries and assistance tickets submitted by customers on the Contact page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("open")}
            className="rounded-xl text-xs"
          >
            Open ({openCount})
          </Button>
          <Button
            variant={filter === "resolved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("resolved")}
            className="rounded-xl text-xs"
          >
            Resolved ({requests.length - openCount})
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-xl text-xs"
          >
            All ({requests.length})
          </Button>
          <Button
            onClick={loadHelpRequests}
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((req) => (
            <div
              key={req.id}
              className={`rounded-2xl border p-5 shadow-xs transition-all ${
                req.status === "open"
                  ? "border-warning/40 bg-card"
                  : "border-border bg-muted/30 opacity-75"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-foreground">
                      {req.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        req.status === "open"
                          ? "bg-warning/15 text-warning"
                          : "bg-success/15 text-success"
                      }`}
                    >
                      {req.status === "open" ? "Open Needs Call" : "Resolved"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <a
                      href={telHref(req.phone)}
                      className="flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      <Phone className="size-3" /> +91 {req.phone}
                    </a>
                    {req.order_no ? (
                      <span>
                        • Order:{" "}
                        <strong className="font-mono text-foreground">{req.order_no}</strong>
                      </span>
                    ) : null}
                    <span>• {formatDate(req.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" className="h-8 rounded-xl text-xs font-bold shadow-xs">
                    <a href={telHref(req.phone)}>
                      <Phone className="size-3 mr-1" /> Call Customer
                    </a>
                  </Button>
                  <Button
                    onClick={() => toggleStatus(req)}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs font-semibold"
                  >
                    {req.status === "open" ? "Mark Resolved" : "Re-open"}
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs space-y-1">
                <p className="font-semibold text-foreground">Issue Category: {req.problem_type}</p>
                {req.message ? (
                  <p className="text-muted-foreground leading-relaxed italic">{req.message}</p>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground text-xs">
            No support inquiries found in this view.
          </div>
        )}
      </div>
    </div>
  );
}
