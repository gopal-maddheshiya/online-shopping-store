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
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">
            Grocery Categories &amp; Subcategories
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage the full departmental catalogue hierarchy for Arun Gopal Traders.
          </p>
        </div>
        <Button onClick={() => openAddModal()} className="rounded-xl font-bold shadow-xs">
          <Plus className="mr-1.5 size-4" /> Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {parentCategories.map((parent) => {
          const subs = categories.filter((c) => c.parent_id === parent.id);

          return (
            <div key={parent.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{parent.icon ?? "🌾"}</span>
                  <div>
                    <h4 className="font-display font-bold text-base text-foreground">
                      {parent.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      /{parent.slug}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => openEditModal(parent)}
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg"
                    aria-label="Edit"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCategory(parent)}
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-destructive hover:bg-destructive/10"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Subcategories list */}
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Subcategories ({subs.length})</span>
                  <button
                    onClick={() => openAddModal(parent)}
                    className="text-primary hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="size-3" /> Add sub
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {subs.length > 0 ? (
                    subs.map((sub) => (
                      <span
                        key={sub.id}
                        onClick={() => openEditModal(sub)}
                        className="group flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs transition-colors hover:border-primary"
                      >
                        <span>{sub.name}</span>
                        <Edit2 className="size-2.5 opacity-0 group-hover:opacity-100 text-primary" />
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] italic text-muted-foreground">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCategory
                ? `Edit Category "${editingCategory.name}"`
                : "Add Category / Subcategory"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Edible Oils & Ghee"
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
                placeholder="edible-oils-ghee"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Emoji / Icon</Label>
                <Input
                  placeholder="🛢️"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="rounded-xl text-center text-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Parent Category (For Subcategories)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Top-level Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-Level Category)</SelectItem>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Image URL / Asset</Label>
              <Input
                placeholder="/images/oil.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
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
                {isSaving ? "Saving…" : editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
