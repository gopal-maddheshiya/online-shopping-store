import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { SlidersHorizontal, X, ArrowUpDown, Search, Filter, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { searchSemanticKiranaQuery } from "@/lib/gemini-admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { useLanguage } from "@/lib/i18n";
import { getCategoryThumbnail } from "@/lib/product-images";
import { categoriesQuery, cheapestVariant, productsQuery, totalStock, settingsQuery } from "@/lib/queries";
import { getCategoryHeadings, type CategoryHeading } from "@/lib/category-headings";

type ShopSearch = {
  q?: string | undefined;
  category?: string | undefined;
  subcategory?: string | undefined;
  sort?: ("relevance" | "price-asc" | "price-desc" | "discount" | "popular") | undefined;
  min?: number | undefined;
  max?: number | undefined;
  instock?: boolean | undefined;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    subcategory: typeof search["subcategory"] === "string" ? search["subcategory"] : undefined,
    sort: (["price-asc", "price-desc", "discount", "popular", "relevance"] as const).includes(
      search["sort"] as never,
    )
      ? (search["sort"] as ShopSearch["sort"])
      : undefined,
    min: typeof search["min"] === "number" ? search["min"] : undefined,
    max: typeof search["max"] === "number" ? search["max"] : undefined,
    instock: search["instock"] === true || search["instock"] === "true" ? true : undefined,
  }),
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Arun Gopal Traders | Shop" },
      {
        name: "description",
        content:
          "Browse the full kirana catalogue: atta, rice, dal, oil, spices, snacks, dairy and household essentials with live prices and stock in Maharajganj.",
      },
      { property: "og:title", content: "Arun Gopal Traders | Shop" },
      {
        property: "og:description",
        content: "Search, filter and order daily essentials for delivery in Maharajganj.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="container-page py-16 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-[#E8E4DA] bg-white p-8 shadow-xs">
        <h2 className="font-sans text-xl font-bold text-[#1F2924]">Unable to load shop catalogue</h2>
        <p className="text-xs text-[#6B746F]">
          Please check your network connection and try again.
        </p>
        <Button onClick={() => reset()} className="rounded-xl bg-[#145A45] text-white">
          Retry Loading
        </Button>
      </div>
    </div>
  ),
  component: Shop,
});

