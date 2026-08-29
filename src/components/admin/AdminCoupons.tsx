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
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
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
                  <span className="font-semibold text-[#1F2924]">{c.used_count ?? 0}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
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
              Create Discount Coupon
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCoupon} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">
                Coupon Code <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. WELCOME50, FESTIVE10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="rounded-xl font-mono text-sm uppercase border-[#E8E4DA] h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">Description</Label>
              <Input
                placeholder="e.g. 10% discount on orders above ₹299"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl text-xs border-[#E8E4DA] h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as "percent" | "flat")}
                >
                  <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent" className="text-xs">Percentage (%)</SelectItem>
                    <SelectItem value="flat" className="text-xs">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Discount Value</Label>
                <Input
                  type="number"
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="rounded-xl font-bold border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Minimum Order (₹)</Label>
                <Input
                  type="number"
                  required
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Max Cap (₹)</Label>
                <Input
                  type="number"
                  placeholder="Optional limit"
                  value={maxDiscount ?? ""}
                  onChange={(e) =>
                    setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
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
                {isSaving ? "Saving…" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

