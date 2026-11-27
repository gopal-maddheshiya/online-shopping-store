/**
 * Admin Gemini AI Utilities for Arun Gopal Traders (अरुण गोपाल ट्रेडर्स)
 * 1. Supplier / Distributor Bill & Voice Product Ingestion
 * 2. Single Product AI Auto-Completion
 * 3. Semantic / Recipe Kirana Search
 */

import type { Category, Product } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

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
 * Comprehensive English/Hinglish to pure Devanagari Hindi translation dictionary.
 * Powers the fallback engine and instant word-level mapping.
 */
export const ENGLISH_TO_HINDI_GROCERY_DICT: Record<string, string> = {
  // Brands
  fortune: "फॉर्च्यून",
  tata: "टाटा",
  aashirvaad: "आशीर्वाद",
  ashirwad: "आशीर्वाद",
  amul: "अमूल",
  mdh: "एमडीएच",
  everest: "एवरेस्ट",
  catch: "कैच",
  dabur: "डाबर",
  patanjali: "पतंजलि",
  parle: "पार्ले",
  britannia: "ब्रिटानिया",
  haldiram: "हल्दीराम",
  haldirams: "हल्दीराम",
  bikaji: "बीकाजी",
  maggi: "मैगी",
  yippee: "यिप्पी",
  sunfeast: "सनफीस्ट",
  vim: "विम",
  surf: "सर्फ",
  excel: "एक्सेल",
  harpic: "हार्पिक",
  lizol: "लाइज़ोल",
  dettol: "डेटॉल",
  lifebuoy: "लाइफबॉय",
  lux: "लक्स",
  dove: "डव",
  colgate: "कोलगेट",
  closeup: "क्लोजअप",
  sensodyne: "सेंसोडाइन",
  ariel: "एरियल",
  tide: "टाइड",
  wheel: "व्हील",
  ghadi: "घड़ी",
  rin: "रिन",
  comfort: "कम्फर्ट",
  kapila: "कपिला",
  boroplus: "बोरोप्लस",
  nivea: "निविया",
  vaseline: "वैसलीन",
  bail: "बैल",
  kolhu: "कोल्हू",
  saffola: "सफोला",
  gemini: "जेमिनी",
  kisan: "किसान",
  kissan: "किसान",
  rajdhani: "राजधानी",

  // Grocery Essentials
  mustard: "सरसों",
  oil: "तेल",
  kachi: "कच्ची",
  kachhi: "कच्ची",
  ghani: "घानी",
  refined: "रिफाइंड",
  soyabean: "सोयाबीन",
  soya: "सोयाबीन",
  sunflower: "सूरजमुखी",
  groundnut: "मूंगफली",
  til: "तिल",
  sesame: "तिल",
  ghee: "घी",
  desi: "देसी",
  milk: "दूध",
  doodh: "दूध",
  chaach: "छाछ",
  dahi: "दही",
  curd: "दही",
  butter: "मक्खन",
  paneer: "पनीर",

  // Grains & Flours
  atta: "आटा",
  aata: "आटा",
  flour: "आटा",
  wheat: "गेहूं",
  chakki: "चक्की",
  fresh: "ताजा",
  shudh: "शुद्ध",
  pure: "शुद्ध",
  maida: "मैदा",
  suji: "सूजी",
  sooji: "सूजी",
  besan: "बेसन",
  rice: "चावल",
  chawal: "चावल",
  basmati: "बासमती",
  poha: "पोहा",

  // Pulses / Dal
  dal: "दाल",
  daal: "दाल",
  pulses: "दलहन",
  arhar: "अरहर",
  toor: "तुअर",
  chana: "चना",
  moong: "मूंग",
  urad: "उड़द",
  masoor: "मसूर",
  rajma: "राजमा",
  kabuli: "काबुली",
  chhole: "छोले",
  moth: "मोठ",

  // Spices & Condiments
  masala: "मसाला",
  spices: "मसाले",
  spice: "मसाला",
  haldi: "हल्दी",
  turmeric: "हल्दी",
  mirch: "मिर्च",
  chilli: "मिर्च",
  chili: "मिर्च",
  powder: "पाउडर",
  dhaniya: "धनिया",
  coriander: "धनिया",
  jeera: "जीरा",
  cumin: "जीरा",
  hing: "हींग",
  asafoetida: "हींग",
  methi: "मेथी",
  rai: "राई",
  ajwain: "अजवाइन",
  saunf: "सौंफ",
  fennel: "सौंफ",
  elaichi: "इलायची",
  cardamom: "इलायची",
  laung: "लौंग",
  clove: "लौंग",
  dalchini: "दालचीनी",
  cinnamon: "दालचीनी",
  tejpatta: "तेजपत्ता",
  sabji: "सब्जी",
  garam: "गरम",
  chicken: "चिकन",
  meat: "मीट",
  biryani: "बिरयानी",
  kasuri: "कसूरी",

  // Sweeteners & Salt
  sugar: "चीनी",
  chini: "चीनी",
  salt: "नमक",
  namak: "नमक",
  jaggery: "गुड़",
  gud: "गुड़",
  honey: "शहद",

  // Tea & Beverages
  tea: "चाय पत्ती",
  chai: "चाय",
  coffee: "कॉफी",
  green: "ग्रीन",

  // Dry Fruits
  kaju: "काजू",
  cashew: "काजू",
  badam: "बादाम",
  almond: "बादाम",
  kishmish: "किशमिश",
  raisin: "किशमिश",
  pista: "पिस्ता",
  pistachio: "पिस्ता",
  anjeer: "अंजीर",
  akhrot: "अखरोट",
  walnut: "अखरोट",
  makhana: "मखाना",

  // Snacks & Breakfast
  biscuit: "बिस्कुट",
  biscuits: "बिस्कुट",
  cookie: "कुकीज",
  cookies: "कुकीज",
  rusk: "रस्क",
  toast: "टोस्ट",
  namkeen: "नमकीन",
  bhujia: "भुजिया",
  sev: "सेव",
  chips: "चिप्स",
  noodle: "नूडल्स",
  noodles: "नूडल्स",
  pasta: "पास्ता",
  macaroni: "मैकरोनी",
  papad: "पापड़",
  sauce: "सॉस",
  ketchup: "केचप",
  pickle: "आचार",
  achar: "आचार",
  jam: "जैम",

  // Cleaning & Personal Care
  soap: "साबुन",
  sabun: "साबुन",
  bath: "नहाने का",
  bathing: "नहाने का",
  detergent: "डिटर्जेंट",
  washing: "धुलाई",
  wash: "वॉश",
  easy: "ईजी",
  matic: "मैटिक",
  hand: "हैंड",
  handwash: "हैंड वॉश",
  original: "ओरिजिनल",
  bar: "बार",
  liquid: "लिक्विड",
  gel: "जेल",
  cleaner: "क्लीनर",
  dishwash: "डिशवॉश",
  toilet: "टॉयलेट",
  floor: "फर्श",
  phenyl: "फिनाइल",
  shampoo: "शैम्पू",
  conditioner: "कंडीशनर",
  paste: "पेस्ट",
  toothpaste: "टूथपेस्ट",
  brush: "ब्रश",
  toothbrush: "टूथब्रश",
  lotion: "बॉडी लोशन",
  cream: "क्रीम",
  hair: "बालों का",
  moisturizing: "मॉइस्चराइजिंग",
  care: "केयर",
  protection: "प्रोटेक्शन",
  protect: "सुरक्षा",
  germ: "जर्म",
  germs: "कीटाणु",
  antibacterial: "एंटीबैक्टीरियल",
  antiseptic: "एंटीसेप्टिक",
  sanitizer: "सैनिटाइज़र",
  skin: "स्किन",
  skincare: "स्किनकेयर",
  soft: "सॉफ्ट",
  gentle: "कोमल",
  glow: "ग्लो",
  shine: "चमक",
  bright: "उज्ज्वल",
  active: "एक्टिव",
  power: "पावर",
  plus: "प्लस",
  super: "सुपर",
  ultra: "अल्ट्रा",
  max: "मैक्स",
  gold: "गोल्ड",
  classic: "क्लासिक",
  premium: "प्रीमियम",
  special: "स्पेशल",
  lemon: "लेमन",
  neem: "नीम",
  tulsi: "तुलसी",
  aloe: "एलोवेरा",
  vera: "एलोवेरा",
  rose: "गुलाब",
  sandal: "चंदन",
  pine: "पाइन",
  fragrance: "खुशबू",
  refill: "रीफिल",
  pump: "पंप",
  bottle: "बोतल",
  pouch: "पाउच",
  pack: "पैक",
  packet: "पैकेट",
  savlon: "सैवलोन",
  santoor: "संतूर",
  godrej: "गोदरेज",
  cinthol: "सिंथोल",
  medimix: "मेडीमिक्स",
  pears: "पियर्स",
  liril: "लिरिल",
  himalaya: "हिमालय",
  garnier: "गार्नियर",
  ponds: "पॉन्ड्स",
  fair: "फेयर",
  lovely: "लवली",

  // Pooja & Others
  pooja: "पूजा",
  puja: "पूजा",
  agarbatti: "अगरबत्ती",
  dhoop: "धूप",
  kapoor: "कपूर",
  camphor: "कपूर",
  havan: "हवन",
  samagri: "सामग्री",
  matchbox: "माचिस",
  machis: "माचिस",
  chokar: "चोकर",
  pasuahar: "पशुआहार",
  pashu: "पशु",
  aahar: "आहार",
};

