import { useState } from "react";
import { Search, AlertTriangle, Plus, Minus, RefreshCw, Save, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import type { Product, Variant } from "@/lib/queries";

type AdminInventoryProps = {
  products: Product[];
  onRefresh: () => void;
};

export function AdminInventory({ products, onRefresh }: AdminInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "low" | "out">("all");
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Flatten products into variant rows
  const rows: Array<{
    variantId: string;
    productName: string;
    slug: string;
    brand: string | null;
    variantLabel: string;
    currentStock: number;
    threshold: number;
    price: number;
    imageUrl: string | null;
  }> = [];

  products.forEach((p) => {
    (p.product_variants ?? []).forEach((v) => {
      rows.push({
        variantId: v.id,
        productName: p.name,
        slug: p.slug,
        brand: p.brand,
        variantLabel: v.label,
        currentStock: v.stock,
        threshold: v.low_stock_threshold,
        price: Number(v.price),
        imageUrl: p.image_url,
      });
    });
  });

  const filteredRows = rows.filter((r) => {
    if (filterType === "out" && r.currentStock > 0) return false;
    if (filterType === "low" && (r.currentStock > r.threshold || r.currentStock === 0))
      return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return r.productName.toLowerCase().includes(q) || (r.brand ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const outOfStockCount = rows.filter((r) => r.currentStock === 0).length;
  const lowStockCount = rows.filter(
    (r) => r.currentStock > 0 && r.currentStock <= r.threshold,
  ).length;

  async function updateStock(variantId: string, newStock: number) {
    if (newStock < 0) return;
    setSavingId(variantId);
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ stock: newStock })
        .eq("id", variantId);

      if (error) throw error;
      toast.success("Stock updated!");
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock";
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Filter & Counter Badges */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B746F]" />
          <Input
            placeholder="Search grocery stock by title or brand…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9.5 rounded-xl text-xs border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
            className={`rounded-xl text-xs h-10 px-3 ${
              filterType === "all"
                ? "bg-[#145A45] text-white font-bold"
                : "border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2]"
            }`}
          >
            All ({rows.length})
          </Button>

          <Button
            variant={filterType === "low" ? "default" : "outline"}
            onClick={() => setFilterType("low")}
            className={`rounded-xl text-xs h-10 px-3 ${
              filterType === "low"
                ? "bg-amber-600 text-white font-bold"
                : lowStockCount > 0
                  ? "border-amber-300 text-amber-800 bg-amber-50"
                  : "border-[#E8E4DA] text-[#1F2924]"
            }`}
          >
            Low Stock ({lowStockCount})
          </Button>

          <Button
            variant={filterType === "out" ? "default" : "outline"}
            onClick={() => setFilterType("out")}
            className={`rounded-xl text-xs h-10 px-3 ${
              filterType === "out"
                ? "bg-red-600 text-white font-bold"
                : outOfStockCount > 0
                  ? "border-red-300 text-red-800 bg-red-50"
                  : "border-[#E8E4DA] text-[#1F2924]"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </Button>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="icon"
            className="rounded-xl border-[#E8E4DA] text-[#1F2924] hover:bg-[#FAF8F2] h-10 w-10 shrink-0"
            aria-label="Refresh stock"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Inventory List: Mobile Cards + Desktop Table */}
      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-xs text-[#6B746F]">
          <Boxes className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
          <p className="font-bold text-[#1F2924]">No items match inventory criteria</p>
          <p className="text-[11px] text-[#6B746F] mt-1">Try clearing search or changing the filter.</p>
        </div>
      ) : (
        <>
          {/* Mobile Inventory Cards (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filteredRows.map((r) => {
              const isLow = r.currentStock <= r.threshold && r.currentStock > 0;
              const isOut = r.currentStock === 0;

              return (
                <div
                  key={r.variantId}
                  className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage({
                        slug: r.slug,
                        name: r.productName,
                        image_url: r.imageUrl,
                      })}
                      alt={r.productName}
                      className="size-12 rounded-xl object-contain bg-[#FAF8F2] border border-[#E8E4DA] p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-[#6B746F]">
                          {r.variantLabel}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                            isOut
                              ? "bg-red-100 text-red-700"
                              : isLow
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isOut
                            ? "Out of Stock"
                            : isLow
                              ? `Low (${r.currentStock})`
                              : `${r.currentStock} in stock`}
                        </span>
                      </div>
                      <p className="font-semibold text-[#1F2924] text-xs leading-snug truncate">
                        {r.productName}
                      </p>
                      <p className="font-sans font-extrabold text-[#145A45] text-sm mt-0.5">
                        {inr(r.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E8E4DA]">
                    <span className="text-xs font-semibold text-[#6B746F]">Adjust Stock:</span>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DA] bg-[#FAF8F2] p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={r.currentStock <= 0 || savingId === r.variantId}
                        onClick={() => updateStock(r.variantId, r.currentStock - 1)}
                        className="size-9 rounded-full bg-white shadow-2xs text-[#1F2924] hover:bg-[#FAF8F2]"
                      >
                        <Minus className="size-4" />
                      </Button>

                      <span className="w-10 text-center text-base font-extrabold text-[#1F2924]">
                        {r.currentStock}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={savingId === r.variantId}
                        onClick={() => updateStock(r.variantId, r.currentStock + 1)}
                        className="size-9 rounded-full bg-white shadow-2xs text-[#1F2924] hover:bg-[#FAF8F2]"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Inventory Table (>= sm) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E4DA] bg-[#FAF8F2]/60 text-[#6B746F]">
                    <th className="py-3 px-4 font-semibold">Grocery Product</th>
                    <th className="py-3 px-4 font-semibold">Pack Variant</th>
                    <th className="py-3 px-4 font-semibold">Unit Price</th>
                    <th className="py-3 px-4 font-semibold">Stock Status</th>
                    <th className="py-3 px-4 text-center font-semibold">Quick Stock Adjustment</th>
                    <th className="py-3 px-4 text-right font-semibold">Direct Set</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DA]">
                  {filteredRows.map((r) => {
                    const draftVal = stockChanges[r.variantId] ?? r.currentStock;
                    const isLow = r.currentStock <= r.threshold && r.currentStock > 0;
                    const isOut = r.currentStock === 0;

                    return (
                      <tr key={r.variantId} className="hover:bg-[#FAF8F2]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImage({
                                slug: r.slug,
                                name: r.productName,
                                image_url: r.imageUrl,
                              })}
                              alt={r.productName}
                              className="size-10 rounded-lg object-contain bg-[#FAF8F2] border border-[#E8E4DA] p-1"
                            />
                            <div>
                              <p className="font-semibold text-[#1F2924]">{r.productName}</p>
                              <p className="text-[10px] text-[#6B746F]">
                                {r.brand || "Arun Gopal"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-medium text-[#1F2924]">{r.variantLabel}</td>

                        <td className="py-3 px-4 font-sans font-semibold text-[#1F2924]">
                          {inr(r.price)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`rounded-md px-2 py-0.5 font-bold ${
                              isOut
                                ? "bg-red-100 text-red-700"
                                : isLow
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isOut
                              ? "Out of Stock"
                              : isLow
                                ? `Low (${r.currentStock} left)`
                                : `${r.currentStock} in stock`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E4DA] bg-[#FAF8F2] p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={r.currentStock <= 0 || savingId === r.variantId}
                              onClick={() => updateStock(r.variantId, r.currentStock - 1)}
                              className="size-7 rounded-lg bg-white text-[#1F2924] shadow-2xs hover:bg-[#FAF8F2]"
                            >
                              <Minus className="size-3" />
                            </Button>

                            <span className="w-10 text-center font-bold text-[#1F2924]">
                              {r.currentStock}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={savingId === r.variantId}
                              onClick={() => updateStock(r.variantId, r.currentStock + 1)}
                              className="size-7 rounded-lg bg-white text-[#1F2924] shadow-2xs hover:bg-[#FAF8F2]"
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Input
                              type="number"
                              value={draftVal}
                              onChange={(e) =>
                                setStockChanges((prev) => ({
                                  ...prev,
                                  [r.variantId]: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="h-7.5 w-16 rounded-lg text-center text-xs border-[#E8E4DA] bg-[#FAF8F2]"
                            />
                            {draftVal !== r.currentStock && (
                              <Button
                                size="sm"
                                onClick={() => updateStock(r.variantId, draftVal)}
                                disabled={savingId === r.variantId}
                                className="h-7.5 rounded-lg text-xs font-semibold bg-[#145A45] text-white hover:bg-[#0E4333]"
                              >
                                <Save className="size-3 mr-1" /> Set
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

