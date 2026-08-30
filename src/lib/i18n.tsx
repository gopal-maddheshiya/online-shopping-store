import React, { createContext, useContext, useState, useEffect } from "react";
import {
  type Language,
  type Translations,
  translations,
  CATEGORY_NAMES_HI,
  CATEGORY_NAMES_BY_NAME_HI,
  PRODUCT_NAMES_HI,
  PRODUCT_NAMES_BY_NAME_HI,
  translateVariantLabel,
  formatStoreStatusText,
} from "./i18n-data";

export type { Language, Translations };
export {
  translations,
  CATEGORY_NAMES_HI,
  CATEGORY_NAMES_BY_NAME_HI,
  PRODUCT_NAMES_HI,
  PRODUCT_NAMES_BY_NAME_HI,
  translateVariantLabel,
  formatStoreStatusText,
};

export type ProductLike = {
  name: string;
  slug?: string;
  name_en?: string | null;
  name_hi?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_hi?: string | null;
};

export type CategoryLike = {
  name: string;
  slug?: string;
  name_en?: string | null;
  name_hi?: string | null;
};

export type VariantLike = {
  label?: string | null;
  label_en?: string | null;
  label_hi?: string | null;
  variant_label?: string | null;
  variant_label_en?: string | null;
  variant_label_hi?: string | null;
  variantLabel?: string | null;
  variantLabel_en?: string | null;
  variantLabel_hi?: string | null;
};