/**
 * Algorithmic phonetic transliteration fallback for any English/Romanized word.
 * Guarantees 0% English alphabet pollution in Hindi titles.
 */
export function transliterateToHindiPhonetic(text: string): string {
  if (!text) return "";
  if (!/[a-zA-Z]/.test(text)) return text;

  let result = text;

  const clusters: [RegExp, string][] = [
    [/\bshree\b/gi, "श्री"],
    [/\bshri\b/gi, "श्री"],
    [/original/gi, "ओरिजिनल"],
    [/liquid/gi, "लिक्विड"],
    [/powder/gi, "पाउडर"],
    [/cleaner/gi, "क्लीनर"],
    [/clean/gi, "क्लीन"],
    [/wash/gi, "वॉश"],
    [/hand/gi, "हैंड"],
    [/soap/gi, "साबुन"],
    [/shampoo/gi, "शैम्पू"],
    [/cream/gi, "क्रीम"],
    [/lotion/gi, "लोशन"],
    [/oil/gi, "ऑयल"],
    [/ghee/gi, "घी"],
    [/gold/gi, "गोल्ड"],
    [/silver/gi, "सिल्वर"],
    [/plus/gi, "प्लस"],
    [/super/gi, "सुपर"],
    [/ultra/gi, "अल्ट्रा"],
    [/max/gi, "मैक्स"],
    [/mini/gi, "मिनी"],
    [/active/gi, "एक्टिव"],
    [/fresh/gi, "फ्रेश"],
    [/care/gi, "केयर"],
    [/shine/gi, "शाइन"],
    [/glow/gi, "ग्लो"],
    [/pure/gi, "प्योर"],
    [/natural/gi, "नेचुरल"],
    [/sweet/gi, "स्वीट"],
    [/bottle/gi, "बोतल"],
    [/packet/gi, "पैकेट"],
    [/pack/gi, "पैक"],
    [/box/gi, "बॉक्स"],
    [/pouch/gi, "पाउच"],
    [/refill/gi, "रीफिल"],
    [/pump/gi, "पंप"],
    [/anti/gi, "एंटी"],
    [/germ/gi, "जर्म"],
    [/free/gi, "फ्री"],
    [/kh/gi, "ख"],
    [/gh/gi, "घ"],
    [/ch/gi, "च"],
    [/chh/gi, "छ"],
    [/jh/gi, "झ"],
    [/th/gi, "थ"],
    [/dh/gi, "ध"],
    [/ph/gi, "फ"],
    [/bh/gi, "भ"],
    [/sh/gi, "श"],
  ];

  for (const [re, rep] of clusters) {
    result = result.replace(re, rep);
  }

  const charMap: Record<string, string> = {
    a: "आ", b: "ब", c: "क", d: "ड", e: "ए", f: "फ", g: "ग", h: "ह",
    i: "इ", j: "ज", k: "क", l: "ल", m: "म", n: "न", o: "ओ", p: "प",
    q: "क्यू", r: "र", s: "स", t: "ट", u: "यू", v: "व", w: "व", x: "क्स",
    y: "य", z: "ज़"
  };

  result = result.replace(/[a-zA-Z]/g, (c) => charMap[c.toLowerCase()] || c);
  return result;
}

