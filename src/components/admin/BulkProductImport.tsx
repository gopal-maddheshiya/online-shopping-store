import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { inr } from "@/lib/format";
import type { Category, Product } from "@/lib/queries";

type BulkProductImportProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  existingProducts: Product[];
  onSuccess: () => void;
};

type ParsedRow = {
  rowIndex: number;
  name: string;
  name_hi: string;
  brand: string;
  categoryInput: string;
  matchedCategory?: Category | undefined;
  label: string;
  price: number;
  mrp: number;
  stock: number;
  image_url: string;
  description: string;
  description_hi: string;
  errors: string[];
};

type GroupedProduct = {
  name: string;
  name_hi: string;
  brand: string;
  category: Category;
  description: string;
  description_hi: string;
  image_url: string;
  variants: {
    label: string;
    price: number;
    mrp: number;
    stock: number;
  }[];
  errors: string[];
};

/**
 * Robust RFC-4180 compliant CSV parser with quote escaping & Devanagari UTF-8 support
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentVal.trim());
        currentVal = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
        currentRow = [];
        currentVal = "";
      } else if (char === "\n") {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
        currentRow = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}

function findCategory(input: string, categories: Category[]): Category | undefined {
  if (!input) return undefined;
  const clean = input.trim().toLowerCase();
  return categories.find((c) => {
    return (
      c.slug.toLowerCase() === clean ||
      c.name.toLowerCase() === clean ||
      (c.name_hi && c.name_hi.trim().toLowerCase() === clean) ||
      c.name.toLowerCase().includes(clean) ||
      clean.includes(c.name.toLowerCase())
    );
  });
}

export function BulkProductImport({
  isOpen,
  onClose,
  categories,
  existingProducts,
  onSuccess,
}: BulkProductImportProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportingName, setCurrentImportingName] = useState("");

  const validProducts = groupedProducts.filter((p) => p.errors.length === 0);
  const invalidProducts = groupedProducts.filter((p) => p.errors.length > 0);

  function resetState() {
    setFileName("");
    setGroupedProducts([]);
    setTotalRows(0);
    setIsImporting(false);
    setImportProgress(0);
    setCurrentImportingName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    if (isImporting) return;
    resetState();
    onClose();
  }

  // Download Sample CSV Template
  function handleDownloadTemplate() {
    const activeCategories = categories.filter((c) => !c.parent_id);
    const categoryExamples = activeCategories.slice(0, 4).map((c) => c.slug).join(", ");

    const headers = [
      "name",
      "name_hi",
      "brand",
      "category",
      "label",
      "price",
      "mrp",
      "stock",
      "image_url",
      "description",
      "description_hi",
    ];

    const sampleRows = [
      [
        "Fortune Kachi Ghani Mustard Oil",
        "फॉर्च्यून कच्ची घानी सरसों तेल",
        "Fortune",
        activeCategories[0]?.slug || "oil-ghee",
        "1 L",
        "155",
        "175",
        "50",
        "",
        "Pure cold pressed kachi ghani mustard oil",
        "शुद्ध कच्ची घानी सरसों का तेल",
      ],
      [
        "Aashirvaad Shudh Chakki Atta",
        "आशीर्वाद शुद्ध चक्की आटा",
        "Aashirvaad",
        activeCategories[1]?.slug || activeCategories[0]?.slug || "atta-flours",
        "5 kg",
        "245",
        "270",
        "35",
        "",
        "100% whole wheat chakki atta with 0% maida",
        "100% शुद्ध संपूर्ण गेहूं का आटा",
      ],
      [
        "Aashirvaad Shudh Chakki Atta",
        "आशीर्वाद शुद्ध चक्की आटा",
        "Aashirvaad",
        activeCategories[1]?.slug || activeCategories[0]?.slug || "atta-flours",
        "10 kg",
        "470",
        "520",
        "25",
        "",
        "100% whole wheat chakki atta with 0% maida",
        "100% शुद्ध संपूर्ण गेहूं का आटा",
      ],
      [
        "Tata Salt Vacuum Evaporated",
        "टाटा नमक",
        "Tata",
        activeCategories[2]?.slug || activeCategories[0]?.slug || "spices",
        "1 kg",
        "28",
        "30",
        "100",
        "",
        "Desh ka namak with iodine guarantee",
        "देश का नमक आयोडीन युक्त",
      ],
    ];

    const csvContent =
      "\uFEFF" + // UTF-8 BOM for Excel to open Hindi correctly
      [
        headers.join(","),
        ...sampleRows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Arun_Gopal_Products_Sample_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.info("Sample CSV Template downloaded! Open in Excel or Google Sheets.");
  }

  // Handle CSV file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          toast.error("File appears to be empty");
          return;
        }

        const rawRows = parseCSV(text);
        if (rawRows.length < 2 || !rawRows[0]) {
          toast.error("CSV file must contain a header row and at least 1 product row");
          return;
        }

        const headerRow = rawRows[0].map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ""));
        
        // Find column indices
        const nameIdx = headerRow.findIndex((h) => h === "name" || h === "product_name" || h === "title");
        const nameHiIdx = headerRow.findIndex((h) => h === "name_hi" || h === "hindi_name" || h === "title_hi");
        const brandIdx = headerRow.findIndex((h) => h === "brand" || h === "company");
        const categoryIdx = headerRow.findIndex((h) => h === "category" || h === "category_slug" || h === "cat");
        const labelIdx = headerRow.findIndex((h) => h === "label" || h === "unit" || h === "size" || h === "pack");
        const priceIdx = headerRow.findIndex((h) => h === "price" || h === "selling_price" || h === "rate");
        const mrpIdx = headerRow.findIndex((h) => h === "mrp");
        const stockIdx = headerRow.findIndex((h) => h === "stock" || h === "quantity" || h === "qty");
        const imageIdx = headerRow.findIndex((h) => h === "image_url" || h === "image" || h === "photo");
        const descIdx = headerRow.findIndex((h) => h === "description" || h === "desc");
        const descHiIdx = headerRow.findIndex((h) => h === "description_hi" || h === "desc_hi");

        if (nameIdx === -1) {
          toast.error("Required column 'name' not found in CSV header");
          return;
        }

        const parsedRows: ParsedRow[] = [];
        const dataRows = rawRows.slice(1);
        setTotalRows(dataRows.length);

        dataRows.forEach((row, i) => {
          const rowNum = i + 2; // 1-indexed including header
          const name = row[nameIdx]?.trim() || "";
          if (!name) return; // Skip completely blank lines

          const nameHi = (nameHiIdx !== -1 ? row[nameHiIdx] : "")?.trim() || "";
          const brand = (brandIdx !== -1 ? row[brandIdx] : "")?.trim() || "";
          const catInput = (categoryIdx !== -1 ? row[categoryIdx] : "")?.trim() || "";
          const label = (labelIdx !== -1 ? row[labelIdx] : "")?.trim() || "1 Unit";
          const rawPrice = (priceIdx !== -1 ? row[priceIdx] : "")?.replace(/[^0-9.]/g, "") || "0";
          const rawMrp = (mrpIdx !== -1 ? row[mrpIdx] : "")?.replace(/[^0-9.]/g, "") || "";
          const rawStock = (stockIdx !== -1 ? row[stockIdx] : "")?.replace(/[^0-9]/g, "") || "50";
          const imageUrl = (imageIdx !== -1 ? row[imageIdx] : "")?.trim() || "";
          const desc = (descIdx !== -1 ? row[descIdx] : "")?.trim() || "";
          const descHi = (descHiIdx !== -1 ? row[descHiIdx] : "")?.trim() || "";

          const price = parseFloat(rawPrice) || 0;
          const mrp = rawMrp ? parseFloat(rawMrp) || price : price;
          const stock = parseInt(rawStock, 10) || 50;

          const rowErrors: string[] = [];

          const matchedCat = findCategory(catInput, categories);
          if (!matchedCat) {
            rowErrors.push(
              catInput
                ? `Category "${catInput}" not found in store`
                : "Category column is missing or empty",
            );
          }

          if (price <= 0) {
            rowErrors.push("Price must be greater than 0");
          }

          parsedRows.push({
            rowIndex: rowNum,
            name,
            name_hi: nameHi,
            brand,
            categoryInput: catInput,
            matchedCategory: matchedCat,
            label,
            price,
            mrp,
            stock,
            image_url: imageUrl,
            description: desc,
            description_hi: descHi,
            errors: rowErrors,
          });
        });

        // Group rows by Product Name (case-insensitive) so multi-variant products combine
        const groupMap = new Map<string, GroupedProduct>();

        for (const row of parsedRows) {
          const key = row.name.toLowerCase().trim();
          const existing = groupMap.get(key);

          if (!existing) {
            groupMap.set(key, {
              name: row.name,
              name_hi: row.name_hi,
              brand: row.brand,
              category: row.matchedCategory || categories[0]!,
              description: row.description,
              description_hi: row.description_hi,
              image_url: row.image_url,
              variants: [
                {
                  label: row.label,
                  price: row.price,
                  mrp: row.mrp,
                  stock: row.stock,
                },
              ],
              errors: [...row.errors],
            });
          } else {
            // Add variant to existing product
            existing.variants.push({
              label: row.label,
              price: row.price,
              mrp: row.mrp,
              stock: row.stock,
            });
            if (row.image_url && !existing.image_url) {
              existing.image_url = row.image_url;
            }
            if (row.name_hi && !existing.name_hi) {
              existing.name_hi = row.name_hi;
            }
            if (row.errors.length > 0) {
              existing.errors.push(...row.errors);
            }
          }
        }

        const groups = Array.from(groupMap.values());
        setGroupedProducts(groups);

        const validCount = groups.filter((g) => g.errors.length === 0).length;
        if (validCount > 0) {
          toast.success(`Found ${validCount} valid products ready for import!`);
        } else {
          toast.warning("No valid products found. Please check categories and required fields.");
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        toast.error("Failed to parse CSV file. Ensure it is UTF-8 formatted.");
      }
    };

    reader.readAsText(file, "UTF-8");
  }

  // Execute Batch Upload into Supabase
  async function handleConfirmImport() {
    if (validProducts.length === 0) {
      toast.error("No valid products to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const existingSlugs = new Set(existingProducts.map((p) => p.slug));
    let importedCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < validProducts.length; i++) {
        const prod = validProducts[i]!;
        setCurrentImportingName(prod.name);

        // Generate clean unique slug
        let baseSlug = prod.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (!baseSlug) baseSlug = "item";

        let slug = baseSlug;
        let counter = 1;
        while (existingSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        existingSlugs.add(slug);

        // 1. Insert product
        const { data: newProd, error: prodErr } = await supabase
          .from("products")
          .insert({
            name: prod.name.trim(),
            name_en: prod.name.trim(),
            name_hi: prod.name_hi?.trim() || null,
            slug: slug,
            brand: prod.brand?.trim() || null,
            category_id: prod.category.id,
            description: prod.description?.trim() || null,
            description_en: prod.description?.trim() || null,
            description_hi: prod.description_hi?.trim() || null,
            image_url: prod.image_url?.trim() || null,
            images: prod.image_url?.trim() ? [prod.image_url.trim()] : [],
            is_active: true,
            is_featured: false,
            is_popular: false,
          })
          .select("id")
          .single();

        if (prodErr) {
          console.error(`Failed to insert product "${prod.name}":`, prodErr);
          failedCount++;
          continue;
        }

        // 2. Insert variants for this product
        const variantsPayload = prod.variants.map((v, vIndex) => ({
          product_id: newProd.id,
          label: v.label,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          low_stock_threshold: 5,
          sort_order: vIndex,
        }));

        const { error: varErr } = await supabase.from("product_variants").insert(variantsPayload);
        if (varErr) {
          console.error(`Failed to insert variants for "${prod.name}":`, varErr);
        }

        importedCount++;
        setImportProgress(Math.round(((i + 1) / validProducts.length) * 100));
      }

      // Sync and invalidate queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });

      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} products into database! 🎉`);
        onSuccess();
        handleClose();
      } else {
        toast.error(`Import failed. Please check permissions or network connection.`);
      }
    } catch (err: unknown) {
      console.error("Bulk import process error:", err);
      const msg = err instanceof Error ? err.message : "Bulk import failed";
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] flex flex-col p-0 rounded-3xl border-[#E8E4DA] bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 border-b border-[#E8E4DA] bg-[#FAF8F2]/60 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924] flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-[#145A45]" />
                Bulk Import Products (CSV थोक आयात)
              </DialogTitle>
              <p className="text-xs text-[#5A655F] mt-1">
                Upload a CSV spreadsheet to add dozens of products and pack sizes to your store at once.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="rounded-xl border-[#145A45]/30 text-[#145A45] hover:bg-[#145A45]/10 font-bold text-xs h-9 shrink-0 gap-1.5"
            >
              <Download className="size-3.5" /> Sample CSV
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* File Upload Box */}
          <div className="relative border-2 border-dashed border-[#145A45]/20 hover:border-[#145A45]/50 bg-[#FAF8F2]/40 rounded-2xl p-6 text-center transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              disabled={isImporting}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="size-12 rounded-full bg-[#145A45]/10 flex items-center justify-center text-[#145A45] mb-2">
                <Upload className="size-6" />
              </div>
              <p className="text-sm font-bold text-[#1F2924]">
                {fileName ? fileName : "Click to choose CSV file or drag & drop"}
              </p>
              <p className="text-xs text-[#6B746F] mt-1">
                Supported: UTF-8 CSV with English &amp; Hindi names, brands, prices &amp; packs.
              </p>
            </div>
          </div>

          {/* Import Progress Bar */}
          {isImporting && (
            <div className="rounded-2xl border border-[#145A45]/20 bg-[#145A45]/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#145A45]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Importing: {currentImportingName}...
                </span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2 bg-stone-200" />
            </div>
          )}

          {/* Preview Section */}
          {groupedProducts.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 border border-[#E8E4DA] rounded-xl px-4 py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1F2924]">
                    Total: {groupedProducts.length} Products ({totalRows} Rows)
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="size-3" /> {validProducts.length} Ready
                  </span>
                  {invalidProducts.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="size-3" /> {invalidProducts.length} Have Issues
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B746F]">
                  Multi-row items with matching names are grouped into 1 product with multiple pack sizes.
                </p>
              </div>

              {/* Products Preview Table */}
              <div className="border border-[#E8E4DA] rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-[320px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#FAF8F2] border-b border-[#E8E4DA] text-[#5A655F] font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Product Name (En / Hi)</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Pack Sizes (Variants)</th>
                        <th className="py-2.5 px-3 text-right">Price Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4DA]/60 bg-white">
                      {groupedProducts.map((prod, idx) => {
                        const hasErrors = prod.errors.length > 0;
                        const minPrice = Math.min(...prod.variants.map((v) => v.price));
                        const maxPrice = Math.max(...prod.variants.map((v) => v.price));

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-[#FAF8F2]/50 transition-colors ${
                              hasErrors ? "bg-amber-50/40" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 align-top">
                              {hasErrors ? (
                                <span
                                  title={prod.errors.join("; ")}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md cursor-help"
                                >
                                  <AlertCircle className="size-3 shrink-0" /> Error
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="size-3 shrink-0" /> Valid
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              <p className="font-bold text-[#1F2924] leading-snug">{prod.name}</p>
                              {prod.name_hi && (
                                <p className="text-[11px] text-[#145A45] font-medium leading-snug pb-0.5">
                                  {prod.name_hi}
                                </p>
                              )}
                              {prod.brand && (
                                <span className="text-[10px] font-semibold text-[#6B746F] uppercase">
                                  Brand: {prod.brand}
                                </span>
                              )}
                              {hasErrors && (
                                <p className="text-[10px] text-amber-700 font-semibold mt-1">
                                  ⚠️ {prod.errors.join(", ")}
                                </p>
                              )}
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              <span className="font-semibold text-[#1F2924]">
                                {prod.category.name}
                              </span>
                              {prod.category.name_hi && (
                                <p className="text-[10px] text-[#6B746F]">
                                  {prod.category.name_hi}
                                </p>
                              )}
                            </td>

                            <td className="py-2.5 px-3 align-top">
                              <div className="flex flex-wrap gap-1">
                                {prod.variants.map((v, vi) => (
                                  <span
                                    key={vi}
                                    className="inline-block border border-[#E8E4DA] bg-[#FAF8F2] px-1.5 py-0.5 rounded text-[10px] text-[#1F2924]"
                                  >
                                    <strong>{v.label}</strong> ({inr(v.price)} | {v.stock} pcs)
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 align-top text-right font-bold text-[#145A45]">
                              {minPrice === maxPrice
                                ? inr(minPrice)
                                : `${inr(minPrice)} – ${inr(maxPrice)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E4DA] bg-[#FAF8F2]/60 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isImporting}
            className="rounded-xl text-xs font-semibold text-[#5A655F]"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {groupedProducts.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={resetState}
                disabled={isImporting}
                className="rounded-xl text-xs border-[#E8E4DA] text-[#5A655F]"
              >
                Clear
              </Button>
            )}

            <Button
              type="button"
              disabled={validProducts.length === 0 || isImporting}
              onClick={handleConfirmImport}
              className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] text-xs h-10 px-5 shadow-xs"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 size-4" /> Import {validProducts.length} Product
                  {validProducts.length === 1 ? "" : "s"} Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