const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "pet-supplies": "dhoop-batti",
  "kitchen-essentials": "bathroom-cleaning",
  "stationery": "agarbatti",
  "pots-cceaners": "pots-cleaners",
};

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const { data: products, isLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName, getProductName } = useLanguage();
  const [term, setTerm] = useState(search.q ?? "");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [semanticProductIds, setSemanticProductIds] = useState<string[] | null>(null);
  const [semanticReason, setSemanticReason] = useState<string | null>(null);

  // Auto-redirect legacy mismatched slugs (e.g. pet-supplies -> dhoop-batti)
  useEffect(() => {
    if (search.category && LEGACY_CATEGORY_REDIRECTS[search.category]) {
      const target = LEGACY_CATEGORY_REDIRECTS[search.category];
      void navigate({
        search: (prev) => ({ ...prev, category: target }),
        replace: true,
      });
    }
  }, [search.category, navigate]);

  // Dynamic Headings & Database Categories (synchronized with Homepage & Supabase store_settings)
  const [headings, setHeadings] = useState<CategoryHeading[]>(() =>
    getCategoryHeadings(settings?.category_headings as CategoryHeading[] | undefined),
  );

  useEffect(() => {
    if (
      settings?.category_headings &&
      Array.isArray(settings.category_headings) &&
      settings.category_headings.length > 0
    ) {
      setHeadings(getCategoryHeadings(settings.category_headings as CategoryHeading[]));
    }
  }, [settings?.category_headings]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CategoryHeading[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail) && customEvent.detail.length > 0) {
        setHeadings(customEvent.detail);
      } else {
        setHeadings(getCategoryHeadings());
      }
    };
    window.addEventListener("agt:headings-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("agt:headings-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const allCategories = categories ?? [];
  const allProducts = products ?? [];

  const parentCategories = useMemo(
    () => allCategories.filter((c) => !c.parent_id),
    [allCategories],
  );
  const allAssignedSlugs = useMemo(
    () => new Set(headings.flatMap((h) => h.slugs)),
    [headings],
  );
  const uncategorizedCategories = useMemo(
    () => parentCategories.filter((c) => !allAssignedSlugs.has(c.slug)),
    [parentCategories, allAssignedSlugs],
  );

  // Group categories exactly matching the homepage configuration
  const groupedCategories = useMemo(() => {
    const groups: { heading: CategoryHeading; items: typeof parentCategories }[] = [];
    for (const h of headings) {
      const items = parentCategories
        .filter((c) => h.slugs.includes(c.slug))
        .sort((a, b) => h.slugs.indexOf(a.slug) - h.slugs.indexOf(b.slug));
      if (items.length > 0) {
        groups.push({ heading: h, items });
      }
    }
    if (uncategorizedCategories.length > 0) {
      groups.push({
        heading: {
          id: "other",
          title_hi: "अन्य श्रेणियाँ",
          title_en: "Other Categories",
          icon: "📦",
          sort_order: 999,
          slugs: uncategorizedCategories.map((c) => c.slug),
        },
        items: uncategorizedCategories,
      });
    }
    return groups;
  }, [headings, parentCategories, uncategorizedCategories]);

  // Flattened ordered categories in exact homepage order
  const orderedCategories = useMemo(() => {
    return groupedCategories.flatMap((g) => g.items);
  }, [groupedCategories]);

  const activeCategory = useMemo(() => {
    const raw = search.category;
    if (!raw) return undefined;
    const target = LEGACY_CATEGORY_REDIRECTS[raw] || raw;
    return allCategories.find((c) => c.slug === target || c.id === target || c.slug === raw || c.id === raw);
  }, [allCategories, search.category]);

  const subs = useMemo(
    () =>
      allCategories.filter(
        (c) =>
          c.parent_id &&
          (c.parent_id === activeCategory?.id || c.parent_id === activeCategory?.slug),
      ),
    [allCategories, activeCategory],
  );

  function update(patch: Partial<ShopSearch>) {
    setSemanticProductIds(null);
    setSemanticReason(null);
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  async function handleAiSemanticSearch() {
    const q = (search.q ?? term).trim();
    if (!q) return;
    setIsAiSearching(true);
    try {
      const res = await searchSemanticKiranaQuery({
        query: q,
        availableProducts: allProducts,
      });
      if (res.success && res.matchedProductIds.length > 0) {
        setSemanticProductIds(res.matchedProductIds);
        setSemanticReason(res.reason || null);
        toast.success(`✨ AI ने "${q}" से जुड़े जरूरी सामान ढूंढ निकाले!`);
      } else {
        toast.info(`AI को "${q}" के लिए कोई विशेष सामान नहीं मिला।`);
      }
    } catch {
      toast.error("AI किराना खोज में समस्या आई।");
    } finally {
      setIsAiSearching(false);
    }
  }

  const results = useMemo(() => {
    if (semanticProductIds && semanticProductIds.length > 0) {
      return allProducts.filter((p) => semanticProductIds.includes(p.id));
    }

    let list = allProducts;
    const catId = activeCategory?.id;
    const catSlug = activeCategory?.slug;
    const subCategory = allCategories.find((c) => c.slug === search.subcategory);
    const subId = subCategory?.id;
    const subSlug = subCategory?.slug;

    if (activeCategory) {
      list = list.filter(
        (p) =>
          p.category_id === catId ||
          p.category_id === catSlug ||
          (catSlug && p.tags?.includes(catSlug)),
      );
    }
    if (subCategory) {
      list = list.filter(
        (p) =>
          p.subcategory_id === subId ||
          p.subcategory_id === subSlug ||
          (subSlug && p.tags?.includes(subSlug)),
      );
    }

    const q = (search.q ?? "").trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hindiName = getProductName(p);
        const englishName = p.name_en || p.name;
        const brand = p.brand ?? "";
        const desc = p.description ?? "";
        const descHi = p.description_hi ?? "";
        const descEn = p.description_en ?? "";
        const tags = p.tags ?? [];
        return [p.name, englishName, p.name_hi, hindiName, brand, desc, descHi, descEn, ...tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }
    if (search.instock) list = list.filter((p) => totalStock(p) > 0);
    if (search.min != null)
      list = list.filter((p) => Number(cheapestVariant(p)?.price ?? 0) >= search.min!);
    if (search.max != null)
      list = list.filter((p) => Number(cheapestVariant(p)?.price ?? 0) <= search.max!);

    const price = (p: (typeof list)[number]) => Number(cheapestVariant(p)?.price ?? 0);
    const disc = (p: (typeof list)[number]) => {
      const v = cheapestVariant(p);
      if (!v || !v.mrp) return 0;
      return (Number(v.mrp) - Number(v.price)) / Number(v.mrp);
    };
    const sorted = [...list];
    if (search.sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    else if (search.sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
    else if (search.sort === "discount") sorted.sort((a, b) => disc(b) - disc(a));
    else if (search.sort === "popular") sorted.sort((a, b) => b.sold_count - a.sold_count);
    return sorted;
  }, [products, categories, activeCategory, search, getProductName, semanticProductIds]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products ?? []) {
      if (p.category_id) {
        map.set(p.category_id, (map.get(p.category_id) ?? 0) + 1);
      }
    }
    return map;
  }, [products]);

  const priceAndStockFilters = (
    <div className="space-y-4">
      {/* Price Range */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5A655F]">
          {t.priceRangeLabel}
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder={t.minPricePlaceholder}
            value={search.min ?? ""}
            onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-lg text-xs border-[#E4DFD5] bg-white h-8 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
          />
          <span className="text-[#5A655F]">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={t.maxPricePlaceholder}
            value={search.max ?? ""}
            onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-lg text-xs border-[#E4DFD5] bg-white h-8 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
          />
        </div>
      </div>

      {/* In Stock Only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="instock"
          checked={!!search.instock}
          onCheckedChange={(v) => update({ instock: v ? true : undefined })}
        />
        <Label htmlFor="instock" className="text-xs font-semibold text-[#16201A]">
          {t.inStockOnlyLabel}
        </Label>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-lg text-xs border-[#E4DFD5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-[#FAF8F2]"
        onClick={() => void navigate({ search: {} })}
      >
        {t.clearAllFiltersBtn}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container-page px-2 sm:px-4 lg:px-6 py-4 sm:py-7 pb-24 sm:pb-32">
      {/* Top Header Row — Locked sticky below main header so it doesn't scroll off or collide */}
      <div className="sticky top-15 sm:top-16 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4DFD5] py-2.5 sm:py-3 -mx-2 sm:-mx-4 lg:-mx-6 px-2 sm:px-4 lg:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-sans text-base sm:text-lg lg:text-xl font-bold text-[#16201A] truncate tracking-tight">
                {search.q
                  ? `${lang === "hi" ? "खोज:" : "Search:"} “${search.q}”`
                  : activeCategory
                  ? getCategoryName(activeCategory)
                  : t.allGroceries}
              </h1>
              {search.q && (
                <button
                  type="button"
                  onClick={() => update({ q: undefined })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626] bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title={lang === "hi" ? "खोज हटाएं" : "Clear search"}
                >
                  <span>{lang === "hi" ? "हटाएं" : "Clear"}</span>
                  <X className="size-3" />
                </button>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#5A655F]">
              {lang === "hi"
                ? `कुल ${results.length} सामान उपलब्ध हैं`
                : `Showing ${results.length} items`}
            </p>
          </div>

          {/* Sort and Mobile Filters */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs border-[#E4DFD5] text-[#0F4A38] bg-white shadow-2xs h-8 px-2 sm:px-2.5 inline-flex items-center hover:bg-[#FAF8F2] cursor-pointer"
                >
                  <Filter className="mr-1 size-3 text-[#145A45]" /> {t.filterBtn}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-5 bg-[#FAF8F2]">
                <SheetHeader className="mb-4 pr-10 text-left">
                  <SheetTitle className="text-base font-bold text-[#0F4A38]">
                    {t.filterCatalogueTitle}
                  </SheetTitle>
                </SheetHeader>
                {priceAndStockFilters}
              </SheetContent>
            </Sheet>

            <Select
              value={search.sort ?? "relevance"}
              onValueChange={(v) => update({ sort: v as ShopSearch["sort"] })}
            >
              <SelectTrigger className="h-8 w-32 sm:w-40 rounded-lg border-[#E4DFD5] bg-white text-xs text-[#16201A] shadow-2xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t.sortRelevance}</SelectItem>
                <SelectItem value="price-asc">{t.sortPriceLowToHigh}</SelectItem>
                <SelectItem value="price-desc">{t.sortPriceHighToLow}</SelectItem>
                <SelectItem value="discount">{t.sortHighestDiscount}</SelectItem>
                <SelectItem value="popular">{t.sortBestSelling}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Layout: Unified Blinkit Category Rail + Products Feed */}
      <div className="mt-2 sm:mt-3 flex flex-row items-start gap-2 sm:gap-3.5 lg:gap-5 w-full min-w-0">
        {/* Category Left Rail (Unified Blinkit Rail on Mobile & Desktop, Premium White & Homepage Squircle) */}
        <aside className="w-[84px] sm:w-[94px] lg:w-[106px] shrink-0 bg-white -ml-2 sm:-ml-4 lg:ml-0 border-r border-[#E5E7EB] py-2 sm:py-3 px-1 sticky top-[108px] sm:top-[116px] self-start z-15 max-h-[calc(100dvh-7.5rem)] overflow-y-auto category-nav-scrollbar space-y-1.5 sm:space-y-2 select-none">
          {/* All Categories Button */}
          <button
            type="button"
            onClick={() => {
              update({ category: undefined, subcategory: undefined });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 w-full transition-all cursor-pointer select-none bg-transparent hover:bg-black/[0.02]"
          >
            {!search.category && (
              <span className="absolute right-0 top-2 bottom-2 w-[3px] bg-[#0C831F] rounded-l-full" />
            )}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] rounded-[13px] p-1 sm:p-1.5 flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-105 ${
              !search.category
                ? "bg-[#EDF8F1] border border-[#A3E3B6] shadow-2xs"
                : "bg-[#EDF8F1] border border-[#DDF3E4] group-hover:bg-[#E4F7EA] group-hover:border-[#CEEED8]"
            }`}>
              <img
                src="/agt-icon.png"
                alt="All"
                loading="lazy"
                decoding="async"
                className="size-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
              />
            </div>
            <span
              className={`text-[11px] sm:text-[11.5px] lg:text-xs leading-[1.25] text-center line-clamp-2 mt-1.5 break-words w-full px-0.5 transition-colors ${
                !search.category ? "font-bold text-[#111827]" : "font-medium text-[#4B5563] group-hover:text-[#111827]"
              }`}
            >
              {t.allCategoriesLabel}
            </span>
          </button>

          {/* Categories Grouped by Homepage Headings */}
          {groupedCategories.map((group, gIdx) => {
            return (
              <div key={group.heading.id} className="space-y-1.5 sm:space-y-2">
                {gIdx > 0 && <div className="w-8 sm:w-10 h-[1px] bg-[#E5E7EB] my-1.5 sm:my-2 mx-auto" />}
                {group.items.map((c) => {
                  const isSelected = search.category === c.slug || search.category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        update({ category: c.slug, subcategory: undefined });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 w-full transition-all cursor-pointer select-none bg-transparent hover:bg-black/[0.02]"
                    >
                      {isSelected && (
                        <span className="absolute right-0 top-2 bottom-2 w-[3px] bg-[#0C831F] rounded-l-full" />
                      )}
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] rounded-[13px] p-1 sm:p-1.5 flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-105 ${
                        isSelected
                          ? "bg-[#EDF8F1] border border-[#A3E3B6] shadow-2xs"
                          : "bg-[#EDF8F1] border border-[#DDF3E4] group-hover:bg-[#E4F7EA] group-hover:border-[#CEEED8]"
                      }`}>
                        <img
                          src={getCategoryThumbnail(c)}
                          alt={getCategoryName(c)}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = "/agt-icon.png";
                          }}
                          className="size-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                        />
                      </div>
                      <span
                        className={`text-[11px] sm:text-[11.5px] lg:text-xs leading-[1.25] text-center line-clamp-2 mt-1.5 break-words w-full px-0.5 transition-colors ${
                          isSelected ? "font-bold text-[#111827]" : "font-medium text-[#4B5563] group-hover:text-[#111827]"
                        }`}
                        title={getCategoryName(c)}
                      >
                        {getCategoryName(c)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* 3. Products Main Area */}
        <main className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4">


          {/* Subcategories Horizontal Scroll Row (Squircle rounded-[10px] chips matching design system - no rounded-full) */}
          {subs.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
              <button
                type="button"
                onClick={() => update({ subcategory: undefined })}
                className={`shrink-0 px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer border ${
                  !search.subcategory
                    ? "bg-[#145A45] border-[#145A45] text-white shadow-xs"
                    : "bg-[#EDF8F1] border-[#DDF3E4] text-[#222725] hover:bg-[#E4F7EA] hover:border-[#CEEED8]"
                }`}
              >
                {lang === "hi" ? "सभी प्रकार" : "All Types"}
              </button>
              {subs.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    update({ subcategory: search.subcategory === s.slug ? undefined : s.slug })
                  }
                  className={`shrink-0 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer border ${
                    search.subcategory === s.slug
                      ? "bg-[#145A45] border-[#145A45] text-white shadow-xs"
                      : "bg-[#EDF8F1] border-[#DDF3E4] text-[#222725] hover:bg-[#E4F7EA] hover:border-[#CEEED8]"
                  }`}
                >
                  {getCategoryName(s)}
                </button>
              ))}
            </div>
          )}
          {/* Semantic Search Explainer Banner */}
          {semanticReason && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs mb-4">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="size-3.5" />
                </span>
                <span>
                  <strong>✨ AI किराना खोज:</strong> {semanticReason}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSemanticProductIds(null);
                  setSemanticReason(null);
                }}
                className="text-[11px] font-bold text-emerald-800 hover:underline shrink-0 bg-emerald-100 px-2 py-1 rounded-md"
              >
                सामान्य कैटलॉग देखें ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card-base p-8 sm:p-12 text-center bg-white border border-[#E4DFD5] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)] space-y-3">
              <p className="font-sans text-base font-bold text-[#16201A]">
                {t.noProductsFoundTitle}
              </p>
              <p className="text-xs text-[#5A655F]">
                {search.q
                  ? `"${search.q}" नाम से कोई सीधा प्रोडक्ट नहीं मिला।`
                  : t.noProductsFoundDesc}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                {search.q && (
                  <Button
                    type="button"
                    disabled={isAiSearching}
                    onClick={handleAiSemanticSearch}
                    className="rounded-xl text-xs bg-gradient-to-r from-[#145A45] to-[#1F7A5E] text-white hover:opacity-95 shadow-xs gap-1.5 h-10 px-5 font-bold"
                  >
                    {isAiSearching ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> AI किराना खोज कर रहा है...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5 text-amber-300" /> ✨ AI से ढूंढें: "{search.q}" की सामग्री
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs border-[#E4DFD5] bg-white text-[#0F4A38] shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-10 px-4"
                  onClick={() => {
                    setSemanticProductIds(null);
                    setSemanticReason(null);
                    void navigate({ search: {} });
                  }}
                >
                  {t.resetFiltersBtn}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  </div>
  );
}
