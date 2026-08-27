import { useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr, discountPercent } from "@/lib/format";
import { getProductImage } from "@/lib/product-images";
import type { Product, Category, Variant } from "@/lib/queries";

type AdminProductsProps = {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
};

export function AdminProducts({ products, categories, onRefresh }: AdminProductsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  type VariantFormItem = {
    id?: string | undefined;
    label: string;
    price: number;
    mrp: number;
    stock: number;
    low_stock_threshold: number;
    sku?: string | undefined;
  };

  // Form State for Add / Edit Product
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Variants in Modal
  const [variants, setVariants] = useState<VariantFormItem[]>([
    { label: "1 kg", price: 100, mrp: 120, stock: 50, low_stock_threshold: 5 },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter((c) => c.parent_id === categoryId);

  function openAddModal() {
    setEditingProduct(null);
    setName("");
    setSlug("");
    setBrand("");
    setCategoryId(parentCategories[0]?.id ?? "");
    setSubcategoryId("");
    setDescription("");
    setImageUrl("/images/packaged.jpg");
    setIsFeatured(false);
    setIsPopular(false);
    setIsActive(true);
    setVariants([{ label: "1 kg", price: 100, mrp: 120, stock: 50, low_stock_threshold: 5 }]);
    setIsAddModalOpen(true);
  }

  function openEditModal(prod: Product) {
    setEditingProduct(prod);
    setName(prod.name);
    setSlug(prod.slug);
    setBrand(prod.brand ?? "");
    setCategoryId(prod.category_id ?? "");
    setSubcategoryId(prod.subcategory_id ?? "");
    setDescription(prod.description ?? "");
    setImageUrl(prod.image_url ?? "/images/packaged.jpg");
    setIsFeatured(prod.is_featured);
    setIsPopular(prod.is_popular);
    setIsActive(prod.is_active);

    const existingVars = (prod.product_variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      price: Number(v.price),
      mrp: Number(v.mrp),
      stock: v.stock,
      low_stock_threshold: v.low_stock_threshold,
      sku: v.sku ?? undefined,
    }));
    setVariants(
      existingVars.length > 0
        ? existingVars
        : [{ label: "Standard", price: 100, mrp: 120, stock: 50, low_stock_threshold: 5 }],
    );
    setIsAddModalOpen(true);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editingProduct) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      { label: "New Pack", price: 100, mrp: 120, stock: 25, low_stock_threshold: 5 },
    ]);
  }

  function updateVariant(idx: number, field: string, value: string | number) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }

  function removeVariantRow(idx: number) {
    if (variants.length <= 1) {
      toast.error("At least one pack size/variant is required");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please provide a product slug URL");
      return;
    }

    setIsSaving(true);
    try {
      if (editingProduct) {
        // 1. Update product
        const { error: prodError } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            slug: slug.trim(),
            brand: brand.trim() || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            description: description.trim() || null,
            image_url: imageUrl.trim() || null,
            is_featured: isFeatured,
            is_popular: isPopular,
            is_active: isActive,
          })
          .eq("id", editingProduct.id);

        if (prodError) throw prodError;

        // 2. Upsert variants
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i]!;
          if (v.id) {
            await supabase
              .from("product_variants")
              .update({
                label: v.label,
                price: v.price,
                mrp: v.mrp,
                stock: v.stock,
                low_stock_threshold: v.low_stock_threshold,
                sort_order: i,
              })
              .eq("id", v.id);
          } else {
            await supabase.from("product_variants").insert({
              product_id: editingProduct.id,
              label: v.label,
              price: v.price,
              mrp: v.mrp,
              stock: v.stock,
              low_stock_threshold: v.low_stock_threshold,
              sort_order: i,
            });
          }
        }

        toast.success(`Product "${name}" updated successfully!`);
      } else {
        // 1. Insert product
        const { data: newProd, error: prodError } = await supabase
          .from("products")
          .insert({
            name: name.trim(),
            slug: slug.trim(),
            brand: brand.trim() || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            description: description.trim() || null,
            image_url: imageUrl.trim() || null,
            is_featured: isFeatured,
            is_popular: isPopular,
            is_active: isActive,
          })
          .select("id")
          .single();

        if (prodError) throw prodError;

        // 2. Insert variants
        const varPayload = variants.map((v, i) => ({
          product_id: newProd.id,
          label: v.label,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          low_stock_threshold: v.low_stock_threshold,
          sort_order: i,
        }));

        await supabase.from("product_variants").insert(varPayload);

        toast.success(`Product "${name}" added to catalogue!`);
      }

      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      console.error("Save product failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to save product";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(prod: Product) {
    if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", prod.id);
      if (error) throw error;
      toast.success(`Deleted ${prod.name}`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  async function handleToggleActive(prod: Product) {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !prod.is_active })
        .eq("id", prod.id);
      if (error) throw error;
      toast.success(`${prod.name} is now ${!prod.is_active ? "Visible" : "Hidden"}`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = (p.brand ?? "").toLowerCase().includes(q);
      return matchName || matchBrand;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by title or brand (Fortune, Tata, Maggi)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl text-xs"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {parentCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openAddModal} className="rounded-xl font-bold shadow-xs">
          <Plus className="mr-1.5 size-4" /> Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Brand &amp; Category</th>
                <th className="py-3 px-4 font-semibold">Variants / Sizes</th>
                <th className="py-3 px-4 font-semibold">Price Range</th>
                <th className="py-3 px-4 font-semibold">Total Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  const vars = p.product_variants ?? [];
                  const totalStock = vars.reduce((s, v) => s + v.stock, 0);
                  const minPrice = vars.length ? Math.min(...vars.map((v) => Number(v.price))) : 0;
                  const maxPrice = vars.length ? Math.max(...vars.map((v) => Number(v.price))) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(p)}
                            alt={p.name}
                            className="size-12 rounded-xl object-cover bg-muted"
                          />
                          <div className="min-w-0 max-w-[200px]">
                            <p className="truncate font-semibold text-foreground">{p.name}</p>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{p.brand || "—"}</p>
                        <p className="text-muted-foreground">{cat?.name || "General"}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {vars.map((v) => (
                            <span
                              key={v.id}
                              className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]"
                            >
                              {v.label} ({inr(v.price)})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground font-display">
                          {minPrice === maxPrice
                            ? inr(minPrice)
                            : `${inr(minPrice)} – ${inr(maxPrice)}`}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`rounded-md px-2 py-0.5 font-bold ${
                            totalStock === 0
                              ? "bg-destructive/10 text-destructive"
                              : totalStock <= 10
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                          }`}
                        >
                          {totalStock === 0 ? "Out of Stock" : `${totalStock} units`}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                            p.is_active
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.is_active ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                          {p.is_active ? "Active" : "Hidden"}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            onClick={() => openEditModal(p)}
                            variant="outline"
                            size="icon"
                            className="size-7 rounded-lg"
                            aria-label="Edit"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteProduct(p)}
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-destructive hover:bg-destructive/10"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No products found. Click "Add Product" to add grocery items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingProduct ? `Edit "${editingProduct.name}"` : "Add New Grocery Product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Fortune Chakki Fresh Atta"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  URL Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="fortune-chakki-fresh-atta"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Brand / Manufacturer</Label>
                <Input
                  placeholder="e.g. Fortune, Tata, MDH, Amul"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Primary Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Product Image URL / Asset</Label>
                <Input
                  placeholder="/images/atta.jpg or https://…"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Description / Highlights</Label>
                <Textarea
                  rows={2}
                  placeholder="Pure 100% whole wheat chakki atta with natural dietary fiber…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Variants Management */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm">Pack Sizes &amp; Variants</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Set individual weight/volume, MRP, selling price, and stock for each pack.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addVariantRow}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  <Plus className="size-3.5 mr-1" /> Add Pack Size
                </Button>
              </div>

              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center rounded-xl bg-card p-2.5 border border-border text-xs"
                  >
                    <div className="col-span-3">
                      <Label className="text-[10px] text-muted-foreground">Pack Label</Label>
                      <Input
                        placeholder="e.g. 5 kg"
                        value={v.label}
                        onChange={(e) => updateVariant(idx, "label", e.target.value)}
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">MRP (₹)</Label>
                      <Input
                        type="number"
                        placeholder="300"
                        value={v.mrp}
                        onChange={(e) => updateVariant(idx, "mrp", Number(e.target.value))}
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Selling (₹)</Label>
                      <Input
                        type="number"
                        placeholder="275"
                        value={v.price}
                        onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Stock Qty</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={v.stock}
                        onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))}
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Low Alert</Label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={v.low_stock_threshold}
                        onChange={(e) =>
                          updateVariant(idx, "low_stock_threshold", Number(e.target.value))
                        }
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>

                    <div className="col-span-1 text-right pt-4">
                      <Button
                        type="button"
                        onClick={() => removeVariantRow(idx)}
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges and toggles */}
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <Checkbox checked={isFeatured} onCheckedChange={(c) => setIsFeatured(Boolean(c))} />
                <span>Featured on Homepage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <Checkbox checked={isPopular} onCheckedChange={(c) => setIsPopular(Boolean(c))} />
                <span>Popular in Maharajganj</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(Boolean(c))} />
                <span>Active &amp; Visible to Customers</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                variant="outline"
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl font-bold">
                {isSaving ? "Saving…" : editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
