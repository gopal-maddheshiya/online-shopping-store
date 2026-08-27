import { useState } from "react";
import { Plus, Edit2, Trash2, FolderPlus, Layers, ArrowUpDown } from "lucide-react";
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
import type { Category } from "@/lib/queries";

type AdminCategoriesProps = {
  categories: Category[];
  onRefresh: () => void;
};

export function AdminCategories({ categories, onRefresh }: AdminCategoriesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🛒");
  const [imageUrl, setImageUrl] = useState("/images/packaged.jpg");
  const [parentId, setParentId] = useState<string>("none");
  const [sortOrder, setSortOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = categories.filter((c) => !c.parent_id);

  function openAddModal(parent?: Category) {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setIcon("🛒");
    setImageUrl("/images/packaged.jpg");
    setParentId(parent ? parent.id : "none");
    setSortOrder(categories.length);
    setIsModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name);
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
    if (!name.trim()) {
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
        name: name.trim(),
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
        toast.success(`Category "${name}" updated!`);
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success(`Category "${name}" created!`);
      }

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
    if (
      !confirm(
        `Are you sure you want to delete "${cat.name}"? Products in this category may lose their category link.`,
      )
    )
      return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;
      toast.success(`Category "${cat.name}" deleted`);
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

      {/* Categories Grid */}
      <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {parentCategories.map((parent) => {
          const subs = categories.filter((c) => c.parent_id === parent.id);

          return (
            <div key={parent.id} className="rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]">{parent.icon ?? "🌾"}</span>
                  <div className="min-w-0">
                    <h4 className="font-sans font-bold text-sm sm:text-base text-[#1F2924] truncate">
                      {parent.name}
                    </h4>
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

              {/* Subcategories Chips */}
              <div className="space-y-1.5 border-t border-[#E8E4DA]/60 pt-2.5">
                <div className="flex items-center justify-between text-xs text-[#6B746F]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Subcategories ({subs.length})</span>
                  <button
                    onClick={() => openAddModal(parent)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#145A45] hover:underline p-1"
                  >
                    <FolderPlus className="size-3" /> + Add Sub
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {subs.map((sub) => (
                    <div
                      key={sub.id}
                      className="group/sub inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DA] bg-[#FAF8F2] px-2.5 py-1 text-xs text-[#1F2924]"
                    >
                      <span>{sub.name}</span>
                      <button
                        onClick={() => openEditModal(sub)}
                        className="text-[#6B746F] hover:text-[#145A45]"
                        aria-label="Edit subcategory"
                      >
                        <Edit2 className="size-3" />
                      </button>
                    </div>
                  ))}
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
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
          <DialogHeader className="border-b border-[#E8E4DA] pb-3">
            <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
              {editingCategory
                ? `Edit Category "${editingCategory.name}"`
                : "Add Category / Subcategory"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Edible Oils & Ghee"
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
              <Label className="text-xs font-semibold text-[#1F2924]">Parent Category (For Subcategories)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-9">
                  <SelectValue placeholder="Top-level Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None (Top-Level Category)</SelectItem>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#1F2924]">Image URL / Asset</Label>
              <Input
                placeholder="/images/oil.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rounded-xl text-xs border-[#E8E4DA] h-9"
              />
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

