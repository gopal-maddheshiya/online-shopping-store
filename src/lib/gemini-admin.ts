/**
 * Admin Gemini AI Utilities for Arun Gopal Traders (अरुण गोपाल ट्रेडर्स)
 * 1. Supplier / Distributor Bill & Voice Product Ingestion
 * 2. Single Product AI Auto-Completion
 * 3. Semantic / Recipe Kirana Search
 */

import type { Category, Product } from "@/lib/queries";

const GEMINI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)["VITE_GEMINI_API_KEY"]
    : undefined) ||
  (typeof process !== "undefined"
    ? (process.env?.["VITE_GEMINI_API_KEY"] || process.env?.["GEMINI_API_KEY"])
    : undefined) ||
  "";

export interface ParsedAiProductVariant {
  label: string;
  price: number;
  mrp: number;
  stock: number;
}

export type GroceryNature = "liquid" | "solid" | "countable";

export interface ParsedAiProduct {
  name: string;
  name_hi: string;
  brand: string;
  category_id?: string | undefined;
  suggested_category_name?: string | undefined;
  description: string;
  description_hi: string;
  variants: ParsedAiProductVariant[];
  matched_existing_id?: string | null;
  matched_existing_name?: string | null;
  action_type?: "update_stock" | "create_new";
  image_url?: string | null;
}

export interface ParseSupplierBillResult {
  success: boolean;
  products: ParsedAiProduct[];
  summary?: string | undefined;
  error?: string | undefined;
}

export interface AutoCompleteProductResult {
  success: boolean;
  data?: {
    name: string;
    name_hi: string;
    slug: string;
    brand: string;
    category_id?: string | undefined;
    description: string;
    description_hi: string;
    nature: GroceryNature;
    variants: ParsedAiProductVariant[];
  } | undefined;
  error?: string | undefined;
}

/**
 * Common Hindi transliteration dictionary for grocery terms to clean URL slugs
 */
export const HINDI_SLUG_DICTIONARY: Record<string, string> = {
  "सरसों": "sarson",
  "तेल": "oil",
  "कच्ची": "kachi",
  "घानी": "ghani",
  "आटा": "atta",
  "चावल": "rice",
  "दाल": "dal",
  "चीनी": "sugar",
  "नमक": "salt",
  "घी": "ghee",
  "दूध": "milk",
  "छाछ": "chaach",
  "दही": "curd",
  "मसाला": "masala",
  "हल्दी": "turmeric",
  "मिर्च": "mirch",
  "धनिया": "dhaniya",
  "जीरा": "jeera",
  "हींग": "hing",
  "मैदा": "maida",
  "सूजी": "suji",
  "बेसन": "besan",
  "पोहा": "poha",
  "साबुन": "soap",
  "बिस्कुट": "biscuit",
  "चाय": "tea",
  "काजू": "kaju",
  "बादाम": "badam",
  "किशमिश": "kishmish",
  "फॉर्च्यून": "fortune",
  "आशीर्वाद": "aashirvaad",
  "टाटा": "tata",
  "अमूल": "amul",
  "डाबर": "dabur",
  "पतंजलि": "patanjali",
  "विम": "vim",
  "सर्फ": "surf",
  "एक्सेल": "excel",
  "हार्पिक": "harpic",
  "लाइज़ोल": "lizol",
};

/**
 * Generates a clean, readable, SEO-friendly kebab-case URL slug.
 * Supports transliterating Hindi characters so the slug is never empty.
 */
export function generateCleanSlug(text: string, brand?: string): string {
  let clean = (text || "").toLowerCase();

  // Replace common Hindi keywords if present
  for (const [hi, en] of Object.entries(HINDI_SLUG_DICTIONARY)) {
    if (clean.includes(hi)) {
      clean = clean.replaceAll(hi, ` ${en} `);
    }
  }

  // Prepend brand if not included and brand is present
  if (brand && brand.trim() && !clean.includes(brand.toLowerCase().trim())) {
    clean = `${brand.toLowerCase().trim()} ${clean}`;
  }

  // Replace non-alphanumeric characters with hyphens
  let slug = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "grocery-item";
}

