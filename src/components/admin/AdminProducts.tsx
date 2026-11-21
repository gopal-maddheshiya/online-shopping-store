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
  Globe,
  Mic,
  MicOff,
  Tag,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  getProductImage,
  getProductImages,
  getImageTypeLabel,
  DEFAULT_PRODUCT_PLACEHOLDER,
} from "@/lib/product-images";
import { uploadProductImage } from "@/lib/image-upload";
import { broadcastProductSync } from "@/lib/realtime-sync";
import { PRODUCT_NAMES_HI, PRODUCT_NAMES_BY_NAME_HI, translateVariantLabel } from "@/lib/i18n";
import type { Product, Category, Variant, ProductImage, ProductImageType } from "@/lib/queries";
import { BulkProductImport } from "./BulkProductImport";
import { AdminAiProductAdder } from "./AdminAiProductAdder";
import {
  autoCompleteProductWithGemini,
  generateCleanSlug,
  detectGroceryNature,
} from "@/lib/gemini-admin";
import { Loader2 } from "lucide-react";
import { playMicTone, removeStutteredWords } from "@/lib/voice";




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
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAiProductAdderOpen, setIsAiProductAdderOpen] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalTab, setModalTab] = useState<"basic" | "pricing" | "photos">("basic");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  useEffect(() => {
    if (initialOpenAdd) {
      openAddModal();
    }
  }, [initialOpenAdd]);

  type VariantFormItem = {
    id?: string | undefined;
    label: string;
    price: number | "";
    mrp: number | "";
    stock: number | "";
    low_stock_threshold: number | "";
    sku?: string | undefined;
  };

  // Form State for Add / Edit Product
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [descriptionHi, setDescriptionHi] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [previewLang, setPreviewLang] = useState<"hi" | "en">("hi");

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

  // Variant Presets Tab: "solid" | "liquid" | "pack"
  const [presetType, setPresetType] = useState<"solid" | "liquid" | "pack">("solid");

  // Variants in Modal (Clean empty values by default)
  const [variants, setVariants] = useState<VariantFormItem[]>([
    { label: "", price: "", mrp: "", stock: "", low_stock_threshold: "" },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter((c) => c.parent_id === categoryId);
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const selectedSubcategoryObj = categories.find((c) => c.id === subcategoryId);

  function openAddModal() {
    setModalTab("basic");
    setShowAdvanced(false);
    setShowLivePreview(false);
    setEditingProduct(null);
    setName("");
    setNameHi("");
    setSlug("");
    setBrand("");
    setCategoryId(parentCategories[0]?.id ?? "");
    setSubcategoryId("");
    setDescription("");
    setDescriptionHi("");
    setFrontImageUrl("");
    setFrontImageLabel("Front View");
    setBackImageUrl("");
    setBackImageLabel("Back / Nutrition");
    setAdditionalImages([]);
    setIsFeatured(false);
    setIsPopular(false);
    setIsActive(true);
    setPreviewLang("hi");
    setVariants([{ label: "", price: "", mrp: "", stock: "", low_stock_threshold: "" }]);
    setIsAddModalOpen(true);
  }

  function openEditModal(prod: Product) {
    setModalTab("basic");
    setShowAdvanced(Boolean(prod.subcategory_id));
    setShowLivePreview(false);
    setEditingProduct(prod);
    setName(prod.name_en || prod.name);
    setNameHi(prod.name_hi || "");
    setSlug(prod.slug);
    setBrand(prod.brand ?? "");
    setCategoryId(prod.category_id ?? "");
    setSubcategoryId(prod.subcategory_id ?? "");
    setDescription(prod.description_en || prod.description || "");
    setDescriptionHi(prod.description_hi || "");
    setIsFeatured(prod.is_featured);
    setIsPopular(prod.is_popular);
    setIsActive(prod.is_active);
    setPreviewLang("hi");

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
      setSlug(generateCleanSlug(val, brand));
    }
  }

  const [isNameListening, setIsNameListening] = useState(false);
  const nameRecognitionRef = useRef<any>(null);

  function toggleVoiceName() {
    if (isNameListening) {
      if (nameRecognitionRef.current) {
        try {
          nameRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsNameListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("आवाज़ पहचान उपलब्ध नहीं है। कृपया लिखकर दर्ज करें।");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "hi-IN";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsNameListening(true);
        playMicTone("start");
        toast.info("🎙️ बोलिए... सामान या ब्रांड का नाम बोलें");
      };

      rec.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i] && event.results[i][0]) {
            text += event.results[i][0].transcript + " ";
          }
        }
        const clean = removeStutteredWords(text).trim();
        if (clean) {
          handleNameChange(clean);
        }
      };

      rec.onerror = () => {
        setIsNameListening(false);
        playMicTone("stop");
      };

      rec.onend = () => {
        setIsNameListening(false);
        playMicTone("stop");
      };

      nameRecognitionRef.current = rec;
      rec.start();
    } catch {
      setIsNameListening(false);
    }
  }

  async function handleAiAutoComplete() {
    if (!name.trim()) {
      toast.error("कृपया पहले प्रोडक्ट या ब्रांड का नाम लिखें (जैसे: Fortune Oil, Tata Namak, या हिंदी में)");
      return;
    }
    setIsAiFilling(true);
    try {
      const res = await autoCompleteProductWithGemini({
        productName: name,
        categories,
      });

      if (res.success && res.data) {
        // 1. Standardize English name if AI gave a clean, professional retail title
        if (res.data.name) setName(res.data.name);

        // 2. Always update authentic Devanagari Hindi name
        if (res.data.name_hi) setNameHi(res.data.name_hi);

        // 3. Always update clean alphanumeric kebab-case URL slug
        if (res.data.slug) setSlug(res.data.slug);

        // 4. Update brand if detected (or clear it if empty/unbranded)
        setBrand(res.data.brand || "");

        // 5. Update category if detected and valid
        if (res.data.category_id) {
          setCategoryId(res.data.category_id);
        }

        // 6. Descriptions
        if (res.data.description) setDescription(res.data.description);
        if (res.data.description_hi) setDescriptionHi(res.data.description_hi);

        // 7. Suggest variants only if variants are still untouched default
        const isUntouchedDefault =
          variants.length === 1 &&
          (!variants[0]?.label || variants[0]?.label === "1 kg" || variants[0]?.label === "") &&
          (!variants[0]?.price || variants[0]?.price === 100);

        if (isUntouchedDefault && res.data.variants && res.data.variants.length > 0) {
          setVariants(
            res.data.variants.map((v) => ({
              label: v.label,
              price: v.price || "",
              mrp: v.mrp || "",
              stock: 50,
              low_stock_threshold: 5,
            }))
          );
        }

        // Auto-switch preset tab to matching nature
        if (res.data.nature === "liquid") {
          setPresetType("liquid");
        } else if (res.data.nature === "countable") {
          setPresetType("pack");
        } else {
          setPresetType("solid");
        }

        toast.success("उत्पाद विवरण स्वतः भर दिए गए!");
      } else {
        toast.error(res.error || "AI ऑटो-कंप्लीट नहीं कर सका।");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI ऑटो-कंप्लीट में समस्या आई।");
    } finally {
      setIsAiFilling(false);
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
      { label: "", price: "", mrp: "", stock: "", low_stock_threshold: "" },
    ]);
  }

  function handlePresetSelect(preset: string) {
    setVariants((prev) => {
      // If only 1 variant exists and its label is empty, fill it directly
      if (prev.length === 1 && prev[0] && !prev[0].label.trim()) {
        const first = prev[0];
        return [{ ...first, label: preset }];
      }
      return [
        ...prev,
        { label: preset, price: "", mrp: "", stock: 50, low_stock_threshold: 5 },
      ];
    });
    toast.success(`पैक चुना गया: ${preset}`);
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
      setModalTab("basic");
      toast.error("कृपया प्रोडक्ट का नाम दर्ज करें");
      return;
    }
    if (!slug.trim()) {
      setModalTab("basic");
      toast.error("कृपया प्रोडक्ट का URL स्लग दर्ज करें");
      return;
    }

    if (variants.length === 0) {
      setModalTab("pricing");
      toast.error("कम से कम 1 पैक साइज / वैरिएंट होना आवश्यक है");
      return;
    }

    // Validate that every variant has a label and price
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!;
      if (!v.label.trim()) {
        setModalTab("pricing");
        toast.error(`पैक #${i + 1} का साइज या वज़न (उदा. 1 kg, 500 g) दर्ज करें`);
        return;
      }
      if (v.price === "" || Number(v.price) <= 0) {
        setModalTab("pricing");
        toast.error(`पैक "${v.label}" का बिक्री मूल्य (Price) दर्ज करें`);
        return;
      }
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

    const primaryUrl = frontImageUrl.trim() || backImageUrl.trim() || DEFAULT_PRODUCT_PLACEHOLDER;
    const stringifiedImages = cleanImages.map((img) => JSON.stringify(img));

    setIsSaving(true);
    try {
      if (editingProduct) {
        // 1. Update product
        const { error: prodError } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            name_en: name.trim(),
            name_hi: nameHi.trim() || null,
            slug: slug.trim(),
            brand: brand.trim() || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            description: description.trim() || null,
            description_en: description.trim() || null,
            description_hi: descriptionHi.trim() || null,
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
          const cleanLabel = (v.label || "Standard").trim();
          const cleanLabelHi = translateVariantLabel(cleanLabel, "hi");
          const vPrice = Number(v.price) || 0;
          const vMrp = Number(v.mrp) > 0 ? Number(v.mrp) : vPrice;
          const vStock = v.stock === "" ? 50 : Math.max(0, Number(v.stock));
          const vLowStock = v.low_stock_threshold === "" ? 5 : Math.max(0, Number(v.low_stock_threshold));

          if (v.id) {
            await supabase
              .from("product_variants")
              .update({
                label: cleanLabel,
                label_hi: cleanLabelHi,
                price: vPrice,
                mrp: vMrp,
                stock: vStock,
                low_stock_threshold: vLowStock,
                sort_order: i,
              })
              .eq("id", v.id);
          } else {
            await supabase.from("product_variants").insert({
              product_id: editingProduct.id,
              label: cleanLabel,
              label_hi: cleanLabelHi,
              price: vPrice,
              mrp: vMrp,
              stock: vStock,
              low_stock_threshold: vLowStock,
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
            name_en: name.trim(),
            name_hi: nameHi.trim() || null,
            slug: slug.trim(),
            brand: brand.trim() || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            description: description.trim() || null,
            description_en: description.trim() || null,
            description_hi: descriptionHi.trim() || null,
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
        const varPayload = variants.map((v, i) => {
          const cleanLabel = (v.label || "Standard").trim();
          const vPrice = Number(v.price) || 0;
          const vMrp = Number(v.mrp) > 0 ? Number(v.mrp) : vPrice;
          const vStock = v.stock === "" ? 50 : Math.max(0, Number(v.stock));
          const vLowStock = v.low_stock_threshold === "" ? 5 : Math.max(0, Number(v.low_stock_threshold));
          return {
            product_id: newProd.id,
            label: cleanLabel,
            label_hi: translateVariantLabel(cleanLabel, "hi"),
            price: vPrice,
            mrp: vMrp,
            stock: vStock,
            low_stock_threshold: vLowStock,
            sort_order: i,
          };
        });

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

  const missingCount = products.filter(
    (p) =>
      !p.name_hi &&
      !PRODUCT_NAMES_HI[p.slug] &&
      !PRODUCT_NAMES_BY_NAME_HI[p.name.toLowerCase().trim()],
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Missing Translation Notice for Store Owner */}
      {missingCount > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-700 shrink-0" />
            <p>
              <span className="font-bold">{missingCount} product(s)</span> are missing Hindi translations. You can click <strong>Edit</strong> on any product to enter its Hindi title and description.
            </p>
          </div>
          <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 shrink-0">
            हिंदी अनुवाद शेष
          </span>
        </div>
      )}

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
                  {c.name} {c.name_hi ? `(${c.name_hi})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            onClick={() => setIsAiProductAdderOpen(true)}
            variant="outline"
            className="rounded-xl font-bold border-[#145A45]/30 text-[#145A45] hover:bg-[#145A45]/10 h-11 text-xs shrink-0 gap-1.5 shadow-2xs"
          >
            <Sparkles className="size-4 text-emerald-600" /> AI बिल / पर्चा स्कैनर
          </Button>
          <Button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            variant="outline"
            className="rounded-xl font-bold border-[#E8E4DA] text-[#5A655F] hover:bg-[#FAF8F2] h-11 text-xs shrink-0"
          >
            <Upload className="mr-1.5 size-4" /> Bulk Import (CSV)
          </Button>
          <Button
            type="button"
            onClick={openAddModal}
            className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-11 text-xs shadow-xs shrink-0 gap-1.5"
          >
            <Plus className="size-4" /> नया प्रोडक्ट जोड़ें
          </Button>
        </div>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-[#1F2924] text-xs leading-snug">
                          {p.name}
                        </p>
                        {!(p.name_hi || PRODUCT_NAMES_HI[p.slug] || PRODUCT_NAMES_BY_NAME_HI[p.name.toLowerCase().trim()]) ? (
                          <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-300">
                            ⚠️ हिंदी बाकी
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-medium text-emerald-700 border border-emerald-200">
                            ✓ En/Hi
                          </span>
                        )}
                      </div>
                      {p.name_hi && (
                        <p className="text-[11px] text-[#145A45] font-medium truncate">
                          {p.name_hi}
                        </p>
                      )}
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
                    const hasHindi = Boolean(p.name_hi || PRODUCT_NAMES_HI[p.slug] || PRODUCT_NAMES_BY_NAME_HI[p.name.toLowerCase().trim()]);

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F2]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              className="size-11 rounded-xl object-contain bg-[#FAF8F2] border border-[#E8E4DA] p-1"
                            />
                            <div className="min-w-0 max-w-[220px]">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-semibold text-[#1F2924]">{p.name}</p>
                                {!hasHindi ? (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-300 shrink-0">
                                    ⚠️ हिंदी बाकी
                                  </span>
                                ) : (
                                  <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-medium text-emerald-700 border border-emerald-200 shrink-0">
                                    ✓ En/Hi
                                  </span>
                                )}
                              </div>
                              {p.name_hi && (
                                <p className="text-[11px] text-[#145A45] font-medium truncate">
                                  {p.name_hi}
                                </p>
                              )}
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

      {/* Add / Edit Product Modal (Clean, Spacious 3-Tab Architecture) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          data-lenis-prevent
          className="w-[95vw] sm:max-w-3xl h-[88vh] max-h-[92dvh] flex flex-col gap-0 p-0 overflow-hidden rounded-3xl border-[#E8E4DA] bg-white shadow-2xl"
        >
          {/* 1. Modal Fixed Header & Tab Navigation Bar */}
          <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-[#E8E4DA] bg-white shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-sans text-lg sm:text-xl font-bold text-[#1F2924]">
                  {editingProduct ? `Edit "${editingProduct.name}"` : "नया किराना प्रोडक्ट जोड़ें (Add Product)"}
                </DialogTitle>
                <p className="text-[11px] text-[#5A655F] mt-0.5">
                  दुकान के लिए नाम, सही माप (लीटर/किलो), एमआरपी व फोटो आसानी से दर्ज करें
                </p>
              </div>
            </div>

            {/* Clean 3-Tab Selector Pill Bar */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF8F2] rounded-2xl border border-[#E8E4DA]">
              <button
                type="button"
                onClick={() => setModalTab("basic")}
                className={cn(
                  "py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  modalTab === "basic"
                    ? "bg-white text-[#145A45] shadow-xs border border-[#145A45]/25"
                    : "text-[#5A655F] hover:text-[#16201A]"
                )}
              >
                <Package className="size-3.5 shrink-0" />
                <span className="truncate">1. बुनियादी जानकारी</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("pricing")}
                className={cn(
                  "py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  modalTab === "pricing"
                    ? "bg-white text-[#145A45] shadow-xs border border-[#145A45]/25"
                    : "text-[#5A655F] hover:text-[#16201A]"
                )}
              >
                <Tag className="size-3.5 shrink-0" />
                <span className="truncate">2. पैक व रेट ({variants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("photos")}
                className={cn(
                  "py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  modalTab === "photos"
                    ? "bg-white text-[#145A45] shadow-xs border border-[#145A45]/25"
                    : "text-[#5A655F] hover:text-[#16201A]"
                )}
              >
                <ImageIcon className="size-3.5 shrink-0" />
                <span className="truncate">3. फोटो व विवरण</span>
              </button>
            </div>
          </DialogHeader>

          {/* 2. Scrollable Body Area (Tab Content) */}
          <form
            onSubmit={handleSaveProduct}
            className="flex flex-col flex-1 min-h-0 h-full overflow-hidden"
          >
            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4"
            >
              {/* TAB 1: BASIC INFORMATION */}
              {modalTab === "basic" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {/* English Name with Voice & AI Auto-fill buttons */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-[#1F2924]">
                          Product Name (English) <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={toggleVoiceName}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs ${
                              isNameListening
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-white hover:bg-[#FAF8F2] text-[#145A45] border border-[#E8E4DA]"
                            }`}
                            title="बोलकर नाम दर्ज करें"
                          >
                            {isNameListening ? <MicOff className="size-3" /> : <Mic className="size-3 text-[#145A45]" />}
                            <span>{isNameListening ? "सुन रहे हैं..." : "बोलें"}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isAiFilling || !name.trim()}
                            onClick={handleAiAutoComplete}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#145A45] hover:bg-[#0E4333] px-3 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                            title="नाम के आधार पर बाकी जानकारी स्वतः भरें"
                          >
                            {isAiFilling ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" /> भरने में लगा है...
                              </>
                            ) : (
                              <>
                                <Sparkles className="size-3.5 text-amber-300" /> AI ऑटो-फिल
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <Input
                        required
                        placeholder="उदा. Fortune Kachi Ghani Mustard Oil, Tata Salt, Maggi Noodles..."
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="rounded-xl border-[#E8E4DA] text-xs h-10 font-semibold bg-white placeholder:font-normal placeholder:text-stone-400/80"
                      />
                    </div>

                    {/* Hindi Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#1F2924]">
                        उत्पाद का नाम (हिंदी / Hindi)
                      </Label>
                      <Input
                        placeholder="उदा. फॉर्च्यून कच्ची घानी सरसों का तेल"
                        value={nameHi}
                        onChange={(e) => setNameHi(e.target.value)}
                        className="rounded-xl border-[#E8E4DA] text-xs h-10 font-semibold bg-white placeholder:font-normal placeholder:text-stone-400/80"
                      />
                    </div>

                    {/* Brand / Manufacturer */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#1F2924]">
                        Brand / कंपनी का नाम
                      </Label>
                      <Input
                        placeholder="उदा. Fortune, Tata, Aashirvaad, Amul, MDH..."
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white placeholder:font-normal placeholder:text-stone-400/80"
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-[#1F2924]">
                        मुख्य कैटेगरी (Category) <span className="text-red-500">*</span>
                      </Label>

                      <Select
                        value={categoryId}
                        onValueChange={(v) => {
                          setCategoryId(v);
                          setSubcategoryId("");
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-10 bg-white font-semibold">
                          <SelectValue placeholder="कैटेगरी चुनें…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {parentCategories.map((c) => {
                            const subs = categories.filter((sub) => sub.parent_id === c.id);
                            return (
                              <SelectItem
                                key={c.id}
                                value={c.id}
                                className="text-xs font-semibold"
                              >
                                <span className="flex items-center gap-2">
                                  <span>{c.icon ?? "📦"}</span>
                                  <span>{c.name_en || c.name}</span>
                                  {c.name_hi ? (
                                    <span className="text-[10px] text-[#145A45]">({c.name_hi})</span>
                                  ) : null}
                                  {subs.length > 0 && (
                                    <span className="rounded bg-[#FAF8F2] border border-[#E8E4DA] px-1 text-[9px] text-[#5A655F]">
                                      {subs.length} sub
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Collapsible Advanced Settings (URL Slug & Subcategory) */}
                  <div className="pt-2 border-t border-[#E8E4DA]/70">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145A45] hover:text-[#0E4333] cursor-pointer"
                    >
                      {showAdvanced ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                      <span>
                        {showAdvanced ? "एडवांस्ड सेटिंग्स छुपायें" : "एडवांस्ड सेटिंग्स (URL Slug व उप-श्रेणी)"}
                      </span>
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 p-3 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] space-y-3 animate-in fade-in duration-150">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-[#1F2924]">
                              URL Slug <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              required
                              placeholder="fortune-mustard-oil"
                              value={slug}
                              onChange={(e) => setSlug(e.target.value)}
                              className="rounded-xl font-mono text-xs border-[#E8E4DA] h-9 bg-white placeholder:font-normal placeholder:text-stone-400/80"
                            />
                          </div>

                          {subcategories.length > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-[#1F2924]">
                                उप-श्रेणी (Subcategory - Optional)
                              </Label>
                              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                                <SelectTrigger className="rounded-xl border-[#E8E4DA] text-xs h-9 bg-white">
                                  <SelectValue placeholder="— उप-श्रेणी चुनें —" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subcategories.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                      <span>{s.name_en || s.name} {s.name_hi ? `(${s.name_hi})` : ""}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PACK SIZES, PRICING & INVENTORY */}
              {modalTab === "pricing" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E4DA] pb-2">
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-[#1F2924]">
                      पैक साइज, एमआरपी, बिक्री मूल्य व स्टॉक
                    </h4>

                    <Button
                      type="button"
                      onClick={addVariantRow}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs border-[#145A45]/30 text-[#145A45] hover:bg-[#E6EFE8] font-bold h-8 cursor-pointer shadow-2xs"
                    >
                      <Plus className="size-3.5 mr-1" /> नया पैक जोड़ें
                    </Button>
                  </div>

                  {/* Quick Unit Presets for Solid, Liquid, Pack */}
                  <div className="rounded-2xl bg-[#FAF8F2] p-3 border border-[#E8E4DA] space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#1F2924]">
                        त्वरित पैक जोड़ें:
                      </span>
                      <div className="flex rounded-lg bg-white border border-[#E8E4DA] p-0.5 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setPresetType("solid")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            presetType === "solid"
                              ? "bg-[#145A45] text-white shadow-2xs"
                              : "text-[#5A655F] hover:text-[#1F2924]"
                          }`}
                        >
                          वज़न (Solid)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetType("liquid")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            presetType === "liquid"
                              ? "bg-[#145A45] text-white shadow-2xs"
                              : "text-[#5A655F] hover:text-[#1F2924]"
                          }`}
                        >
                          तरल (Liquid)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetType("pack")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            presetType === "pack"
                              ? "bg-[#145A45] text-white shadow-2xs"
                              : "text-[#5A655F] hover:text-[#1F2924]"
                          }`}
                        >
                          पैकेट / पीस
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {presetType === "solid" &&
                        ["50 g", "100 g", "250 g", "500 g", "1 kg", "2 kg", "5 kg", "10 kg", "25 kg"].map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handlePresetSelect(preset)}
                              className="rounded-lg bg-white border border-[#145A45]/30 text-[#145A45] hover:bg-[#E6EFE8] px-2.5 py-1 font-bold shadow-2xs transition-colors text-[11px] cursor-pointer"
                            >
                              + {preset}
                            </button>
                          )
                        )}

                      {presetType === "liquid" &&
                        ["100 ml", "200 ml", "250 ml", "500 ml", "1 L", "2 L", "5 L Jar", "15 L Tin"].map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handlePresetSelect(preset)}
                              className="rounded-lg bg-white border border-sky-300 text-sky-800 hover:bg-sky-50 px-2.5 py-1 font-bold shadow-2xs transition-colors text-[11px] cursor-pointer"
                            >
                              + {preset}
                            </button>
                          )
                        )}

                      {presetType === "pack" &&
                        ["1 Pack", "Pack of 4", "1 Piece", "1 दर्जन (12 pcs)", "1 Box", "1 Pouch", "1 टिकिया / बार"].map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handlePresetSelect(preset)}
                              className="rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 px-2.5 py-1 font-bold shadow-2xs transition-colors text-[11px] cursor-pointer"
                            >
                              + {preset}
                            </button>
                          )
                        )}
                    </div>
                  </div>

                  {/* Clean Variant Cards */}
                  <div className="space-y-2.5">
                    {variants.map((v, idx) => {
                      const mrpNum = Number(v.mrp) || 0;
                      const priceNum = Number(v.price) || 0;
                      const disc =
                        mrpNum > 0 && priceNum > 0 && mrpNum > priceNum
                          ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
                          : 0;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl bg-white p-3 sm:p-3.5 border border-[#E8E4DA] text-xs shadow-2xs space-y-2.5"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-2.5 items-end">
                            {/* Pack Label */}
                            <div className="col-span-2 sm:col-span-3">
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-[10px] text-[#6B746F] font-bold uppercase tracking-wider block">
                                  Pack Label
                                </Label>
                                <span className="text-[10px] font-bold text-[#145A45] bg-[#E6EFE8] px-1.5 py-0.2 rounded border border-[#145A45]/20">
                                  {translateVariantLabel(v.label, "hi") || "—"}
                                </span>
                              </div>
                              <Input
                                placeholder="उदा. 1 L, 1 kg, 500 g"
                                value={v.label}
                                onChange={(e) => updateVariant(idx, "label", e.target.value)}
                                className="h-9.5 text-xs rounded-xl border-[#E8E4DA] font-semibold placeholder:font-normal placeholder:text-stone-400/80"
                              />
                              {/* Quick 1-tap size chips for this variant row */}
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <span className="text-[9.5px] text-stone-600 font-medium">त्वरित:</span>
                                {["250 g", "500 g", "1 kg", "2 kg", "5 kg", "1 L", "1 pc"].map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() => updateVariant(idx, "label", chip)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                      v.label === chip
                                        ? "bg-[#145A45] text-white border-[#145A45]"
                                        : "bg-white text-stone-600 hover:text-[#145A45] hover:bg-[#E6EFE8] border-stone-200"
                                    }`}
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* MRP */}
                            <div className="sm:col-span-2">
                              <Label className="text-[10px] text-[#6B746F] font-bold uppercase tracking-wider mb-1 block">
                                MRP (₹)
                              </Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="1"
                                placeholder="उदा. 150"
                                value={v.mrp === "" ? "" : v.mrp}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateVariant(idx, "mrp", val === "" ? "" : Number(val));
                                }}
                                className="h-9.5 text-xs rounded-xl border-[#E8E4DA] font-bold text-stone-600 placeholder:font-normal placeholder:text-stone-400/80"
                              />
                            </div>

                            {/* Selling Price */}
                            <div className="sm:col-span-3">
                              <Label className="text-[10px] text-[#145A45] font-bold uppercase tracking-wider mb-1 block">
                                बिक्री मूल्य / Price (₹)
                              </Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="1"
                                placeholder="उदा. 135"
                                value={v.price === "" ? "" : v.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateVariant(idx, "price", val === "" ? "" : Number(val));
                                }}
                                className="h-9.5 text-xs rounded-xl border-[#145A45]/40 font-extrabold text-[#145A45] bg-emerald-50/30 placeholder:font-normal placeholder:text-stone-400/80"
                              />
                            </div>

                            {/* Stock Quantity */}
                            <div className="sm:col-span-2">
                              <Label className="text-[10px] text-[#6B746F] font-bold uppercase tracking-wider mb-1 block">
                                स्टॉक मात्रा
                              </Label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                placeholder="उदा. 50"
                                value={v.stock === "" ? "" : v.stock}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateVariant(idx, "stock", val === "" ? "" : Number(val));
                                }}
                                className="h-9.5 text-xs rounded-xl border-[#E8E4DA] font-semibold placeholder:font-normal placeholder:text-stone-400/80"
                              />
                            </div>

                            {/* Low Stock Threshold */}
                            <div className="sm:col-span-2">
                              <Label className="text-[10px] text-[#6B746F] font-bold uppercase tracking-wider mb-1 block">
                                लो अलर्ट
                              </Label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                placeholder="उदा. 5"
                                value={v.low_stock_threshold === "" ? "" : v.low_stock_threshold}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateVariant(idx, "low_stock_threshold", val === "" ? "" : Number(val));
                                }}
                                className="h-9.5 text-xs rounded-xl border-[#E8E4DA] font-semibold placeholder:font-normal placeholder:text-stone-400/80"
                              />
                            </div>
                          </div>

                          {/* Pills Row: Margin, Discount & Remove */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-dashed border-[#E8E4DA]">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="rounded-md bg-[#E6EFE8] border border-[#145A45]/30 px-2 py-0.5 text-[10px] font-bold text-[#0F4A38]">
                                बचत / मार्जिन: {mrpNum > 0 && priceNum > 0 ? inr(mrpNum - priceNum) : "—"}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                                  disc > 0
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : "bg-stone-50 text-stone-500 border-stone-200"
                                }`}
                              >
                                {disc > 0 ? `${disc}% छूट` : "कोई छूट नहीं"}
                              </span>
                            </div>

                            {variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariantRow(idx)}
                                className="h-7 px-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                                <span>हटाएं</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PHOTOS, DESCRIPTIONS & VISIBILITY */}
              {modalTab === "photos" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Front & Back Photo Cards */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Front Image */}
                    <div className="rounded-2xl bg-white p-3.5 border-2 border-[#145A45]/30 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-1.5">
                        <span className="rounded-md bg-[#E6EFE8] px-2 py-0.5 text-[10px] font-bold text-[#0F4A38] flex items-center gap-1">
                          <Star className="size-3 fill-[#0F4A38]" /> मुख्य फोटो (Front View)
                        </span>
                        {frontImageUrl && (
                          <button
                            type="button"
                            onClick={() => setFrontImageUrl("")}
                            className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            हटाएं
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="relative size-18 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={frontImageUrl || DEFAULT_PRODUCT_PLACEHOLDER}
                            alt="Front View"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
                                target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                              }
                            }}
                            className="size-full object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5 text-xs">
                          <label className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#145A45]/30 bg-[#E6EFE8]/70 text-[#0F4A38] px-3 text-xs font-bold hover:bg-[#E6EFE8] active:scale-98 cursor-pointer transition-colors shadow-2xs w-full">
                            <Upload className="size-3.5" />
                            <span>{isUploadingFront ? "अपलोड हो रहा है..." : "डिवाइस से फोटो अपलोड करें"}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFront(file);
                              }}
                              disabled={isUploadingFront}
                              className="hidden"
                            />
                          </label>

                          <Input
                            placeholder="या फोटो का सीधा URL पेस्ट करें"
                            value={frontImageUrl}
                            onChange={(e) => setFrontImageUrl(e.target.value)}
                            className="h-7.5 text-[11px] rounded-lg border-[#E8E4DA]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Back Image */}
                    <div className="rounded-2xl bg-white p-3.5 border border-[#E8E4DA] shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-1.5">
                        <span className="rounded-md bg-[#FAF8F2] px-2 py-0.5 text-[10px] font-bold text-[#5A655F] flex items-center gap-1">
                          <Boxes className="size-3 text-[#5A655F]" /> पीछे की फोटो / पोषण (Back View)
                        </span>
                        {backImageUrl && (
                          <button
                            type="button"
                            onClick={() => setBackImageUrl("")}
                            className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            हटाएं
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="relative size-18 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA] p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={backImageUrl || DEFAULT_PRODUCT_PLACEHOLDER}
                            alt="Back View"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
                                target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                              }
                            }}
                            className="size-full object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5 text-xs">
                          <label className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#E8E4DA] bg-[#FAF8F2] text-[#1F2924] px-3 text-xs font-bold hover:bg-white active:scale-98 cursor-pointer transition-colors shadow-2xs w-full">
                            <Upload className="size-3.5 text-[#145A45]" />
                            <span>{isUploadingBack ? "अपलोड हो रहा है..." : "डिवाइस से फोटो अपलोड करें"}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadBack(file);
                              }}
                              disabled={isUploadingBack}
                              className="hidden"
                            />
                          </label>

                          <Input
                            placeholder="या Back Photo URL पेस्ट करें"
                            value={backImageUrl}
                            onChange={(e) => setBackImageUrl(e.target.value)}
                            className="h-7.5 text-[11px] rounded-lg border-[#E8E4DA]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions (English & Hindi) */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[#16201A]">
                        Description (English)
                      </Label>
                      <Textarea
                        rows={2}
                        placeholder="Pure stone ground whole wheat flour with natural dietary fiber..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl text-xs border-[#E8E4DA] bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[#16201A]">
                        उत्पाद विवरण (हिंदी)
                      </Label>
                      <Textarea
                        rows={2}
                        placeholder="100% शुद्ध संपूर्ण गेहूं के दानों से बना चक्की आटा..."
                        value={descriptionHi}
                        onChange={(e) => setDescriptionHi(e.target.value)}
                        className="rounded-xl text-xs border-[#E8E4DA] bg-white"
                      />
                    </div>
                  </div>

                  {/* Visibility Checkboxes */}
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-[#E8E4DA]">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2924]">
                      <Checkbox checked={isFeatured} onCheckedChange={(c) => setIsFeatured(Boolean(c))} />
                      <span>होमपेज पर दिखाएं (Featured)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2924]">
                      <Checkbox checked={isPopular} onCheckedChange={(c) => setIsPopular(Boolean(c))} />
                      <span>महराजगंज में लोकप्रिय (Popular)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2924]">
                      <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(Boolean(c))} />
                      <span>सक्रिय रखें (Active &amp; Visible)</span>
                    </label>
                  </div>

                  {/* Collapsible Customer Live Card Preview */}
                  <div className="pt-2 border-t border-[#E8E4DA]/70">
                    <button
                      type="button"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145A45] hover:text-[#0E4333] cursor-pointer"
                    >
                      {showLivePreview ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                      <span>
                        {showLivePreview ? "कस्टमर कार्ड प्रिव्यू छुपायें" : "कस्टमर कार्ड प्रिव्यू देखें (ग्राहक को कैसा दिखेगा)"}
                      </span>
                    </button>

                    {showLivePreview && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E8E4DA] space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#145A45]">Live Preview:</span>
                          <div className="flex items-center rounded-xl bg-white p-0.5 border border-[#E8E4DA] shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setPreviewLang("hi")}
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                                previewLang === "hi"
                                  ? "bg-[#145A45] text-white"
                                  : "text-[#5A655F]"
                              }`}
                            >
                              हिंदी
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewLang("en")}
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                                previewLang === "en"
                                  ? "bg-[#145A45] text-white"
                                  : "text-[#5A655F]"
                              }`}
                            >
                              English
                            </button>
                          </div>
                        </div>

                        <div className="max-w-[240px] mx-auto rounded-2xl bg-white p-3 border border-[#E8E4DA] shadow-xs space-y-2">
                          <div className="h-24 rounded-xl bg-[#FAF8F2] flex items-center justify-center p-1 overflow-hidden border border-[#E8E4DA]/60">
                            <img
                              src={frontImageUrl || backImageUrl || DEFAULT_PRODUCT_PLACEHOLDER}
                              alt="Preview"
                              className="size-full object-contain"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_PRODUCT_PLACEHOLDER) {
                                  target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                                }
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#16201A] line-clamp-2">
                              {previewLang === "hi"
                                ? nameHi.trim() || name.trim() || "उत्पाद का नाम"
                                : name.trim() || "Product Name"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-[#E8E4DA]">
                            <span className="text-xs font-extrabold text-[#145A45]">
                              {variants[0]?.price && Number(variants[0].price) > 0
                                ? inr(Number(variants[0].price))
                                : "₹—"}
                            </span>
                            <span className="rounded-md bg-[#145A45] px-2 py-0.5 text-[9px] font-bold text-white">
                              {previewLang === "hi" ? "जोड़ें +" : "Add +"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Modal Fixed Footer with Step Navigation */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-[#E8E4DA] bg-[#FAF8F2] shrink-0 gap-2">
              {/* Left Button */}
              <div>
                {modalTab === "basic" ? (
                  <Button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    variant="ghost"
                    className="rounded-xl text-xs text-[#5A655F] hover:bg-white h-9.5 px-3 cursor-pointer"
                  >
                    रद्द करें (Cancel)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setModalTab(modalTab === "photos" ? "pricing" : "basic")}
                    variant="outline"
                    className="rounded-xl text-xs border-[#E8E4DA] bg-white text-[#1F2924] hover:bg-[#FAF8F2] h-9.5 px-3.5 font-bold cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="size-4 mr-1" /> पिछला
                  </Button>
                )}
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2">
                {modalTab !== "photos" && (
                  <Button
                    type="submit"
                    disabled={isSaving || !name.trim()}
                    variant="outline"
                    className="rounded-xl text-xs border-[#145A45]/30 text-[#145A45] hover:bg-[#E6EFE8] h-9.5 px-3 font-bold hidden sm:inline-flex cursor-pointer"
                  >
                    तुरंत सेव करें
                  </Button>
                )}

                {modalTab === "basic" && (
                  <Button
                    type="button"
                    onClick={() => setModalTab("pricing")}
                    className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-9.5 text-xs shadow-xs px-4 cursor-pointer"
                  >
                    <span>आगे: पैक और रेट</span>
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                )}

                {modalTab === "pricing" && (
                  <Button
                    type="button"
                    onClick={() => setModalTab("photos")}
                    className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-9.5 text-xs shadow-xs px-4 cursor-pointer"
                  >
                    <span>आगे: फोटो और विवरण</span>
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                )}

                {modalTab === "photos" && (
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl font-bold bg-[#145A45] text-white hover:bg-[#0E4333] h-9.5 text-xs shadow-xs px-5 cursor-pointer"
                  >
                    {isSaving ? "सेव हो रहा है…" : editingProduct ? "अपडेट सुरक्षित करें" : "प्रोडक्ट सेव करें"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk CSV Import Modal */}
      <BulkProductImport
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        categories={categories}
        existingProducts={products}
        onSuccess={onRefresh}
      />

      {/* AI Smart Product Intake Modal (Invoice / Voice / WhatsApp) */}
      <AdminAiProductAdder
        isOpen={isAiProductAdderOpen}
        onClose={() => setIsAiProductAdderOpen(false)}
        categories={categories}
        existingProducts={products}
        onSuccess={onRefresh}
      />
    </div>
  );
}

