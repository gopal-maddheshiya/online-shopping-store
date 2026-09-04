import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Upload,
  ImageIcon,
  X,
  Check,
  Search,
  Languages,
  Layers,
  Settings,
  AlertTriangle,
} from "lucide-react";
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
import {
  getCategoryHeadings,
  saveCategoryHeadings,
  moveCategorySlugToHeading,
  removeCategorySlugFromHeadings,
  type CategoryHeading,
} from "@/lib/category-headings";

type AdminCategoriesProps = {
  categories: Category[];
  onRefresh: () => void;
  onNavigateToSettings?: () => void;
};

export function AdminCategories({ categories, onRefresh, onNavigateToSettings }: AdminCategoriesProps) {
  const queryClient = useQueryClient();

  // Headings state
  const [headings, setHeadings] = useState<CategoryHeading[]>(getCategoryHeadings());
  
  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHeadingModalOpen, setIsHeadingModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingHeading, setEditingHeading] = useState<CategoryHeading | null>(null);

  // Category Form State
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🛒");
  const [imageUrl, setImageUrl] = useState("/images/packaged.jpg");
  const [selectedHeadingId, setSelectedHeadingId] = useState<string>("food");
  const [sortOrder, setSortOrder] = useState(0);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Heading Form State
  const [headingTitleHi, setHeadingTitleHi] = useState("");
  const [headingTitleEn, setHeadingTitleEn] = useState("");
  const [headingIcon, setHeadingIcon] = useState("📦");
  const [headingSortOrder, setHeadingSortOrder] = useState(1);
  const [headingBannerUrl, setHeadingBannerUrl] = useState("");
  const [isUploadingHeadingBanner, setIsUploadingHeadingBanner] = useState(false);
  const [isSavingHeading, setIsSavingHeading] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Sync headings listener
  useEffect(() => {
    const handleUpdate = () => setHeadings(getCategoryHeadings());
    window.addEventListener("agt:headings-updated", handleUpdate);
    return () => window.removeEventListener("agt:headings-updated", handleUpdate);
  }, []);

  // Top level categories only
  const parentCategories = categories.filter((c) => !c.parent_id);

  // Helper to find which heading a category slug belongs to
  function getCategoryHeadingId(categorySlug: string): string {
    for (const h of headings) {
      if (h.slugs.includes(categorySlug)) return h.id;
    }
    return headings[0]?.id || "food";
  }

  // --- Category Modal Handlers ---
  function openAddCategoryModal(targetHeadingId?: string) {
    setEditingCategory(null);
    setName("");
    setNameHi("");
    setSlug("");
    setIcon("🛒");
    setImageUrl("/images/packaged.jpg");
    setSelectedHeadingId(targetHeadingId || headings[0]?.id || "food");
    setSortOrder(categories.length);
    setIsCategoryModalOpen(true);
  }

  function openEditCategoryModal(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name_en || cat.name);
    setNameHi(cat.name_hi || "");
    setSlug(cat.slug);
    setIcon(cat.icon ?? "🛒");
    setImageUrl(cat.image_url ?? "/images/packaged.jpg");
    setSelectedHeadingId(getCategoryHeadingId(cat.slug));
    setSortOrder(cat.sort_order || 0);
    setIsCategoryModalOpen(true);
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
      toast.error("कृपया कैटेगरी का नाम दर्ज करें");
      return;
    }
    if (!slug.trim()) {
      toast.error("कृपया कैटेगरी स्लग दर्ज करें");
      return;
    }

    setIsSavingCategory(true);
    try {
      const payload = {
        name: trimmedName,
        name_en: trimmedName,
        name_hi: nameHi.trim() || null,
        slug: slug.trim(),
        icon: icon.trim() || "🛒",
        image_url: imageUrl.trim() || "/images/packaged.jpg",
        parent_id: null,
        sort_order: sortOrder,
        is_active: true,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        moveCategorySlugToHeading(selectedHeadingId, slug.trim());
        toast.success(`कैटेगरी "${nameHi || trimmedName}" अपडेट हो गई!`);
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        moveCategorySlugToHeading(selectedHeadingId, slug.trim());
        toast.success(`कैटेगरी "${nameHi || trimmedName}" जुड़ गई!`);
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      broadcastProductSync({ action: "update" });
      setIsCategoryModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save category";
      toast.error(msg);
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    const confirmMsg = `क्या आप वाकई "${cat.name_hi || cat.name}" कैटेगरी को हटाना चाहते हैं?`;
    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;

      removeCategorySlugFromHeadings(cat.slug);
      toast.success(`कैटेगरी "${cat.name_hi || cat.name}" हटा दी गई`);

      queryClient.invalidateQueries({ queryKey: ["categories"] });
      broadcastProductSync({ action: "update" });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  // --- Heading Modal Handlers ---
  async function handleHeadingBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHeadingBanner(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        const { error: catErr } = await supabase.storage
          .from("categories")
          .upload(filePath, file, { upsert: true });
        if (catErr) throw uploadError;
        const { data } = supabase.storage.from("categories").getPublicUrl(filePath);
        setHeadingBannerUrl(data.publicUrl);
      } else {
        const { data } = supabase.storage.from("products").getPublicUrl(filePath);
        setHeadingBannerUrl(data.publicUrl);
      }
      toast.success("सब-हीरो बैनर इमेज अपलोड हो गई!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Banner upload failed";
      toast.error(`अपलोड विफल: ${msg}`);
    } finally {
      setIsUploadingHeadingBanner(false);
    }
  }

  function openAddHeadingModal() {
    setEditingHeading(null);
    setHeadingTitleHi("");
    setHeadingTitleEn("");
    setHeadingIcon("📦");
    setHeadingBannerUrl("");
    setHeadingSortOrder(headings.length + 1);
    setIsHeadingModalOpen(true);
  }

  function openEditHeadingModal(h: CategoryHeading) {
    setEditingHeading(h);
    setHeadingTitleHi(h.title_hi);
    setHeadingTitleEn(h.title_en);
    setHeadingIcon(h.icon || "📦");
    setHeadingBannerUrl(h.banner_image_url || "");
    setHeadingSortOrder(h.sort_order || 1);
    setIsHeadingModalOpen(true);
  }

  function handleSaveHeading(e: React.FormEvent) {
    e.preventDefault();
    if (!headingTitleHi.trim() || !headingTitleEn.trim()) {
      toast.error("कृपया हेडिंग का हिंदी और अंग्रेजी दोनों नाम दर्ज करें");
      return;
    }

    setIsSavingHeading(true);
    try {
      const currentList = [...getCategoryHeadings()];

      if (editingHeading) {
        const idx = currentList.findIndex((h) => h.id === editingHeading.id);
        if (idx !== -1) {
          currentList[idx] = {
            ...currentList[idx],
            title_hi: headingTitleHi.trim(),
            title_en: headingTitleEn.trim(),
            icon: headingIcon.trim() || "📦",
            sort_order: headingSortOrder,
            banner_image_url: headingBannerUrl.trim() || null,
          };
          saveCategoryHeadings(currentList);
          setHeadings(currentList);
          toast.success(`हेडिंग "${headingTitleHi}" अपडेट हो गई!`);
        }
      } else {
        const newId = `sec_${Date.now()}`;
        const newHeading: CategoryHeading = {
          id: newId,
          title_hi: headingTitleHi.trim(),
          title_en: headingTitleEn.trim(),
          icon: headingIcon.trim() || "📦",
          sort_order: headingSortOrder,
          banner_sub: null,
          banner_image_url: headingBannerUrl.trim() || null,
          slugs: [],
        };
        currentList.push(newHeading);
        saveCategoryHeadings(currentList);
        setHeadings(currentList);
        toast.success(`नई हेडिंग "${headingTitleHi}" जुड़ गई!`);
      }

      setIsHeadingModalOpen(false);
    } catch {
      toast.error("हेडिंग सेव करने में विफलता");
    } finally {
      setIsSavingHeading(false);
    }
  }

  function handleDeleteHeading(h: CategoryHeading) {
    if (headings.length <= 1) {
      toast.error("कम से कम 1 हेडिंग रहनी आवश्यक है!");
      return;
    }
    if (!confirm(`क्या आप हेडिंग "${h.title_hi}" को हटाना चाहते हैं? इसके अंदर की श्रेणियां पहली हेडिंग में ट्रांसफर हो जाएंगी।`)) {
      return;
    }

    const currentList = getCategoryHeadings().filter((item) => item.id !== h.id);
    if (currentList[0] && h.slugs.length > 0) {
      currentList[0].slugs = Array.from(new Set([...currentList[0].slugs, ...h.slugs]));
    }
    saveCategoryHeadings(currentList);
    setHeadings(currentList);
    toast.success(`हेडिंग "${h.title_hi}" हटा दी गई`);
  }

  // Filter categories by search
  const cleanSearch = searchTerm.trim().toLowerCase();
  const searchMatches = (c: Category) => {
    if (!cleanSearch) return true;
    return (
      c.name.toLowerCase().includes(cleanSearch) ||
      (c.name_hi && c.name_hi.toLowerCase().includes(cleanSearch)) ||
      c.slug.toLowerCase().includes(cleanSearch)
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-4 sm:p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-sans font-bold text-lg sm:text-xl text-[#1F2924] flex items-center gap-2">
            <Layers className="size-5 text-[#145A45]" />
            स्टोर कैटेगरीज एवं हेडिंग्स (Store Categories &amp; Sections)
          </h3>
          <p className="text-xs text-[#6B746F] mt-0.5">
            होमपेज के अनुसार हेडिंग्स में व्यवस्थित कैटेगरीज। नया हेडिंग जोड़ें, नाम बदलें या कैटेगरीज मैनेज करें।
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            onClick={openAddHeadingModal}
            variant="outline"
            className="rounded-xl font-bold border-[#145A45]/30 text-[#145A45] hover:bg-[#E6EFE8] h-10 text-xs shadow-2xs"
          >
            <FolderPlus className="mr-1.5 size-4" /> + नया हेडिंग जोड़ें
          </Button>

          <Button
            onClick={() => openAddCategoryModal()}
            className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-10 text-xs shadow-xs"
          >
            <Plus className="mr-1.5 size-4" /> + नई कैटेगरी जोड़ें
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#5A655F]" />
        <Input
          placeholder="कैटेगरी खोजें (हिंदी नाम, English name, or slug)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 rounded-xl border-[#E8E4DA] text-xs h-10 bg-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A655F] hover:text-[#1F2924]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Grouped Categories by Headings */}
      <div className="space-y-6 sm:space-y-8">
        {headings.map((heading) => {
          // Find categories assigned to this heading
          const headingCategories = parentCategories.filter(
            (c) => heading.slugs.includes(c.slug) && searchMatches(c)
          );

          return (
            <div
              key={heading.id}
              className="rounded-3xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-4 sm:p-6 shadow-xs space-y-4"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E4DA] pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl size-10 grid place-items-center rounded-2xl bg-white border border-[#E8E4DA] shadow-2xs shrink-0">
                    {heading.icon || "📦"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-sans font-bold text-base sm:text-lg text-[#16201A]">
                        {heading.title_hi}
                      </h4>
                      <span className="text-xs text-[#5A655F] font-normal">
                        ({heading.title_en})
                      </span>
                    </div>
                    <p className="text-[11px] text-[#145A45] font-semibold">
                      {headingCategories.length} श्रेणियाँ (Categories)
                    </p>
                  </div>
                </div>

                {/* Heading Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                  <Button
                    onClick={() => openAddCategoryModal(heading.id)}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold border-[#145A45]/30 text-[#145A45] hover:bg-[#E6EFE8] h-8 shadow-2xs"
                  >
                    <Plus className="mr-1 size-3.5" /> इस हेडिंग में जोड़ें
                  </Button>

                  <Button
                    onClick={() => openEditHeadingModal(heading)}
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs text-[#5A655F] hover:text-[#16201A] hover:bg-white h-8"
                    title="Edit Heading Details"
                  >
                    <Edit2 className="mr-1 size-3.5" /> एडिट हेडिंग
                  </Button>

                  <Button
                    onClick={() => handleDeleteHeading(heading)}
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                    title="Delete Heading"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sub-Hero Banner Guide Note */}
              <div className="rounded-xl border border-[#E5E0D5] bg-white px-3.5 py-2 flex items-center justify-between text-xs text-[#5A655F]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-[#145A45] shrink-0" />
                  <span>
                    इस हेडिंग का <strong>सब-हीरो बैनर</strong> होमपेज पर दिखाने के लिए <strong>Store Settings ➔ Homepage</strong> में बैनर अपलोड करें।
                  </span>
                </div>
                {onNavigateToSettings && (
                  <button
                    onClick={onNavigateToSettings}
                    className="text-[11px] font-bold text-[#145A45] hover:underline flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Settings className="size-3" /> सेटिंग्स में जाएं
                  </button>
                )}
              </div>

              {/* Categories Grid under this Heading */}
              {headingCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8E4DA] bg-white p-6 text-center">
                  <p className="text-xs text-[#5A655F]">
                    {cleanSearch
                      ? "इस हेडिंग में कोई कैटेगरी सर्च से मैच नहीं हुई।"
                      : "इस हेडिंग के अंदर अभी कोई कैटेगरी नहीं है। ऊपर दिए '+ इस हेडिंग में जोड़ें' बटन से कैटेगरी जोड़ें।"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {headingCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group rounded-2xl border border-[#E8E4DA] bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF8F2] border border-[#E8E4DA] mb-2 p-1.5 flex items-center justify-center">
                        <img
                          src={cat.image_url || "/images/packaged.jpg"}
                          alt={cat.name_hi || cat.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="space-y-0.5 text-center min-w-0">
                        <h5 className="font-sans font-bold text-xs sm:text-sm text-[#16201A] truncate" title={cat.name_hi || cat.name}>
                          {cat.name_hi || cat.name}
                        </h5>
                        <p className="text-[11px] text-[#5A655F] truncate" title={cat.name_en || cat.name}>
                          {cat.name_en || cat.name}
                        </p>
                        <span className="inline-block text-[9px] font-mono text-[#6B746F] bg-[#FAF8F2] px-1.5 py-0.5 rounded border border-[#E8E4DA] truncate max-w-full">
                          /{cat.slug}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-2.5 pt-2 border-t border-[#E8E4DA] flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-1.5 rounded-lg text-[#145A45] hover:bg-[#E6EFE8] transition-colors cursor-pointer"
                          title="कैटेगरी एडिट करें"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="कैटेगरी डिलीट करें"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════
          ADD / EDIT CATEGORY MODAL
          ════════════════════════════════════════════════════════════ */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
          <DialogHeader className="border-b border-[#E8E4DA] pb-3">
            <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
              {editingCategory ? (
                <>
                  <Edit2 className="size-5 text-[#145A45]" />
                  कैटेगरी एडिट करें (Edit Category)
                </>
              ) : (
                <>
                  <Plus className="size-5 text-[#145A45]" />
                  नई कैटेगरी जोड़ें (Add New Category)
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
            {/* Heading Assignment */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F2924]">
                हेडिंग / सेक्शन चुनें (Assign to Section) <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedHeadingId} onValueChange={setSelectedHeadingId}>
                <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white font-medium">
                  <SelectValue placeholder="हेडिंग चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {headings.map((h) => (
                    <SelectItem key={h.id} value={h.id} className="text-xs">
                      {h.icon} {h.title_hi} ({h.title_en})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bilingual Name */}
            <div className="space-y-3 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#145A45]">
                <Languages className="size-3.5" />
                द्विभाषी नाम (Bilingual Category Names)
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1F2924]">
                  हिंदी नाम (Hindi Name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="जैसे: मैदा और बेसन, बासमती चावल"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9.5 bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1F2924]">
                  अंग्रेजी नाम (English Name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Maida and Besan, Basmati Rice"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-9.5 bg-white font-medium"
                />
              </div>
            </div>

            {/* Slug & Icon */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-[#1F2924]">
                  URL Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="atta-flour"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9.5 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1F2924]">Emoji</Label>
                <Input
                  placeholder="🌾"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="rounded-xl text-center text-base border-[#E8E4DA] h-9.5 bg-white"
                />
              </div>
            </div>

            {/* Image Upload / URL */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1F2924]">कैटेगरी फोटो (Image)</Label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-[#145A45]/30 bg-[#E6EFE8] hover:bg-[#D4E8DC] px-3.5 py-2 text-xs font-bold text-[#145A45] transition-all shrink-0">
                  <Upload className="size-3.5" />
                  <span>डिवाइस से अपलोड करें</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        toast.loading("Uploading category image...", { id: "cat-upload" });
                        const { blob } = await compressAndOptimizeImage(file, 800, 800, 0.9);
                        const fileName = `cat_${Date.now()}.webp`;
                        const filePath = `categories/${fileName}`;
                        const { error } = await supabase.storage
                          .from("product-images")
                          .upload(filePath, blob, {
                            cacheControl: "31536000",
                            upsert: true,
                            contentType: "image/webp",
                          });
                        if (error) throw error;
                        const { data: pubData } = supabase.storage
                          .from("product-images")
                          .getPublicUrl(filePath);
                        if (pubData?.publicUrl) {
                          setImageUrl(pubData.publicUrl);
                          toast.success("फोटो अपलोड सफल!", { id: "cat-upload" });
                        }
                      } catch {
                        toast.error("फोटो अपलोड में विफलता", { id: "cat-upload" });
                      }
                      e.target.value = "";
                    }}
                  />
                </label>

                <Input
                  placeholder="या इमेज URL यहाँ पेस्ट करें..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="rounded-xl text-xs border-[#E8E4DA] h-9.5 bg-white flex-1"
                />
              </div>

              {imageUrl && (
                <div className="mt-1 size-16 rounded-xl border border-[#E8E4DA] bg-white p-1 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E4DA]">
              <Button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                variant="outline"
                className="rounded-xl text-xs h-10 border-[#E8E4DA]"
              >
                रद्द करें (Cancel)
              </Button>

              <Button
                type="submit"
                disabled={isSavingCategory}
                className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-10 text-xs shadow-xs"
              >
                {isSavingCategory ? "सेव हो रहा है..." : editingCategory ? "कैटेगरी अपडेट करें" : "कैटेगरी जोड़ें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════
          ADD / EDIT HEADING MODAL
          ════════════════════════════════════════════════════════════ */}
      <Dialog open={isHeadingModalOpen} onOpenChange={setIsHeadingModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-[#E8E4DA] bg-white">
          <DialogHeader className="border-b border-[#E8E4DA] pb-3">
            <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
              {editingHeading ? (
                <>
                  <Edit2 className="size-5 text-[#145A45]" />
                  हेडिंग एडिट करें (Edit Heading)
                </>
              ) : (
                <>
                  <FolderPlus className="size-5 text-[#145A45]" />
                  नया हेडिंग जोड़ें (Add New Heading)
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveHeading} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F2924]">
                हेडिंग का नाम (हिंदी में) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="जैसे: खाने-पीने का सामान, घर की सफ़ाई व बर्तन"
                value={headingTitleHi}
                onChange={(e) => setHeadingTitleHi(e.target.value)}
                className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F2924]">
                हेडिंग का नाम (English में) <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Food & Kitchen Essentials, Household & Cleaning"
                value={headingTitleEn}
                onChange={(e) => setHeadingTitleEn(e.target.value)}
                className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1F2924]">आइकॉन / Emoji</Label>
                <Input
                  placeholder="🍲"
                  value={headingIcon}
                  onChange={(e) => setHeadingIcon(e.target.value)}
                  className="rounded-xl text-center text-lg border-[#E8E4DA] h-10 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1F2924]">क्रम (Sort Order)</Label>
                <Input
                  type="number"
                  value={headingSortOrder}
                  onChange={(e) => setHeadingSortOrder(Number(e.target.value))}
                  className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white"
                />
              </div>
            </div>

            {/* Sub-Hero Banner Image */}
            <div className="space-y-2 pt-2 border-t border-[#E8E4DA]/70">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1F2924] flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-[#145A45]" />
                  सब-हीरो बैनर (Sub-Hero Banner - वैकल्पिक)
                </Label>
                {headingBannerUrl && (
                  <button
                    type="button"
                    onClick={() => setHeadingBannerUrl("")}
                    className="text-[10px] text-red-600 hover:underline font-semibold"
                  >
                    हटाएं
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#6B746F] leading-tight">
                यह इमेज होमपेज पर इस हेडिंग के ठीक नीचे और कैटेगरीज़ के ठीक ऊपर दिखाई देगी।
              </p>

              {headingBannerUrl && (
                <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-[#E8E4DA] bg-neutral-100 shadow-2xs">
                  <img
                    src={headingBannerUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="https://... या इमेज फ़ाइल अपलोड करें"
                  value={headingBannerUrl}
                  onChange={(e) => setHeadingBannerUrl(e.target.value)}
                  className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white"
                />
                <label className="flex items-center justify-center gap-1.5 px-3 rounded-xl border border-[#E8E4DA] bg-[#FAF8F2] hover:bg-[#E6EFE8] cursor-pointer shrink-0 text-xs font-bold text-[#145A45] transition-colors">
                  <Upload className="size-4" />
                  <span>{isUploadingHeadingBanner ? "..." : "अपलोड"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeadingBannerUpload}
                    className="hidden"
                    disabled={isUploadingHeadingBanner}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E4DA]">
              <Button
                type="button"
                onClick={() => setIsHeadingModalOpen(false)}
                variant="outline"
                className="rounded-xl text-xs h-10 border-[#E8E4DA]"
              >
                रद्द करें
              </Button>

              <Button
                type="submit"
                disabled={isSavingHeading}
                className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-10 text-xs shadow-xs"
              >
                {isSavingHeading ? "सेव हो रहा है..." : editingHeading ? "हेडिंग अपडेट करें" : "हेडिंग जोड़ें"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
