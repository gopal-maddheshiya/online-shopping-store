import { useState } from "react";
import { Plus, Tag, Trash2, CheckCircle2, XCircle, Percent, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import type { Coupon } from "@/lib/queries";

type AdminCouponsProps = {
  coupons: Coupon[];
  onRefresh: () => void;
};

export function AdminCoupons({ coupons, onRefresh }: AdminCouponsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(299);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(100);
  const [isSaving, setIsSaving] = useState(false);

  function openCreateModal() {
    setCode("");
    setDescription("");
    setDiscountType("percent");
    setValue(10);
    setMinOrder(299);
    setMaxDiscount(100);
    setIsModalOpen(true);
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter coupon code");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        discount_type: discountType,
        value: Number(value),
        min_order: Number(minOrder),
        max_discount: maxDiscount ? Number(maxDiscount) : null,
        is_active: true,
      });

      if (error) throw error;
      toast.success(`Coupon code ${code.toUpperCase()} created!`);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create coupon";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleCoupon(c: Coupon) {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !c.is_active })
        .eq("id", c.id);
      if (error) throw error;
      toast.success(`Coupon ${c.code} is now ${!c.is_active ? "Active" : "Inactive"}`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  async function handleDeleteCoupon(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", c.id);
      if (error) throw error;
      toast.success(`Deleted coupon ${c.code}`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">
            Discount Coupons &amp; Offers
          </h3>
          <p className="text-xs text-muted-foreground">
            Create promotional coupon codes and festive discount offers for Maharajganj customers.
          </p>
        </div>
        <Button onClick={openCreateModal} className="rounded-xl font-bold shadow-xs">
          <Plus className="mr-1.5 size-4" /> Create Coupon
        </Button>
      </div>

      {/* Coupons Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-accent/20 text-accent-foreground">
                  <Tag className="size-4" />
                </span>
                <div>
                  <span className="font-mono font-bold text-base text-foreground tracking-wider">
                    {c.code}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {c.description || "Special offer"}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {c.is_active ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount Value:</span>
                <span className="font-bold text-foreground">
                  {c.discount_type === "percent" ? `${c.value}% OFF` : inr(c.value) + " FLAT OFF"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Order Value:</span>
                <span className="font-semibold">{inr(c.min_order)}</span>
              </div>
              {c.max_discount ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Discount:</span>
                  <span className="font-semibold">{inr(c.max_discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Times Used:</span>
                <span className="font-semibold">{c.used_count ?? 0}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                onClick={() => handleToggleCoupon(c)}
                variant="outline"
                size="sm"
                className="h-7 rounded-lg text-xs"
              >
                {c.is_active ? "Disable" : "Enable"}
              </Button>
              <Button
                onClick={() => handleDeleteCoupon(c)}
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Discount Coupon</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCoupon} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Coupon Code <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. WELCOME50, DIWALI10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="rounded-xl font-mono text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                placeholder="e.g. 10% discount on all spices and staples"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as "percent" | "flat")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Discount Value</Label>
                <Input
                  type="number"
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Minimum Order (₹)</Label>
                <Input
                  type="number"
                  required
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max Cap (₹)</Label>
                <Input
                  type="number"
                  placeholder="Optional limit"
                  value={maxDiscount ?? ""}
                  onChange={(e) =>
                    setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl font-bold">
                {isSaving ? "Saving…" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
