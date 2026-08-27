import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve("public/images/products");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

type SvgConfig = {
  filename: string;
  badge?: string;
  brand: string;
  title: string;
  titleHi: string;
  subtitle: string;
  weight: string;
  type: "pouch" | "box" | "jar" | "bottle" | "sack" | "can" | "bar" | "utensil";
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  illustration:
    | "lentils"
    | "flour"
    | "rice"
    | "oil"
    | "spice"
    | "leaf"
    | "snack"
    | "bottle"
    | "jar"
    | "soap"
    | "can"
    | "biscuit"
    | "cleaner"
    | "egg"
    | "cookware"
    | "tool"
    | "bulb"
    | "battery";
};

const products: SvgConfig[] = [
  // Pulses & Dal
  {
    filename: "rajma-chitra.svg",
    badge: "100% PURE & NATURAL",
    brand: "ARUN GOPAL SELECT",
    title: "Rajma Chitra",
    titleHi: "प्रीमियम चित्रा राजमा",
    subtitle: "Premium Unpolished Kidney Beans",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#881337",
    secondaryColor: "#BE123C",
    accentColor: "#F43F5E",
    illustration: "lentils",
  },
  {
    filename: "moong-dal.svg",
    badge: "UNPOLISHED",
    brand: "ARUN GOPAL SELECT",
    title: "Moong Dal Dhuli",
    titleHi: "मूंग दाल धुली (पीली)",
    subtitle: "Split Washed Yellow Lentils",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#CA8A04",
    secondaryColor: "#EAB308",
    accentColor: "#FEF08A",
    illustration: "lentils",
  },
  {
    filename: "masoor-dal.svg",
    badge: "UNPOLISHED",
    brand: "ARUN GOPAL SELECT",
    title: "Masoor Dal",
    titleHi: "मलका मसूर दाल",
    subtitle: "Pure Red Split Lentils",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#C2410C",
    secondaryColor: "#EA580C",
    accentColor: "#FED7AA",
    illustration: "lentils",
  },
  {
    filename: "kabuli-chana.svg",
    badge: "PREMIUM GRADE",
    brand: "ARUN GOPAL SELECT",
    title: "Kabuli Chana",
    titleHi: "सफेद काबुली चना (छोला)",
    subtitle: "Large White Chickpeas",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#B45309",
    secondaryColor: "#D97706",
    accentColor: "#FDE68A",
    illustration: "lentils",
  },
  {
    filename: "chana-dal.svg",
    badge: "DESI CHANA DAL",
    brand: "ARUN GOPAL SELECT",
    title: "Chana Dal",
    titleHi: "शुद्ध चना दाल",
    subtitle: "Unpolished Split Bengal Gram",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#B45309",
    secondaryColor: "#F59E0B",
    accentColor: "#FEF08A",
    illustration: "lentils",
  },
  {
    filename: "urad-dal.svg",
    badge: "WHITE SPLIT",
    brand: "ARUN GOPAL SELECT",
    title: "Urad Dal Dhuli",
    titleHi: "उड़द दाल धुली (सफेद)",
    subtitle: "Washed White Urad Lentils",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#334155",
    secondaryColor: "#475569",
    accentColor: "#E2E8F0",
    illustration: "lentils",
  },
  {
    filename: "pearl-millet-bajra.svg",
    badge: "DESI MILLET",
    brand: "FARM FRESH",
    title: "Pearl Millet (Bajra)",
    titleHi: "देसी बाजरा (खड़ा अनाज)",
    subtitle: "Nutrient Rich Whole Grain",
    weight: "1 kg",
    type: "sack",
    primaryColor: "#065F46",
    secondaryColor: "#047857",
    accentColor: "#A7F3D0",
    illustration: "flour",
  },
  {
    filename: "sorghum-jowar.svg",
    badge: "GLUTEN FREE",
    brand: "FARM FRESH",
    title: "Desi Jowar",
    titleHi: "देसी ज्वार (खड़ा अनाज)",
    subtitle: "High Fiber Sorghum Grains",
    weight: "1 kg",
    type: "sack",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FDE68A",
    illustration: "flour",
  },
  {
    filename: "kala-chana.svg",
    badge: "HIGH PROTEIN",
    brand: "ARUN GOPAL SELECT",
    title: "Black Chickpeas",
    titleHi: "काले देसी चने",
    subtitle: "Protein Rich Kala Chana",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#451A03",
    secondaryColor: "#78350F",
    accentColor: "#FDE68A",
    illustration: "lentils",
  },
  {
    filename: "sabut-masoor.svg",
    badge: "WHOLE LENTIL",
    brand: "ARUN GOPAL SELECT",
    title: "Whole Red Lentils",
    titleHi: "साबुत मसूर (काली मसूर)",
    subtitle: "Unpolished Whole Brown Lentils",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#7C2D12",
    secondaryColor: "#9A3412",
    accentColor: "#FFEDD5",
    illustration: "lentils",
  },
  {
    filename: "sabut-moong.svg",
    badge: "SPROUTS SPECIAL",
    brand: "ARUN GOPAL SELECT",
    title: "Green Gram Whole",
    titleHi: "साबुत हरा मूंग (खड़ा)",
    subtitle: "Whole Green Moong for Sprouts",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#14532D",
    secondaryColor: "#166534",
    accentColor: "#86EFAC",
    illustration: "lentils",
  },
  {
    filename: "urad-sabut.svg",
    badge: "DAL MAKHANI SPECIAL",
    brand: "ARUN GOPAL SELECT",
    title: "Black Lentils (Urad)",
    titleHi: "काली दाल (उड़द साबुत)",
    subtitle: "Whole Black Gram for Dal Makhani",
    weight: "1 kg",
    type: "pouch",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#94A3B8",
    illustration: "lentils",
  },

  // Flour & Grains
  {
    filename: "rajdhani-besan.svg",
    badge: "100% CHANA DAL",
    brand: "RAJDHANI",
    title: "Pure Besan",
    titleHi: "राजधानी शुद्ध बारीक बेसन",
    subtitle: "Superfine Gram Flour",
    weight: "500 g",
    type: "pouch",
    primaryColor: "#B45309",
    secondaryColor: "#F59E0B",
    accentColor: "#FCD34D",
    illustration: "flour",
  },
  {
    filename: "bansi-suji.svg",
    badge: "DANEDAR",
    brand: "BANSI",
    title: "Pure Suji / Rava",
    titleHi: "बंसी दानेदार सूजी / रवा",
    subtitle: "Premium Wheat Semolina",
    weight: "500 g",
    type: "pouch",
    primaryColor: "#065F46",
    secondaryColor: "#10B981",
    accentColor: "#A7F3D0",
    illustration: "flour",
  },
  {
    filename: "shakti-bhog-maida.svg",
    badge: "SUPER REFINED",
    brand: "SHAKTI BHOG",
    title: "Refined Maida",
    titleHi: "शक्ति भोग शुद्ध मैदा",
    subtitle: "Fine White Wheat Flour",
    weight: "500 g",
    type: "pouch",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#93C5FD",
    illustration: "flour",
  },
  {
    filename: "daawat-basmati-rice.svg",
    badge: "AGED BASMATI",
    brand: "DAAWAT",
    title: "Rozana Gold Basmati",
    titleHi: "दावत रोज़ाना गोल्ड बासमती",
    subtitle: "Aromatic Daily Long Grain Rice",
    weight: "5 kg",
    type: "sack",
    primaryColor: "#1E293B",
    secondaryColor: "#D97706",
    accentColor: "#FDE68A",
    illustration: "rice",
  },
  {
    filename: "sona-masoori-rice.svg",
    badge: "MILL FRESH",
    brand: "LOCAL MILL",
    title: "Sona Masoori Rice",
    titleHi: "सोना मसूरी चावल (सफेद)",
    subtitle: "Premium Lightweight Daily Rice",
    weight: "10 kg",
    type: "sack",
    primaryColor: "#047857",
    secondaryColor: "#059669",
    accentColor: "#6EE7B7",
    illustration: "rice",
  },

  // Spices & Masala
  {
    filename: "catch-hing.svg",
    badge: "POWERFUL AROMA",
    brand: "CATCH",
    title: "Catch Hing",
    titleHi: "कैच हींग पाउडर (कंपाउंड)",
    subtitle: "Digestive Strong Asafoetida",
    weight: "50 g",
    type: "jar",
    primaryColor: "#B45309",
    secondaryColor: "#D97706",
    accentColor: "#FEF08A",
    illustration: "spice",
  },
  {
    filename: "cardamom.svg",
    badge: "ROYAL AROMA",
    brand: "ROYAL SPICES",
    title: "Green Cardamom",
    titleHi: "हरी छोटी इलायची",
    subtitle: "Bold Green Fragrant Elaichi",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#15803D",
    secondaryColor: "#22C55E",
    accentColor: "#BBF7D0",
    illustration: "spice",
  },
  {
    filename: "cinnamon.svg",
    badge: "100% PURE BARK",
    brand: "ROYAL SPICES",
    title: "Cinnamon (Dalchini)",
    titleHi: "शुद्ध दालचीनी (खड़ी)",
    subtitle: "Rolled Sweet Aromatic Bark",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FDE68A",
    illustration: "spice",
  },
  {
    filename: "cloves.svg",
    badge: "BOLD & SPICY",
    brand: "ROYAL SPICES",
    title: "Whole Cloves (Laung)",
    titleHi: "साबुत लौंग (प्रीमियम)",
    subtitle: "High Oil Content Whole Cloves",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#451A03",
    secondaryColor: "#78350F",
    accentColor: "#FDE68A",
    illustration: "spice",
  },
  {
    filename: "black-pepper.svg",
    badge: "KING OF SPICES",
    brand: "ROYAL SPICES",
    title: "Black Pepper",
    titleHi: "काली मिर्च (साबुत गोल)",
    subtitle: "Bold Pungent Black Peppercorns",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#94A3B8",
    illustration: "spice",
  },
  {
    filename: "fennel-seeds.svg",
    badge: "MUKHWAS & MASALA",
    brand: "ROYAL SPICES",
    title: "Fennel Seeds (Saunf)",
    titleHi: "मोटी हरी सौंफ",
    subtitle: "Sweet Aromatic Green Saunf",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#166534",
    secondaryColor: "#22C55E",
    accentColor: "#86EFAC",
    illustration: "spice",
  },
  {
    filename: "methi-seeds.svg",
    badge: "NATURAL DIGESTIVE",
    brand: "ROYAL SPICES",
    title: "Fenugreek Seeds",
    titleHi: "दाना मेथी (साबुत)",
    subtitle: "Clean Yellow Methi Seeds",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#854D0E",
    secondaryColor: "#CA8A04",
    accentColor: "#FEF08A",
    illustration: "spice",
  },
  {
    filename: "amchur.svg",
    badge: "TANGY FLAVOUR",
    brand: "EVEREST",
    title: "Dry Mango (Amchur)",
    titleHi: "एवरेस्ट आमचूर पाउडर",
    subtitle: "Pure Tangy Dried Mango Powder",
    weight: "100 g",
    type: "box",
    primaryColor: "#854D0E",
    secondaryColor: "#A16207",
    accentColor: "#FEF08A",
    illustration: "spice",
  },
  {
    filename: "tej-patta.svg",
    badge: "AROMATIC LEAVES",
    brand: "ROYAL SPICES",
    title: "Bay Leaves (Tej Patta)",
    titleHi: "सुगंधित तेज पत्ता",
    subtitle: "Handpicked Dried Bay Leaves",
    weight: "50 g",
    type: "pouch",
    primaryColor: "#3F6212",
    secondaryColor: "#65A30D",
    accentColor: "#BEF264",
    illustration: "leaf",
  },
  {
    filename: "saffron-kesar.svg",
    badge: "100% KASHMIRI MONGRA",
    brand: "BABY BRAND",
    title: "Pure Saffron (Kesar)",
    titleHi: "शुद्ध कश्मीरी केसर",
    subtitle: "Organic Rich Red Saffron Strands",
    weight: "1 g",
    type: "box",
    primaryColor: "#B91C1C",
    secondaryColor: "#DC2626",
    accentColor: "#FDE047",
    illustration: "spice",
  },
  {
    filename: "ajwain.svg",
    badge: "DESI DIGESTIVE",
    brand: "ROYAL SPICES",
    title: "Carom Seeds (Ajwain)",
    titleHi: "देसी अजवाइन (खड़ी)",
    subtitle: "Fragrant Clean Carom Seeds",
    weight: "100 g",
    type: "pouch",
    primaryColor: "#713F12",
    secondaryColor: "#854D0E",
    accentColor: "#FEF08A",
    illustration: "spice",
  },
  {
    filename: "nutmeg.svg",
    badge: "SWEET SPICE",
    brand: "ROYAL SPICES",
    title: "Nutmeg (Jaiphal)",
    titleHi: "साबुत जायफल",
    subtitle: "Whole Sweet Aromatic Nutmeg",
    weight: "50 g",
    type: "pouch",
    primaryColor: "#78350F",
    secondaryColor: "#B45309",
    accentColor: "#FDE68A",
    illustration: "spice",
  },
  {
    filename: "star-anise.svg",
    badge: "BIRAYANI SPECIAL",
    brand: "ROYAL SPICES",
    title: "Star Anise",
    titleHi: "चक्र फूल (स्टार ऐनीस)",
    subtitle: "Whole 8-Point Star Anise",
    weight: "50 g",
    type: "pouch",
    primaryColor: "#451A03",
    secondaryColor: "#78350F",
    accentColor: "#FDE68A",
    illustration: "spice",
  },
  {
    filename: "mdh-deggi-mirch.svg",
    badge: "ASLI MASALE SACH SACH",
    brand: "MDH",
    title: "Deggi Mirch",
    titleHi: "एमडीएच देगी मिर्च पाउडर",
    subtitle: "Special Kashmiri Red Chilli",
    weight: "100 g",
    type: "box",
    primaryColor: "#991B1B",
    secondaryColor: "#DC2626",
    accentColor: "#FCA5A5",
    illustration: "spice",
  },
  {
    filename: "everest-garam-masala.svg",
    badge: "TASTE MAKER",
    brand: "EVEREST",
    title: "Garam Masala",
    titleHi: "एवरेस्ट शाही गरम मसाला",
    subtitle: "Aromatic Whole Spices Blend",
    weight: "100 g",
    type: "box",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FCD34D",
    illustration: "spice",
  },
  {
    filename: "catch-jeera.svg",
    badge: "100% WHOLE",
    brand: "CATCH",
    title: "Jeera Whole",
    titleHi: "कैच खड़ा साबुत जीरा",
    subtitle: "Aromatic Cumin Seeds",
    weight: "100 g",
    type: "box",
    primaryColor: "#713F12",
    secondaryColor: "#854D0E",
    accentColor: "#FDE047",
    illustration: "spice",
  },
  {
    filename: "everest-dhaniya.svg",
    badge: "FRESH AROMA",
    brand: "EVEREST",
    title: "Coriander Powder",
    titleHi: "एवरेस्ट धनिया पाउडर",
    subtitle: "Pure Ground Coriander",
    weight: "100 g",
    type: "box",
    primaryColor: "#14532D",
    secondaryColor: "#166534",
    accentColor: "#86EFAC",
    illustration: "spice",
  },

  // Cooking Oils
  {
    filename: "soyabean-oil.svg",
    badge: "HEART HEALTHY",
    brand: "FORTUNE",
    title: "Soya Health Oil",
    titleHi: "फॉर्च्यून सोयाबीन तेल",
    subtitle: "Refined Soybean Cooking Oil",
    weight: "1 L",
    type: "pouch",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#FDE047",
    illustration: "oil",
  },
  {
    filename: "peanut-oil.svg",
    badge: "GROUNDNUT PURITY",
    brand: "DHARA",
    title: "Refined Peanut Oil",
    titleHi: "धारा शुद्ध मूंगफली तेल",
    subtitle: "Filtered Groundnut Cooking Oil",
    weight: "1 L",
    type: "bottle",
    primaryColor: "#B45309",
    secondaryColor: "#D97706",
    accentColor: "#FEF08A",
    illustration: "oil",
  },
  {
    filename: "olive-oil.svg",
    badge: "EXTRA VIRGIN SPANISH",
    brand: "FIGARO",
    title: "Pure Olive Oil",
    titleHi: "फिगारो शुद्ध जैतून तेल",
    subtitle: "Cold Pressed Pure Olive Oil",
    weight: "500 ml",
    type: "can",
    primaryColor: "#3F6212",
    secondaryColor: "#4D7C0F",
    accentColor: "#ECFCCB",
    illustration: "oil",
  },
  {
    filename: "sesame-oil.svg",
    badge: "GINGELLY OIL",
    brand: "TILSONA",
    title: "Sesame Oil (Til Tel)",
    titleHi: "तिलसोना शुद्ध तिल का तेल",
    subtitle: "Pure Cold Pressed Sesame Oil",
    weight: "500 ml",
    type: "bottle",
    primaryColor: "#854D0E",
    secondaryColor: "#A16207",
    accentColor: "#FEF08A",
    illustration: "oil",
  },
  {
    filename: "rice-bran-oil.svg",
    badge: "GAMMA ORYZANOL",
    brand: "FORTUNE",
    title: "Rice Bran Health",
    titleHi: "फॉर्च्यून राइस ब्रान तेल",
    subtitle: "Physically Refined Cooking Oil",
    weight: "1 L",
    type: "pouch",
    primaryColor: "#065F46",
    secondaryColor: "#059669",
    accentColor: "#FDE047",
    illustration: "oil",
  },
  {
    filename: "dalda-ghee.svg",
    badge: "TRUST OF GENERATIONS",
    brand: "DALDA",
    title: "Vanaspati Ghee",
    titleHi: "डालडा शुद्ध वनस्पति घी",
    subtitle: "Vegetable Cooking Ghee",
    weight: "1 L",
    type: "pouch",
    primaryColor: "#15803D",
    secondaryColor: "#16A34A",
    accentColor: "#FEF08A",
    illustration: "oil",
  },
  {
    filename: "patanjali-mustard-oil.svg",
    badge: "KACHI GHANI",
    brand: "PATANJALI",
    title: "Sarson Tel",
    titleHi: "पतंजलि कच्ची घानी सरसों तेल",
    subtitle: "100% Pure Mustard Oil",
    weight: "1 L",
    type: "bottle",
    primaryColor: "#854D0E",
    secondaryColor: "#CA8A04",
    accentColor: "#FEF08A",
    illustration: "oil",
  },
  {
    filename: "fortune-sunflower-oil.svg",
    badge: "LIGHT & HEALTHY",
    brand: "FORTUNE",
    title: "Sunlite Sunflower Oil",
    titleHi: "फॉर्च्यून सनलाइट रिफाइंड तेल",
    subtitle: "Refined Sunflower Cooking Oil",
    weight: "1 L",
    type: "pouch",
    primaryColor: "#B45309",
    secondaryColor: "#EAB308",
    accentColor: "#FEF08A",
    illustration: "oil",
  },

  // Dairy Products
  {
    filename: "amul-dahi.svg",
    badge: "THICK & CREAMY",
    brand: "AMUL",
    title: "Masti Dahi (Curd)",
    titleHi: "अमुल मस्ती ताज़ा दही",
    subtitle: "Pasteurised Rich Cow Milk Dahi",
    weight: "400 g",
    type: "pouch",
    primaryColor: "#0284C7",
    secondaryColor: "#0EA5E9",
    accentColor: "#E0F2FE",
    illustration: "jar",
  },
  {
    filename: "amul-paneer.svg",
    badge: "SOFT MALAI PANEER",
    brand: "AMUL",
    title: "Fresh Malai Paneer",
    titleHi: "अमुल फ्रेश मलाई पनीर",
    subtitle: "Rich Cottage Cheese Block",
    weight: "200 g",
    type: "box",
    primaryColor: "#15803D",
    secondaryColor: "#16A34A",
    accentColor: "#DCFCE7",
    illustration: "box",
  },
  {
    filename: "amul-cream.svg",
    badge: "LOW FAT 25%",
    brand: "AMUL",
    title: "Fresh Dairy Cream",
    titleHi: "अमुल ताज़ा मलाई (क्रीम)",
    subtitle: "Sterilised Cooking Cream",
    weight: "250 ml",
    type: "box",
    primaryColor: "#0369A1",
    secondaryColor: "#0284C7",
    accentColor: "#BAE6FD",
    illustration: "jar",
  },
  {
    filename: "amul-chhaachh.svg",
    badge: "MASALA CHHAACHH",
    brand: "AMUL",
    title: "Spiced Buttermilk",
    titleHi: "अमुल मसाला छाछ",
    subtitle: "Refreshing Spiced Mattha Drink",
    weight: "200 ml",
    type: "pouch",
    primaryColor: "#047857",
    secondaryColor: "#10B981",
    accentColor: "#D1FAE5",
    illustration: "bottle",
  },
  {
    filename: "milk-powder.svg",
    badge: "RICH TEA WHITENER",
    brand: "NESTLE",
    title: "Everyday Milk Powder",
    titleHi: "नेस्ले एवरीडे दूध पाउडर",
    subtitle: "Dairy Whitener for Thick Tea",
    weight: "400 g",
    type: "box",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#FEF08A",
    illustration: "box",
  },
  {
    filename: "condensed-milk.svg",
    badge: "FOR SWEETS & DESSERTS",
    brand: "NESTLE",
    title: "Milkmaid Condensed Milk",
    titleHi: "मिल्कमेड गाढ़ा मीठा दूध",
    subtitle: "Sweetened Rich Condensed Milk",
    weight: "380 g",
    type: "can",
    primaryColor: "#0284C7",
    secondaryColor: "#0EA5E9",
    accentColor: "#FEF08A",
    illustration: "can",
  },
  {
    filename: "cheese-slices.svg",
    badge: "10 DELICIOUS SLICES",
    brand: "AMUL",
    title: "Processed Cheese Slices",
    titleHi: "अमुल चीज़ स्लाइस",
    subtitle: "Individually Wrapped Slices",
    weight: "200 g",
    type: "box",
    primaryColor: "#B45309",
    secondaryColor: "#F59E0B",
    accentColor: "#FEF08A",
    illustration: "box",
  },

  // Snacks & Sweets
  {
    filename: "rasgulla.svg",
    badge: "TRADITIONAL BENGALI",
    brand: "HALDIRAM'S",
    title: "Rasgulla Tin",
    titleHi: "हल्दीराम रसगुल्ला टिन",
    subtitle: "Spongy Juicy Cottage Cheese Balls",
    weight: "1 kg",
    type: "can",
    primaryColor: "#B91C1C",
    secondaryColor: "#DC2626",
    accentColor: "#FEF08A",
    illustration: "can",
  },
  {
    filename: "gulab-jamun.svg",
    badge: "MAWA SPECIAL",
    brand: "HALDIRAM'S",
    title: "Gulab Jamun Tin",
    titleHi: "हल्दीराम गुलाब जामुन टिन",
    subtitle: "Soft Khoya Balls in Sugar Syrup",
    weight: "1 kg",
    type: "can",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FDE68A",
    illustration: "can",
  },
  {
    filename: "mtr-poha.svg",
    badge: "3-MIN READY BREAKFAST",
    brand: "MTR",
    title: "Instant Khatta Meetha Poha",
    titleHi: "एमटीआर झटपट पोहा",
    subtitle: "Ready in 3 Minutes Breakfast",
    weight: "60 g",
    type: "box",
    primaryColor: "#B45309",
    secondaryColor: "#D97706",
    accentColor: "#FEF08A",
    illustration: "box",
  },
  {
    filename: "mtr-upma.svg",
    badge: "SAVOURY SEMOLINA",
    brand: "MTR",
    title: "Instant Rava Upma Mix",
    titleHi: "एमटीआर रवा उपमा मिक्स",
    subtitle: "Homestyle Breakfast Treat",
    weight: "500 g",
    type: "pouch",
    primaryColor: "#065F46",
    secondaryColor: "#059669",
    accentColor: "#A7F3D0",
    illustration: "flour",
  },

  // Beverages
  {
    filename: "green-tea.svg",
    badge: "HONEY LEMON DETOX",
    brand: "LIPTON",
    title: "Green Tea Bags",
    titleHi: "लिप्टन ग्रीन टी (हनी लेमन)",
    subtitle: "Pure Antioxidant Green Tea",
    weight: "25 Bags",
    type: "box",
    primaryColor: "#15803D",
    secondaryColor: "#16A34A",
    accentColor: "#FEF08A",
    illustration: "leaf",
  },
  {
    filename: "red-bull.svg",
    badge: "VITALIZES BODY & MIND",
    brand: "RED BULL",
    title: "Energy Drink",
    titleHi: "रेड बुल एनर्जी ड्रिंक",
    subtitle: "Carbonated Taurine Energy Drink",
    weight: "250 ml",
    type: "can",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#DC2626",
    illustration: "can",
  },
  {
    filename: "amul-kool.svg",
    badge: "CHILLED COFFEE",
    brand: "AMUL",
    title: "Amul Kool Cafe",
    titleHi: "अमुल कूल कैफे (मिल्क)",
    subtitle: "Flavoured Dairy Drink Can",
    weight: "200 ml",
    type: "can",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FDE68A",
    illustration: "can",
  },
  {
    filename: "coconut-water.svg",
    badge: "100% TENDER COCONUT",
    brand: "REAL",
    title: "Tender Coconut Water",
    titleHi: "रियल ताज़ा नारियल पानी",
    subtitle: "Electrolyte Rich Hydration",
    weight: "200 ml",
    type: "box",
    primaryColor: "#047857",
    secondaryColor: "#10B981",
    accentColor: "#CCFBF1",
    illustration: "bottle",
  },

  // Breakfast
  {
    filename: "wheat-bread.svg",
    badge: "100% WHOLE WHEAT",
    brand: "BRITANNIA",
    title: "Whole Wheat Bread",
    titleHi: "ब्रिटानिया ब्राउन ब्रेड",
    subtitle: "Fresh Sliced Sandwich Bread",
    weight: "400 g",
    type: "pouch",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FDE68A",
    illustration: "flour",
  },
  {
    filename: "farm-eggs.svg",
    badge: "FARM FRESH PROTEIN",
    brand: "POULTRY FRESH",
    title: "Farm White Eggs",
    titleHi: "ताज़ा फार्म अंडे (6 पीस)",
    subtitle: "High Quality Grade A Eggs",
    weight: "6 Pcs",
    type: "box",
    primaryColor: "#B45309",
    secondaryColor: "#D97706",
    accentColor: "#FEF08A",
    illustration: "egg",
  },
  {
    filename: "kissan-jam.svg",
    badge: "8 REAL FRUITS",
    brand: "KISSAN",
    title: "Mixed Fruit Jam",
    titleHi: "किसान मिक्स्ड फ्रूट जैम",
    subtitle: "Delicious Fruit Pulp Spread",
    weight: "500 g",
    type: "jar",
    primaryColor: "#991B1B",
    secondaryColor: "#DC2626",
    accentColor: "#FCA5A5",
    illustration: "jar",
  },
  {
    filename: "peanut-butter.svg",
    badge: "CRUNCHY 100% ROASTED",
    brand: "PINTOLA",
    title: "All Natural Peanut Butter",
    titleHi: "पिंटोला पीनट बटर (मूंगफली)",
    subtitle: "High Protein Crunchy Spread",
    weight: "350 g",
    type: "jar",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FEF08A",
    illustration: "jar",
  },
  {
    filename: "muesli.svg",
    badge: "FRUIT NUT & SEEDS",
    brand: "KELLOGG'S",
    title: "Muesli Extra Crunch",
    titleHi: "केलॉग्स म्यूसली (मेवे और बीज)",
    subtitle: "Multigrain Crunchy Breakfast",
    weight: "500 g",
    type: "box",
    primaryColor: "#881337",
    secondaryColor: "#BE123C",
    accentColor: "#FEF08A",
    illustration: "box",
  },
  {
    filename: "nutella.svg",
    badge: "HAZELNUT COCOA SPREAD",
    brand: "NUTELLA",
    title: "Hazelnut Spread",
    titleHi: "नुटेला हेज़लनट कोको स्प्रेड",
    subtitle: "Creamy Chocolate Spread",
    weight: "350 g",
    type: "jar",
    primaryColor: "#451A03",
    secondaryColor: "#78350F",
    accentColor: "#FFFFFF",
    illustration: "jar",
  },

  // Personal Care
  {
    filename: "dettol-soap.svg",
    badge: "100% GERM DEFENCE",
    brand: "DETTOL",
    title: "Original Soap Bar",
    titleHi: "डेटॉल ओरिजिनल साबुन",
    subtitle: "Antibacterial Bathing Bar",
    weight: "Pack of 4",
    type: "bar",
    primaryColor: "#15803D",
    secondaryColor: "#22C55E",
    accentColor: "#BBF7D0",
    illustration: "soap",
  },
  {
    filename: "head-shoulders.svg",
    badge: "ANTI-DANDRUFF",
    brand: "HEAD & SHOULDERS",
    title: "Cool Menthol Shampoo",
    titleHi: "हेड एंड शोल्डर शैम्पू",
    subtitle: "Menthol Fresh Hair Wash",
    weight: "180 ml",
    type: "bottle",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#93C5FD",
    illustration: "bottle",
  },
  {
    filename: "oral-b-brush.svg",
    badge: "CROSS ACTION",
    brand: "ORAL-B",
    title: "Shiny Clean Toothbrush",
    titleHi: "ओरल-बी टूथब्रश (3 पीस)",
    subtitle: "Medium Plaque Removal Bristles",
    weight: "Pack of 3",
    type: "box",
    primaryColor: "#0284C7",
    secondaryColor: "#0EA5E9",
    accentColor: "#BAE6FD",
    illustration: "cleaner",
  },
  {
    filename: "shaving-foam.svg",
    badge: "EXTRA RICH LATHER",
    brand: "GILLETTE",
    title: "Foamy Shaving Foam",
    titleHi: "जिलेट शेविंग फोम",
    subtitle: "Smooth Glide Lemon Lime",
    weight: "196 g",
    type: "can",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#FEF08A",
    illustration: "can",
  },
  {
    filename: "nivea-lotion.svg",
    badge: "48H DEEP MOISTURE",
    brand: "NIVEA",
    title: "Nourishing Body Lotion",
    titleHi: "निविया बॉडी लोशन",
    subtitle: "Deep Moisture Serum Cream",
    weight: "200 ml",
    type: "bottle",
    primaryColor: "#1E3A8A",
    secondaryColor: "#3B82F6",
    accentColor: "#FFFFFF",
    illustration: "bottle",
  },
  {
    filename: "fogg-deo.svg",
    badge: "1000 SPRAYS NO GAS",
    brand: "FOGG",
    title: "Scent Master Deodorant",
    titleHi: "फॉग डियोड्रेंट बॉडी स्प्रे",
    subtitle: "Long Lasting Perfumed Spray",
    weight: "120 ml",
    type: "bottle",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#FDE047",
    illustration: "bottle",
  },
  {
    filename: "garnier-facewash.svg",
    badge: "ACNO FIGHT CHARCOAL",
    brand: "GARNIER MEN",
    title: "Acno Fight Face Wash",
    titleHi: "गार्नियर मेन फेस वॉश",
    subtitle: "Anti-Pimple Face Cleanser",
    weight: "100 g",
    type: "bottle",
    primaryColor: "#047857",
    secondaryColor: "#059669",
    accentColor: "#FEF08A",
    illustration: "cleaner",
  },

  // Cleaning & Household
  {
    filename: "colin-spray.svg",
    badge: "STREAK FREE SHINE",
    brand: "COLIN",
    title: "Glass Cleaner Spray",
    titleHi: "कोलिन ग्लास क्लीनर स्प्रे",
    subtitle: "Shine Booster Surface Spray",
    weight: "500 ml",
    type: "bottle",
    primaryColor: "#0284C7",
    secondaryColor: "#38BDF8",
    accentColor: "#E0F2FE",
    illustration: "cleaner",
  },
  {
    filename: "pril-liquid.svg",
    badge: "ACTIVE POWER DROPS",
    brand: "PRIL",
    title: "Dishwash Gel Liquid",
    titleHi: "प्रिल लिक्विड डिशवॉश",
    subtitle: "Fast Degreasing Formula",
    weight: "425 ml",
    type: "bottle",
    primaryColor: "#15803D",
    secondaryColor: "#22C55E",
    accentColor: "#FEF08A",
    illustration: "cleaner",
  },
  {
    filename: "phenyl-bottle.svg",
    badge: "PINE SCENTED DISINFECTANT",
    brand: "TRISHUL",
    title: "White Phenyl Cleaner",
    titleHi: "त्रिशूल सफेद फिनाइल",
    subtitle: "Germicidal Floor Cleaner",
    weight: "1 L",
    type: "bottle",
    primaryColor: "#065F46",
    secondaryColor: "#047857",
    accentColor: "#CCFBF1",
    illustration: "cleaner",
  },
  {
    filename: "odonil-block.svg",
    badge: "30 DAYS FRESHNESS",
    brand: "ODONIL",
    title: "Lavender Air Freshener",
    titleHi: "ओडोनिल एयर फ्रेशनर",
    subtitle: "Natural Room Fragrance Block",
    weight: "50 g",
    type: "box",
    primaryColor: "#6B21A8",
    secondaryColor: "#9333EA",
    accentColor: "#F3E8FF",
    illustration: "box",
  },
  {
    filename: "garbage-bags.svg",
    badge: "OXO-BIODEGRADABLE",
    brand: "SHALIMAR",
    title: "Garbage Bags Medium",
    titleHi: "शालीमार डस्टबिन कचरा बैग",
    subtitle: "Tear Resistant Black Bags",
    weight: "30 Bags",
    type: "box",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#64748B",
    illustration: "tool",
  },
  {
    filename: "gala-broom.svg",
    badge: "VIRGIN GRASS",
    brand: "GALA",
    title: "King Kong Grass Broom",
    titleHi: "गाला घास वाली झाड़ू",
    subtitle: "Long Lasting Dust Broom",
    weight: "1 Pc",
    type: "box",
    primaryColor: "#854D0E",
    secondaryColor: "#A16207",
    accentColor: "#FEF08A",
    illustration: "tool",
  },
  {
    filename: "floor-mop.svg",
    badge: "100% COTTON LOOPS",
    brand: "SCOTCH-BRITE",
    title: "Cotton Floor Mop",
    titleHi: "स्कॉच-ब्राइट कॉटन पोछा (मॉप)",
    subtitle: "Super Absorbent Floor Mop",
    weight: "1 Pc",
    type: "box",
    primaryColor: "#15803D",
    secondaryColor: "#16A34A",
    accentColor: "#86EFAC",
    illustration: "tool",
  },
  {
    filename: "water-bucket.svg",
    badge: "VIRGIN PLASTIC 18L",
    brand: "MILTON",
    title: "Heavy Duty Bucket",
    titleHi: "मिल्टन मजबूत प्लास्टिक बाल्टी",
    subtitle: "Sturdy Utility Wash Bucket",
    weight: "18 Litre",
    type: "box",
    primaryColor: "#0284C7",
    secondaryColor: "#0284C7",
    accentColor: "#BAE6FD",
    illustration: "tool",
  },

  // Cookware & Utensils
  {
    filename: "pressure-cooker.svg",
    badge: "INNER LID SAFETY",
    brand: "HAWKINS",
    title: "Classic Pressure Cooker",
    titleHi: "हॉकिन्स 3L प्रेशर कुकर",
    subtitle: "Energy Efficient Aluminium Cooker",
    weight: "3 Litre",
    type: "utensil",
    primaryColor: "#334155",
    secondaryColor: "#475569",
    accentColor: "#94A3B8",
    illustration: "cookware",
  },
  {
    filename: "dosa-tawa.svg",
    badge: "NON-STICK INDUCTION",
    brand: "PRESTIGE",
    title: "Omni Flat Dosa Tawa",
    titleHi: "प्रेस्टीज नॉन-स्टिक तवा (28cm)",
    subtitle: "Scratch Resistant Roti & Dosa Pan",
    weight: "28 cm",
    type: "utensil",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#DC2626",
    illustration: "cookware",
  },
  {
    filename: "anodised-kadhai.svg",
    badge: "HARD ANODISED WITH LID",
    brand: "PRESTIGE",
    title: "Deep Frying Kadhai",
    titleHi: "प्रेस्टीज हार्ड एनोडाइज्ड कढ़ाई",
    subtitle: "Non-Toxic Deep Cooking Wok",
    weight: "2.5 L",
    type: "utensil",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#F59E0B",
    illustration: "cookware",
  },
  {
    filename: "mixer-grinder.svg",
    badge: "500W HEAVY MOTOR",
    brand: "BAJAJ",
    title: "Classic Mixer Grinder",
    titleHi: "बजाज 500W मिक्सर ग्राइंडर",
    subtitle: "3 Stainless Steel Jars Included",
    weight: "Set of 3 Jars",
    type: "box",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#FDE047",
    illustration: "cookware",
  },
  {
    filename: "chakla-belan.svg",
    badge: "PURE SHEESHAM WOOD",
    brand: "KITCHEN CRAFT",
    title: "Wooden Chakla Belan",
    titleHi: "शीशम की लकड़ी का चकला-बेलन",
    subtitle: "Traditional Solid Rolling Pin Set",
    weight: "Set of 2",
    type: "utensil",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#FDE68A",
    illustration: "tool",
  },
  {
    filename: "knife-peeler.svg",
    badge: "LASER SHARP STAINLESS",
    brand: "KITCHEN CRAFT",
    title: "Knife & Peeler Set",
    titleHi: "किचन चाकू और छीलनी सेट",
    subtitle: "Ergonomic Vegetable Knife",
    weight: "Pack of 2",
    type: "box",
    primaryColor: "#334155",
    secondaryColor: "#475569",
    accentColor: "#E2E8F0",
    illustration: "tool",
  },
  {
    filename: "storage-jars.svg",
    badge: "SEE THROUGH WINDOW",
    brand: "KITCHEN CRAFT",
    title: "Steel Storage Jars",
    titleHi: "स्टेनलेस स्टील स्टोरेज डिब्बे",
    subtitle: "Airtight Grocery Dabba Containers",
    weight: "Set of 4",
    type: "box",
    primaryColor: "#475569",
    secondaryColor: "#64748B",
    accentColor: "#CBD5E1",
    illustration: "tool",
  },
  {
    filename: "colander-chhalni.svg",
    badge: "FINE WIRE MESH",
    brand: "KITCHEN CRAFT",
    title: "Steel Mesh Strainer",
    titleHi: "स्टील छलनी (आटा और चाय)",
    subtitle: "Rust Proof Fine Colander",
    weight: "1 Pc",
    type: "utensil",
    primaryColor: "#64748B",
    secondaryColor: "#94A3B8",
    accentColor: "#E2E8F0",
    illustration: "tool",
  },

  // Misc & Electrical
  {
    filename: "duracell-batteries.svg",
    badge: "UP TO 10X LONGER",
    brand: "DURACELL",
    title: "Ultra AA Alkaline",
    titleHi: "ड्यूरासेल AA बैटरी (4 पीस)",
    subtitle: "1.5V Alkaline Power Cells",
    weight: "Pack of 4",
    type: "box",
    primaryColor: "#78350F",
    secondaryColor: "#92400E",
    accentColor: "#F59E0B",
    illustration: "battery",
  },
  {
    filename: "led-bulb.svg",
    badge: "9W 900 LUMENS B22",
    brand: "WIPRO",
    title: "Garnet 9W LED Bulb",
    titleHi: "विप्रो 9W एलईडी बल्ब (सफेद)",
    subtitle: "Energy Saving Cool White Light",
    weight: "1 Pc",
    type: "box",
    primaryColor: "#0284C7",
    secondaryColor: "#0EA5E9",
    accentColor: "#FEF08A",
    illustration: "bulb",
  },
  {
    filename: "white-candles.svg",
    badge: "SMOKELESS WAX",
    brand: "BRIGHT HOME",
    title: "Household Candles",
    titleHi: "सफेद मोमबत्तियां (12 पीस)",
    subtitle: "Emergency Home Lighting Candles",
    weight: "Pack of 12",
    type: "box",
    primaryColor: "#B45309",
    secondaryColor: "#D97706",
    accentColor: "#FEF08A",
    illustration: "bulb",
  },
  {
    filename: "matchboxes.svg",
    badge: "SAFETY MATCHES",
    brand: "SHIP",
    title: "Safety Matchboxes",
    titleHi: "माचिस की डिब्बियां (10 का बंडल)",
    subtitle: "Carbonized Smooth Strike Matches",
    weight: "Bundle of 10",
    type: "box",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#DC2626",
    illustration: "bulb",
  },
  {
    filename: "fevicol-glue.svg",
    badge: "ALL PURPOSE CRAFT GLUE",
    brand: "FEVICOL",
    title: "Fevicol MR Squeezy",
    titleHi: "फेविकोल एमआर गोंद (100g)",
    subtitle: "Synthetic Clean Adhesive Glue",
    weight: "100 g",
    type: "bottle",
    primaryColor: "#1E3A8A",
    secondaryColor: "#2563EB",
    accentColor: "#FEF08A",
    illustration: "bottle",
  },
  {
    filename: "craft-scissors.svg",
    badge: "HEAVY DUTY GRIP",
    brand: "KITCHEN CRAFT",
    title: "Kitchen & Craft Scissors",
    titleHi: "स्टील किचन कैंची",
    subtitle: "Sharp Stainless Steel Scissors",
    weight: "1 Pc",
    type: "box",
    primaryColor: "#991B1B",
    secondaryColor: "#DC2626",
    accentColor: "#94A3B8",
    illustration: "tool",
  },
  {
    filename: "sewing-kit.svg",
    badge: "EMERGENCY TAILORING",
    brand: "STITCH CRAFT",
    title: "Home Sewing Kit",
    titleHi: "सिलाई किट (सुई, धागा, बटन)",
    subtitle: "Threads, Needles & Buttons Set",
    weight: "1 Set",
    type: "box",
    primaryColor: "#6B21A8",
    secondaryColor: "#9333EA",
    accentColor: "#FDE047",
    illustration: "tool",
  },
  {
    filename: "gas-lighter.svg",
    badge: "HEAVY STEEL SPARK",
    brand: "CHEF KITCHEN",
    title: "Gas Stove Lighter",
    titleHi: "गैस चूल्हा लाइटर (स्टील)",
    subtitle: "Instant Electronic Gas Lighter",
    weight: "1 Pc",
    type: "box",
    primaryColor: "#475569",
    secondaryColor: "#64748B",
    accentColor: "#DC2626",
    illustration: "tool",
  },
];