/**
 * Generates a clean, readable, SEO-friendly kebab-case URL slug.
 * Supports transliterating Hindi characters so the slug is never empty.
 * Never includes 'generic' prefix or suffixes.
 */
export function generateCleanSlug(text: string, brand?: string): string {
  let clean = (text || "").toLowerCase();

  // Strip generic/unbranded labels from raw product text
  clean = clean.replace(/\b(generic|unbranded|local|n\/a|none|null)\b/gi, " ");

  // Validate brand: never prepend if generic/unbranded/empty
  const rawBrand = (brand || "").trim().toLowerCase();
  const isGenericBrand =
    !rawBrand ||
    /^(generic|local|unbranded|n\/a|none|null|लोकल|खुला|देसी|थोक)$/i.test(rawBrand);

  // Replace common Hindi keywords if present
  for (const [hi, en] of Object.entries(HINDI_SLUG_DICTIONARY)) {
    if (clean.includes(hi)) {
      clean = clean.replaceAll(hi, ` ${en} `);
    }
  }

  // Prepend real brand only if not generic and not already present
  if (!isGenericBrand && !clean.includes(rawBrand)) {
    clean = `${rawBrand} ${clean}`;
  }

  // Replace non-alphanumeric characters with hyphens
  let slug = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Extra safety: strip any lingering generic prefixes, infixes or suffixes
  slug = slug
    .replace(/^generic-+/gi, "")
    .replace(/-+generic$/gi, "")
    .replace(/-generic-/gi, "-")
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
    "phenyl", "phenol", "handwash", "hand wash", "hand-wash", "body wash", "bodywash", "face wash", "facewash", "dishwash", "dish wash", "dishwash gel", "vim gel", "pril", "surf excel liquid",
    "ariel liquid", "comfort fabric", "sanitizer", "rose water", "gulab jal", "gulabjal",
    "coconut water", "oil-ghee", "beverages", "dairy", "लीटर", "लीटर", "लीटर"
  ];

  for (const kw of liquidKeywords) {
    if (text.includes(kw)) {
      // Exclude solid forms like soap bar or dry powders unless it says liquid/gel/wash
      if (text.includes("soap") || text.includes("bar") || text.includes("powder")) {
        if (!text.includes("liquid") && !text.includes("gel") && !text.includes("oil") && !text.includes("wash")) {
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

      // If label has no volume unit at all (e.g. "Standard" or "1"), default appropriately
      if (!/(?:l|ltr|litre|litres|ml|pouch|bottle|jar|can|लीटर|मिली)/i.test(label)) {
        if (/(?:handwash|hand\s*wash|sanitizer|shampoo|lotion|conditioner|face\s*wash)/i.test(productName)) {
          label = "250 ml";
        } else {
          label = "1 L";
        }
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

type AdminAiProxyAction =
  | "semantic_search"
  | "admin_parse_bill"
  | "admin_translate"
  | "admin_autocomplete";

async function callGeminiApi(
  requestBody: Record<string, unknown>,
  action: AdminAiProxyAction = "admin_autocomplete",
): Promise<string | null> {
  const payload = { ...requestBody };
  if (payload["generation_config"] && !payload["generationConfig"]) {
    payload["generationConfig"] = payload["generation_config"];
    delete payload["generation_config"];
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (action !== "semantic_search") {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    }

    const res = await fetch("/api/ai/gemini", {
      method: "POST",
      headers,
      body: JSON.stringify({ action, requestBody: payload }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Gemini Proxy] ${action} HTTP ${res.status}:`, errText.slice(0, 180));
      return null;
    }

    const json = (await res.json()) as { success?: boolean; text?: string };
    return json.success && json.text ? json.text : null;
  } catch (err) {
    console.warn(`[Gemini Proxy] ${action} failed:`, err);
    return null;
  }
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
1. Product Name: Clean English name (e.g. "Fortune Kachi Ghani Mustard Oil", "Tata Salt Vacuum Evaporated", "Red Chilli Powder"). NEVER prepend "Generic" to product names!
2. Hindi Name: Clear Devanagari Hindi translation (e.g. "फॉर्च्यून कच्ची घानी सरसों तेल", "टाटा नमक", "लाल मिर्च पाउडर").
3. Brand: e.g. "Fortune", "Tata", "Aashirvaad", "MDH", "Catch", "Parle", "Amul".
   - If a specific real manufacturer/brand is mentioned, return it.
   - If the item is unbranded, loose, commodity, or unknown, set "brand": "" (EMPTY STRING).
   - STRICTLY NEVER write "Generic", "Local", "Unbranded", "None", or "N/A" as brand name!
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
    }, "admin_parse_bill");

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

        let brand = String(item.brand || "").trim();
        if (/^(generic|local|unbranded|n\/a|none|null|लोकल|खुला|देसी|थोक)$/i.test(brand)) {
          brand = "";
        }
        let name = String(item.name || "Grocery Item").trim();
        name = name.replace(/^generic\s+/i, "").trim();
        let nameHi = String(item.name_hi || "").trim();
        nameHi = nameHi.replace(/^(जेनेरिक|लोकल|सामान्य)\s+/i, "").trim();

        // Apply physical retail unit guardrail (L/ml for oils vs kg/g for grains)
        const finalVariants = sanitizeVariantUnits(
          name,
          variantsList,
          brand,
          matchedCat?.name
        );

        return {
          name,
          name_hi: nameHi,
          brand,
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
 * 3. Fast 1-Tap Pure Devanagari Hindi Translation for Product Titles
 */
export async function translateProductNameToHindi({
  productName,
}: {
  productName: string;
}): Promise<{ success: boolean; name_hi: string }> {
  const trimmed = productName.trim();
  if (!trimmed) return { success: false, name_hi: "" };

  const systemInstruction = `You are a master Hindi grocery translator and retail specialist for "Arun Gopal Traders" (अरुण गोपाल ट्रेडर्स, रामनगर चौराहा, महराजगंज, उत्तर प्रदेश).
Your task is to translate any grocery product name into 100% pure authentic Devanagari Hindi script.

CRITICAL RULES:
1. STRICTLY NO ENGLISH OR ROMAN ALPHABETS! The output MUST be 100% Devanagari Hindi.
2. Transliterate brand names properly:
   - Fortune -> फॉर्च्यून
   - Tata -> टाटा
   - Aashirvaad -> आशीर्वाद
   - Amul -> अमूल
   - Surf Excel -> सर्फ एक्सेल
   - Vim -> विम
   - Harpic -> हार्पिक
   - Lizol -> लाइज़ोल
   - MDH -> एमडीएच
   - Everest -> एवरेस्ट
   - Catch -> कैच
   - Dettol -> डेटॉल
   - Colgate -> कोलगेट
   - Parle -> पार्ले
   - Britannia -> ब्रिटानिया
   - Dabur -> डाबर
   - Patanjali -> पतंजलि
   - Haldiram -> हल्दीराम
   - Bikaji -> बीकाजी
   - Maggi -> मैगी
   - Boroplus -> बोरोप्लस
   - Nivea -> निविया
   - Vaseline -> वैसलीन
   - Kapila -> कपिला
3. Translate grocery item types naturally:
   - Mustard Oil -> कच्ची घानी सरसों का तेल
   - Refined Oil -> रिफाइंड सोयाबीन / सूरजमुखी तेल
   - Desi Ghee -> शुद्ध देसी घी
   - Atta / Flour -> चक्की ताजा शुद्ध आटा
   - Basmati Rice -> प्रीमियम बासमती चावल
   - Arhar Dal -> शुद्ध अरहर (तुअर) दाल
   - Chana Dal -> चना दाल
   - Salt -> आयोडीन युक्त नमक
   - Sugar -> शुद्ध साफ चीनी
   - Tea -> कड़क चाय पत्ती
   - Detergent Powder -> डिटर्जेंट पाउडर
   - Dishwash Bar / Gel -> बर्तन धोने का साबुन / जेल
   - Bath Soap -> नहाने का साबुन
   - Body Lotion -> मॉइस्चराइजिंग बॉडी लोशन
   - Hair Oil -> बालों का तेल
   - Toothpaste -> दंतमंजन / टूथपेस्ट
   - Pashu Aahar -> दुधारू पशुआहार
4. Output ONLY the pure Devanagari Hindi title. Do NOT include quotation marks, markdown backticks, or any English explanation.`;

  try {
    const rawText = await callGeminiApi({
      contents: [{ parts: [{ text: `Translate this product title to pure Hindi: "${trimmed}"` }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generation_config: { temperature: 0.1 },
    }, "admin_translate");

    if (rawText && rawText.trim()) {
      const clean = rawText.replace(/["'*`]/g, "").trim();
      // Ensure it doesn't return empty or pure whitespace
      if (clean) return { success: true, name_hi: clean };
    }
  } catch (err) {
    console.warn("[Gemini Admin] Direct Hindi translate error, falling back:", err);
  }

  // Fallback to heuristic translation
  const fallback = generateHeuristicProductData(trimmed, []);
  return { success: true, name_hi: fallback.name_hi || trimmed };
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
   - E.g. "red chilli powder" -> "Red Chilli Powder"
   - E.g. "jeera" -> "Cumin Seeds (Jeera)"
   - CRITICAL: NEVER prepend "Generic" to product names! E.g. write "Red Chilli Powder", NEVER "Generic Red Chilli Powder".

2. BRAND RULES (MANDATORY & CRITICAL):
   - If a specific real manufacturer/brand is identified or requested (e.g. "Fortune", "Tata", "Aashirvaad", "Catch", "MDH", "Amul", "Dabur", "Patanjali", "Parle", "Britannia", "Everest", "Bail Kolhu", "Chakra"), set "brand" to that brand name.
   - If the product is unbranded, loose, commodity grain/spice/dry fruit, or no brand is known, SET "brand": "" (EMPTY STRING).
   - STRICTLY AND ABSOLUTELY NEVER return "Generic", "Local", "Unbranded", "None", or "N/A" as the brand! Leave it completely EMPTY: "".

3. HINDI NAME (Devanagari - STRICTLY ZERO ENGLISH ALPHABETS):
   - The output MUST be in pure, authentic Devanagari Hindi script.
   - NEVER leave English or Romanized words in name_hi!
   - Preserve brand in clean Hindi: Fortune -> फॉर्च्यून, Tata -> टाटा, Aashirvaad -> आशीर्वाद, Amul -> अमूल, Catch -> कैच, MDH -> एमडीएच, Everest -> एवरेस्ट, Dabur -> डाबर, Patanjali -> पतंजलि, Surf Excel -> सर्फ एक्सेल, Vim -> विम, Harpic -> हार्पिक, Lizol -> लाइज़ोल, Parle -> पार्ले, Britannia -> ब्रिटानिया, Dettol -> डेटॉल, Colgate -> कोलगेट, Haldiram -> हल्दीराम, Boroplus -> बोरोप्लस.
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
     * Detergent Bar / Powder -> डिटर्जेंट बार / पाउडर
     * Dishwash Gel -> बर्तन धोने का जेल
     * Body Lotion -> मॉइस्चराइजिंग बॉडी लोशन
   - E.g. "Fortune Kachi Ghani Mustard Oil" -> "फॉर्च्यून कच्ची घानी सरसों का तेल"
   - E.g. "Tata Salt Vacuum Evaporated" -> "टाटा वैक्यूम इवापोरेटेड आयोडीन युक्त नमक"
   - E.g. "Aashirvaad Chakki Atta" -> "आशीर्वाद शुद्ध चक्की ताजा आटा"
   - E.g. "Red Chilli Powder" -> "शुद्ध पिसी लाल मिर्च पाउडर"
   - NEVER prepend "जेनेरिक" or "लोकल" to Hindi names!

4. URL SLUG:
   - Clean alphanumeric kebab-case URL slug matching brand and product name.
   - Lowercase, no spaces, no special characters.
   - NEVER contain "generic".
   - E.g. "fortune-kachi-ghani-mustard-oil"
   - E.g. "aashirvaad-shudh-chakki-atta"
   - E.g. "red-chilli-powder"

5. PHYSICAL STATE & PACK UNITS (CRITICAL RETAIL PHYSICS):
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

6. VARIANTS, PRICES & MRP:
   - Provide 1 to 3 realistic pack sizes with typical Indian market retail prices (in INR) and MRP (MRP >= price).
   - Default stock: 50.

7. PRODUCT DESCRIPTIONS (HIGH VALUE & RETAIL GRADE - ABSOLUTELY NO GENERIC TEXT):
   - "description" (English): 2 to 3 detailed, engaging sentences highlighting:
     * Product origin, quality & purity (e.g. cold-pressed from mustard seeds, 100% whole wheat chakki ground, unpolished dal).
     * Exact kitchen or household usage (e.g. daily dal tadka, deep frying, rotis, stain removal, skin hydration).
     * Sensory notes & benefits (e.g. strong pungent aroma, fluffy rotis, vibrant aroma, gentle on hands).
     * STRICTLY NEVER write generic lines like "100% authentic quality for everyday grocery needs"!
   - "description_hi" (Hindi): 2 to 3 natural, customer-appealing Hindi sentences in authentic Devanagari:
     * शुद्धता, स्वाद, उपयोग और लाभों का स्पष्ट उल्लेख करें।
     * जैसे सरसों तेल के लिए: "पारंपरिक कच्ची घानी विधि द्वारा तैयार 100% शुद्ध सरसों का तेल। इसकी तीखी झांझ और मनभावन खुशबू भोजन और आचार के स्वाद को कई गुना बढ़ा देती है। प्राकृतिक एंटीऑक्सीडेंट्स से भरपूर।"
     * जैसे आटा के लिए: "100% शुद्ध साबुत सुनहरे गेहूं से चक्की में पिसा हुआ ताजा आटा। इसमें भरपूर चोकर और फाइबर रहता है, जिससे बनी रोटियां नर्म, फूली हुई और लंबे समय तक मुलायम बनी रहती हैं।"
     * जैसे साबुन / लोशन के लिए: "त्वचा को गहराई से नमी और पोषण देने वाला फॉर्मूला। दैनिक उपयोग से त्वचा कोमल, स्वस्थ और खिली-खिली रहती है।"

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
}
OR FOR UNBRANDED / LOOSE ITEM:
{
  "name": "Red Chilli Powder",
  "name_hi": "शुद्ध तीखी लाल मिर्च पाउडर",
  "slug": "red-chilli-powder",
  "brand": "",
  "category_id": "spices-masale-id",
  "nature": "solid",
  "description": "Pure ground red chilli powder for rich colour and authentic spicy kick.",
  "description_hi": "शुद्ध पिसी हुई लाल मिर्च पाउडर, जो दे खाने को गहरा रंग और बढ़िया तीखापन।",
  "variants": [
    { "label": "100 g", "price": 40, "mrp": 45, "stock": 50 },
    { "label": "250 g", "price": 95, "mrp": 105, "stock": 50 }
  ]
}`;

  try {
    const rawText = await callGeminiApi({
      contents: [{ parts: [{ text: `Generate complete metadata for product: "${trimmedInput}"` }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generation_config: { temperature: 0.15, response_mime_type: "application/json" },
    }, "admin_autocomplete");

    if (!rawText) {
      const fallbackData = generateHeuristicProductData(trimmedInput, categories);
      return { success: true, data: fallbackData };
    }

    const clean = cleanJsonFence(rawText);
    const parsed = JSON.parse(clean);

    let matchedCat = categories.find(
      (c) => c.id === parsed.category_id || c.slug === parsed.category_id
    );
    if (!matchedCat) matchedCat = categories[0];

    // Sanitize brand: NEVER allow 'Generic' or 'Unbranded' to pollute data
    let brand = String(parsed.brand || "").trim();
    if (/^(generic|local|unbranded|n\/a|none|null|लोकल|खुला|देसी|थोक)$/i.test(brand)) {
      brand = "";
    }

    // Sanitize product title: Strip leading 'Generic '
    let standardName = String(parsed.name || trimmedInput).trim();
    standardName = standardName.replace(/^generic\s+/i, "").trim();

    // Sanitize Hindi title
    let standardNameHi = String(parsed.name_hi || "").trim();
    standardNameHi = standardNameHi.replace(/^(जेनेरिक|लोकल|सामान्य)\s+/i, "").trim();

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
        name_hi: standardNameHi || standardName,
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
    console.warn("[Gemini Admin] Auto-complete error, using heuristic fallback:", err);
    const fallbackData = generateHeuristicProductData(trimmedInput, categories);
    return {
      success: true,
      data: fallbackData,
    };
  }
}

/**
 * Intelligent instant local fallback for grocery metadata.
 * Ensures the owner is NEVER stuck even during network outages.
 */
export function generateHeuristicProductData(
  input: string,
  categories: Category[]
): NonNullable<AutoCompleteProductResult["data"]> {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. Detect Brand
  const knownBrands = [
    "Fortune", "Tata", "Aashirvaad", "MDH", "Everest", "Catch", "Amul", "Dabur",
    "Patanjali", "Parle", "Britannia", "Vim", "Surf Excel", "Harpic", "Lizol",
    "Saffola", "Gemini", "Nature Fresh", "Haldiram", "Bikaji", "Maggi", "Sunfeast",
    "Dettol", "Lifebuoy", "Colgate", "Sensodyne", "Brooke Bond", "Taj Mahal", "Red Label",
    "Ariel", "Tide", "Wheel", "Ghadi", "Active Wheel", "Comfort", "Good Knight", "All Out"
  ];
  let detectedBrand = "";
  for (const b of knownBrands) {
    if (new RegExp(`\\b${b}\\b`, "i").test(trimmed)) {
      detectedBrand = b;
      break;
    }
  }

  // 2. Detect Nature
  const nature = detectGroceryNature(trimmed, detectedBrand);

  // 3. Category matching
  let matchedCat: Category | undefined;
  if (/(?:oil|mustard|tel|sarso|refine|ghee|dalda)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "oils-ghee" || /oil|ghee|तेल/i.test(c.name));
  } else if (/(?:atta|flour|maida|suji|besan|aata)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "atta-flours" || /atta|flour|आटा/i.test(c.name));
  } else if (/(?:rice|chawal|basmati)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "rice-grains" || /rice|चावल/i.test(c.name));
  } else if (/(?:dal|pulses|chana|arhar|toor|moong|urad|rajma|kabuli)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "dals-pulses" || /dal|दाल/i.test(c.name));
  } else if (/(?:masala|spice|mirch|haldi|jeera|dhaniya|garam|sabji)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "spices-masale" || /spice|masala|मसाले/i.test(c.name));
  } else if (/(?:handwash|hand\s*wash|sanitizer)/i.test(lower)) {
    matchedCat = categories.find((c) => /personal|care|साबुन|handwash/i.test(c.name) || c.slug === "personal-care");
  } else if (/(?:bath\s*soap|bathing\s*soap|lux|dove|pears|santoor|liril|margo|medimix)/i.test(lower)) {
    matchedCat = categories.find((c) => /soap|साबुन|personal/i.test(c.name));
  } else if (/(?:dishwash|vim|bartan|pril|exo)/i.test(lower)) {
    matchedCat = categories.find((c) => /dish|बर्तन|clean/i.test(c.name));
  } else if (/(?:surf|detergent|tide|ariel|wheel|ghadi|rin|कपड़ा)/i.test(lower)) {
    matchedCat = categories.find((c) => /detergent|धुलाई|clean/i.test(c.name));
  } else if (/(?:harpic|toilet|lizol|floor|phenyl)/i.test(lower)) {
    matchedCat = categories.find((c) => /clean|सफाई/i.test(c.name));
  } else if (/(?:biscuit|cookies|maggi|noodle|chips|snack|bhujia|namkeen)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "snacks-beverages" || /snack|चाय|बिस्कुट/i.test(c.name));
  } else if (/(?:chai|tea|coffee)/i.test(lower)) {
    matchedCat = categories.find((c) => c.slug === "tea-coffee" || /tea|coffee|चाय/i.test(c.name));
  }
  if (!matchedCat) matchedCat = categories[0];

  // 4. Generate Hindi Name via multi-word phrase matching + dictionary + phonetic fallback
  let processed = trimmed;
  const commonPhrases: [RegExp, string][] = [
    [/\bhand\s*wash\b/gi, "हैंड वॉश"],
    [/\bdish\s*wash\b/gi, "डिशवॉश"],
    [/\bface\s*wash\b/gi, "फेस वॉश"],
    [/\bbath\s*soap\b/gi, "नहाने का साबुन"],
    [/\bbody\s*wash\b/gi, "बॉडी वॉश"],
    [/\bbody\s*lotion\b/gi, "बॉडी लोशन"],
    [/\bhair\s*oil\b/gi, "बालों का तेल"],
    [/\bmustard\s*oil\b/gi, "सरसों का तेल"],
    [/\brefined\s*oil\b/gi, "रिफाइंड तेल"],
    [/\bdesi\s*ghee\b/gi, "देसी घी"],
    [/\bchakki\s*atta\b/gi, "चक्की आटा"],
    [/\bbasmati\s*rice\b/gi, "बासमती चावल"],
    [/\btoilet\s*cleaner\b/gi, "टॉयलेट क्लीनर"],
    [/\bfloor\s*cleaner\b/gi, "फर्श क्लीनर"],
    [/\bdetergent\s*powder\b/gi, "डिटर्जेंट पाउडर"],
    [/\bdetergent\s*bar\b/gi, "डिटर्जेंट बार"],
    [/\btooth\s*paste\b/gi, "टूथपेस्ट"],
    [/\btooth\s*brush\b/gi, "टूथब्रश"],
  ];
  for (const [re, rep] of commonPhrases) {
    processed = processed.replace(re, rep);
  }

  const words = processed.split(/\s+/);
  const hiWords = words.map((w) => {
    if (!/[a-zA-Z]/.test(w)) return w;
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ENGLISH_TO_HINDI_GROCERY_DICT[cleanWord]) {
      return ENGLISH_TO_HINDI_GROCERY_DICT[cleanWord];
    }
    for (const [hi, en] of Object.entries(HINDI_SLUG_DICTIONARY)) {
      if (en.toLowerCase() === cleanWord) return hi;
    }
    return transliterateToHindiPhonetic(w);
  });
  const nameHi = hiWords.join(" ");

  // 5. Clean Title & Slug
  const standardName = trimmed.replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
  const slug = generateCleanSlug(standardName, detectedBrand);

  // 6. Rich, product-specific descriptions tailored by category
  let descEn = `Premium quality ${standardName} sourced with strict standards of purity and freshness for everyday household cooking and dining.`;
  let descHi = `उच्च गुणवत्ता और शुद्धता के सख्त मानकों पर खरा उतरा ${nameHi || standardName}। दैनिक घरेलू उपयोग और पौष्टिक खान-पान के लिए उत्तम।`;

  if (/(?:oil|mustard|tel|sarso|refine|ghee|dalda)/i.test(lower)) {
    descEn = `Pure, carefully filtered edible cooking oil with authentic pungent aroma. Ideal for everyday Indian curries, tadka, deep frying, and traditional pickle making.`;
    descHi = `पारंपरिक विधि द्वारा तैयार 100% शुद्ध तेल, जो दे खाने को असली स्वाद और मनभावन सुगंध। दैनिक खाना पकाने, दाल तड़का और आचार बनाने के लिए सर्वोत्तम।`;
  } else if (/(?:atta|flour|maida|suji|besan|aata)/i.test(lower)) {
    descEn = `Stone-ground from premium selected whole wheat grains preserving natural dietary fiber. Kneads easily into soft, fluffy rotis that stay tender for hours.`;
    descHi = `100% शुद्ध सुनहरे साबुत गेहूं के दानों से चक्की में पिसा हुआ ताजा आटा। प्राकृतिक फाइबर से भरपूर, जिससे रोटियां नर्म, फूली हुई और लंबे समय तक मुलायम बनी रहती हैं।`;
  } else if (/(?:rice|chawal|basmati)/i.test(lower)) {
    descEn = `Aromatic, long-grain basmati rice naturally aged for exquisite fragrance and fluffy, non-sticky grains after cooking. Ideal for biryanis, pulao, and daily meals.`;
    descHi = `प्रीमियम खुशबूदार बासमती चावल, जो पकने के बाद खिले-खिले और लंबे बनते हैं। पुलाव, बिरयानी और दैनिक भोजन में बेहतरीन स्वाद के लिए एकदम सही।`;
  } else if (/(?:dal|pulses|chana|arhar|toor|moong|urad|rajma|kabuli)/i.test(lower)) {
    descEn = `Unpolished, high-protein pulses sourced directly from trusted farms. Cooks evenly into rich, flavorful dal with authentic home-style aroma.`;
    descHi = `बिना पॉलिश की हुई 100% शुद्ध और पौष्टिक दाल। प्रोटीन से भरपूर, जो आसानी से गलती है और घर जैसा असली और गाढ़ा स्वाद देती है।`;
  } else if (/(?:masala|spice|mirch|haldi|jeera|dhaniya|garam|sabji)/i.test(lower)) {
    descEn = `Sun-dried and hygienically ground whole spices preserving natural essential oils, vibrant color, and rich aroma for authentic Indian dishes.`;
    descHi = `धूप में सुखाए गए खड़े मसालों से पिसा हुआ शुद्ध मसाला। प्राकृतिक सुगंध और गहरा रंग हर व्यंजन को दे लाजवाब जायका।`;
  } else if (/(?:handwash|hand\s*wash|sanitizer)/i.test(lower)) {
    descEn = `Antibacterial liquid hand wash that washes away 99.9% of illness-causing germs while keeping hands soft, moisturized, and pleasantly fragrant.`;
    descHi = `कीटाणुओं से 99.9% तक प्रभावी सुरक्षा देने वाला लिक्विड हैंड वॉश। हाथों की त्वचा पर कोमल और हर धुलाई के बाद दे मनभावन ताजगी भरी खुशबू।`;
  } else if (/(?:dishwash|vim|bartan|pril|exo)/i.test(lower)) {
    descEn = `Cuts through tough grease, burnt food, and oil with the power of lemons, leaving utensils sparkling clean and odor-free.`;
    descHi = `बर्तनों की जिद्दी चिकनाई और जले हुए दागों को आसानी से हटाने वाला असरदार डिशवॉश। बर्तनों को दे चमकदार सफाई और नींबू की ताजगी।`;
  } else if (/(?:surf|detergent|tide|ariel|wheel|ghadi|rin|कपड़ा)/i.test(lower)) {
    descEn = `Advanced stain-fighting laundry detergent that dissolves tough collar dirt and stains effortlessly while preserving fabric brightness and colors.`;
    descHi = `कठिन दागों और जिद्दी मैल को चुटकियों में साफ करने वाला असरदार कपड़े धोने का डिटर्जेंट। कपड़ों की चमक बनाए रखे और कपड़ों को नया जैसा रखे।`;
  } else if (/(?:bath\s*soap|bathing\s*soap|lux|dove|pears|santoor|liril|margo|medimix|lifebuoy\s*soap)/i.test(lower) || (/soap|साबुन/i.test(lower) && !/dish|detergent|clean/i.test(lower))) {
    descEn = `Gentle, refreshing bathing soap enriched with skin moisturizers to cleanse and nourish skin, keeping you fresh and confident all day.`;
    descHi = `त्वचा को गहराई से साफ और कोमल बनाए रखने वाला नहाने का साबुन। दैनिक उपयोग से त्वचा खिली-खिली, स्वस्थ और तरोताजा बनी रहती है।`;
  } else if (/(?:harpic|toilet|lizol|floor|phenyl)/i.test(lower)) {
    descEn = `Powerful disinfectant household cleaner that eliminates 99.9% of germs, limescale, and tough grime, keeping home surfaces sparkling clean and fresh.`;
    descHi = `99.9% कीटाणुओं का नाश करने वाला कीटाणुरोधक क्लीनर। सतहों को दे चमकदार सफाई और पूरे घर में मनभावन ताजगी।`;
  } else if (/(?:shampoo|conditioner|hair\s*oil)/i.test(lower)) {
    descEn = `Nourishing hair care formula that strengthens roots from within, reduces hair fall, and leaves hair silky, smooth, and naturally lustrous.`;
    descHi = `बालों को जड़ों से मजबूत और चमकदार बनाने वाला फॉर्मूला। बालों को दे रेशमी मुलायम अहसास और प्राकृतिक चमक।`;
  } else if (/(?:toothpaste|paste|colgate|closeup|sensodyne|pepsodent|dant)/i.test(lower)) {
    descEn = `Complete oral care formula that fights cavities, removes dental plaque, and provides long-lasting fresh breath and healthy gums.`;
    descHi = `दांतों को कैविटी से बचाने और मसूड़ों को मजबूत रखने वाला टूथपेस्ट। लंबे समय तक ताजगी और चमकदार मुस्कान के लिए सर्वोत्तम।`;
  } else if (/(?:biscuit|cookies|maggi|noodle|chips|snack|bhujia|namkeen)/i.test(lower)) {
    descEn = `Crispy, freshly packed tea-time snack made with quality ingredients and sealed for long-lasting crunch and delicious taste.`;
    descHi = `चाय के समय का सबसे स्वादिष्ट और कुरकुरा स्नैक। उच्च गुणवत्ता से तैयार और ताजगी बनाए रखने के लिए सुरक्षित पैक।`;
  } else if (/(?:chai|tea|coffee)/i.test(lower)) {
    descEn = `Premium selected tea leaves blended for rich amber liquor, strong aroma, and refreshing kadak taste to energize your mornings.`;
    descHi = `कड़क स्वाद और मनमोहक सुगंध वाली दानेदार चाय पत्ती। हर कप में ताजगी और भरपूर स्वाद का अहसास।`;
  } else if (/(?:sugar|chini|salt|namak|jaggery|gud)/i.test(lower)) {
    descEn = `Hygienically refined everyday essential enriched with natural sweetness and mineral purity for all home culinary preparations.`;
    descHi = `हाइजीनिक तरीके से तैयार शुद्ध और स्वच्छ सामग्री। दैनिक रसोई में हर व्यंजन के स्वाद को संतुलित और स्वादिष्ट बनाने के लिए उत्तम।`;
  }

  // 7. Variants based on nature
  let variants: ParsedAiProductVariant[] = [];
  if (nature === "liquid") {
    if (/(?:handwash|hand\s*wash|dishwash|shampoo|lotion)/i.test(lower)) {
      variants = [
        { label: "250 ml", price: 99, mrp: 120, stock: 50 },
        { label: "500 ml", price: 175, mrp: 199, stock: 40 },
        { label: "750 ml Refill", price: 145, mrp: 165, stock: 30 },
      ];
    } else {
      variants = [
        { label: "1 L", price: 155, mrp: 170, stock: 50 },
        { label: "500 ml", price: 82, mrp: 90, stock: 40 },
      ];
    }
  } else if (nature === "solid") {
    if (/(?:masala|spice|mirch|haldi|dhaniya|jeera)/i.test(lower)) {
      variants = [
        { label: "100 g", price: 42, mrp: 48, stock: 50 },
        { label: "250 g", price: 95, mrp: 110, stock: 40 },
      ];
    } else {
      variants = [
        { label: "1 kg", price: 60, mrp: 70, stock: 50 },
        { label: "500 g", price: 32, mrp: 38, stock: 40 },
      ];
    }
  } else {
    variants = [{ label: "1 Pack", price: 30, mrp: 35, stock: 50 }];
  }

  return {
    name: standardName,
    name_hi: nameHi || standardName,
    slug,
    brand: detectedBrand,
    category_id: matchedCat?.id,
    description: descEn,
    description_hi: descHi,
    nature,
    variants,
  };
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
    }, "semantic_search");

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
