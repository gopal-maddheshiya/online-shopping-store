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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { broadcastProductSync } from "@/lib/realtime-sync";
import { compressAndOptimizeImage } from "@/lib/image-upload";
import { settingsQuery, type Category } from "@/lib/queries";
import {
  getCategoryHeadings,
  saveCategoryHeadings,
  moveCategorySlugToHeading,
  removeCategorySlugFromHeadings,
  type CategoryHeading,
} from "@/lib/category-headings";

type AdminCategoriesProps = {
  categories: Category[];
  categoryHeadings?: CategoryHeading[] | null | undefined;
  onRefresh: () => void;
  onNavigateToSettings?: () => void;
};

export function AdminCategories({
  categories,
  categoryHeadings,
  onRefresh,
  onNavigateToSettings,
}: AdminCategoriesProps) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery(settingsQuery);

  // Headings state (initialized from prop / DB first, fallback to storage)
  const [headings, setHeadings] = useState<CategoryHeading[]>(() =>
    getCategoryHeadings(categoryHeadings),
  );

  useEffect(() => {
    if (categoryHeadings && Array.isArray(categoryHeadings) && categoryHeadings.length > 0) {
      setHeadings(getCategoryHeadings(categoryHeadings));
    }
  }, [categoryHeadings]);
  
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
  const [headingBannerSub, setHeadingBannerSub] = useState<"hero2" | "hero3" | "hero4" | null>(null);
  const [headingBannerSource, setHeadingBannerSource] = useState<"none" | "custom" | "hero2" | "hero3" | "hero4">("none");
  const [isUploadingHeadingBanner, setIsUploadingHeadingBanner] = useState(false);
  const [isSavingHeading, setIsSavingHeading] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Sync headings listener
  useEffect(() => {
    const handleUpdate = () => setHeadings(getCategoryHeadings(categoryHeadings));
    window.addEventListener("agt:headings-updated", handleUpdate);
    return () => window.removeEventListener("agt:headings-updated", handleUpdate);
  }, [categoryHeadings]);

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
        const updated = moveCategorySlugToHeading(selectedHeadingId, slug.trim(), headings);
        setHeadings(updated);
        toast.success(`कैटेगरी "${nameHi || trimmedName}" अपडेट हो गई!`);
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        const updated = moveCategorySlugToHeading(selectedHeadingId, slug.trim(), headings);
        setHeadings(updated);
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

      const updated = removeCategorySlugFromHeadings(cat.slug, headings);
      setHeadings(updated);
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
      toast.loading("सब-हीरो बैनर कंप्रेस व अपलोड हो रहा है...", { id: "heading-banner-upload" });
      const { blob } = await compressAndOptimizeImage(file, 1920, 1080, 0.9);

      const fileName = `custom_banner_${editingHeading?.id || "new"}_${Date.now()}.webp`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, blob, {
          cacheControl: "31536000",
          upsert: true,
          contentType: blob.type || "image/webp",
        });

      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      if (pubData?.publicUrl) {
        setHeadingBannerUrl(pubData.publicUrl);
        setHeadingBannerSub(null);
        setHeadingBannerSource("custom");
        toast.success("सब-हीरो बैनर इमेज अपलोड हो गई!", { id: "heading-banner-upload" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Banner upload failed";
      toast.error(`अपलोड विफल: ${msg}`, { id: "heading-banner-upload" });
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
    setHeadingBannerSub(null);
    setHeadingBannerSource("none");
    setHeadingSortOrder(headings.length + 1);
    setIsHeadingModalOpen(true);
  }

  function openEditHeadingModal(h: CategoryHeading) {
    setEditingHeading(h);
    setHeadingTitleHi(h.title_hi);
    setHeadingTitleEn(h.title_en);
    setHeadingIcon(h.icon || "📦");
    setHeadingBannerUrl(h.banner_image_url || "");
    setHeadingBannerSub(h.banner_sub || null);
    if (h.banner_sub) {
      setHeadingBannerSource(h.banner_sub);
    } else if (h.banner_image_url) {
      setHeadingBannerSource("custom");
    } else {
      setHeadingBannerSource("none");
    }
    setHeadingSortOrder(h.sort_order || 1);
    setIsHeadingModalOpen(true);
  }

  async function handleSaveHeading(e: React.FormEvent) {
    e.preventDefault();
    if (!headingTitleHi.trim() || !headingTitleEn.trim()) {
      toast.error("कृपया हेडिंग का हिंदी और अंग्रेजी दोनों नाम दर्ज करें");
      return;
    }

    setIsSavingHeading(true);
    try {
      const currentList = [...getCategoryHeadings()];
      let finalBannerSub: "hero2" | "hero3" | "hero4" | null = null;
      let finalBannerUrl: string | null = null;

      if (headingBannerSource === "hero2" || headingBannerSource === "hero3" || headingBannerSource === "hero4") {
        finalBannerSub = headingBannerSource;
        finalBannerUrl = null;
      } else if (headingBannerSource === "custom" && headingBannerUrl.trim()) {
        finalBannerSub = null;
        finalBannerUrl = headingBannerUrl.trim();
      }

      if (editingHeading) {
        const idx = currentList.findIndex((h) => h.id === editingHeading.id);
        const target = currentList[idx];
        if (target) {
          currentList[idx] = {
            ...target,
            id: target.id,
            slugs: target.slugs || [],
            title_hi: headingTitleHi.trim(),
            title_en: headingTitleEn.trim(),
            icon: headingIcon.trim() || "📦",
            sort_order: headingSortOrder,
            banner_sub: finalBannerSub,
            banner_image_url: finalBannerUrl,
          };
          await saveCategoryHeadings(currentList);
          setHeadings(currentList);
          queryClient.invalidateQueries({ queryKey: ["store-settings"] });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          onRefresh();
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
          banner_sub: finalBannerSub,
          banner_image_url: finalBannerUrl,
          slugs: [],
        };
        currentList.push(newHeading);
        await saveCategoryHeadings(currentList);
        setHeadings(currentList);
        queryClient.invalidateQueries({ queryKey: ["store-settings"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        onRefresh();
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

  function handleQuickAssign(slug: string, headingId: string) {
    const updated = moveCategorySlugToHeading(headingId, slug, headings);
    setHeadings(updated);
    toast.success("कैटेगरी को हेडिंग में जोड़ दिया गया!");
    onRefresh();
  }

  const allAssignedSlugs = new Set(headings.flatMap((h) => h.slugs));
  const unassignedCategories = parentCategories.filter(
    (c) => !allAssignedSlugs.has(c.slug) && searchMatches(c),
  );

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

      {/* Unassigned Categories Section (if any category lacks a heading) */}
      {unassignedCategories.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl size-9 grid place-items-center rounded-xl bg-amber-100 border border-amber-300 text-amber-800 shrink-0">
                ⚠️
              </span>
              <div>
                <h4 className="font-sans font-bold text-sm sm:text-base text-amber-900 leading-tight">
                  बिना हेडिंग वाली कैटेगरीज ({unassignedCategories.length})
                </h4>
                <p className="text-[11px] text-amber-800">
                  ये कैटेगरीज किसी हेडिंग में सेट नहीं हैं। ड्रॉपडाउन से उन्हें किसी हेडिंग में जोड़ें।
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {unassignedCategories.map((cat) => {
              const hasHindi = Boolean(cat.name_hi && cat.name_hi.trim());
              const primaryName = hasHindi ? cat.name_hi : (cat.name_en || cat.name);
              const secondaryName = hasHindi ? (cat.name_en || cat.name) : null;

              return (
                <div
                  key={cat.id}
                  className="group rounded-2xl border border-amber-200 bg-white p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF8F2] border border-[#E8E4DA]/70 mb-2 p-2 flex items-center justify-center">
                    <img
                      src={cat.image_url || "/images/packaged.jpg"}
                      alt={primaryName ?? ""}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                      }}
                    />
                  </div>

                  <div className="text-center min-w-0 px-0.5 space-y-0.5 flex-1 flex flex-col justify-center">
                    <h5
                      className="font-sans font-bold text-xs text-[#16201A] leading-snug line-clamp-1 pb-0.5 overflow-visible"
                      title={primaryName ?? undefined}
                    >
                      {primaryName}
                    </h5>
                    {secondaryName && secondaryName.toLowerCase() !== primaryName?.toLowerCase() && (
                      <p
                        className="text-[11px] text-[#6B746F] font-medium leading-tight line-clamp-1 truncate"
                        title={secondaryName}
                      >
                        {secondaryName}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#E8E4DA]/70 space-y-1.5">
                    <Select onValueChange={(targetHId) => handleQuickAssign(cat.slug, targetHId)}>
                      <SelectTrigger className="h-7 text-[10px] font-bold bg-[#FAF8F2] border-[#E8E4DA] text-[#145A45] rounded-lg">
                        <SelectValue placeholder="हेडिंग चुनें..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headings.map((h) => (
                          <SelectItem key={h.id} value={h.id} className="text-xs">
                            {h.icon} {h.title_hi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditCategoryModal(cat)}
                        className="h-6 flex-1 rounded-md text-[10px] font-semibold text-[#145A45] hover:bg-[#145A45]/10 px-1"
                      >
                        एडिट
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(cat)}
                        className="size-6 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grouped Categories by Headings */}
      <div className="space-y-6 sm:space-y-8">
        {headings.map((heading) => {
          // Find categories assigned to this heading
          const headingCategories = parentCategories.filter(
            (c) => heading.slugs.includes(c.slug) && searchMatches(c),
          );

          return (
            <div
              key={heading.id}
              className="rounded-3xl border border-[#E8E4DA] bg-[#FAF8F2]/60 p-4 sm:p-6 shadow-xs space-y-4"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E4DA] pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl size-11 grid place-items-center rounded-2xl bg-white border border-[#E8E4DA] shadow-2xs shrink-0">
                    {heading.icon || "📦"}
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-sans font-bold text-base sm:text-lg text-[#16201A] leading-snug">
                        {heading.title_hi}
                      </h4>
                      <span className="text-xs text-[#5A655F] font-medium">
                        • {heading.title_en}
                      </span>
                      <span className="rounded-full bg-[#145A45]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#145A45] border border-[#145A45]/20">
                        {headingCategories.length} {headingCategories.length === 1 ? "कैटेगरी" : "कैटेगरीज"}
                      </span>
                      {heading.banner_image_url && (
                        <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 flex items-center gap-1 border border-emerald-200">
                          <ImageIcon className="size-3" /> बैनर सक्रिय
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Heading Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                  <Button
                    type="button"
                    onClick={() => openAddCategoryModal(heading.id)}
                    size="sm"
                    className="rounded-xl text-xs font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-8.5 shadow-2xs gap-1"
                  >
                    <Plus className="size-3.5" /> नई कैटेगरी जोड़ें
                  </Button>

                  <Button
                    type="button"
                    onClick={() => openEditHeadingModal(heading)}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold border-[#E8E4DA] bg-white text-[#16201A] hover:bg-[#FAF8F2] h-8.5 gap-1 shadow-2xs"
                  >
                    <Edit2 className="size-3 text-[#145A45]" /> हेडिंग एडिट
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleDeleteHeading(heading)}
                    size="icon"
                    variant="ghost"
                    className="size-8.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete Heading"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Optional Section Banner Preview & Quick Controls */}
              {(() => {
                const subHeroMap: Record<string, string | null | undefined> = {
                  hero2: settings?.hero2_image_url,
                  hero3: settings?.hero3_image_url,
                  hero4: settings?.hero4_image_url,
                };
                const activeBanner =
                  (heading.banner_sub && subHeroMap[heading.banner_sub]) ||
                  heading.banner_image_url ||
                  null;

                if (activeBanner) {
                  return (
                    <div className="relative group/banner rounded-2xl overflow-hidden border border-[#E8E4DA] bg-[#FAF8F2] shadow-2xs">
                      <div className="relative w-full bg-[#FAF8F2] overflow-hidden flex items-center justify-center p-2">
                        <img
                          src={activeBanner}
                          alt={heading.title_hi}
                          className="w-full h-auto max-h-48 sm:max-h-56 object-contain rounded-xl block"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-between px-4 rounded-2xl">
                          <span className="text-white text-xs font-semibold drop-shadow-xs">
                            {heading.banner_sub
                              ? `होमपेज बैनर (Hero Slide ${heading.banner_sub.slice(4)})`
                              : "कस्टम होमपेज बैनर"}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => openEditHeadingModal(heading)}
                              className="h-8 rounded-xl bg-white text-[#16201A] hover:bg-white/90 text-xs font-bold gap-1 shadow-xs"
                            >
                              <Edit2 className="size-3 text-[#145A45]" /> बैनर बदलें
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`क्या आप "${heading.title_hi}" का होमपेज बैनर हटाना चाहते हैं?`)) {
                                  const updated = headings.map((h) =>
                                    h.id === heading.id ? { ...h, banner_image_url: null, banner_sub: null } : h,
                                  );
                                  setHeadings(updated);
                                  await saveCategoryHeadings(updated);
                                  queryClient.invalidateQueries({ queryKey: ["store-settings"] });
                                  queryClient.invalidateQueries({ queryKey: ["categories"] });
                                  onRefresh();
                                  toast.success("बैनर हटा दिया गया");
                                }
                              }}
                              className="h-8 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold gap-1 shadow-xs"
                            >
                              <Trash2 className="size-3" /> बैनर हटाएं
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl border border-dashed border-[#E8E4DA] bg-white/70 hover:bg-white transition-colors">
                    <div className="flex items-center gap-2 text-xs text-[#5A655F]">
                      <ImageIcon className="size-4 text-[#8C9590]" />
                      <span>होमपेज सेक्शन बैनर अभी नहीं जुड़ा है</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditHeadingModal(heading)}
                      className="h-7 text-xs font-bold text-[#145A45] hover:bg-[#145A45]/10 gap-1 rounded-lg"
                    >
                      <Plus className="size-3" /> बैनर जोड़ें
                    </Button>
                  </div>
                );
              })()}

              {/* Categories Grid under this Heading */}
              {headingCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8E4DA] bg-white p-6 text-center">
                  <p className="text-xs text-[#5A655F]">
                    {cleanSearch
                      ? "इस हेडिंग में कोई कैटेगरी सर्च से मैच नहीं हुई।"
                      : "इस हेडिंग के अंदर अभी कोई कैटेगरी नहीं है। ऊपर दिए '+ नई कैटेगरी जोड़ें' बटन से कैटेगरी जोड़ें।"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {headingCategories.map((cat) => {
                    const hasHindi = Boolean(cat.name_hi && cat.name_hi.trim());
                    const primaryName = hasHindi ? cat.name_hi : (cat.name_en || cat.name);
                    const secondaryName = hasHindi ? (cat.name_en || cat.name) : null;

                    return (
                      <div
                        key={cat.id}
                        className="group rounded-2xl border border-[#E8E4DA] bg-white p-3 shadow-2xs hover:border-[#145A45]/40 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF8F2] border border-[#E8E4DA]/70 mb-2 p-2 flex items-center justify-center">
                          <img
                            src={cat.image_url || "/images/packaged.jpg"}
                            alt={primaryName ?? ""}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/packaged.jpg";
                            }}
                          />
                          {cat.icon && (
                            <span className="absolute top-1.5 left-1.5 text-xs bg-white/90 backdrop-blur-xs rounded-md size-5 flex items-center justify-center shadow-2xs border border-[#E8E4DA]/60">
                              {cat.icon}
                            </span>
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div className="text-center min-w-0 px-0.5 space-y-0.5 flex-1 flex flex-col justify-center">
                          <h5
                            className="font-sans font-bold text-xs text-[#16201A] leading-snug line-clamp-1 pb-0.5 overflow-visible"
                            title={primaryName ?? undefined}
                          >
                            {primaryName}
                          </h5>
                          {secondaryName && secondaryName.toLowerCase() !== primaryName?.toLowerCase() && (
                            <p
                              className="text-[11px] text-[#6B746F] font-medium leading-tight line-clamp-1 truncate"
                              title={secondaryName}
                            >
                              {secondaryName}
                            </p>
                          )}
                        </div>

                        {/* Actions Strip */}
                        <div className="mt-2.5 pt-2 border-t border-[#E8E4DA]/70 flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditCategoryModal(cat)}
                            className="h-7 flex-1 rounded-lg text-[11px] font-semibold text-[#145A45] hover:bg-[#145A45]/10 px-2"
                          >
                            <Edit2 className="size-3 mr-1" /> एडिट
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(cat)}
                            className="size-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            title="हटाएं"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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

            {/* Sub-Hero Banner Selector */}
            <div className="space-y-3 pt-2 border-t border-[#E8E4DA]/70">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#1F2924] flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-[#145A45]" />
                  सब-हीरो बैनर (Sub-Hero Banner)
                </Label>
                {headingBannerSource !== "none" && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeadingBannerSource("none");
                      setHeadingBannerUrl("");
                      setHeadingBannerSub(null);
                    }}
                    className="text-[10px] text-red-600 hover:underline font-semibold"
                  >
                    बैनर हटाएं
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#6B746F] leading-tight">
                यह इमेज होमपेज पर इस हेडिंग के ठीक नीचे और संबंधित कैटेगरीज़ के ऊपर दिखाई देगी।
              </p>

              {/* Banner Source Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#FAF8F2] border border-[#E8E4DA] rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHeadingBannerSource("custom");
                    setHeadingBannerSub(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    headingBannerSource === "custom"
                      ? "bg-[#145A45] text-white shadow-2xs"
                      : "text-[#5A655F] hover:bg-white"
                  }`}
                >
                  कस्टम इमेज
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeadingBannerSource("hero2");
                    setHeadingBannerSub("hero2");
                  }}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    headingBannerSource === "hero2"
                      ? "bg-[#145A45] text-white shadow-2xs"
                      : "text-[#5A655F] hover:bg-white"
                  }`}
                >
                  Hero Slide 2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeadingBannerSource("hero3");
                    setHeadingBannerSub("hero3");
                  }}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    headingBannerSource === "hero3"
                      ? "bg-[#145A45] text-white shadow-2xs"
                      : "text-[#5A655F] hover:bg-white"
                  }`}
                >
                  Hero Slide 3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeadingBannerSource("hero4");
                    setHeadingBannerSub("hero4");
                  }}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    headingBannerSource === "hero4"
                      ? "bg-[#145A45] text-white shadow-2xs"
                      : "text-[#5A655F] hover:bg-white"
                  }`}
                >
                  Hero Slide 4
                </button>
              </div>

              {/* Preview Box */}
              {(() => {
                const previewImg =
                  headingBannerSource === "hero2"
                    ? settings?.hero2_image_url
                    : headingBannerSource === "hero3"
                    ? settings?.hero3_image_url
                    : headingBannerSource === "hero4"
                    ? settings?.hero4_image_url
                    : headingBannerSource === "custom"
                    ? headingBannerUrl
                    : null;

                if (!previewImg) return null;

                return (
                  <div className="relative rounded-xl overflow-hidden border border-[#E8E4DA] bg-[#FAF8F2] p-1.5 shadow-2xs">
                    <img
                      src={previewImg}
                      alt="Banner Preview"
                      className="w-full h-auto max-h-40 object-contain rounded-lg block mx-auto"
                    />
                  </div>
                );
              })()}

              {/* Custom Image Upload / URL Input */}
              {headingBannerSource === "custom" && (
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
              )}

              {headingBannerSource.startsWith("hero") && (
                <p className="text-[11px] text-[#145A45] bg-[#E6EFE8]/50 px-2.5 py-1.5 rounded-lg">
                  यह हेडिंग <strong>Admin Settings → Banners</strong> में सेट किए गए {headingBannerSource.toUpperCase()} से जुड़ी है।
                </p>
              )}
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