function generateSvg(p: SvgConfig): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <!-- Background Studio Gradients -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="80%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EFF3F8" />
    </radialGradient>
    
    <!-- Pack Main Gradients -->
    <linearGradient id="packGrad_${p.filename.replace(/\W/g, "")}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.secondaryColor}" />
      <stop offset="50%" stop-color="${p.primaryColor}" />
      <stop offset="100%" stop-color="${p.primaryColor}" />
    </linearGradient>
    
    <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.05" />
      <stop offset="70%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
    </linearGradient>

    <!-- Shadow filter -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="500" height="500" rx="24" fill="url(#bgGrad)" />

  <!-- Drop Shadow Base Ellipse -->
  <ellipse cx="250" cy="435" rx="140" ry="16" fill="#0F172A" opacity="0.12" />
  <ellipse cx="250" cy="432" rx="100" ry="10" fill="#0F172A" opacity="0.20" />

  <!-- Product Pack Container with Shadow -->
  <g filter="url(#softShadow)">
    ${
      p.type === "jar" || p.type === "bottle"
        ? `
      <!-- Bottle / Jar Shape -->
      <!-- Cap -->
      <rect x="205" y="65" width="90" height="32" rx="8" fill="${p.accentColor}" stroke="#CBD5E1" stroke-width="2" />
      <rect x="215" y="97" width="70" height="12" fill="#94A3B8" />
      <!-- Body -->
      <rect x="135" y="105" width="230" height="310" rx="36" fill="url(#packGrad_${p.filename.replace(/\W/g, "")})" />
      <rect x="135" y="105" width="230" height="310" rx="36" fill="url(#sheen)" />
      <!-- Label Plate -->
      <rect x="150" y="150" width="200" height="235" rx="16" fill="#FFFFFF" opacity="0.96" />
      `
        : p.type === "bar"
          ? `
      <!-- Soap Bar Shape -->
      <rect x="100" y="130" width="300" height="240" rx="32" fill="url(#packGrad_${p.filename.replace(/\W/g, "")})" />
      <rect x="100" y="130" width="300" height="240" rx="32" fill="url(#sheen)" />
      <!-- Wrapper Band -->
      <rect x="130" y="160" width="240" height="180" rx="16" fill="#FFFFFF" opacity="0.96" />
      `
          : p.type === "utensil"
            ? `
      <!-- Utensil Cookware Shape -->
      <circle cx="250" cy="240" r="140" fill="url(#packGrad_${p.filename.replace(/\W/g, "")})" stroke="#CBD5E1" stroke-width="4" />
      <circle cx="250" cy="240" r="140" fill="url(#sheen)" />
      <!-- Label Center Area -->
      <rect x="150" y="150" width="200" height="235" rx="18" fill="#FFFFFF" opacity="0.96" />
      `
            : `
      <!-- Pouch / Sack / Box Shape -->
      <!-- Top Seal / Handle -->
      <path d="M 125 105 Q 250 85 375 105 L 360 415 Q 250 430 140 415 Z" fill="url(#packGrad_${p.filename.replace(/\W/g, "")})" />
      <path d="M 125 105 Q 250 85 375 105 L 360 415 Q 250 430 140 415 Z" fill="url(#sheen)" />
      <!-- Top Serrated Header -->
      <rect x="130" y="85" width="240" height="30" rx="6" fill="${p.primaryColor}" />
      <rect x="210" y="93" width="80" height="14" rx="7" fill="#FFFFFF" opacity="0.8" />
      <!-- Label Center Area -->
      <rect x="150" y="135" width="200" height="260" rx="18" fill="#FFFFFF" opacity="0.96" />
      `
    }

    <!-- Content on White Label Plate -->
    <!-- Brand Banner -->
    <rect x="165" y="155" width="170" height="28" rx="8" fill="${p.primaryColor}" />
    <text x="250" y="174" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="13" letter-spacing="1.5">
      ${escapeXml(p.brand)}
    </text>

    <!-- Badge Tag -->
    ${
      p.badge
        ? `
    <text x="250" y="196" text-anchor="middle" fill="${p.primaryColor}" font-family="system-ui, sans-serif" font-weight="800" font-size="9" letter-spacing="1">
      ★ ${escapeXml(p.badge)} ★
    </text>
    `
        : ""
    }

    <!-- Product Title English -->
    <text x="250" y="222" text-anchor="middle" fill="#0F172A" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="16">
      ${escapeXml(p.title)}
    </text>

    <!-- Product Title Hindi -->
    <text x="250" y="246" text-anchor="middle" fill="${p.primaryColor}" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="14">
      ${escapeXml(p.titleHi)}
    </text>

    <!-- Divider Line -->
    <line x1="175" y1="258" x2="325" y2="258" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="4,4" />

    <!-- Center Icon Graphic / Food Visual -->
    <circle cx="250" cy="305" r="38" fill="${p.accentColor}" opacity="0.4" />
    <circle cx="250" cy="305" r="30" fill="${p.primaryColor}" opacity="0.15" />
    
    <!-- Food Symbol based on type -->
    ${renderFoodSymbol(p)}

    <!-- Subtitle / Quality note -->
    <text x="250" y="360" text-anchor="middle" fill="#64748B" font-family="system-ui, sans-serif" font-weight="600" font-size="10">
      ${escapeXml(p.subtitle)}
    </text>

    <!-- Weight & Veg Badge Footer -->
    <rect x="175" y="372" width="150" height="20" rx="6" fill="#F1F5F9" />
    
    <!-- Green Veg Mark -->
    <rect x="183" y="376" width="12" height="12" fill="#FFFFFF" stroke="#16A34A" stroke-width="1.5" />
    <circle cx="189" cy="382" r="3" fill="#16A34A" />

    <!-- Weight Text -->
    <text x="255" y="386" text-anchor="middle" fill="#0F172A" font-family="system-ui, sans-serif" font-weight="800" font-size="11">
      NET WT. ${escapeXml(p.weight)}
    </text>
  </g>

  <!-- Store Guarantee Bottom Banner -->
  <rect x="160" y="458" width="180" height="24" rx="12" fill="#18483B" />
  <text x="250" y="474" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="800" font-size="10" letter-spacing="0.5">
    ARUN GOPAL TRADERS • 100% GENUINE
  </text>
