import { useState } from "react";
import { Search, AlertTriangle, CheckCircle2, Plus, Minus, RefreshCw, Save } from "lucide-react";
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
    <div className="space-y-6">
      {/* Top Filter & Counter Badges */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search grocery stock by title or brand…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className="rounded-xl text-xs"
          >
            All Items ({rows.length})
          </Button>

          <Button
            variant={filterType === "low" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("low")}
            className={`rounded-xl text-xs ${filterType !== "low" && lowStockCount > 0 ? "border-warning text-warning" : ""}`}
          >
            Low Stock ({lowStockCount})
          </Button>

          <Button
            variant={filterType === "out" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("out")}
            className={`rounded-xl text-xs ${filterType !== "out" && outOfStockCount > 0 ? "border-destructive text-destructive" : ""}`}
          >
            Out of Stock ({outOfStockCount})
          </Button>

          <Button
            onClick={onRefresh}
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Inventory List: Mobile Cards + Desktop Table */}
      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          No items match inventory criteria.
        </div>
      ) : (
        <>
          {/* Mobile Inventory Cards (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filteredRows.map((r) => {
              const draftVal = stockChanges[r.variantId] ?? r.currentStock;
              const isLow = r.currentStock <= r.threshold && r.currentStock > 0;
              const isOut = r.currentStock === 0;

              return (
                <div
                  key={r.variantId}
                  className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage({
                        slug: r.slug,
                        name: r.productName,
                        image_url: r.imageUrl,
                      })}
                      alt={r.productName}
                      className="size-12 rounded-xl object-contain bg-white border border-[#EFECE6] p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {r.variantLabel}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                            isOut
                              ? "bg-destructive/10 text-destructive"
                              : isLow
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                          }`}
                        >
                          {isOut
                            ? "Out of Stock"
                            : isLow
                              ? `Low (${r.currentStock})`
                              : `${r.currentStock} in stock`}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-xs leading-snug truncate">
                        {r.productName}
                      </p>
                      <p className="font-display font-extrabold text-foreground text-sm mt-0.5">
                        {inr(r.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                    <span className="text-xs font-bold text-muted-foreground">Adjust Stock:</span>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-2 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={r.currentStock <= 0 || savingId === r.variantId}
                        onClick={() => updateStock(r.variantId, r.currentStock - 1)}
                        className="size-7 rounded-full bg-card shadow-2xs"
                      >
                        <Minus className="size-3.5" />
                      </Button>

                      <span className="w-8 text-center text-sm font-extrabold text-foreground">
                        {r.currentStock}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={savingId === r.variantId}
                        onClick={() => updateStock(r.variantId, r.currentStock + 1)}
                        className="size-7 rounded-full bg-card shadow-2xs"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Inventory Table (>= sm) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Grocery Product</th>
                    <th className="py-3 px-4 font-semibold">Pack Variant</th>
                    <th className="py-3 px-4 font-semibold">Unit Price</th>
                    <th className="py-3 px-4 font-semibold">Stock Status</th>
                    <th className="py-3 px-4 text-center font-semibold">Quick Stock Adjustment</th>
                    <th className="py-3 px-4 text-right font-semibold">Direct Set</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((r) => {
                    const draftVal = stockChanges[r.variantId] ?? r.currentStock;
                    const isLow = r.currentStock <= r.threshold && r.currentStock > 0;
                    const isOut = r.currentStock === 0;

                    return (
                      <tr key={r.variantId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImage({
                                slug: r.slug,
                                name: r.productName,
                                image_url: r.imageUrl,
                              })}
                              alt={r.productName}
                              className="size-10 rounded-lg object-cover bg-muted"
                            />
                            <div>
                              <p className="font-semibold text-foreground">{r.productName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {r.brand || "Local Kirana"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-medium text-foreground">{r.variantLabel}</td>

                        <td className="py-3 px-4 font-display font-semibold text-foreground">
                          {inr(r.price)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`rounded-md px-2 py-0.5 font-bold ${
                              isOut
                                ? "bg-destructive/10 text-destructive"
                                : isLow
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
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
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-border p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={r.currentStock <= 0 || savingId === r.variantId}
                              onClick={() => updateStock(r.variantId, r.currentStock - 1)}
                              className="size-7 rounded-lg"
                            >
                              <Minus className="size-3" />
                            </Button>

                            <span className="w-10 text-center font-bold text-foreground">
                              {r.currentStock}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={savingId === r.variantId}
                              onClick={() => updateStock(r.variantId, r.currentStock + 1)}
                              className="size-7 rounded-lg"
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
                              className="h-8 w-16 rounded-lg text-center text-xs"
                            />
                            {draftVal !== r.currentStock ? (
                              <Button
                                size="sm"
                                onClick={() => updateStock(r.variantId, draftVal)}
                                disabled={savingId === r.variantId}
                                className="h-8 rounded-lg text-xs font-semibold"
                              >
                                <Save className="size-3 mr-1" /> Set
                              </Button>
                            ) : null}
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