/**
 * Detects whether a grocery product is a Liquid, Solid, or Countable item.
 * Ensures the physical laws of grocery retail:
 * - Liquid: MUST use Litre (L) or Millilitre (ml). NEVER kg!
 * - Solid: MUST use Kilogram (kg) or Gram (g). NEVER L!
 * - Countable: MUST use Pack, Piece, Box, Bar.
 */
export function detectGroceryNature(
  name: string,
  brand?: string,
  categorySlugOrName?: string
): GroceryNature {
  const text = `${name || ""} ${brand || ""} ${categorySlugOrName || ""}`.toLowerCase();

  // 1. LIQUIDS
  const liquidKeywords = [
    "oil", "tel", "tail", "sarson", "mustard", "refined", "soyabean", "soya", "sunflower",
    "groundnut", "til", "sesame", "olive", "ghee", "milk", "doodh", "dudh", "chaach", "chhaachh",
    "mattha", "buttermilk", "lassi", "paneer water", "juice", "drink", "cold drink", "soda",
    "coca cola", "coke", "pepsi", "sprite", "thums up", "fanta", "mirinda", "limca", "maaza",
    "frooti", "real fruit", "sharbat", "syrup", "rooh afza", "water", "bisleri", "aquafina",
    "shampoo", "conditioner", "liquid", "floor cleaner", "toilet cleaner", "harpic", "lizol",
    "phenyl", "phenol", "handwash", "dishwash gel", "vim gel", "pril", "surf excel liquid",
    "ariel liquid", "comfort fabric", "sanitizer", "rose water", "gulab jal", "gulabjal",
    "coconut water", "oil-ghee", "beverages", "dairy", "लीटर", "लीटर", "लीटर"
  ];

  for (const kw of liquidKeywords) {
    if (text.includes(kw)) {
      // Exclude solid forms like soap bar or dry powders unless it says liquid/gel
      if (text.includes("soap") || text.includes("bar") || text.includes("powder")) {
        if (!text.includes("liquid") && !text.includes("gel") && !text.includes("oil")) {
          continue;
        }
      }
      return "liquid";
    }
  }

  // 2. COUNTABLE / PACK / PIECE
  const countableKeywords = [
    "soap", "sabun", "bar", "cake", "biscuit", "cookies", "rusk", "toast", "namkeen", "bhujia",
    "chips", "kurkure", "lays", "noodle", "noodles", "maggi", "yippee", "pasta", "macaroni",
    "chocolate", "dairy milk", "kitkat", "pen", "pencil", "notebook", "copy", "register",
    "battery", "bulb", "led", "matchbox", "machis", "agarbatti", "incense", "dhoop", "kapoor",
    "camphor", "diaper", "pampers", "pad", "whisper", "stayfree", "broom", "jhadu", "mop",
    "pocha", "wiper", "scrubber", "sponge", "scotch brite", "knife", "lighter", "foil",
    "aluminium foil", "tape", "fevicol", "brush", "toothbrush", "paste", "toothpaste",
    "shaving cream", "razor", "blade"
  ];

  for (const kw of countableKeywords) {
    if (text.includes(kw)) {
      return "countable";
    }
  }

  // 3. SOLIDS (Default for groceries like Atta, Rice, Dal, Spices, Sugar, Salt)
  return "solid";
}

/**
 * Hard guardrail: Sanitizes variant labels according to the grocery item's physical nature.
 * Prevents oils from having "kg" or grains from having "Litre".
 */
