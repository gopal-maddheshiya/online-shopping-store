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
import { useQueryClient } from "@tanstack/react-query";
import { inr, discountPercent } from "@/lib/format";
import { getProductImage, getProductImages, getImageTypeLabel } from "@/lib/product-images";
import { uploadProductImage } from "@/lib/image-upload";
import { broadcastProductSync } from "@/lib/realtime-sync";
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
  const queryClient = useQueryClient();
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

  // Dedicated Front & Back Image State
  const [frontImageUrl, setFrontImageUrl] = useState("");
  const [frontImageLabel, setFrontImageLabel] = useState("Front View");
  const [backImageUrl, setBackImageUrl] = useState("");
  const [backImageLabel, setBackImageLabel] = useState("Back / Nutrition");
  const [additionalImages, setAdditionalImages] = useState<
    { id: string; url: string; label: string }[]
  >([]);

  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [uploadingAdditionalId, setUploadingAdditionalId] = useState<string | null>(null);

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
    setFrontImageUrl("");
    setFrontImageLabel("Front View");
    setBackImageUrl("");
    setBackImageLabel("Back / Nutrition");
    setAdditionalImages([]);
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

    const parsedImages = getProductImages(prod);
    const front = parsedImages.find((img) => img.type === "front") || parsedImages[0];
    const back =
      parsedImages.find((img) => img.type === "back") ||
      (parsedImages.length > 1 && parsedImages[1] !== front ? parsedImages[1] : undefined);
    const extras = parsedImages.filter((img) => img !== front && img !== back);

    setFrontImageUrl(front?.url || prod.image_url || "");
    setFrontImageLabel(front?.label || "Front View");
    setBackImageUrl(back?.url || "");
    setBackImageLabel(back?.label || "Back / Nutrition");
    setAdditionalImages(
      extras.map((img, idx) => ({
        id: `extra-${idx}-${Date.now()}`,
        url: img.url,
        label: img.label || `Photo ${idx + 3}`,
      })),
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

  async function handleUploadFront(file: File) {
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
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large (max 10 MB allowed)");
      return;
    }

    setIsUploadingFront(true);
    const toastId = toast.loading("Optimizing and processing front photo...");
    try {
      const url = await uploadProductImage(file);
      setFrontImageUrl(url);
      toast.success("Front photo uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Upload front error:", err);
      toast.error("Failed to process front image file", { id: toastId });
    } finally {
      setIsUploadingFront(false);
    }
  }

  async function handleUploadBack(file: File) {
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
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large (max 10 MB allowed)");
      return;
    }

    setIsUploadingBack(true);
    const toastId = toast.loading("Optimizing and processing back photo...");
    try {
      const url = await uploadProductImage(file);
      setBackImageUrl(url);
      toast.success("Back photo uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Upload back error:", err);
      toast.error("Failed to process back image file", { id: toastId });
    } finally {
      setIsUploadingBack(false);
    }
  }

  async function handleUploadAdditional(id: string, file: File) {
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
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large (max 10 MB allowed)");
      return;
    }

    setUploadingAdditionalId(id);
    const toastId = toast.loading("Optimizing and processing photo...");
    try {
      const url = await uploadProductImage(file);
      setAdditionalImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, url } : img)),
      );
      toast.success("Photo uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Upload additional error:", err);
      toast.error("Failed to process image file", { id: toastId });
    } finally {
      setUploadingAdditionalId(null);
    }
  }

  function addAdditionalImageSlot() {
    if (additionalImages.length >= 6) {
      toast.error("Maximum 6 additional photos allowed");
      return;
    }
    const newId = `extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setAdditionalImages((prev) => [
      ...prev,
      {
        id: newId,
        url: "",
        label: `Photo ${prev.length + 3}`,
      },
    ]);
  }

  function removeAdditionalImageSlot(id: string) {
    setAdditionalImages((prev) => prev.filter((img) => img.id !== id));
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

    // Build structured clean images array
    const cleanImages: ProductImage[] = [];

    // 1. Front View (sort_order: 0)
    if (frontImageUrl.trim()) {
      cleanImages.push({
        url: frontImageUrl.trim(),
        type: "front",
        label: frontImageLabel.trim() || "Front View",
        sort_order: 0,
      });
    }

    // 2. Back / Nutrition View (sort_order: 1)
    if (backImageUrl.trim()) {
      cleanImages.push({
        url: backImageUrl.trim(),
        type: "back",
        label: backImageLabel.trim() || "Back / Nutrition",
        sort_order: 1,
      });
    }

    // 3. Additional Photos (sort_order: 2+)
    additionalImages.forEach((img, idx) => {
      if (img.url.trim()) {
        cleanImages.push({
          url: img.url.trim(),
          type: "additional",
          label: img.label.trim() || `Photo ${idx + 3}`,
          sort_order: 2 + idx,
        });
      }
    });

    const primaryUrl = frontImageUrl.trim() || backImageUrl.trim() || "/images/packaged.jpg";
    const stringifiedImages = cleanImages.map((img) => JSON.stringify(img));

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
            image_url: primaryUrl,
            images: stringifiedImages as unknown as string[],
            is_featured: isFeatured,
            is_popular: isPopular,
            is_active: isActive,
          })
          .eq("id", editingProduct.id);

        if (prodError) throw prodError;

        // 2. Clean up removed variants
        const activeVariantIds = new Set(variants.map((v) => v.id).filter(Boolean));
        const existingDbVariants = editingProduct.product_variants ?? [];
        for (const dbv of existingDbVariants) {
          if (!activeVariantIds.has(dbv.id)) {
            await supabase.from("product_variants").delete().eq("id", dbv.id);
          }
        }

        // 3. Upsert active variants
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
            image_url: primaryUrl,
            images: stringifiedImages as unknown as string[],
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

      // Invalidate all product queries across the storefront and broadcast in realtime
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      broadcastProductSync({ slug: slug.trim(), action: "update" });

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

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      broadcastProductSync({ productId: prod.id, slug: prod.slug, action: "delete" });

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

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      broadcastProductSync({ productId: prod.id, slug: prod.slug, action: "status" });

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

            {/* Section 3: Dedicated Front & Back Product Images */}
            <div className="rounded-2xl border border-[#E5E0D5] bg-[#FAF8F2] p-3.5 sm:p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-sans font-bold text-xs sm:text-sm text-[#16201A] flex items-center gap-2">
                    <ImageIcon className="size-4 text-[#145A45]" />
                    3. Product Images (Front &amp; Back Photos)
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#5A655F]">
                    Upload crisp photos for front display and back packaging/nutrition. Both are independently editable.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={addAdditionalImageSlot}
                  variant="outline"
                  size="sm"
                  className="h-7.5 rounded-lg text-xs border-[#E5E0D5] bg-white text-[#145A45] hover:bg-[#FAF8F2] shadow-2xs"
                >
                  <Plus className="size-3 mr-1" /> Add Extra Photo
                </Button>
              </div>

              {/* Grid: 1. Front Image Card & 2. Back Image Card */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* 1. Front Image (Primary) */}
                <div className="rounded-2xl bg-white p-3.5 border-2 border-[#145A45]/40 ring-1 ring-[#145A45]/20 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E0D5]/70 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-[#E6EFE8] px-2 py-0.5 text-[10px] font-bold text-[#0F4A38] border border-[#145A45]/30 flex items-center gap-1">
                        <Star className="size-3 fill-[#0F4A38]" /> Front Image (मुख्य फोटो)
                      </span>
                    </div>
                    {frontImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFrontImageUrl("")}
                        className="text-[10px] font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    {/* Thumbnail */}
                    <div className="relative size-20 rounded-xl bg-[#FAF8F2] border border-[#E5E0D5] p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={frontImageUrl || "/images/packaged.jpg"}
                        alt="Front View Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                        }}
                        className="size-full object-contain"
                      />
                    </div>

                    {/* Actions & Inputs */}
                    <div className="flex-1 space-y-2 text-xs">
                      <label className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#145A45]/40 bg-[#E6EFE8]/70 text-[#0F4A38] px-2.5 text-[11px] font-bold hover:bg-[#E6EFE8] active:scale-98 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="size-3.5" />
                        <span>{isUploadingFront ? "Uploading..." : "Upload Front Photo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadFront(file);
                          }}
                          disabled={isUploadingFront}
                          className="hidden"
                        />
                      </label>

                      <Input
                        placeholder="Or enter Front Image URL"
                        value={frontImageUrl}
                        onChange={(e) => setFrontImageUrl(e.target.value)}
                        className="h-7 text-xs rounded-lg border-[#E5E0D5]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Back Image (Nutrition / Details) */}
                <div className="rounded-2xl bg-white p-3.5 border border-[#E5E0D5] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E0D5]/70 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-[#FAF8F2] px-2 py-0.5 text-[10px] font-bold text-[#5A655F] border border-[#E5E0D5] flex items-center gap-1">
                        <Boxes className="size-3 text-[#5A655F]" /> Back Image (पीछे का फोटो / पोषण)
                      </span>
                    </div>
                    {backImageUrl && (
                      <button
                        type="button"
                        onClick={() => setBackImageUrl("")}
                        className="text-[10px] font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    {/* Thumbnail */}
                    <div className="relative size-20 rounded-xl bg-[#FAF8F2] border border-[#E5E0D5] p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={backImageUrl || "/images/packaged.jpg"}
                        alt="Back View Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                        }}
                        className="size-full object-contain"
                      />
                    </div>

                    {/* Actions & Inputs */}
                    <div className="flex-1 space-y-2 text-xs">
                      <label className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#E5E0D5] bg-[#FAF8F2] text-[#1F2924] px-2.5 text-[11px] font-bold hover:bg-white active:scale-98 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="size-3.5 text-[#145A45]" />
                        <span>{isUploadingBack ? "Uploading..." : "Upload Back Photo"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadBack(file);
                          }}
                          disabled={isUploadingBack}
                          className="hidden"
                        />
                      </label>

                      <Input
                        placeholder="Or enter Back Image URL"
                        value={backImageUrl}
                        onChange={(e) => setBackImageUrl(e.target.value)}
                        className="h-7 text-xs rounded-lg border-[#E5E0D5]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Additional Image Slots (if any) */}
              {additionalImages.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-[#E5E0D5]/70">
                  <Label className="text-xs font-bold text-[#16201A]">Additional Product Photos</Label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {additionalImages.map((addImg, idx) => (
                      <div
                        key={addImg.id}
                        className="rounded-xl bg-white p-2.5 border border-[#E5E0D5] flex items-center gap-2.5 text-xs shadow-2xs"
                      >
                        <div className="relative size-14 rounded-lg bg-[#FAF8F2] border border-[#E5E0D5] p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={addImg.url || "/images/packaged.jpg"}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                            }}
                            className="size-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1">
                            <Input
                              placeholder="Image URL"
                              value={addImg.url}
                              onChange={(e) =>
                                setAdditionalImages((prev) =>
                                  prev.map((item) =>
                                    item.id === addImg.id ? { ...item, url: e.target.value } : item,
                                  ),
                                )
                              }
                              className="h-6.5 text-[11px] rounded-md border-[#E5E0D5]"
                            />
                            <label className="flex h-6.5 shrink-0 items-center gap-1 rounded-md border border-[#E5E0D5] bg-[#FAF8F2] px-2 text-[10px] font-bold text-[#145A45] hover:bg-white cursor-pointer">
                              <Upload className="size-2.5" />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadAdditional(addImg.id, file);
                                }}
                                disabled={uploadingAdditionalId === addImg.id}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAdditionalImageSlot(addImg.id)}
                          className="size-6 text-red-500 hover:text-red-700 flex items-center justify-center shrink-0"
                          title="Remove Photo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Grocery Presets Selector */}
              <div className="space-y-1.5 pt-2 border-t border-[#E5E0D5]/60">
                <Label className="text-[11px] font-semibold text-[#5A655F]">
                  Quick Presets (Click to set as Front Image):
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
                        setFrontImageUrl(preset.url);
                        toast.success(`Set Front Image to ${preset.label}`);
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

