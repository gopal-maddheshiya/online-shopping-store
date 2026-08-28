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

interface LanguageContextType {
  lang: Language;
  language: Language;
  setLang: (l: Language) => void;
  t: Translations;
  getCategoryName: (name: string, slug?: string) => string;
  getProductName: (name: string, slug?: string) => string;
  getVariantLabel: (label: string) => string;
  formatStatus: (status: { open: boolean; text: string }) => string;
}


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("hi");

  useEffect(() => {
    const saved = localStorage.getItem("agt.lang") as Language;
    if (saved === "hi" || saved === "en") {
      setLangState(saved);
    } else {
      setLangState("hi");
    }
  }, []);

  function setLang(newLang: Language) {
    setLangState(newLang);
    localStorage.setItem("agt.lang", newLang);
  }

  function getCategoryName(name: string, slug?: string): string {
    if (lang === "hi") {
      // 1. Check exact slug
      if (slug && CATEGORY_NAMES_HI[slug]) {
        return CATEGORY_NAMES_HI[slug];
      }
      // 2. Check normalized slug
      if (slug) {
        const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (CATEGORY_NAMES_HI[norm]) return CATEGORY_NAMES_HI[norm];
      }
      // 3. Check name lookup
      const lower = name.toLowerCase().trim();
      if (CATEGORY_NAMES_BY_NAME_HI[lower]) {
        return CATEGORY_NAMES_BY_NAME_HI[lower];
      }
      // 4. Try fuzzy matching words
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
    }
    return name;
  }

  function getProductName(name: string, slug?: string): string {
    if (lang === "hi") {
      // 1. Check exact slug
      if (slug && PRODUCT_NAMES_HI[slug]) {
        return PRODUCT_NAMES_HI[slug];
      }
      // 2. Check normalized slug
      if (slug) {
        const norm = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (PRODUCT_NAMES_HI[norm]) return PRODUCT_NAMES_HI[norm];
      }
      // 3. Check name lookup
      const lower = name.toLowerCase().trim();
      if (PRODUCT_NAMES_BY_NAME_HI[lower]) {
        return PRODUCT_NAMES_BY_NAME_HI[lower];
      }
    }
    return name;
  }

  function getVariantLabel(label: string): string {
    return translateVariantLabel(label, lang);
  }

  function formatStatus(status: { open: boolean; text: string }): string {
    return formatStoreStatusText(status, lang);
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
        getVariantLabel,
        formatStatus,
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
      lang: "en" as Language,
      language: "en" as Language,
      setLang: () => {},
      t: translations.en,
      getCategoryName: (name: string) => name,
      getProductName: (name: string) => name,
      getVariantLabel: (label: string) => label,
      formatStatus: (status: { open: boolean; text: string }) => status.text,
    };
  }
  return ctx;
}