export function sanitizeVariantUnits(
  productName: string,
  variants: ParsedAiProductVariant[],
  brand?: string,
  categorySlugOrName?: string
): ParsedAiProductVariant[] {
  if (!variants || variants.length === 0) {
    return [{ label: "1 Unit", price: 50, mrp: 60, stock: 50 }];
  }

  const nature = detectGroceryNature(productName, brand, categorySlugOrName);

  return variants.map((v) => {
    let label = (v.label || "").trim();

    if (nature === "liquid") {
      // Must use Litre or ml!
      // Convert "1 kg" -> "1 L"
      label = label.replace(/\b1\s*(?:kg|kilo|kilogram|किलो)\b/gi, "1 L");
      label = label.replace(/\b2\s*(?:kg|kilo|kilogram|किलो)\b/gi, "2 L");
      label = label.replace(/\b5\s*(?:kg|kilo|kilogram|किलो)\b/gi, "5 L");
      label = label.replace(/\b10\s*(?:kg|kilo|kilogram|किलो)\b/gi, "10 L");
      label = label.replace(/\b15\s*(?:kg|kilo|kilogram|किलो)\b/gi, "15 L");
      label = label.replace(/\b500\s*(?:g|gm|gram|grams|ग्राम)\b/gi, "500 ml");
      label = label.replace(/\b200\s*(?:g|gm|gram|grams|ग्राम)\b/gi, "200 ml");
      label = label.replace(/\b250\s*(?:g|gm|gram|grams|ग्राम)\b/gi, "250 ml");
      label = label.replace(/\b100\s*(?:g|gm|gram|grams|ग्राम)\b/gi, "100 ml");
      label = label.replace(/\b750\s*(?:g|gm|gram|grams|ग्राम)\b/gi, "750 ml");

      // If label has no volume unit at all (e.g. "Standard" or "1"), default to "1 L"
      if (!/(?:l|ltr|litre|litres|ml|pouch|bottle|jar|can|लीटर|मिली)/i.test(label)) {
        label = "1 L";
      }
    } else if (nature === "solid") {
      // Must use kg or g!
      // Convert "1 L" -> "1 kg"
      label = label.replace(/\b1\s*(?:l|ltr|litre|litres|लीटर)\b/gi, "1 kg");
      label = label.replace(/\b2\s*(?:l|ltr|litre|litres|लीटर)\b/gi, "2 kg");
      label = label.replace(/\b5\s*(?:l|ltr|litre|litres|लीटर)\b/gi, "5 kg");
      label = label.replace(/\b10\s*(?:l|ltr|litre|litres|लीटर)\b/gi, "10 kg");
      label = label.replace(/\b25\s*(?:l|ltr|litre|litres|लीटर)\b/gi, "25 kg");
      label = label.replace(/\b26\s*(?:l|ltr|litre|litres|लीटर)\b/gi, "26 kg");
      label = label.replace(/\b500\s*(?:ml|milli|millilitre|मिली)\b/gi, "500 g");
      label = label.replace(/\b250\s*(?:ml|milli|millilitre|मिली)\b/gi, "250 g");
      label = label.replace(/\b200\s*(?:ml|milli|millilitre|मिली)\b/gi, "200 g");
      label = label.replace(/\b100\s*(?:ml|milli|millilitre|मिली)\b/gi, "100 g");

      // If label has no weight unit at all (e.g. "Standard" or "1"), default to "1 kg"
      if (!/(?:kg|kilo|kilogram|g|gm|gram|grams|packet|pouch|bag|sack|किलो|ग्राम)/i.test(label)) {
        label = "1 kg";
      }
    } else {
      // Countable items
      if (/(?:1\s*kg|1\s*l)/i.test(label) && /(?:soap|brush|pen|matchbox|agarbatti|biscuit)/i.test(productName)) {
        label = "1 Pack";
      }
    }

    return {
      label,
      price: Math.max(1, Number(v.price) || 50),
      mrp: Math.max(Number(v.price) || 50, Number(v.mrp) || 60),
      stock: Math.max(1, Number(v.stock) || 50),
    };
  });
}

async function callGeminiApi(requestBody: Record<string, unknown>): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key सेट नहीं है। कृपया Vercel/Environment में VITE_GEMINI_API_KEY सेट करें।");
  }

  const models = ["gemini-3.6-flash", "gemini-flash-latest"];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.warn(`[Gemini Admin] ${model} HTTP ${res.status}:`, err);
        continue;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      console.warn(`[Gemini Admin] ${model} fetch failed:`, err);
    }
  }

  return null;
}

function cleanJsonFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * 1. Parse Distributor Bills, Wholesale Invoices, or Voice Dictations
 */
