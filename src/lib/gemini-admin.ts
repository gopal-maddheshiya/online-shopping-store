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

export interface ParsedAiProduct {
  name: string;
  name_hi: string;
  brand: string;
  category_id?: string | undefined;
  suggested_category_name?: string | undefined;
  description: string;
  description_hi: string;
  variants: ParsedAiProductVariant[];
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
    name_hi: string;
    brand: string;
    category_id?: string | undefined;
    description: string;
    description_hi: string;
    variants: ParsedAiProductVariant[];
  } | undefined;
  error?: string | undefined;
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
5. Variants: Each item MUST have at least 1 variant (pack size/weight like "1 kg", "500 g", "1 L", "Pack of 6").
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

        return {
          name: String(item.name || "Grocery Item").trim(),
          name_hi: String(item.name_hi || "").trim(),
          brand: String(item.brand || "").trim(),
          category_id: matchedCat?.id,
          suggested_category_name: matchedCat?.name || item.suggested_category_name,
          description: String(item.description || "").trim(),
          description_hi: String(item.description_hi || "").trim(),
          variants: variantsList,
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
 * 2. Auto-Complete Single Product Metadata
 */
export async function autoCompleteProductWithGemini({
  productName,
  categories = [],
}: {
  productName: string;
  categories: Category[];
}): Promise<AutoCompleteProductResult> {
  if (!productName.trim()) {
    return { success: false, error: "कृपया पहले प्रोडक्ट का नाम लिखें।" };
  }

  const categoryIndex = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const systemInstruction = `You are a grocery product catalog specialist for an Indian Kirana store (Arun Gopal Traders, Maharajganj, UP).
The admin provided a product title: "${productName.trim()}".

Available categories in store:
${JSON.stringify(categoryIndex)}

Generate complete, professional product metadata in valid JSON with:
1. "name_hi": Accurate Devanagari Hindi name (e.g. "Catch Chana Masala" -> "कैच चना मसाला").
2. "brand": Clean brand name (e.g. "Catch").
3. "category_id": The best matching category "id" from the available store categories.
4. "description": 1-2 sentence crisp English description.
5. "description_hi": 1-2 sentence crisp Hindi description.
6. "variants": An array of 1 to 3 standard market pack sizes for this product with typical Indian retail prices (INR), MRP, and default stock (e.g. 50).

Return ONLY raw JSON object. Do not include markdown code fences.

OUTPUT JSON FORMAT:
{
  "name_hi": "...",
  "brand": "...",
  "category_id": "...",
  "description": "...",
  "description_hi": "...",
  "variants": [
    { "label": "100 g", "price": 40, "mrp": 45, "stock": 50 }
  ]
}`;

  try {
    const rawText = await callGeminiApi({
      contents: [{ parts: [{ text: `Generate metadata for product: "${productName.trim()}"` }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generation_config: { temperature: 0.2, response_mime_type: "application/json" },
    });

    if (!rawText) {
      return { success: false, error: "AI से कोई उत्तर नहीं मिला।" };
    }

    const clean = cleanJsonFence(rawText);
    const parsed = JSON.parse(clean);

    let matchedCat = categories.find((c) => c.id === parsed.category_id || c.slug === parsed.category_id);
    if (!matchedCat) matchedCat = categories[0];

    const variants: ParsedAiProductVariant[] = Array.isArray(parsed.variants) && parsed.variants.length > 0
      ? parsed.variants.map((v: Record<string, unknown>) => ({
          label: String(v["label"] || "1 Unit").trim(),
          price: Math.max(1, Number(v["price"]) || 50),
          mrp: Math.max(Number(v["price"]) || 50, Number(v["mrp"]) || 60),
          stock: Math.max(1, Number(v["stock"]) || 50),
        }))
      : [{ label: "1 Unit", price: 50, mrp: 60, stock: 50 }];

    return {
      success: true,
      data: {
        name_hi: String(parsed.name_hi || "").trim(),
        brand: String(parsed.brand || "").trim(),
        category_id: matchedCat?.id,
        description: String(parsed.description || "").trim(),
        description_hi: String(parsed.description_hi || "").trim(),
        variants,
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
