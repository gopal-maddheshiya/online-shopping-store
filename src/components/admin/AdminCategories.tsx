import { useState } from "react";
import { Plus, Edit2, Trash2, FolderPlus, Upload, ImageIcon, X, Check, Search, ChevronRight, Languages } from "lucide-react";
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
import { broadcastProductSync } from "@/lib/realtime-sync";
import { compressAndOptimizeImage } from "@/lib/image-upload";
import type { Category } from "@/lib/queries";

type AdminCategoriesProps = {
  categories: Category[];
  onRefresh: () => void;
};

export function AdminCategories({ categories, onRefresh }: AdminCategoriesProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🛒");
  const [imageUrl, setImageUrl] = useState("/images/packaged.jpg");
  const [parentId, setParentId] = useState<string>("none");
  const [sortOrder, setSortOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const parentCategories = categories.filter((c) => !c.parent_id);

  function openAddModal(parent?: Category) {
    setEditingCategory(null);
    setName("");
    setNameHi("");
    setSlug("");
    setIcon("🛒");
    setImageUrl("/images/packaged.jpg");
    setParentId(parent ? parent.id : "none");
    setSortOrder(categories.length);
    setIsModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name_en || cat.name);
    setNameHi(cat.name_hi || "");
    setSlug(cat.slug);
    setIcon(cat.icon ?? "🛒");
    setImageUrl(cat.image_url ?? "/images/packaged.jpg");
    setParentId(cat.parent_id ?? "none");
    setSortOrder(cat.sort_order);
    setIsModalOpen(true);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Please enter a category name");
      return;
    }
    if (!slug.trim()) {
      toast.error("Please enter a category slug");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: trimmedName,
        name_en: trimmedName,
        name_hi: nameHi.trim() || null,
        slug: slug.trim(),
        icon: icon.trim() || null,
        image_url: imageUrl.trim() || null,
        parent_id: parentId === "none" ? null : parentId,
        sort_order: sortOrder,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success(`Category "${trimmedName}" updated!`);
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success(`Category "${trimmedName}" created!`);
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      broadcastProductSync({ action: "update" });

      setIsModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save category";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    const subs = categories.filter((c) => c.parent_id === cat.id);
    const isParent = subs.length > 0;
    const confirmMsg = isParent
      ? `"${cat.name}" has ${subs.length} subcategories. Deleting it will leave subcategories as orphans. Continue?`
      : `Are you sure you want to delete "${cat.name}"?`;

    if (!confirm(confirmMsg)) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;
      toast.success(`Category "${cat.name}" deleted`);

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      broadcastProductSync({ action: "update" });

      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  // Filter categories based on search
  const filteredParents = parentCategories.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.name_hi?.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3.5 sm:p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-sans font-bold text-base sm:text-lg text-[#1F2924] flex items-center gap-2">
            <FolderPlus className="size-4.5 text-[#145A45]" />
            Grocery Categories &amp; Subcategories
          </h3>
          <p className="text-xs text-[#6B746F]">
            Manage the catalogue hierarchy for Arun Gopal Traders.
          </p>
        </div>
        <Button
          onClick={() => openAddModal()}
          className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-11 text-xs shadow-xs shrink-0"
        >
          <Plus className="mr-1.5 size-4" /> Add Category
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5A655F]" />
        <Input
          placeholder="Search categories by name, slug, or Hindi name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 rounded-xl border-[#E8E4DA] text-xs h-10 bg-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#1F2924]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredParents.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-[#E8E4DA] bg-white/50 p-8 text-center">
            <p className="text-sm text-[#5A655F] font-medium">
              {searchTerm ? "No categories match your search." : "No categories yet. Click 'Add Category' to create one."}
            </p>
          </div>
        )}

        {filteredParents.map((parent) => {
          const subs = categories.filter((c) => c.parent_id === parent.id);
          const filteredSubs = subs.filter((s) => {
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            return (
              s.name.toLowerCase().includes(term) ||
              s.name_hi?.toLowerCase().includes(term) ||
              s.slug.toLowerCase().includes(term)
            );
          });

          return (
            <div
              key={parent.id}
              className="rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]">
                    {parent.icon ?? "🌾"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans font-bold text-sm sm:text-base text-[#1F2924] truncate">
                      {parent.name_en || parent.name}
                    </h4>
                    {parent.name_hi && (
                      <p className="text-[11px] text-[#145A45] font-semibold truncate">
                        🇮🇳 {parent.name_hi}
                      </p>
                    )}
                    <span className="text-[10px] text-[#6B746F] font-mono block truncate">
                      /{parent.slug}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => openEditModal(parent)}
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl text-[#145A45] hover:bg-[#FAF8F2]"
                    aria-label="Edit category"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCategory(parent)}
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl text-red-600 hover:bg-red-50"
                    aria-label="Delete category"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Subcategories List */}
              <div className="space-y-1.5 border-t border-[#E8E4DA]/60 pt-2.5">
                <div className="flex items-center justify-between text-xs text-[#6B746F]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Subcategories ({subs.length})
                  </span>
                  <button
                    onClick={() => openAddModal(parent)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#145A45] hover:underline p-1"
                  >
                    <Plus className="size-3" /> Add Sub
                  </button>
                </div>

                <div className="space-y-1.5">
                  {filteredSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="group/sub flex items-center justify-between gap-2 rounded-lg border border-[#E8E4DA] bg-[#FAF8F2] hover:bg-white hover:border-[#145A45]/40 px-2.5 py-1.5 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#6B746F]">└</span>
                          <span className="text-xs font-semibold text-[#1F2924] truncate">
                            {sub.name_en || sub.name}
                          </span>
                          {sub.name_hi && (
                            <span className="text-[10px] text-[#145A45] font-medium truncate">
                              / {sub.name_hi}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-60 group-hover/sub:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEditModal(sub)}
                          className="size-7 grid place-items-center rounded-md text-[#145A45] hover:bg-[#E6EFE8] transition-colors"
                          aria-label="Edit subcategory"
                          title="Edit subcategory"
                        >
                          <Edit2 className="size-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(sub)}
                          className="size-7 grid place-items-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          aria-label="Delete subcategory"
                          title="Delete subcategory"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredSubs.length === 0 && subs.length > 0 && (
                    <span className="text-[11px] italic text-[#6B746F]">
                      No subcategories match your search.
                    </span>
                  )}
                  {subs.length === 0 && (
                    <span className="text-[11px] italic text-[#6B746F]">
                      No subcategories yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
          <DialogHeader className="border-b border-[#E8E4DA] pb-3">
            <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
              {editingCategory ? (
                <>
                  <Edit2 className="size-4 text-[#145A45]" />
                  Edit Category
                </>
              ) : (
                <>
                  <Plus className="size-4 text-[#145A45]" />
                  Add Category / Subcategory
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-3.5 py-2">
            {/* Bilingual Names Section */}
            <div className="space-y-2.5 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#145A45]">
                <Languages className="size-3" />
                Bilingual Category Name
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2924] flex items-center justify-between">
                  <span>
                    Name (English) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-[#5A655F] font-normal">Primary</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Edible Oils & Ghee"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2924] flex items-center justify-between">
                  <span>Name (Hindi / हिंदी)</span>
                  <span className="text-[10px] text-[#5A655F] font-normal">Optional</span>
                </Label>
                <Input
                  placeholder="जैसे: खाने-पीने का सामान"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9 bg-white"
                />
                {nameHi && (
                  <p className="text-[10px] text-[#145A45] font-medium flex items-center gap-1">
                    <Check className="size-3" /> Preview: 🇮🇳 {nameHi}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">
                URL Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="edible-oils-ghee"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Emoji / Icon</Label>
                <Input
                  placeholder="🛢️"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="rounded-xl text-center text-lg border-[#E8E4DA] h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#1F2924]">Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">
                Parent Category{" "}
                <span className="text-[10px] text-[#5A655F] font-normal">
                  (for subcategories)
                </span>
              </Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-9">
                  <SelectValue placeholder="Top-level Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    None (Top-Level Category)
                  </SelectItem>
                  {parentCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name_en || c.name}
                        {c.name_hi ? ` (${c.name_hi})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {parentId !== "none" && (
                <p className="text-[10px] text-[#5A655F] flex items-center gap-1">
                  <ChevronRight className="size-3" /> This will be a subcategory
                </p>
              )}
            </div>

            {/* Image Section */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2924]">Category Image</Label>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-[#145A45]/20 bg-[#E6EFE8] hover:bg-[#D4E8DC] px-3 py-1.5 text-[11px] font-bold text-[#145A45] transition-all">
                  <Upload className="size-3.5" />
                  <span>
                    {imageUrl && imageUrl !== "/images/packaged.jpg"
                      ? "Change Image"
                      : "Upload from Device"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        toast.loading("Uploading category image...", {
                          id: "cat-img-upload",
                        });
                        const { dataUrl, blob } = await compressAndOptimizeImage(
                          file,
                          800,
                          800,
                          0.9,
                        );

                        const fileName = `cat_${Date.now()}.webp`;
                        const filePath = `categories/${fileName}`;
                        const { data: uploadData, error: uploadError } =
                          await supabase.storage
                            .from("product-images")
                            .upload(filePath, blob, {
                              cacheControl: "31536000",
                              upsert: true,
                              contentType: blob.type || "image/webp",
                            });

                        if (!uploadError && uploadData) {
                          const { data: pubData } = supabase.storage
                            .from("product-images")
                            .getPublicUrl(filePath);
                          if (pubData?.publicUrl) {
                            setImageUrl(pubData.publicUrl);
                            toast.success("Image uploaded!", {
                              id: "cat-img-upload",
                            });
                            return;
                          }
                        }

                        setImageUrl(dataUrl);
                        toast.success("Image saved (fallback)!", {
                          id: "cat-img-upload",
                        });
                      } catch {
                        toast.error("Failed to upload image", {
                          id: "cat-img-upload",
                        });
                      }
                      e.target.value = "";
                    }}
                  />
                </label>

                <span className="text-[10px] text-[#6B746F]">or</span>

                <div className="flex-1">
                  <Input
                    placeholder="Paste image URL here..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="rounded-xl text-xs border-[#E8E4DA] h-8"
                  />
                </div>
              </div>

              <p className="text-[10px] text-[#6B746F]">
                Upload from your device or paste any image URL. Square images (1:1) work best.
              </p>

              {imageUrl && imageUrl !== "/images/packaged.jpg" ? (
                <div className="mt-1 rounded-xl overflow-hidden border border-[#E8E4DA] shadow-xs relative size-20 bg-white p-1.5">
                  <img
                    src={imageUrl}
                    alt="Category preview"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="mt-1 rounded-xl border-2 border-dashed border-[#E8E4DA] bg-[#FAF8F2] size-20 flex flex-col items-center justify-center gap-1">
                  <ImageIcon className="size-5 text-[#C5BEA8]" />
                </div>
              )}
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
                {isSaving ? "Saving…" : editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
