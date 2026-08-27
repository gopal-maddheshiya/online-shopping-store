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
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/lib/i18n";
import { getCategoryThumbnail } from "@/lib/product-images";
import { categoriesQuery, cheapestVariant, productsQuery, totalStock } from "@/lib/queries";

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
  head: () => ({
    meta: [
      { title: "Shop Groceries Online — Arun Gopal Traders" },
      {
        name: "description",
        content:
          "Browse the full kirana catalogue: atta, rice, dal, oil, spices, snacks, dairy and household essentials with live prices and stock in Maharajganj.",
      },
      { property: "og:title", content: "Shop Groceries Online — Arun Gopal Traders" },
      {
        property: "og:description",
        content: "Search, filter and order daily essentials for delivery in Maharajganj.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: categories } = useQuery(categoriesQuery);
  const { data: products, isLoading } = useQuery(productsQuery());
  const { lang, t, getCategoryName, getProductName } = useLanguage();
  const [term, setTerm] = useState(search.q ?? "");

  const parents = (categories ?? []).filter((c) => !c.parent_id);
  const activeCategory = parents.find((c) => c.slug === search.category);
  const subs = (categories ?? []).filter((c) => c.parent_id && c.parent_id === activeCategory?.id);

  function update(patch: Partial<ShopSearch>) {
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  const results = useMemo(() => {
    let list = products ?? [];
    const catId = activeCategory?.id;
    const catSlug = activeCategory?.slug;
    const subCategory = (categories ?? []).find((c) => c.slug === search.subcategory);
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
        const hindiName = getProductName(p.name, p.slug);
        return [p.name, hindiName, p.brand ?? "", p.description ?? "", ...(p.tags ?? [])]
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
  }, [products, categories, activeCategory, search]);

  const filters = (
    <div className="space-y-6">
      {/* Category List */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#676D68]">
          {lang === "hi" ? "कैटेगरी" : "Categories"}
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => update({ category: undefined, subcategory: undefined })}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              !search.category ? "bg-[#18483B] text-white" : "text-[#191C1B] hover:bg-[#FAF8F5]"
            }`}
          >
            <span>{lang === "hi" ? "सभी सामान" : "All Categories"}</span>
          </button>
          {parents.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ category: c.slug, subcategory: undefined })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                search.category === c.slug
                  ? "bg-[#18483B] text-white"
                  : "text-[#191C1B] hover:bg-[#FAF8F5]"
              }`}
            >
              <span>{getCategoryName(c.name, c.slug)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory if selected */}
      {subs.length ? (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#676D68]">
            {activeCategory ? getCategoryName(activeCategory.name, activeCategory.slug) : ""}{" "}
            {lang === "hi" ? "के प्रकार" : "Types"}
          </h3>
          <div className="space-y-1">
            {subs.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  update({ subcategory: search.subcategory === c.slug ? undefined : c.slug })
                }
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  search.subcategory === c.slug
                    ? "bg-[#EBF4F0] text-[#18483B] font-bold"
                    : "text-[#676D68] hover:bg-[#FAF8F5]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Price Range */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#676D68]">
          {lang === "hi" ? "मूल्य सीमा (₹)" : "Price Range (₹)"}
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder={lang === "hi" ? "न्यूनतम" : "Min"}
            value={search.min ?? ""}
            onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-lg text-xs"
          />
          <span className="text-[#676D68]">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder={lang === "hi" ? "अधिकतम" : "Max"}
            value={search.max ?? ""}
            onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-lg text-xs"
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
        <Label htmlFor="instock" className="text-xs font-semibold text-[#191C1B]">
          {lang === "hi" ? "केवल उपलब्ध सामान" : "In stock only"}
        </Label>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-lg text-xs border-[#EAE6DF]"
        onClick={() => void navigate({ search: {} })}
      >
        {lang === "hi" ? "सभी फिल्टर हटाएं" : "Clear All Filters"}
      </Button>
    </div>
  );

  return (
    <div className="container-page py-6 sm:py-8 pb-36 overflow-x-hidden">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-sans text-2xl font-bold text-[#191C1B]">
            {activeCategory
              ? getCategoryName(activeCategory.name, activeCategory.slug)
              : lang === "hi"
                ? "सभी किराना सामान"
                : "All Groceries"}
          </h1>
          <p className="text-xs text-[#676D68] mt-0.5">
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
                className="rounded-full text-xs lg:hidden border-[#EAE6DF]"
              >
                <Filter className="mr-1.5 size-3.5" /> {lang === "hi" ? "फिल्टर" : "Filter"}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetHeader className="mb-4 pr-10 text-left">
                <SheetTitle className="text-base font-bold text-[#18483B]">
                  {lang === "hi" ? "किराना फिल्टर" : "Filter Catalogue"}
                </SheetTitle>
              </SheetHeader>
              {filters}
            </SheetContent>
          </Sheet>

          <Select
            value={search.sort ?? "relevance"}
            onValueChange={(v) => update({ sort: v as ShopSearch["sort"] })}
          >
            <SelectTrigger className="h-9 w-44 rounded-full border-[#EAE6DF] bg-white text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">
                {lang === "hi" ? "लोकप्रियता (Relevance)" : "Relevance"}
              </SelectItem>
              <SelectItem value="price-asc">
                {lang === "hi" ? "कीमत: कम से ज्यादा" : "Price: Low to High"}
              </SelectItem>
              <SelectItem value="price-desc">
                {lang === "hi" ? "कीमत: ज्यादा से कम" : "Price: High to Low"}
              </SelectItem>
              <SelectItem value="discount">
                {lang === "hi" ? "ज्यादा छूट पहले" : "Highest Discount"}
              </SelectItem>
              <SelectItem value="popular">
                {lang === "hi" ? "सर्वाधिक बिकने वाले" : "Best Selling"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + 4-Col Products */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_1fr] items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block card-base p-4 border border-[#EAE6DF] bg-white sticky top-20">
          {filters}
        </aside>

        {/* Products Grid */}
        <main className="space-y-4">
          {/* Quick Category Switcher Pills */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => update({ category: undefined, subcategory: undefined })}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                !search.category
                  ? "bg-[#18483B] text-white shadow-2xs"
                  : "border border-[#EAE6DF] bg-white text-[#191C1B] hover:border-[#18483B]"
              }`}
            >
              <img
                src="/images/packaged.jpg"
                alt="All"
                className="size-4 rounded-full object-cover shrink-0"
              />
              <span>
                {lang === "hi" ? "सभी सामान" : "All Items"} ({products?.length ?? 0})
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
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                    search.category === c.slug
                      ? "bg-[#18483B] text-white shadow-2xs"
                      : "border border-[#EAE6DF] bg-white text-[#191C1B] hover:border-[#18483B]"
                  }`}
                >
                  <img
                    src={getCategoryThumbnail(c)}
                    alt={c.name}
                    className="size-4 rounded-full object-cover shrink-0 border border-[#EAE6DF]"
                  />
                  <span>{getCategoryName(c.name, c.slug)}</span>
                  {count > 0 && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                        search.category === c.slug
                          ? "bg-white/20 text-white font-bold"
                          : "bg-[#FAF8F5] text-[#676D68]"
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
            <div
              className="grocery-grid grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card-base p-12 text-center bg-white">
              <p className="font-sans text-base font-bold text-[#191C1B]">
                {lang === "hi" ? "कोई उत्पाद नहीं मिला" : "No products found"}
              </p>
              <p className="text-xs text-[#676D68] mt-1">
                {lang === "hi"
                  ? "कृपया अलग शब्द खोजें या फिल्टर साफ़ करें।"
                  : "Try adjusting your search terms or filters."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full text-xs"
                onClick={() => void navigate({ search: {} })}
              >
                {lang === "hi" ? "फिल्टर साफ़ करें" : "Reset Filters"}
              </Button>
            </div>
          ) : (
            <div
              className="grocery-grid grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "0.75rem",
              }}
            >
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
