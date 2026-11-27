/**
 * Gemini AI Integration for Arun Gopal Traders (अरुण गोपाल ट्रेडर्स, महराजगंज)
 * Multimodal Vision (Handwritten Grocery Slips) & Natural Language Grocery Parser
 */

import type { Product } from "@/lib/queries";
import { getProductImage } from "@/lib/product-images";

export interface MatchedRationItem {
  original_item: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_name_en?: string | null;
  product_name_hi?: string | null;
  variant_label: string;
  variant_label_en?: string | null;
  variant_label_hi?: string | null;
  quantity: number;
  unit_price: number;
  mrp?: number | undefined;
  stock?: number | undefined;
  image_url: string | null;
  slug: string;
  matched: boolean;
  notes?: string | undefined;
}

export interface ParseRationResult {
  success: boolean;
  items: MatchedRationItem[];
  rawSummary?: string | undefined;
  error?: string | undefined;
}

/**
 * Parses a grocery slip photo or typed/spoken grocery list using Gemini AI,
 * matching with Arun Gopal Traders live inventory catalog.
 */
export async function parseGrocerySlipWithGemini({
  text,
  imageBase64,
  mimeType = "image/jpeg",
  availableProducts = [],
}: {
  text?: string | undefined;
  imageBase64?: string | undefined;
  mimeType?: string | undefined;
  availableProducts?: Product[] | undefined;
}): Promise<ParseRationResult> {
  if (!text?.trim() && !imageBase64) {
    return {
      success: false,
      items: [],
      error: "कृपया राशन लिस्ट लिखें या पर्चे की फोटो अपलोड करें।",
    };
  }

  // Build condensed full catalog index for Gemini context (omit image_url from prompt to fit full catalog)
  const catalogSummary = availableProducts.map((p) => ({
    id: p.id,
    name: p.name,
    name_hi: p.name_hi || null,
    brand: p.brand || null,
    slug: p.slug,
    variants: (p.product_variants || [])
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        label: v.label,
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
      })),
  }));

  const systemInstruction = `You are the expert Kirana Assistant for "Arun Gopal Traders" (अरुण गोपाल ट्रेडर्स, रामनगर चौराहा, महराजगंज, उत्तर प्रदेश).
Your task is to analyze the customer's grocery slip (handwritten paper note, shopping list image, or typed/spoken text in Hindi, English, or Bhojpuri).
Extract each item with its intended quantity/weight, and match it with the best product and variant from our STORE CATALOG.

STORE CATALOG (JSON):
${JSON.stringify(catalogSummary)}

RULES:
1. Parse units smartly: e.g. "5 kg atta" -> match with 5 kg or nearest variant. "1 packet salt" -> match 1 kg Tata salt. "sarson tel" -> match mustard oil.
2. If the user asks for e.g. 5 kg of something sold in 1 kg packets, set quantity=5 and choose the 1 kg variant, OR choose the 5 kg variant with quantity=1 if available.
3. For matched items, include the exact product_id and variant_id from the STORE CATALOG.
4. If an item is clearly grocery but not found in catalog, set matched=false, product_id=null, variant_id=null, but still extract it so the shopkeeper knows.
5. Return ONLY a valid, raw JSON array of objects. Do not wrap in markdown or backticks.

OUTPUT FORMAT EXAMPLE:
[
  {
    "original_item": "5 किलो आशीर्वाद आटा",
    "product_id": "...",
    "variant_id": "...",
    "product_name": "Aashirvaad Chakki Atta",
    "variant_label": "5 kg",
    "quantity": 1,
    "unit_price": 245,
    "mrp": 275,
    "matched": true,
    "notes": "5kg pack selected"
  }
]`;

  const parts: Array<Record<string, unknown>> = [];

  // Multimodal Vision: Attach handwritten slip image if present
  if (imageBase64) {
    // Strip header prefix if present (data:image/jpeg;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    });
    parts.push({
      text:
        (text?.trim()
          ? `User note: ${text.trim()}\n\n`
          : "") +
        "Please read the handwritten grocery slip/image carefully and extract all items into the JSON array matching our store catalog.",
    });
  } else if (text?.trim()) {
    parts.push({
      text: `Customer Grocery List / Voice transcript:\n"${text.trim()}"\n\nPlease extract all items and match with our store catalog into the required JSON array.`,
    });
  }

  const requestBody = {
    contents: [
      {
        parts,
      },
    ],
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    generation_config: {
      temperature: 0.2,
      response_mime_type: "application/json",
    },
  };

  try {
    const response = await fetch("/api/ai/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "smart_ration",
        requestBody,
      }),
    });

    const data = (await response.json()) as { success?: boolean; text?: string; error?: string };

    if (!response.ok || !data.success || !data.text) {
      throw new Error(data.error || "AI सेवा उपलब्ध नहीं है");
    }

    const rawText = data.text;
    const cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed)) {
      const hydratedItems: MatchedRationItem[] = parsed.map((item) => {
        const matchedProd = availableProducts.find((p) => p.id === item.product_id);
        const matchedVariant = matchedProd?.product_variants?.find(
          (v) => v.id === item.variant_id
        );

        return {
          original_item: item.original_item || item.product_name || "सामग्री",
          product_id: matchedProd?.id || null,
          variant_id: matchedVariant?.id || null,
          product_name: matchedProd?.name || item.product_name || "किराना सामान",
          product_name_en: matchedProd?.name_en || matchedProd?.name || null,
          product_name_hi: matchedProd?.name_hi || null,
          variant_label: matchedVariant?.label || item.variant_label || "1 Unit",
          variant_label_en: matchedVariant?.label_en || matchedVariant?.label || null,
          variant_label_hi: matchedVariant?.label_hi || null,
          quantity: Math.max(1, Number(item.quantity) || 1),
          unit_price: matchedVariant?.price || Number(item.unit_price) || 0,
          mrp: matchedVariant?.mrp || Number(item.mrp) || undefined,
          stock: matchedVariant?.stock,
          image_url: matchedProd ? getProductImage(matchedProd) : null,
          slug: matchedProd?.slug || "shop",
          matched: Boolean(matchedProd && matchedVariant && matchedVariant.stock > 0),
          notes: item.notes,
        };
      });

      return {
        success: true,
        items: hydratedItems,
        rawSummary: `AI ने ${hydratedItems.filter((i) => i.matched).length} सामान दुकान की लिस्ट से मिलाए।`,
      };
    }
  } catch (err) {
    console.warn("Smart ration AI proxy call failed:", err);
  }

  return {
    success: false,
    items: [],
    error: "AI पर्चा पढ़ने में समस्या आई। कृपया टेक्स्ट दोबारा जांचें या साफ फोटो अपलोड करें।",
  };
}