export async function parseSupplierBillWithGemini({
  text,
  imageBase64,
  mimeType = "image/jpeg",
  categories = [],
}: {
  text?: string | undefined;
  imageBase64?: string | undefined;
  mimeType?: string | undefined;
  categories: Category[];
}): Promise<ParseSupplierBillResult> {
  if (!text?.trim() && !imageBase64) {
    return {
      success: false,
      products: [],
      error: "कृपया बिल/पर्चा की फोटो अपलोड करें या बोलकर/लिखकर सामान की लिस्ट दें।",
    };
  }

  const categoryIndex = categories.map((c) => ({
    id: c.id,
    name: c.name,
    name_hi: c.name_hi,
    slug: c.slug,
  }));

  const systemInstruction = `You are an expert wholesale grocery bill & stock intake parser for Arun Gopal Traders (अरुण गोपाल ट्रेडर्स, महराजगंज, यूपी).
Your task is to analyze distributor wholesale bills, delivery challans, handwritten stock lists, voice dictations, or supplier WhatsApp messages.
Extract every product into a clean, structured product catalog format with variants, prices, MRP, and stock.

AVAILABLE STORE CATEGORIES:
${JSON.stringify(categoryIndex)}

RULES:
1. Product Name: Clean English name (e.g. "Fortune Kachi Ghani Mustard Oil", "Tata Salt Vacuum Evaporated").
2. Hindi Name: Clear Devanagari Hindi translation (e.g. "फॉर्च्यून कच्ची घानी सरसों तेल", "टाटा नमक").
3. Brand: e.g. "Fortune", "Tata", "Aashirvaad", "MDH", "Catch", "Parle", "Amul".
4. Category: Match to one of the provided store categories' "id". If unclear, pick the closest one (e.g. oil -> oil-ghee, flour -> atta-flours).
5. Variants & Physical Units (STRICT GROCERY LAWS):
   - LIQUIDS (Cooking oils, mustard oil, refined oil, ghee, milk, chaach, juices, drinks, cleaners, shampoo): MUST USE "1 L", "500 ml", "200 ml", "5 L Jar", "Pouch (1 L)". NEVER assign "kg" to edible oils or beverages!
   - SOLIDS (Atta, rice, dal, pulses, sugar, salt, spices, dry fruits): MUST USE "1 kg", "500 g", "250 g", "5 kg". NEVER assign "L" to grains or flour!
   - PIECES/PACKS (Soaps, biscuits, noodles, brushes): Use "1 Piece", "1 Pack", "Pack of 4", "Packet".
6. Prices:
   - "price": The retail selling price to customers. (If only purchase rate is given on bill, add standard 5-10% retail margin).
   - "mrp": Maximum Retail Price. If not explicitly on bill, estimate realistic MRP (mrp >= price).
   - "stock": Number of units/packets received into stock (default to 20 if unspecified).
7. Descriptions: Short, professional 1-line English and Hindi descriptions.
8. Output: Return ONLY a valid JSON array of objects. Do not use markdown backticks.

OUTPUT JSON SCHEMA:
[
  {
    "name": "Fortune Kachi Ghani Mustard Oil",
    "name_hi": "फॉर्च्यून कच्ची घानी सरसों तेल",
    "brand": "Fortune",
    "category_id": "category-id-from-list",
    "suggested_category_name": "Oils & Ghee",
    "description": "Pure cold pressed mustard oil for traditional Indian cooking",
    "description_hi": "पारंपरिक भारतीय रसोई के लिए शुद्ध कच्ची घानी सरसों का तेल",
    "variants": [
      {
        "label": "1 L",
        "price": 155,
        "mrp": 170,
        "stock": 48
      }
    ]
  }
]`;

  const parts: Array<Record<string, unknown>> = [];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    });
    parts.push({
      text:
        (text?.trim() ? `Additional notes: ${text.trim()}\n\n` : "") +
        "Please extract all grocery items, pack sizes, wholesale rates/MRPs, and quantities from this supplier bill into the required JSON array.",
    });
  } else if (text?.trim()) {
    parts.push({
      text: `Supplier Stock List / Voice Transcript / Message:\n"${text.trim()}"\n\nPlease structure this into the product catalog JSON array.`,
    });
  }

  try {
    const rawText = await callGeminiApi({
      contents: [{ parts }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generation_config: { temperature: 0.15, response_mime_type: "application/json" },
    });

    if (!rawText) {
      return { success: false, products: [], error: "AI ने कोई परिणाम नहीं दिया। कृपया साफ फोटो या टेक्स्ट दें।" };
    }

    const clean = cleanJsonFence(rawText);
    const parsed = JSON.parse(clean);

    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized: ParsedAiProduct[] = parsed.map((item) => {
        let matchedCat = categories.find((c) => c.id === item.category_id || c.slug === item.category_id);
        if (!matchedCat && item.suggested_category_name) {
          matchedCat = categories.find(
            (c) =>
              c.name.toLowerCase().includes(item.suggested_category_name.toLowerCase()) ||
              item.suggested_category_name.toLowerCase().includes(c.name.toLowerCase())
          );
        }
        if (!matchedCat) {
          matchedCat = categories[0];
        }

        const variantsList: ParsedAiProductVariant[] = Array.isArray(item.variants) && item.variants.length > 0
          ? item.variants.map((v: Record<string, unknown>) => {
              const price = Math.max(1, Number(v["price"]) || 50);
              const mrp = Math.max(price, Number(v["mrp"]) || price);
              const stock = Math.max(1, Number(v["stock"]) || 20);
              return {
                label: String(v["label"] || "1 Unit").trim(),
                price,
                mrp,
                stock,
              };
            })
          : [
              {
                label: "1 Unit",
                price: 50,
                mrp: 60,
                stock: 20,
              },
            ];

        // Apply physical retail unit guardrail (L/ml for oils vs kg/g for grains)
        const finalVariants = sanitizeVariantUnits(
          String(item.name || "").trim(),
          variantsList,
          String(item.brand || "").trim(),
          matchedCat?.name
        );

        return {
          name: String(item.name || "Grocery Item").trim(),
          name_hi: String(item.name_hi || "").trim(),
          brand: String(item.brand || "").trim(),
          category_id: matchedCat?.id,
          suggested_category_name: matchedCat?.name || item.suggested_category_name,
          description: String(item.description || "").trim(),
          description_hi: String(item.description_hi || "").trim(),
          variants: finalVariants,
        };
      });

      return {
        success: true,
        products: sanitized,
        summary: `AI ने बिल/लिस्ट से ${sanitized.length} सामान सफलतापूर्वक निकाले।`,
      };
    }

    return {
      success: false,
      products: [],
      error: "AI को बिल में कोई सामान नहीं मिला। कृपया दोबारा प्रयास करें।",
    };
  } catch (err) {
    console.error("[Gemini Admin] Bill parse error:", err);
    return {
      success: false,
      products: [],
      error: err instanceof Error ? err.message : "AI पार्सिंग में समस्या आई।",
    };
  }
}