</svg>`;
}

function renderFoodSymbol(p: SvgConfig): string {
  switch (p.illustration) {
    case "lentils":
      return `
      <!-- Lentils / Dal Beans Icon -->
      <ellipse cx="242" cy="300" rx="9" ry="6" fill="${p.primaryColor}" transform="rotate(-20 242 300)" />
      <ellipse cx="258" cy="300" rx="9" ry="6" fill="${p.secondaryColor}" transform="rotate(20 258 300)" />
      <ellipse cx="250" cy="312" rx="9" ry="6" fill="${p.primaryColor}" transform="rotate(5 250 312)" />
      <circle cx="240" cy="310" r="4" fill="${p.secondaryColor}" />
      <circle cx="260" cy="310" r="4" fill="${p.primaryColor}" />
      `;
    case "rice":
      return `
      <!-- Basmati Grain Grains -->
      <path d="M 235 315 Q 242 295 245 285 Q 248 295 242 315 Z" fill="${p.primaryColor}" transform="rotate(-25 240 300)" />
      <path d="M 255 315 Q 262 295 265 285 Q 268 295 262 315 Z" fill="${p.primaryColor}" transform="rotate(25 260 300)" />
      <path d="M 246 320 Q 250 295 250 282 Q 254 295 250 320 Z" fill="${p.secondaryColor}" />
      `;
    case "oil":
      return `
      <!-- Oil Droplet & Mustard Flower -->
      <path d="M 250 285 C 240 305 235 315 235 322 C 235 330 242 336 250 336 C 258 336 265 330 265 322 C 265 315 260 305 250 285 Z" fill="${p.primaryColor}" />
      <circle cx="246" cy="320" r="3" fill="#FFFFFF" opacity="0.6" />
      `;
    case "spice":
      return `
      <!-- Spice Mortar / Star Anise / Bowl -->
      <path d="M 230 310 Q 250 330 270 310 L 265 300 L 235 300 Z" fill="${p.primaryColor}" />
      <circle cx="250" cy="296" r="8" fill="${p.secondaryColor}" />
      <path d="M 246 288 L 262 305" stroke="#FFFFFF" stroke-width="2" />
      `;
    case "egg":
      return `
      <!-- Fresh Farm Egg -->
      <ellipse cx="250" cy="305" rx="16" ry="22" fill="#FFFFFF" stroke="${p.primaryColor}" stroke-width="3" />
      <circle cx="250" cy="308" r="8" fill="${p.accentColor}" />
      `;
    case "cookware":
      return `
      <!-- Pressure Cooker / Kadhai / Pot -->
      <rect x="235" y="295" width="30" height="20" rx="4" fill="${p.primaryColor}" />
      <line x1="225" y1="305" x2="275" y2="305" stroke="#FFFFFF" stroke-width="3" />
      `;
    case "bulb":
      return `
      <!-- Light Bulb / Flame / Spark -->
      <circle cx="250" cy="300" r="14" fill="${p.accentColor}" />
      <rect x="245" y="312" width="10" height="8" rx="2" fill="${p.primaryColor}" />
      `;
    case "battery":
      return `
      <!-- Battery Cell -->
      <rect x="240" y="290" width="20" height="30" rx="3" fill="${p.primaryColor}" />
      <rect x="246" y="286" width="8" height="4" fill="${p.accentColor}" />
      <text x="250" y="310" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="bold">+</text>
      `;
    case "leaf":
      return `
      <!-- Green Tea Leaf -->
      <path d="M 235 315 C 235 295 255 285 265 285 C 265 305 245 325 235 315 Z" fill="${p.primaryColor}" />
      <path d="M 235 315 Q 250 300 265 285" stroke="#FFFFFF" stroke-width="1.5" />
      `;
    case "biscuit":
    case "snack":
      return `
      <!-- Biscuit / Cookie shape -->
      <rect x="232" y="290" width="36" height="28" rx="6" fill="${p.primaryColor}" />
      <circle cx="240" cy="298" r="1.5" fill="#FFFFFF" />
      <circle cx="250" cy="298" r="1.5" fill="#FFFFFF" />
      <circle cx="260" cy="298" r="1.5" fill="#FFFFFF" />
      <circle cx="240" cy="308" r="1.5" fill="#FFFFFF" />
      <circle cx="250" cy="308" r="1.5" fill="#FFFFFF" />
      <circle cx="260" cy="308" r="1.5" fill="#FFFFFF" />
      `;
    case "cleaner":
    case "soap":
      return `
      <!-- Sparkle / Clean Bubble -->
      <circle cx="246" cy="302" r="14" fill="${p.primaryColor}" opacity="0.8" />
      <circle cx="242" cy="298" r="4" fill="#FFFFFF" opacity="0.7" />
      <circle cx="260" cy="312" r="8" fill="${p.secondaryColor}" opacity="0.6" />
      <path d="M 258 285 L 261 292 L 268 295 L 261 298 L 258 305 L 255 298 L 248 295 L 255 292 Z" fill="${p.accentColor}" />
      `;
    default:
      return `
      <!-- Quality Star Badge -->
      <polygon points="250,285 255,298 268,298 258,306 261,319 250,311 239,319 242,306 232,298 245,298" fill="${p.primaryColor}" />
      `;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

console.log(`Generating ${products.length} accurate product SVG packaging graphics...`);

for (const p of products) {
  const filePath = path.join(OUT_DIR, p.filename);
  const svg = generateSvg(p);
  fs.writeFileSync(filePath, svg, "utf-8");
}

console.log(
  `Successfully generated all ${products.length} product packaging graphics in public/images/products/!`,
);
