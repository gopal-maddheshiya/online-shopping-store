export interface CategoryHeading {
  id: string;
  title_hi: string;
  title_en: string;
  icon: string;
  sort_order: number;
  banner_sub?: "hero2" | "hero3" | "hero4" | null;
  banner_image_url?: string | null;
  slugs: string[];
}

export const CANONICAL_HEADINGS: CategoryHeading[] = [
  {
    id: "food",
    title_hi: "खाने-पीने का सामान",
    title_en: "Food & Kitchen Essentials",
    icon: "🍲",
    sort_order: 1,
    banner_sub: null,
    slugs: [
      "atta-flour",
      "rice",
      "pulses-dal",
      "oil-ghee",
      "spices-masala",
      "salt-sugar",
      "dry-fruits",
      "biscuits",
      "namkeen-snacks",
      "noodles-pasta",
      "dairy",
      "breakfast",
    ],
  },
  {
    id: "household",
    title_hi: "घर की सफ़ाई व बर्तन",
    title_en: "Household & Cleaning",
    icon: "🧹",
    sort_order: 2,
    banner_sub: "hero2",
    slugs: ["household-cleaning", "laundry", "kitchen-essentials"],
  },
  {
    id: "personal",
    title_hi: "पर्सनल केयर व ब्यूटी",
    title_en: "Personal Care & Beauty",
    icon: "🧴",
    sort_order: 3,
    banner_sub: "hero3",
    slugs: ["personal-care", "hair-care", "skin-care", "oral-care", "baby-products"],
  },
  {
    id: "pooja_misc",
    title_hi: "पूजा, स्टेशनरी व अन्य",
    title_en: "Pooja, Stationery & More",
    icon: "🪔",
    sort_order: 4,
    banner_sub: "hero4",
    slugs: ["pooja-items", "stationery", "pet-supplies", "misc-items"],
  },
];

import { supabase } from "@/integrations/supabase/client";

const HEADINGS_STORAGE_KEY = "agt.category_headings_v2";

export function getCategoryHeadings(fromDb?: CategoryHeading[] | null): CategoryHeading[] {
  if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(HEADINGS_STORAGE_KEY, JSON.stringify(fromDb));
      } catch {}
    }
    return [...fromDb].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  if (typeof window === "undefined") return CANONICAL_HEADINGS;
  try {
    const raw = localStorage.getItem(HEADINGS_STORAGE_KEY);
    if (!raw) return CANONICAL_HEADINGS;
    const parsed = JSON.parse(raw) as CategoryHeading[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  } catch {
    // Fallback
  }
  return CANONICAL_HEADINGS;
}

export async function saveCategoryHeadings(headings: CategoryHeading[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(HEADINGS_STORAGE_KEY, JSON.stringify(headings));
      window.dispatchEvent(new CustomEvent("agt:headings-updated", { detail: headings }));
    } catch {
      // ignore
    }
  }

  // Persist directly to Supabase store_settings table
  try {
    await supabase
      .from("store_settings")
      .update({ category_headings: headings } as never)
      .eq("id", 1);
  } catch (err) {
    console.warn("Could not save headings to store_settings table:", err);
  }
}

export function addCategorySlugToHeading(headingId: string, slug: string) {
  const headings = getCategoryHeadings();
  const target = headings.find((h) => h.id === headingId);
  if (target) {
    if (!target.slugs.includes(slug)) {
      target.slugs.push(slug);
      saveCategoryHeadings(headings);
    }
  } else if (headings[0]) {
    // fallback to first
    if (!headings[0].slugs.includes(slug)) {
      headings[0].slugs.push(slug);
      saveCategoryHeadings(headings);
    }
  }
}

export function removeCategorySlugFromHeadings(slug: string) {
  const headings = getCategoryHeadings();
  let changed = false;
  for (const h of headings) {
    const idx = h.slugs.indexOf(slug);
    if (idx !== -1) {
      h.slugs.splice(idx, 1);
      changed = true;
    }
  }
  if (changed) {
    saveCategoryHeadings(headings);
  }
}

export function moveCategorySlugToHeading(targetHeadingId: string, slug: string) {
  removeCategorySlugFromHeadings(slug);
  addCategorySlugToHeading(targetHeadingId, slug);
}