/**
 * 2. Auto-Complete Single Product Metadata with Physical State Intelligence
 */
export async function autoCompleteProductWithGemini({
  productName,
  categories = [],
}: {
  productName: string;
  categories: Category[];
}): Promise<AutoCompleteProductResult> {
  const trimmedInput = productName.trim();
  if (!trimmedInput) {
    return { success: false, error: "कृपया पहले प्रोडक्ट का नाम लिखें।" };
  }

  const categoryIndex = categories.map((c) => ({
    id: c.id,
    name: c.name,
    name_hi: c.name_hi,
    slug: c.slug,
  }));

  const systemInstruction = `You are a master grocery catalog specialist and retail data architect for "Arun Gopal Traders" (अरुण गोपाल ट्रेडर्स, रामनगर चौराहा, महराजगंज, उत्तर प्रदेश).
Your task is to convert any product input (which may be in English, Roman Hindi/Hinglish, Devanagari Hindi, or colloquial supplier shorthand) into a 100% accurate, professional kirana store catalog record.

AVAILABLE STORE CATEGORIES:
${JSON.stringify(categoryIndex)}

CRITICAL RULES FOR GROCERY INTELLIGENCE:

1. PRODUCT NAME (English):
   - Standardize into a clean, retail brand-first title in Title Case.
   - E.g. "fortune tel" -> "Fortune Kachi Ghani Mustard Oil"
   - E.g. "sarso tel 1 ltr" -> "Fortune Kachi Ghani Mustard Oil"
   - E.g. "aashirvaad aata" -> "Aashirvaad Shudh Chakki Atta"
   - E.g. "catch chana masala 100g" -> "Catch Chana Masala"
   - E.g. "surf excel bar" -> "Surf Excel Detergent Bar"
   - E.g. "harpic blue" -> "Harpic Power Plus Toilet Cleaner"
   - E.g. "tata namak" -> "Tata Salt Vacuum Evaporated"

2. HINDI NAME (Devanagari):
   - Natural, authentic Devanagari Hindi as spoken in Purvanchal / Maharajganj grocery markets.
   - Preserve brand in clean Hindi: Fortune -> फॉर्च्यून, Tata -> टाटा, Aashirvaad -> आशीर्वाद, Amul -> अमूल, Catch -> कैच, MDH -> एमडीएच, Everest -> एवरेस्ट, Dabur -> डाबर, Patanjali -> पतंजलि, Surf Excel -> सर्फ एक्सेल, Vim -> विम, Harpic -> हार्पिक, Lizol -> लाइज़ोल, Parle -> पार्ले, Britannia -> ब्रिटानिया.
   - Use standard Hindi grocery nouns:
     * Mustard Oil -> कच्ची घानी सरसों का तेल
     * Refined Oil -> रिफाइंड सोयाबीन / सूरजमुखी तेल
     * Desi Ghee -> शुद्ध देसी घी
     * Atta -> चक्की ताजा शुद्ध आटा
     * Basmati Rice -> प्रीमियम बासमती चावल
     * Arhar / Toor Dal -> शुद्ध अरहर (तुअर) दाल
     * Chana Dal -> चना दाल
     * Moong Dal -> मूंग दाल
     * Sugar -> शुद्ध साफ चीनी
     * Salt -> आयोडीन युक्त नमक
     * Tea -> कड़क चाय पत्ती
   - E.g. "Fortune Kachi Ghani Mustard Oil" -> "फॉर्च्यून कच्ची घानी सरसों का तेल"
   - E.g. "Tata Salt Vacuum Evaporated" -> "टाटा शुद्ध आयोडीन नमक"
   - E.g. "Aashirvaad Chakki Atta" -> "आशीर्वाद शुद्ध चक्की आटा"

3. URL SLUG:
   - Clean alphanumeric kebab-case URL slug matching brand and product name.
   - Lowercase, no spaces, no special characters.
   - E.g. "fortune-kachi-ghani-mustard-oil"
   - E.g. "aashirvaad-shudh-chakki-atta"
   - E.g. "tata-iodised-salt"

4. PHYSICAL STATE & PACK UNITS (CRITICAL RETAIL PHYSICS):
   - **LIQUIDS & FLUIDS (Oils, Ghee, Milk, Chaach, Drinks, Syrups, Cleaners, Shampoos, Liquid Handwash/Gel)**:
     * MUST USE "1 L" (Litre) or "500 ml" (millilitre)!
     * NEVER use "kg" or "g" for cooking oils, beverages, or liquid cleaners!
     * Standard variants: ["1 L", "500 ml"] or ["1 L Pouch", "5 L Jar"].
   - **SOLIDS & BULK (Atta, Rice, Dal, Sugar, Salt, Besan, Maida, Spices, Dry Fruits)**:
     * MUST USE "kg" or "g"!
     * NEVER use "L" or "ml" for grains, flour, sugar, salt, or dry spices!
     * Standard variants: ["1 kg", "500 g"] or ["5 kg", "10 kg"] for flours; ["100 g", "50 g"] for spices.
   - **COUNTABLE / PIECES (Soaps, Biscuits, Toothpaste, Brushes, Matches, Agarbatti, Lighters)**:
     * Use "1 Pack", "Pack of 4", "1 Piece", "1 Bar (100g)", "1 Box".

5. VARIANTS, PRICES & MRP:
   - Provide 1 to 3 realistic pack sizes with typical Indian market retail prices (in INR) and MRP (MRP >= price).
   - Default stock: 50.

Return ONLY raw JSON object. Do not include markdown code fences.

OUTPUT JSON FORMAT:
{
  "name": "Fortune Kachi Ghani Mustard Oil",
  "name_hi": "फॉर्च्यून कच्ची घानी सरसों का तेल",
  "slug": "fortune-kachi-ghani-mustard-oil",
  "brand": "Fortune",
  "category_id": "category-id-from-list",
  "nature": "liquid",
  "description": "Pure cold pressed mustard oil with authentic pungent aroma for everyday cooking.",
  "description_hi": "पारंपरिक भारतीय रसोई के लिए शुद्ध कच्ची घानी तीखी झांझ वाला सरसों का तेल।",
  "variants": [
    { "label": "1 L", "price": 155, "mrp": 170, "stock": 50 },
    { "label": "500 ml", "price": 82, "mrp": 90, "stock": 40 }
  ]
}`;

  try {
    const rawText = await callGeminiApi({
      contents: [{ parts: [{ text: `Generate complete metadata for product: "${trimmedInput}"` }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generation_config: { temperature: 0.15, response_mime_type: "application/json" },
    });

    if (!rawText) {
      return { success: false, error: "AI से कोई उत्तर नहीं मिला।" };
    }

    const clean = cleanJsonFence(rawText);
    const parsed = JSON.parse(clean);

    let matchedCat = categories.find(
      (c) => c.id === parsed.category_id || c.slug === parsed.category_id
    );
    if (!matchedCat) matchedCat = categories[0];

    const standardName = String(parsed.name || trimmedInput).trim();
    const brand = String(parsed.brand || "").trim();
    const standardNameHi = String(parsed.name_hi || "").trim();

    // Determine nature and clean slug
    const nature = detectGroceryNature(standardName, brand, matchedCat?.name);
    const slug = generateCleanSlug(parsed.slug || standardName, brand);

    const rawVariants: ParsedAiProductVariant[] =
      Array.isArray(parsed.variants) && parsed.variants.length > 0
        ? parsed.variants.map((v: Record<string, unknown>) => ({
            label: String(v["label"] || "1 Unit").trim(),
            price: Math.max(1, Number(v["price"]) || 50),
            mrp: Math.max(Number(v["price"]) || 50, Number(v["mrp"]) || 60),
            stock: Math.max(1, Number(v["stock"]) || 50),
          }))
        : [{ label: nature === "liquid" ? "1 L" : "1 kg", price: 50, mrp: 60, stock: 50 }];

    // Hard physical unit sanitization (guarantees oils have 1 L, flours have 1 kg)
    const sanitizedVariants = sanitizeVariantUnits(
      standardName,
      rawVariants,
      brand,
      matchedCat?.name
    );

    return {
      success: true,
      data: {
        name: standardName,
        name_hi: standardNameHi,
        slug,
        brand,
        category_id: matchedCat?.id,
        description: String(parsed.description || "").trim(),
        description_hi: String(parsed.description_hi || "").trim(),
        nature,
        variants: sanitizedVariants,
      },
    };
  } catch (err) {
    console.error("[Gemini Admin] Auto-complete error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "AI ऑटो-कंप्लीट विफल रहा।",
    };
  }
}

/**
 * 3. Semantic / Recipe Kirana Search
 * Matches conversational queries (e.g. "चाय बनाने का सामान", "व्रत फलाहार", "dal fry ingredients")
 * against the live store inventory.
 */
export async function searchSemanticKiranaQuery({
  query,
  availableProducts = [],
}: {
  query: string;
  availableProducts: Product[];
}): Promise<{ success: boolean; matchedProductIds: string[]; reason?: string }> {
  if (!query.trim() || availableProducts.length === 0) {
    return { success: false, matchedProductIds: [] };
  }

  const catalogSubset = availableProducts.slice(0, 150).map((p) => ({
    id: p.id,
    name: p.name,
    name_hi: p.name_hi || null,
    category: p.category_id,
  }));

  const systemInstruction = `You are a Kirana shopping assistant for Arun Gopal Traders (महराजगंज).
A customer typed a thematic, dish, recipe, or festive search query: "${query.trim()}".

Identify which products from our store catalog are relevant to make or fulfill this request.
STORE CATALOG:
${JSON.stringify(catalogSubset)}

Return ONLY a JSON object with:
- "matched_ids": array of product string IDs from the catalog that match this dish/need.
- "reason_hi": A short 1-line Hindi message explaining what was found (e.g. "चाय बनाने के लिए चाय पत्ती, चीनी, और मसाले मिले।")

Return raw JSON only.`;

  try {
    const rawText = await callGeminiApi({
      contents: [{ parts: [{ text: `Customer Search: "${query.trim()}"` }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generation_config: { temperature: 0.2, response_mime_type: "application/json" },
    });

    if (!rawText) return { success: false, matchedProductIds: [] };

    const clean = cleanJsonFence(rawText);
    const parsed = JSON.parse(clean);

    if (parsed && Array.isArray(parsed.matched_ids)) {
      return {
        success: true,
        matchedProductIds: parsed.matched_ids,
        reason: parsed.reason_hi || undefined,
      };
    }

    return { success: false, matchedProductIds: [] };
  } catch (err) {
    console.warn("[Gemini Semantic Search] Error:", err);
    return { success: false, matchedProductIds: [] };
  }
}
