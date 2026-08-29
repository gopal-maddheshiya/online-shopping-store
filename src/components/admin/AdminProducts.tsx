import { useState, useEffect, useRef } from "react";
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
  Boxes,
  Upload,
  ArrowUp,
  ArrowDown,
  Star,
  ImagePlus,
  FileImage,
  AlertCircle,
  CheckCircle2,
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
import { getProductImage, getProductImages, getImageTypeLabel } from "@/lib/product-images";
import { uploadProductImage } from "@/lib/image-upload";
import type { Product, Category, Variant, ProductImage, ProductImageType } from "@/lib/queries";


type AdminProductsProps = {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
  initialOpenAdd?: boolean;
};

export function AdminProducts({
  products,
  categories,
  onRefresh,
  initialOpenAdd = false,
}: AdminProductsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (initialOpenAdd) {
      openAddModal();
    }
  }, [initialOpenAdd]);

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
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  type GalleryImageItem = {
    id: string;
    url: string;
    type: ProductImageType;
    label: string;
    sort_order: number;
  };

  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>([
    { id: "img-1", url: "/images/packaged.jpg", type: "front", label: "Front View", sort_order: 0 },
  ]);

  // Variants in Modal
  const [variants, setVariants] = useState<VariantFormItem[]>([
    { label: "1 kg", price: 100, mrp: 120, stock: 50, low_stock_threshold: 5 },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = categories.filter((c) => !c.parent_id);

  function openAddModal() {
    setEditingProduct(null);
    setName("");
    setSlug("");
    setBrand("");
    setCategoryId(parentCategories[0]?.id ?? "");
    setSubcategoryId("");
    setDescription("");
    setGalleryImages([
      {
        id: `img-${Date.now()}`,
        url: "/images/packaged.jpg",
        type: "front",
        label: "Front View",
        sort_order: 0,
      },
    ]);
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
    setIsFeatured(prod.is_featured);
    setIsPopular(prod.is_popular);
    setIsActive(prod.is_active);

    const parsedImages = getProductImages(prod).map((img, idx) => ({
      id: `img-${idx}-${Date.now()}`,
      url: img.url,
      type: img.type,
      label:
        img.label ||
        (img.type === "front"
          ? "Front View"
          : img.type === "back"
            ? "Back / Nutrition"
            : img.type === "detail"
              ? "Detail View"
              : "Additional Photo"),
      sort_order: img.sort_order ?? idx,
    }));

    setGalleryImages(
      parsedImages.length > 0
        ? parsedImages
        : [
          {
            id: `img-${Date.now()}`,
            url: prod.image_url || "/images/packaged.jpg",
            type: "front",
            label: "Front View",
            sort_order: 0,
          },
        ],
    );

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

  function addGalleryImage(type: ProductImageType = "additional", defaultUrl: string = "") {
    if (galleryImages.length >= 8) {
      toast.error("Maximum 8 images allowed per product");
      return;
    }
    const newId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const label =
      type === "front"
        ? "Front View"
        : type === "back"
          ? "Back / Nutrition"
          : type === "detail"
            ? "Detail View"
            : `Additional Photo ${galleryImages.length + 1}`;

    setGalleryImages((prev) => [
      ...prev,
      {
        id: newId,
        url: defaultUrl || "/images/packaged.jpg",
        type,
        label,
        sort_order: prev.length,
      },
    ]);
  }

  function updateGalleryImage(id: string, field: keyof GalleryImageItem, value: any) {
    setGalleryImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)),
    );
  }

  function removeGalleryImage(id: string) {
    if (galleryImages.length <= 1) {
      toast.error("At least one product image is required");
      return;
    }
    setGalleryImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (!filtered.some((img) => img.type === "front") && filtered.length > 0) {
        filtered[0]!.type = "front";
      }
      return filtered.map((img, idx) => ({ ...img, sort_order: idx }));
    });
  }

  function setPrimaryImage(id: string) {
    setGalleryImages((prev) => {
      const targetIndex = prev.findIndex((img) => img.id === id);
      if (targetIndex === -1) return prev;
      const target = prev[targetIndex]!;
      const remaining = prev.filter((img) => img.id !== id);

      const updatedTarget: GalleryImageItem = { ...target, type: "front", sort_order: 0 };
      const updatedRemaining = remaining.map((img, idx) => ({
        ...img,
        type: img.type === "front" ? ("additional" as ProductImageType) : img.type,
        sort_order: idx + 1,
      }));

      return [updatedTarget, ...updatedRemaining];
    });
    toast.success("Designated as primary front image");
  }

  function moveGalleryImage(index: number, direction: "up" | "down") {
    setGalleryImages((prev) => {
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const copy = [...prev];
      const temp = copy[index]!;
      copy[index] = copy[targetIdx]!;
      copy[targetIdx] = temp;

      return copy.map((img, idx) => ({ ...img, sort_order: idx }));
    });
  }

  async function handleFileUpload(id: string, file: File) {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (PNG, JPG, WebP, SVG)");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file is too large (max 10 MB allowed)");
      return;
    }

    const toastId = toast.loading("Optimizing and processing photo...");
    try {
      const optimizedUrl = await uploadProductImage(file);
      updateGalleryImage(id, "url", optimizedUrl);
      toast.success("Photo uploaded and applied successfully!", { id: toastId });
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to process image file", { id: toastId });
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

    // Determine primary Front image and full images array
    const primary =
      galleryImages.find((img) => img.type === "front") ||
      galleryImages[0] || { url: "/images/packaged.jpg" };

    const cleanImages: ProductImage[] = galleryImages
      .filter((img) => img.url && img.url.trim().length > 0)
      .map((img, idx) => ({
        url: img.url.trim(),
        type: img.type,
        label: img.label.trim() || undefined,
        sort_order: idx,
      }));

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
            image_url: primary.url.trim() || "/images/packaged.jpg",
            images: cleanImages as unknown as string[],
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
            image_url: primary.url.trim() || "/images/packaged.jpg",
            images: cleanImages as unknown as string[],
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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6B746F]" />
            <Input
              placeholder="Search products by name or brand (Fortune, Tata, Maggi)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 rounded-xl text-xs border-[#E8E4DA] bg-[#FAF8F2]/60 focus:bg-white h-11"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl text-xs font-semibold border-[#E8E4DA] bg-[#FAF8F2]/60 h-11">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {parentCategories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={openAddModal}
          className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-11 text-xs shadow-xs shrink-0"
        >
          <Plus className="mr-1.5 size-4" /> Add Product
        </Button>
      </div>

      {/* Products List: Mobile Cards + Desktop Table */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-12 text-center text-xs text-[#6B746F]">
          <Package className="mx-auto size-8 text-[#6B746F]/40 mb-2" />
          <p className="font-bold text-[#1F2924]">No products found</p>
          <p className="text-[11px] text-[#6B746F] mt-1">Click "Add Product" to add grocery items to your store.</p>
        </div>
      ) : (
        <>
          {/* Mobile Product Cards (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filteredProducts.map((p) => {
              const vars = p.product_variants ?? [];
              const totalStock = vars.reduce((s, v) => s + v.stock, 0);
              const minPrice = vars.length ? Math.min(...vars.map((v) => Number(v.price))) : 0;
              const maxPrice = vars.length ? Math.max(...vars.map((v) => Number(v.price))) : 0;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage(p)}
                      alt={p.name}
                      className="size-14 rounded-xl object-contain bg-[#FAF8F2] border border-[#E8E4DA] p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-[#6B746F]">
                          {p.brand || "Arun Gopal"}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${totalStock === 0
                              ? "bg-red-100 text-red-700"
                              : totalStock <= 10
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                        >
                          {totalStock === 0 ? "Out of Stock" : `${totalStock} in stock`}
                        </span>
                      </div>
                      <p className="font-semibold text-[#1F2924] text-xs leading-snug line-clamp-1">
                        {p.name}
                      </p>
                      <p className="font-sans font-extrabold text-[#145A45] text-sm mt-0.5">
                        {minPrice === maxPrice
                          ? inr(minPrice)
                          : `${inr(minPrice)} – ${inr(maxPrice)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-[#E8E4DA]/60">
                    {vars.map((v) => (
                      <span
                        key={v.id}
                        className="rounded-md border border-[#E8E4DA] bg-[#FAF8F2] px-1.5 py-0.5 text-[10px] text-[#1F2924]"
                      >
                        {v.label}: {inr(v.price)}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E4DA]">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[36px] text-xs font-bold transition-colors ${p.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-600"
                        }`}
                    >
                      {p.is_active ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      {p.is_active ? "Active" : "Hidden"}
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => openEditModal(p)}
                        variant="outline"
                        className="h-10 rounded-xl text-xs font-semibold px-3.5 border-[#E8E4DA] bg-white text-[#145A45] hover:bg-[#FAF8F2]"
                      >
                        <Edit2 className="mr-1 size-3.5" /> Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(p)}
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-xl text-red-600 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Product Table (>= sm) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E4DA] bg-[#FAF8F2]/60 text-[#6B746F]">
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">Brand &amp; Category</th>
                    <th className="py-3 px-4 font-semibold">Variants / Sizes</th>
                    <th className="py-3 px-4 font-semibold">Price Range</th>
                    <th className="py-3 px-4 font-semibold">Total Stock</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DA]">
                  {filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    const vars = p.product_variants ?? [];
                    const totalStock = vars.reduce((s, v) => s + v.stock, 0);
                    const minPrice = vars.length
                      ? Math.min(...vars.map((v) => Number(v.price)))
                      : 0;
                    const maxPrice = vars.length
                      ? Math.max(...vars.map((v) => Number(v.price)))
                      : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F2]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              className="size-11 rounded-xl object-contain bg-[#FAF8F2] border border-[#E8E4DA] p-1"
                            />
                            <div className="min-w-0 max-w-[200px]">
                              <p className="truncate font-semibold text-[#1F2924]">{p.name}</p>
                              <span className="text-[10px] text-[#6B746F] font-mono">
                                /{p.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#1F2924]">{p.brand || "—"}</p>
                          <p className="text-[#6B746F]">{cat?.name || "General"}</p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {vars.map((v) => (
                              <span
                                key={v.id}
                                className="rounded-md border border-[#E8E4DA] bg-[#FAF8F2] px-1.5 py-0.5 text-[10px] text-[#1F2924]"
                              >
                                {v.label} ({inr(v.price)})
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-[#1F2924] font-sans">
                            {minPrice === maxPrice
                              ? inr(minPrice)
                              : `${inr(minPrice)} – ${inr(maxPrice)}`}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`rounded-md px-2 py-0.5 font-bold ${totalStock === 0
                                ? "bg-red-100 text-red-700"
                                : totalStock <= 10
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                          >
                            {totalStock === 0 ? "Out of Stock" : `${totalStock} units`}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${p.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-600"
                              }`}
                          >
                            {p.is_active ? (
                              <Eye className="size-3" />
                            ) : (
                              <EyeOff className="size-3" />
                            )}
                            {p.is_active ? "Active" : "Hidden"}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              onClick={() => openEditModal(p)}
                              variant="outline"
                              size="icon"
                              className="size-7.5 rounded-lg border-[#E8E4DA] text-[#145A45] hover:bg-[#FAF8F2]"
                              aria-label="Edit"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteProduct(p)}
                              variant="ghost"
                              size="icon"
                              className="size-7.5 rounded-lg text-red-600 hover:bg-red-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
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

      {/* Add / Edit Product Modal (Organized, Mobile-Friendly) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
          <DialogHeader className="border-b border-[#E8E4DA] pb-3">
            <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
              {editingProduct ? `Edit "${editingProduct.name}"` : "Add New Grocery Product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 py-2">
            {/* Section 1: Basic Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#145A45]">
                1. Basic Information
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-[#1F2924]">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Fortune Chakki Fresh Atta"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">
                    URL Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="fortune-chakki-fresh-atta"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#1F2924]">Brand / Manufacturer</Label>
                  <Input
                    placeholder="e.g. Fortune, Tata, MDH, Amul"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="rounded-xl border-[#E8E4DA] text-xs h-9"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-[#1F2924]">Primary Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-9">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: Variants, Pricing & Stock */}
            <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF8F2] p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-sans font-bold text-xs sm:text-sm text-[#1F2924]">
                    2. Pack Sizes, Pricing &amp; Inventory
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#6B746F]">
                    Set pack label, MRP, selling price, and stock quantity.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addVariantRow}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs border-[#E8E4DA] bg-white text-[#145A45] hover:bg-[#FAF8F2] h-7.5"
                >
                  <Plus className="size-3.5 mr-1" /> Add Pack
                </Button>
              </div>

              <div className="space-y-2.5">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white p-3 border border-[#E8E4DA] text-xs shadow-2xs space-y-2"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                      <div>
                        <Label className="text-[10px] text-[#6B746F] font-semibold">Pack Label</Label>
                        <Input
                          placeholder="e.g. 5 kg"
                          value={v.label}
                          onChange={(e) => updateVariant(idx, "label", e.target.value)}
                          className="h-8 text-xs rounded-lg border-[#E8E4DA]"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] text-[#6B746F] font-semibold">MRP (₹)</Label>
                        <Input
                          type="number"
                          placeholder="300"
                          value={v.mrp}
                          onChange={(e) => updateVariant(idx, "mrp", Number(e.target.value))}
                          className="h-8 text-xs rounded-lg border-[#E8E4DA]"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] text-[#6B746F] font-semibold">Selling (₹)</Label>
                        <Input
                          type="number"
                          placeholder="275"
                          value={v.price}
                          onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                          className="h-8 text-xs rounded-lg border-[#E8E4DA]"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] text-[#6B746F] font-semibold">Stock Qty</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))}
                          className="h-8 text-xs rounded-lg border-[#E8E4DA]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex-1">
                          <Label className="text-[10px] text-[#6B746F] font-semibold">Low Alert</Label>
                          <Input
                            type="number"
                            placeholder="5"
                            value={v.low_stock_threshold}
                            onChange={(e) =>
                              updateVariant(idx, "low_stock_threshold", Number(e.target.value))
                            }
                            className="h-8 text-xs rounded-lg border-[#E8E4DA]"
                          />
                        </div>
                        {variants.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeVariantRow(idx)}
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-600 hover:bg-red-50 mt-3"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Product Images Gallery */}
            <div className="rounded-2xl border border-[#E5E0D5] bg-[#FAF8F2] p-3.5 sm:p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-sans font-bold text-xs sm:text-sm text-[#16201A] flex items-center gap-2">
                    <ImageIcon className="size-4 text-[#145A45]" />
                    3. Product Images Gallery
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#5A655F]">
                    Upload and manage Front (Primary), Back (Packaging &amp; Nutrition), Detail, and Additional photos.
                  </p>
                </div>

                {/* Quick Add Image Slot Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    onClick={() => addGalleryImage("front")}
                    variant="outline"
                    size="sm"
                    className="h-7.5 rounded-lg text-xs border-[#E5E0D5] bg-white text-[#145A45] hover:bg-[#FAF8F2] shadow-2xs"
                  >
                    <Plus className="size-3 mr-1" /> Front
                  </Button>
                  <Button
                    type="button"
                    onClick={() => addGalleryImage("back")}
                    variant="outline"
                    size="sm"
                    className="h-7.5 rounded-lg text-xs border-[#E5E0D5] bg-white text-[#D97706] hover:bg-[#FAF8F2] shadow-2xs"
                  >
                    <Plus className="size-3 mr-1" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => addGalleryImage("detail")}
                    variant="outline"
                    size="sm"
                    className="h-7.5 rounded-lg text-xs border-[#E5E0D5] bg-white text-emerald-700 hover:bg-[#FAF8F2] shadow-2xs"
                  >
                    <Plus className="size-3 mr-1" /> Detail
                  </Button>
                  <Button
                    type="button"
                    onClick={() => addGalleryImage("additional")}
                    variant="outline"
                    size="sm"
                    className="h-7.5 rounded-lg text-xs border-[#E5E0D5] bg-white text-[#5A655F] hover:bg-[#FAF8F2] shadow-2xs"
                  >
                    <Plus className="size-3 mr-1" /> Photo
                  </Button>
                </div>
              </div>

              {/* Image Cards Stack */}
              <div className="space-y-3">
                {galleryImages.map((img, idx) => {
                  const isPrimary = img.type === "front" || idx === 0;

                  return (
                    <div
                      key={img.id}
                      className={`rounded-xl bg-white p-3 border transition-all shadow-2xs space-y-2.5 ${isPrimary
                          ? "border-[#145A45]/50 ring-1 ring-[#145A45]/30 bg-white"
                          : "border-[#E5E0D5]"
                        }`}
                    >
                      {/* Image Header: Type, Primary Badge, Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D5]/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#5A655F]">
                            #{idx + 1}
                          </span>

                          <Select
                            value={img.type}
                            onValueChange={(val) =>
                              updateGalleryImage(img.id, "type", val as ProductImageType)
                            }
                          >
                            <SelectTrigger className="h-7 rounded-md text-[11px] font-semibold border-[#E5E0D5] bg-[#FAF8F2] w-40">
                              <SelectValue placeholder="Slot Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="front" className="text-xs">
                                🌾 Front (Primary Image)
                              </SelectItem>
                              <SelectItem value="back" className="text-xs">
                                📦 Back (Nutrition / MRP)
                              </SelectItem>
                              <SelectItem value="detail" className="text-xs">
                                🔍 Detail (Label / Seal)
                              </SelectItem>
                              <SelectItem value="additional" className="text-xs">
                                🖼️ Additional Photo
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {isPrimary && (
                            <span className="rounded-md bg-[#E6EFE8] px-2 py-0.5 text-[10px] font-bold text-[#0F4A38] border border-[#145A45]/30 flex items-center gap-1">
                              <Star className="size-3 fill-[#0F4A38]" /> Primary
                            </span>
                          )}
                        </div>

                        {/* Image Actions: Move, Set Primary, Remove */}
                        <div className="flex items-center gap-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(img.id)}
                              title="Make Primary Front Image"
                              className="flex h-7 items-center gap-1 rounded-md border border-[#E5E0D5] bg-[#FAF8F2] px-2 text-[10px] font-bold text-[#145A45] hover:bg-white active:scale-95"
                            >
                              <Star className="size-3" /> Make Front
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => moveGalleryImage(idx, "up")}
                            disabled={idx === 0}
                            title="Move Up"
                            className="flex size-7 items-center justify-center rounded-md border border-[#E5E0D5] text-[#5A655F] hover:bg-[#FAF8F2] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => moveGalleryImage(idx, "down")}
                            disabled={idx === galleryImages.length - 1}
                            title="Move Down"
                            className="flex size-7 items-center justify-center rounded-md border border-[#E5E0D5] text-[#5A655F] hover:bg-[#FAF8F2] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>

                          {galleryImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(img.id)}
                              title="Delete Image"
                              className="flex size-7 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 active:scale-95 ml-1"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Content Row: Preview, URL Input, Upload Button, Label Input */}
                      <div className="grid gap-3 sm:grid-cols-[5rem_1fr] items-start">
                        {/* Thumbnail Preview */}
                        <div className="relative size-20 rounded-xl bg-[#FAF8F2] border border-[#E5E0D5] p-1 flex items-center justify-center overflow-hidden shrink-0 mx-auto sm:mx-0">
                          <img
                            src={img.url || "/images/packaged.jpg"}
                            alt={img.label || "Preview"}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                            }}
                            className="size-full object-contain"
                          />
                        </div>

                        {/* Inputs: URL, File Upload, Label */}
                        <div className="space-y-2 text-xs">
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <Input
                                placeholder="https://... or /images/atta.jpg"
                                value={img.url}
                                onChange={(e) => updateGalleryImage(img.id, "url", e.target.value)}
                                className="h-8 text-xs rounded-lg border-[#E5E0D5]"
                              />
                            </div>

                            {/* File Upload Trigger */}
                            <label className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#E5E0D5] bg-[#FAF8F2] px-2.5 text-[11px] font-semibold text-[#16201A] hover:bg-white active:scale-95 cursor-pointer shadow-2xs">
                              <Upload className="size-3 text-[#145A45]" />
                              <span>Upload File</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(img.id, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Image Caption (e.g. Front packaging, Nutrition table, Purity mark)"
                              value={img.label}
                              onChange={(e) => updateGalleryImage(img.id, "label", e.target.value)}
                              className="h-7 text-xs rounded-lg border-[#E5E0D5] text-[#5A655F]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Grocery Presets Selector */}
              <div className="space-y-1.5 pt-1 border-t border-[#E5E0D5]/60">
                <Label className="text-[11px] font-semibold text-[#5A655F]">
                  Quick Presets (Click to apply to primary image):
                </Label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "🌾 Atta", url: "/images/atta.jpg" },
                    { label: "🍚 Rice", url: "/images/rice.jpg" },
                    { label: "🫘 Dal", url: "/images/dal.jpg" },
                    { label: "🛢️ Mustard Oil", url: "/images/fortune_mustard_oil_1787801798943.jpg" },
                    { label: "🧈 Amul Ghee", url: "/images/amul_desi_ghee_1787801851052.jpg" },
                    { label: "🌶️ Spices", url: "/images/spices.jpg" },
                    { label: "🧂 Tata Salt", url: "/images/tata_salt_pack_1787801868973.jpg" },
                    { label: "🍪 Parle-G", url: "/images/parle_g_biscuits_1787801925687.jpg" },
                    { label: "🥨 Bhujia", url: "/images/haldirams_aloo_bhujia_1787801945399.jpg" },
                    { label: "🍫 Cadbury", url: "/images/cadbury_dairy_milk_1787801969771.jpg" },
                    { label: "🍯 Honey", url: "/images/dabur_honey_jar_1787802014923.jpg" },
                    { label: "🧼 Surf Excel", url: "/images/surf_excel_detergent_1787801991917.jpg" },
                    { label: "📦 General Pack", url: "/images/packaged.jpg" },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        if (galleryImages.length > 0) {
                          updateGalleryImage(galleryImages[0]!.id, "url", preset.url);
                          toast.success(`Applied ${preset.label} image`);
                        }
                      }}
                      className="rounded-md border border-[#E5E0D5] bg-white px-2 py-1 text-[10px] font-medium text-[#16201A] hover:bg-[#E6EFE8] hover:border-[#145A45]/40 transition-colors shadow-2xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Highlights */}
              <div className="space-y-1 pt-2 border-t border-[#E5E0D5]/60">
                <Label className="text-xs font-semibold text-[#16201A]">
                  Description / Product Highlights
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Pure whole wheat chakki atta with natural dietary fiber, 0% maida..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs border-[#E5E0D5] bg-white"
                />
              </div>
            </div>

            {/* Section 4: Visibility & Badges */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-[#E8E4DA]">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1F2924]">
                <Checkbox checked={isFeatured} onCheckedChange={(c) => setIsFeatured(Boolean(c))} />
                <span>Featured on Homepage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1F2924]">
                <Checkbox checked={isPopular} onCheckedChange={(c) => setIsPopular(Boolean(c))} />
                <span>Popular in Maharajganj</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1F2924]">
                <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(Boolean(c))} />
                <span>Active &amp; Visible</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E4DA]">
              <Button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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
                {isSaving ? "Saving…" : editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

