import { useState } from "react";
import { Plus, Tag, Trash2, Pencil } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { inr } from "@/lib/format";
import type { Coupon } from "@/lib/queries";

type AdminCouponsProps = {
  coupons: Coupon[];
  onRefresh: () => void;
};

export function AdminCoupons({ coupons, onRefresh }: AdminCouponsProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(299);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(100);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  function toDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    return iso.slice(0, 10);
  }

  function openCreateModal() {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setDiscountType("percent");
    setValue(10);
    setMinOrder(299);
    setMaxDiscount(100);
    setStartsAt("");
    setEndsAt("");
    setUsageLimit(undefined);
    setIsModalOpen(true);
  }

  function openEditModal(c: Coupon) {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description ?? "");
    setDiscountType(c.discount_type);
    setValue(Number(c.value));
    setMinOrder(Number(c.min_order));
    setMaxDiscount(c.max_discount != null ? Number(c.max_discount) : undefined);
    setStartsAt(toDateInput(c.starts_at));
    setEndsAt(toDateInput(c.ends_at));
    setUsageLimit(c.usage_limit != null ? Number(c.usage_limit) : undefined);
    setIsModalOpen(true);
  }

  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter coupon code");
      return;
    }

    const numericVal = Number(value);
    if (!Number.isFinite(numericVal) || numericVal <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (discountType === "percent" && numericVal > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    if (startsAt && endsAt && startsAt > endsAt) {
      toast.error("Expiry date must be after start date");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: cleanCode,
        description: description.trim() || null,
        discount_type: discountType,
        value: numericVal,
        min_order: Math.max(0, Number(minOrder) || 0),
        max_discount: maxDiscount && Number(maxDiscount) > 0 ? Number(maxDiscount) : null,
        starts_at: startsAt ? new Date(`${startsAt}T00:00:00+05:30`).toISOString() : null,
        ends_at: endsAt ? new Date(`${endsAt}T23:59:59+05:30`).toISOString() : null,
        usage_limit: usageLimit && Number(usageLimit) > 0 ? Math.floor(Number(usageLimit)) : null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editingCoupon.id);
        if (error) throw error;
        toast.success(`Coupon code ${cleanCode} updated!`);
      } else {
        const { error } = await supabase.from("coupons").insert({
          ...payload,
          is_active: true,
        });
        if (error) throw error;
        toast.success(`Coupon code ${cleanCode} created!`);
      }

      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save coupon";
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
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
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
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      onRefresh();
    } catch (err: unknown) {

      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-sans font-bold text-base sm:text-lg text-[#1F2924]">
            Discount Coupons &amp; Festive Offers
          </h3>
          <p className="text-xs text-[#6B746F]">
            Create promotional coupon codes and offers for Maharajganj customers.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-11 text-xs shadow-xs shrink-0"
        >
          <Plus className="mr-1.5 size-4" /> Create Coupon
        </Button>
      </div>

      {/* Coupons Grid */}
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-xs text-[#6B746F]">
          <Tag className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
          <p className="font-bold text-[#1F2924]">No coupons created yet</p>
          <p className="text-[11px] text-[#6B746F] mt-1">Click "Create Coupon" to add discount codes.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 border border-amber-200">
                    <Tag className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-sm sm:text-base text-[#1F2924] tracking-wider block truncate">
                      {c.code}
                    </span>
                    <p className="text-[11px] text-[#6B746F] truncate">
                      {c.description || "Special offer"}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                    c.is_active ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {c.is_active ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#6B746F]">Discount Value:</span>
                  <span className="font-bold text-[#145A45]">
                    {c.discount_type === "percent" ? `${c.value}% OFF` : inr(c.value) + " FLAT OFF"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B746F]">Min Order Value:</span>
                  <span className="font-semibold text-[#1F2924]">{inr(c.min_order)}</span>
                </div>
                {c.max_discount && (
                  <div className="flex justify-between">
                    <span className="text-[#6B746F]">Max Discount:</span>
                    <span className="font-semibold text-[#1F2924]">{inr(c.max_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6B746F]">Times Used:</span>
                  <span className="font-semibold text-[#1F2924]">
                    {c.used_count ?? 0}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </span>
                </div>
                {(c.starts_at || c.ends_at) && (
                  <div className="flex justify-between">
                    <span className="text-[#6B746F]">Valid Window:</span>
                    <span className="font-medium text-[#1F2924]">
                      {c.starts_at ? c.starts_at.slice(0, 10) : "Now"} →{" "}
                      {c.ends_at ? c.ends_at.slice(0, 10) : "No expiry"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
                <Button
                  onClick={() => openEditModal(c)}
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-xl border-[#E8E4DA] text-[#145A45] hover:bg-[#FAF8F2]"
                  aria-label="Edit coupon"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  onClick={() => handleToggleCoupon(c)}
                  variant="outline"
                  className="h-10 rounded-xl text-xs font-semibold px-4 border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
                >
                  {c.is_active ? "Disable" : "Enable"}
                </Button>
                <Button
                  onClick={() => handleDeleteCoupon(c)}
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-xl text-red-600 hover:bg-red-50"
                  aria-label="Delete coupon"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Coupon Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
          <DialogHeader className="border-b border-[#E8E4DA] pb-3">
            <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create Discount Coupon"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCoupon} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label htmlFor="coupon-code-input" className="text-xs font-semibold text-[#1F2924]">
                Coupon Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="coupon-code-input"
                required
                placeholder="e.g. WELCOME50, FESTIVE10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="rounded-xl font-mono text-sm uppercase border-[#E8E4DA] h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="coupon-desc-input" className="text-xs font-semibold text-[#1F2924]">Description</Label>
              <Input
                id="coupon-desc-input"
                placeholder="e.g. 10% discount on orders above ₹299"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl text-xs border-[#E8E4DA] h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="coupon-type-select" className="text-xs font-semibold text-[#1F2924]">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as "percent" | "flat")}
                >
                  <SelectTrigger id="coupon-type-select" className="rounded-xl border-[#E8E4DA] text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent" className="text-xs">Percentage (%)</SelectItem>
                    <SelectItem value="flat" className="text-xs">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="coupon-value-input" className="text-xs font-semibold text-[#1F2924]">Discount Value</Label>
                <Input
                  id="coupon-value-input"
                  type="number"
                  min="1"
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="rounded-xl font-bold border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="coupon-min-input" className="text-xs font-semibold text-[#1F2924]">Minimum Order (₹)</Label>
                <Input
                  id="coupon-min-input"
                  type="number"
                  min="0"
                  required
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="coupon-cap-input" className="text-xs font-semibold text-[#1F2924]">Max Cap (₹)</Label>
                <Input
                  id="coupon-cap-input"
                  type="number"
                  min="1"
                  placeholder="Optional limit"
                  value={maxDiscount ?? ""}
                  onChange={(e) =>
                    setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="coupon-start-input" className="text-xs font-semibold text-[#1F2924]">Starts On</Label>
                <Input
                  id="coupon-start-input"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="coupon-end-input" className="text-xs font-semibold text-[#1F2924]">Expires On</Label>
                <Input
                  id="coupon-end-input"
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="coupon-limit-input" className="text-xs font-semibold text-[#1F2924]">Max Uses</Label>
                <Input
                  id="coupon-limit-input"
                  type="number"
                  min="1"
                  placeholder="∞"
                  value={usageLimit ?? ""}
                  onChange={(e) =>
                    setUsageLimit(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E4DA]">
              <Button
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="rounded-xl text-xs border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-9 text-xs shadow-xs"
              >
                {isSaving ? "Saving…" : editingCoupon ? "Save Changes" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

