import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X, ArrowUpDown, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { categoriesQuery, cheapestVariant, productsQuery, totalStock } from "@/lib/queries";
import { ADDITIONAL_CATEGORIES } from "@/lib/catalog-data";

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
        <Button onClick={() => reset()} className="rounded-full bg-[#145A45] text-white">
          Retry Loading
        </Button>
      </div>
    </div>
  ),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: categories } = useQuery(categoriesQuery);
  const { data: products, isLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName, getProductName } = useLanguage();
  const [term, setTerm] = useState(search.q ?? "");

  const allCategories = categories && categories.length > 0 ? categories : ADDITIONAL_CATEGORIES;
  const allProducts = products ?? [];

  const parents = allCategories.filter((c) => !c.parent_id);
  const activeCategory = parents.find((c) => c.slug === search.category);
  const subs = allCategories.filter(
    (c) =>
      c.parent_id &&
      (c.parent_id === activeCategory?.id || c.parent_id === activeCategory?.slug),
  );

  function update(patch: Partial<ShopSearch>) {
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  const results = useMemo(() => {
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
  }, [products, categories, activeCategory, search, getProductName]);

  const filters = (
    <div className="space-y-5">
      {/* Category List */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5A655F]">
          {t.categoriesLabel}
        </h3>
        <div className="space-y-0.5">
          <button
            onClick={() => update({ category: undefined, subcategory: undefined })}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              !search.category
                ? "bg-[#145A45] text-white shadow-2xs"
                : "text-[#16201A] hover:bg-[#FAF8F2]"
            }`}
          >
            <span>{t.allCategoriesLabel}</span>
          </button>
          {parents.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ category: c.slug, subcategory: undefined })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                search.category === c.slug
                  ? "bg-[#145A45] text-white shadow-2xs"
                  : "text-[#16201A] hover:bg-[#FAF8F2]"
              }`}
            >
              <span>{getCategoryName(c)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory if selected */}
      {subs.length ? (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5A655F]">
            {activeCategory ? getCategoryName(activeCategory) : ""} {t.typesLabel}
          </h3>
          <div className="space-y-0.5">
            {subs.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  update({ subcategory: search.subcategory === c.slug ? undefined : c.slug })
                }
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  search.subcategory === c.slug
                    ? "bg-[#E6EFE8] text-[#0F4A38] font-bold"
                    : "text-[#5A655F] hover:bg-[#FAF8F2]"
                }`}
              >
                {getCategoryName(c)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
            className="rounded-lg text-xs border-[#E5E0D5] bg-white h-8"
          />
          <span className="text-[#5A655F]">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={t.maxPricePlaceholder}
            value={search.max ?? ""}
            onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-lg text-xs border-[#E5E0D5] bg-white h-8"
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
        className="w-full rounded-lg text-xs border-[#E5E0D5] hover:bg-[#FAF8F2]"
        onClick={() => void navigate({ search: {} })}
      >
        {t.clearAllFiltersBtn}
      </Button>
    </div>
  );

  return (
    <div className="container-page py-6 sm:py-8 pb-36 overflow-x-hidden">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-4">
        <div>
          <h1 className="font-sans text-2xl font-bold text-[#16201A]">
            {activeCategory
              ? getCategoryName(activeCategory)
              : t.allGroceries}
          </h1>
          <p className="text-xs text-[#5A655F] mt-0.5">
            {lang === "hi"
              ? `कुल ${results.length} उत्पाद उपलब्ध हैं`
              : `Showing ${results.length} items`}
          </p>
        </div>

        {/* Sort and Mobile Filters */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs lg:hidden border-[#E5E0D5] text-[#0F4A38] bg-white"
              >
                <Filter className="mr-1.5 size-3.5 text-[#145A45]" /> {t.filterBtn}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5 bg-[#FAF8F2]">
              <SheetHeader className="mb-4 pr-10 text-left">
                <SheetTitle className="text-base font-bold text-[#0F4A38]">
                  {t.filterCatalogueTitle}
                </SheetTitle>
              </SheetHeader>
              {filters}
            </SheetContent>
          </Sheet>

          <Select
            value={search.sort ?? "relevance"}
            onValueChange={(v) => update({ sort: v as ShopSearch["sort"] })}
          >
            <SelectTrigger className="h-9 w-44 rounded-lg border-[#E5E0D5] bg-white text-xs text-[#16201A]">
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

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_1fr] items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block card-base p-4 border border-[#E5E0D5] bg-white sticky top-20">
          {filters}
        </aside>

        {/* Products Grid */}
        <main className="min-w-0 w-full max-w-full space-y-4">
          {/* Quick Category Switcher Pills */}
          <div
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 touch-pan-x scroll-smooth overscroll-x-contain w-full min-w-0 max-w-full"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              onClick={() => update({ category: undefined, subcategory: undefined })}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                !search.category
                  ? "bg-[#145A45] text-white shadow-2xs"
                  : "border border-[#E5E0D5] bg-white text-[#16201A] hover:border-[#145A45]"
              }`}
            >
              <img
                src="/images/packaged.jpg"
                alt="All"
                className="size-4 rounded-full object-cover shrink-0"
              />
              <span>
                {t.allItemsCountLabel} ({products?.length ?? 0})
              </span>
            </button>
            {parents.map((c) => {
              const count = (products ?? []).filter(
                (p) => p.category_id === c.id || p.category_id === c.slug,
              ).length;
              return (
                <button
                  key={c.id}
                  onClick={() => update({ category: c.slug, subcategory: undefined })}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    search.category === c.slug
                      ? "bg-[#145A45] text-white shadow-2xs"
                      : "border border-[#E5E0D5] bg-white text-[#16201A] hover:border-[#145A45]"
                  }`}
                >
                  <img
                    src={getCategoryThumbnail(c)}
                    alt={c.name}
                    className="size-4 rounded-full object-cover shrink-0 border border-[#E5E0D5]"
                  />
                  <span>{getCategoryName(c)}</span>
                  {count > 0 && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                        search.category === c.slug
                          ? "bg-white/20 text-white font-bold"
                          : "bg-[#FAF8F2] text-[#5A655F]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {isLoading ? (
            <div className="grocery-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card-base p-12 text-center bg-white border border-[#E5E0D5]">
              <p className="font-sans text-base font-bold text-[#16201A]">
                {t.noProductsFoundTitle}
              </p>
              <p className="text-xs text-[#5A655F] mt-1">
                {t.noProductsFoundDesc}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-lg text-xs border-[#E5E0D5] text-[#0F4A38]"
                onClick={() => void navigate({ search: {} })}
              >
                {t.resetFiltersBtn}
              </Button>
            </div>
          ) : (
            <div className="grocery-grid">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