interface LanguageContextType {
  lang: Language;
  language: Language;
  setLang: (l: Language) => void;
  t: Translations;
  getCategoryName: (categoryOrName: CategoryLike | string, slug?: string) => string;
  getProductName: (productOrName: ProductLike | string, slug?: string) => string;
  getProductDescription: (productOrDesc: ProductLike | string | null | undefined) => string;
  getVariantLabel: (variantOrLabel: VariantLike | string | null | undefined) => string;
  formatStatus: (status: { open: boolean; text: string }) => string;
  hasHindiTranslation: (product: ProductLike) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agt.lang") as Language;
      if (saved === "hi" || saved === "en") return saved;
    }
    return "hi";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  function setLang(newLang: Language) {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("agt.lang", newLang);
    }
  }

  function getCategoryName(categoryOrName: CategoryLike | string, slugParam?: string): string {
    const isObj = typeof categoryOrName === "object" && categoryOrName !== null;
    const name = isObj ? categoryOrName.name : categoryOrName;
    const slug = isObj ? categoryOrName.slug ?? slugParam : slugParam;
    const name_hi = isObj ? categoryOrName.name_hi : undefined;
    const name_en = isObj ? categoryOrName.name_en : undefined;

    if (lang === "hi") {
      // 1. Direct database field
      if (name_hi && name_hi.trim().length > 0) {
        return name_hi.trim();
      }
      // 2. Exact slug lookup
      if (slug && CATEGORY_NAMES_HI[slug]) {
        return CATEGORY_NAMES_HI[slug];
      }
      // 3. Normalized slug lookup
      if (slug) {
        const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (CATEGORY_NAMES_HI[norm]) return CATEGORY_NAMES_HI[norm];
      }
      // 4. Name lookup
      const lower = (name || "").toLowerCase().trim();
      if (CATEGORY_NAMES_BY_NAME_HI[lower]) {
        return CATEGORY_NAMES_BY_NAME_HI[lower];
      }
      // 5. Keyword fuzzy match
      if (lower.includes("atta") || lower.includes("flour")) return "आटा और मैदा";
      if (lower.includes("rice")) return "चावल और अनाज";
      if (lower.includes("dal") || lower.includes("pulse")) return "दालें और दलहन";
      if (lower.includes("oil") || lower.includes("ghee")) return "सरसों तेल और घी";
      if (lower.includes("spice") || lower.includes("masala")) return "खड़े और पिसे मसाले";
      if (lower.includes("sugar") || lower.includes("salt")) return "चीनी, गुड़ और नमक";
      if (lower.includes("dry fruit") || lower.includes("badam") || lower.includes("kaju"))
        return "सूखे मेवे (काजू, बादाम)";
      if (lower.includes("tea") || lower.includes("coffee")) return "चाय और कॉफी";
      if (lower.includes("biscuit") || lower.includes("cookie")) return "बिस्कुट और कुकीज";
      if (lower.includes("namkeen") || lower.includes("snack")) return "नमकीन और स्नैक्स";

      // Fallback
      return name_en || name || "";
    }

    return name_en || name || name_hi || "";
  }

  function getProductName(productOrName: ProductLike | string, slugParam?: string): string {
    const isObj = typeof productOrName === "object" && productOrName !== null;
    const name = isObj ? productOrName.name : productOrName;
    const slug = isObj ? productOrName.slug ?? slugParam : slugParam;
    const name_hi = isObj ? productOrName.name_hi : undefined;
    const name_en = isObj ? productOrName.name_en : undefined;

    if (lang === "hi") {
      // 1. Direct database field
      if (name_hi && name_hi.trim().length > 0) {
        return name_hi.trim();
      }
      // 2. Exact slug lookup
      if (slug && PRODUCT_NAMES_HI[slug]) {
        return PRODUCT_NAMES_HI[slug];
      }
      // 3. Normalized slug lookup
      if (slug) {
        const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (PRODUCT_NAMES_HI[norm]) return PRODUCT_NAMES_HI[norm];
      }
      // 4. Name lookup
      const lower = (name || "").toLowerCase().trim();
      if (PRODUCT_NAMES_BY_NAME_HI[lower]) {
        return PRODUCT_NAMES_BY_NAME_HI[lower];
      }
      // Clean fallback to English
      return name_en || name || "";
    }

    return name_en || name || name_hi || "";
  }

  function getProductDescription(productOrDesc: ProductLike | string | null | undefined): string {
    if (!productOrDesc) {
      return translations[lang].defaultDescription;
    }
    const isObj = typeof productOrDesc === "object" && productOrDesc !== null;
    if (!isObj) {
      return String(productOrDesc);
    }
    const desc_hi = productOrDesc.description_hi?.trim();
    const desc_en = productOrDesc.description_en?.trim();
    const desc_base = productOrDesc.description?.trim();

    if (lang === "hi") {
      if (desc_hi && desc_hi.length > 0) return desc_hi;
      if (desc_en && desc_en.length > 0) return desc_en;
      if (desc_base && desc_base.length > 0) return desc_base;
      return translations.hi.defaultDescription;
    }

    if (desc_en && desc_en.length > 0) return desc_en;
    if (desc_base && desc_base.length > 0) return desc_base;
    if (desc_hi && desc_hi.length > 0) return desc_hi;
    return translations.en.defaultDescription;
  }

  function getVariantLabel(variantOrLabel: VariantLike | string | null | undefined): string {
    if (!variantOrLabel) return "";
    const isObj = typeof variantOrLabel === "object" && variantOrLabel !== null;
    const label = isObj
      ? (variantOrLabel.label || variantOrLabel.variant_label || variantOrLabel.variantLabel || "")
      : variantOrLabel;
    const label_hi = isObj
      ? (variantOrLabel.label_hi || variantOrLabel.variant_label_hi || variantOrLabel.variantLabel_hi)
      : undefined;
    const label_en = isObj
      ? (variantOrLabel.label_en || variantOrLabel.variant_label_en || variantOrLabel.variantLabel_en)
      : undefined;

    if (lang === "hi") {
      if (label_hi && label_hi.trim().length > 0) return label_hi.trim();
      return translateVariantLabel(label, "hi");
    }

    return label_en || label || "";
  }

  function formatStatus(status: { open: boolean; text: string }): string {
    return formatStoreStatusText(status, lang);
  }

  function hasHindiTranslation(product: ProductLike): boolean {
    if (product.name_hi && product.name_hi.trim().length > 0) return true;
    if (product.slug && PRODUCT_NAMES_HI[product.slug]) return true;
    if (product.name && PRODUCT_NAMES_BY_NAME_HI[product.name.toLowerCase().trim()]) return true;
    return false;
  }

  return (
    <LanguageContext.Provider
      value={{
        lang,
        language: lang,
        setLang,
        t: translations[lang],
        getCategoryName,
        getProductName,
        getProductDescription,
        getVariantLabel,
        formatStatus,
        hasHindiTranslation,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "hi" as Language,
      language: "hi" as Language,
      setLang: () => {},
      t: translations.hi,
      getCategoryName: (nameOrCat: CategoryLike | string) =>
        typeof nameOrCat === "object" ? nameOrCat.name : nameOrCat,
      getProductName: (nameOrProd: ProductLike | string) =>
        typeof nameOrProd === "object" ? nameOrProd.name : nameOrProd,
      getProductDescription: () => translations.hi.defaultDescription,
      getVariantLabel: (labelOrVar: VariantLike | string) =>
        typeof labelOrVar === "object" ? labelOrVar.label : labelOrVar,
      formatStatus: (status: { open: boolean; text: string }) => status.text,
      hasHindiTranslation: () => true,
    };
  }
  return ctx;
}
