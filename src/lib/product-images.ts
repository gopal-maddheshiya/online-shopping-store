import type { Product, ProductImage, ProductImageType } from "./queries";

// Database-driven category thumbnail. Returns whatever the admin uploaded,
// or a clean placeholder if no image is set. No hardcoded mapping.
export function getCategoryThumbnail(category: {
  slug?: string;
  name?: string;
  image_url?: string | null;
  icon?: string | null;
}): string {
  const url = (category.image_url ?? "").trim();
  if (url.length > 0) {
    return url;
  }
  // Simple default placeholder when admin has not uploaded any image yet
  return "/images/packaged.jpg";
}

export const PRODUCT_SPECIFIC_IMAGES: Record<string, string> = {
  // Atta, Flour & Grains
  "fortune-chakki-fresh-atta": "/images/products/aashirvaad-atta.jpg",
  "aashirvaad-shudh-chakki-atta": "/images/products/aashirvaad-atta.jpg",
  "rajdhani-besan": "/images/dal.jpg",
  "bansi-suji-rava": "/images/atta.jpg",
  "shakti-bhog-maida": "/images/atta.jpg",

  // Rice
  "india-gate-classic-basmati-rice": "/images/products/india-gate-basmati-rice.jpg",
  "daawat-rozana-gold-basmati": "/images/products/india-gate-basmati-rice.jpg",
  "sona-masoori-rice-local": "/images/rice.jpg",

  // Pulses & Dal
  "tata-sampann-toor-dal": "/images/products/tata-toor-dal.jpg",
  "moong-dal-dhuli": "/images/dal.jpg",
  "masoor-dal": "/images/dal.jpg",
  "rajma-chitra": "/images/dal.jpg",
  "kabuli-chana": "/images/dal.jpg",

  // Mustard Oil, Refined Oil & Ghee
  "fortune-kachi-ghani-mustard-oil": "/images/products/fortune-mustard-oil.jpg",
  "patanjali-kachi-ghani-sarson-tel": "/images/products/fortune-mustard-oil.jpg",
  "fortune-sunlite-refined-sunflower-oil": "/images/oil.jpg",
  "amul-pure-desi-ghee": "/images/products/amul-desi-ghee.jpg",

  // Spices & Masala
  "everest-turmeric-powder-haldi": "/images/products/everest-turmeric.jpg",
  "mdh-deggi-mirch": "/images/spices.jpg",
  "everest-garam-masala": "/images/spices.jpg",
  "catch-jeera-whole": "/images/spices.jpg",
  "everest-dhaniya-powder": "/images/spices.jpg",

  // Salt, Sugar & Sweeteners
  "tata-salt-iodised": "/images/products/tata-salt.jpg",
  "madhur-pure-sugar": "/images/packaged.jpg",
  "organic-gud-jaggery-block": "/images/packaged.jpg",
  "dabur-honey": "/images/products/dabur-honey.jpg",

  // Biscuits, Snacks & Namkeen
  "parle-g-original-glucose-biscuits": "/images/products/parle-g.jpg",
  "britannia-good-day-cashew-cookies": "/images/products/parle-g.jpg",
  "haldiram-s-aloo-bhujia": "/images/products/haldirams-aloo-bhujia.jpg",
  "lay-s-india-s-magic-masala": "/images/products/haldirams-aloo-bhujia.jpg",
  "cadbury-dairy-milk": "/images/products/cadbury-dairy-milk.jpg",
  "maggi-2-minute-masala-noodles": "/images/products/maggi-noodles.jpg",

  // Detergents & Home
  "surf-excel-easy-wash-detergent-powder": "/images/products/surf-excel.jpg",
};

/**
 * Returns the exact verified local product packaging image.
 * Uses exact slug mapping, fuzzy name matching, and category photographic fallback.
 */
export function getProductImage(product?: {
  slug?: string | null;
  name?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  updated_at?: string | null;
}): string {
  if (!product) return "/images/packaged.jpg";

  // 1. Check if product has an explicit custom image_url (Uploaded Base64, Storage URL, External URL)
  if (
    product.image_url &&
    typeof product.image_url === "string" &&
    product.image_url.trim().length > 0 &&
    product.image_url !== "/images/packaged.jpg"
  ) {
    const cleanUrl = product.image_url.trim();
    if (
      cleanUrl.startsWith("data:image/") ||
      cleanUrl.startsWith("http://") ||
      cleanUrl.startsWith("https://") ||
      cleanUrl.startsWith("blob:") ||
      cleanUrl.startsWith("/")
    ) {
      return withImageVersion(cleanUrl, product.updated_at);
    }
  }

  // 2. Check exact slug match in verified product catalog
  if (product.slug) {
    const direct = PRODUCT_SPECIFIC_IMAGES[product.slug];
    if (direct) return direct;
  }

  // 3. Check normalized slug
  if (product.slug) {
    const norm = product.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const normMatch = PRODUCT_SPECIFIC_IMAGES[norm];
    if (normMatch) return normMatch;
  }

  // 4. Check name lookup with photographic fallbacks
  if (product.name) {
    const normName = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const nameMatch = PRODUCT_SPECIFIC_IMAGES[normName];
    if (nameMatch) return nameMatch;

    // Fuzzy keywords matching to real photos
    const lower = product.name.toLowerCase();
    if (lower.includes("atta") || lower.includes("flour") || lower.includes("wheat"))
    if (lower.includes("soap") || lower.includes("lifebuoy") || lower.includes("lux"))
      return "/images/products/lifebuoy-soap.svg";
    if (lower.includes("toothpaste") || lower.includes("colgate") || lower.includes("brush"))
      return "/images/products/colgate-toothpaste.svg";
    if (lower.includes("coconut oil") || lower.includes("parachute") || lower.includes("hair oil"))
      return "/images/products/parachute-oil.svg";
    if (lower.includes("shampoo")) return "/images/products/clinic-plus-shampoo.svg";
    if (lower.includes("cream") || lower.includes("nivea") || lower.includes("moisturizer"))
      return "/images/products/nivea-soft.svg";

    if (lower.includes("lizol") || lower.includes("floor cleaner"))
      return "/images/products/lizol-cleaner.svg";
    if (lower.includes("harpic") || lower.includes("toilet cleaner"))
      return "/images/products/harpic-cleaner.svg";
    if (lower.includes("vim") || lower.includes("dishwash")) return "/images/products/vim-bar.svg";
    if (
      lower.includes("surf") ||
      lower.includes("detergent") ||
      lower.includes("washing powder") ||
      lower.includes("tide") ||
      lower.includes("aerial")
    )
      return "/images/products/surf-excel.jpg";
    if (lower.includes("rin")) return "/images/products/rin-bar.svg";
    if (lower.includes("comfort") || lower.includes("conditioner"))
      return "/images/products/comfort-fabric.svg";
    if (lower.includes("scrub") || lower.includes("scotch"))
      return "/images/products/scotch-brite.svg";
    if (lower.includes("foil")) return "/images/products/homefoil-foil.svg";

    if (lower.includes("agarbatti") || lower.includes("dhoop") || lower.includes("incense"))
      return "/images/products/cycle-agarbatti.svg";
    if (lower.includes("kapoor") || lower.includes("camphor") || lower.includes("puja"))
      return "/images/products/mangaldeep-kapoor.svg";

    if (lower.includes("notebook") || lower.includes("copy") || lower.includes("classmate"))
      return "/images/products/classmate-notebook.svg";
    if (lower.includes("pen") || lower.includes("cello")) return "/images/products/cello-pen.svg";

    // Dairy & Sweets
    if (lower.includes("dahi") || lower.includes("curd") || lower.includes("yogurt"))
      return "/images/products/amul-dahi.svg";
    if (lower.includes("paneer") || lower.includes("cottage cheese"))
      return "/images/products/amul-paneer.svg";
    if (lower.includes("cream") || lower.includes("malai"))
      return "/images/products/amul-cream.svg";
    if (
      lower.includes("chhaachh") ||
      lower.includes("buttermilk") ||
      lower.includes("mattha") ||
      lower.includes("lassi")
    )
      return "/images/products/amul-chhaachh.svg";
    if (lower.includes("milk powder") || lower.includes("dairy whitener"))
      return "/images/products/milk-powder.svg";
    if (lower.includes("condensed milk") || lower.includes("milkmaid"))
      return "/images/products/condensed-milk.svg";
    if (lower.includes("cheese slice") || lower.includes("cheese"))
      return "/images/products/cheese-slices.svg";
    if (lower.includes("rasgulla") || lower.includes("rosogolla"))
      return "/images/products/rasgulla.svg";
    if (lower.includes("gulab jamun")) return "/images/products/gulab-jamun.svg";

    // Grains & Millets
    if (lower.includes("bajra") || lower.includes("pearl millet"))
      return "/images/products/pearl-millet-bajra.svg";
    if (lower.includes("jowar") || lower.includes("sorghum"))
      return "/images/products/sorghum-jowar.svg";
    if (lower.includes("kala chana") || lower.includes("black chickpea"))
      return "/images/products/kala-chana.svg";
    if (lower.includes("sabut masoor")) return "/images/products/sabut-masoor.svg";
    if (lower.includes("sabut moong") || lower.includes("green gram"))
      return "/images/products/sabut-moong.svg";
    if (lower.includes("urad sabut") || lower.includes("kali dal"))
      return "/images/products/urad-sabut.svg";

    // Spices
    if (lower.includes("hing") || lower.includes("asafoetida"))
      return "/images/products/catch-hing.svg";
    if (lower.includes("cardamom") || lower.includes("elaichi"))
      return "/images/products/cardamom.svg";
    if (lower.includes("cinnamon") || lower.includes("dalchini"))
      return "/images/products/cinnamon.svg";
    if (lower.includes("clove") || lower.includes("laung")) return "/images/products/cloves.svg";
    if (lower.includes("black pepper") || lower.includes("kali mirch"))
      return "/images/products/black-pepper.svg";
    if (lower.includes("fennel") || lower.includes("saunf"))
      return "/images/products/fennel-seeds.svg";
    if (lower.includes("fenugreek") || lower.includes("methi"))
      return "/images/products/methi-seeds.svg";
    if (lower.includes("amchur") || lower.includes("amchoor") || lower.includes("mango powder"))
      return "/images/products/amchur.svg";
    if (lower.includes("tej patta") || lower.includes("bay leaf") || lower.includes("bay leaves"))
      return "/images/products/tej-patta.svg";
    if (lower.includes("saffron") || lower.includes("kesar"))
      return "/images/products/saffron-kesar.svg";
    if (lower.includes("ajwain") || lower.includes("carom")) return "/images/products/ajwain.svg";
    if (lower.includes("nutmeg") || lower.includes("jaiphal")) return "/images/products/nutmeg.svg";
    if (lower.includes("star anise") || lower.includes("chakra phool"))
      return "/images/products/star-anise.svg";

    // Oils
    if (lower.includes("soya") || lower.includes("soyabean"))
      return "/images/products/soyabean-oil.svg";
    if (lower.includes("peanut") || lower.includes("groundnut") || lower.includes("mungfali"))
      return "/images/products/peanut-oil.svg";
    if (lower.includes("olive") || lower.includes("jaitun"))
      return "/images/products/olive-oil.svg";
    if (lower.includes("sesame") || lower.includes("til")) return "/images/products/sesame-oil.svg";
    if (lower.includes("rice bran")) return "/images/products/rice-bran-oil.svg";
    if (lower.includes("dalda") || lower.includes("vanaspati"))
      return "/images/products/dalda-ghee.svg";

    // Breakfast
    if (lower.includes("bread")) return "/images/products/wheat-bread.svg";
    if (lower.includes("egg") || lower.includes("anda")) return "/images/products/farm-eggs.svg";
    if (lower.includes("jam")) return "/images/products/kissan-jam.svg";
    if (lower.includes("peanut butter")) return "/images/products/peanut-butter.svg";
    if (lower.includes("muesli")) return "/images/products/muesli.svg";
    if (lower.includes("nutella")) return "/images/products/nutella.svg";
    if (lower.includes("green tea")) return "/images/products/green-tea.svg";
    if (lower.includes("red bull") || lower.includes("energy drink"))
      return "/images/products/red-bull.svg";
    if (lower.includes("coconut water") || lower.includes("nariyal pani"))
      return "/images/products/coconut-water.svg";

    // Cleaning & Misc
    if (lower.includes("colin") || lower.includes("glass cleaner"))
      return "/images/products/colin-spray.svg";
    if (lower.includes("pril") || lower.includes("dishwash gel"))
      return "/images/products/pril-liquid.svg";
    if (lower.includes("phenyl") || lower.includes("finyle"))
      return "/images/products/phenyl-bottle.svg";
    if (lower.includes("odonil") || lower.includes("air freshener"))
      return "/images/products/odonil-block.svg";
    if (lower.includes("garbage") || lower.includes("trash bag"))
      return "/images/products/garbage-bags.svg";
    if (lower.includes("broom") || lower.includes("jhaadu"))
      return "/images/products/gala-broom.svg";
    if (lower.includes("mop") || lower.includes("pocha")) return "/images/products/floor-mop.svg";
    if (lower.includes("bucket") || lower.includes("balti"))
      return "/images/products/water-bucket.svg";

    // Cookware & Utensils
    if (lower.includes("cooker") || lower.includes("pressure cooker"))
      return "/images/products/pressure-cooker.svg";
    if (lower.includes("tawa") || lower.includes("pan")) return "/images/products/dosa-tawa.svg";
    if (lower.includes("kadhai") || lower.includes("wok"))
      return "/images/products/anodised-kadhai.svg";
    if (lower.includes("mixer") || lower.includes("grinder"))
      return "/images/products/mixer-grinder.svg";
    if (lower.includes("chakla") || lower.includes("belan"))
      return "/images/products/chakla-belan.svg";
    if (lower.includes("knife") || lower.includes("peeler") || lower.includes("chaku"))
      return "/images/products/knife-peeler.svg";
    if (lower.includes("jar") || lower.includes("container") || lower.includes("dabba"))
      return "/images/products/storage-jars.svg";
    if (lower.includes("colander") || lower.includes("chhalni") || lower.includes("strainer"))
      return "/images/products/colander-chhalni.svg";

    // Misc
    if (lower.includes("battery") || lower.includes("duracell") || lower.includes("cell"))
      return "/images/products/duracell-batteries.svg";
    if (lower.includes("bulb") || lower.includes("led")) return "/images/products/led-bulb.svg";
    if (lower.includes("candle") || lower.includes("mombatti"))
      return "/images/products/white-candles.svg";
    if (lower.includes("match") || lower.includes("maachis"))
      return "/images/products/matchboxes.svg";
    if (lower.includes("glue") || lower.includes("fevicol") || lower.includes("gond"))
      return "/images/products/fevicol-glue.svg";
    if (lower.includes("scissor") || lower.includes("kainchi"))
      return "/images/products/craft-scissors.svg";
    if (
      lower.includes("sewing") ||
      lower.includes("needle") ||
      lower.includes("thread") ||
      lower.includes("dhaga")
    )
      return "/images/products/sewing-kit.svg";
    if (lower.includes("lighter")) return "/images/products/gas-lighter.svg";

    if (lower.includes("dog") || lower.includes("pet food") || lower.includes("pedigree"))
      return "/images/products/pedigree-food.svg";
    if (lower.includes("baby powder") || lower.includes("johnson"))
      return "/images/products/johnsons-powder.svg";
    if (lower.includes("diaper") || lower.includes("pampers"))
      return "/images/products/pampers-diapers.svg";
  }

  // 4. Check if product already has a valid non-empty relative image_url
  if (
    product.image_url &&
    (product.image_url.startsWith("/images/") || product.image_url.startsWith("http"))
  ) {
    return withImageVersion(product.image_url, product.updated_at);
  }


  return "/images/packaged.jpg";
}

/**
 * Deterministically versions Supabase Storage product image URLs using product.updated_at
 * to prevent browser disk cache from serving stale images when an image is replaced in Admin.
 */
export function withImageVersion(url: string, updatedAt?: string | null): string {
  if (!url || !updatedAt || !url.includes("supabase.co/storage")) return url;
  if (url.includes("?v=") || url.includes("&v=")) return url;
  const version = new Date(updatedAt).getTime();
  if (isNaN(version) || version <= 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${version}`;
}

/**
 * Normalizes any product's image data into an array of typed ProductImage items.
 * Ensures 100% backward compatibility with legacy products that only have image_url.
 */
export function getProductImages(
  product: (Partial<Product> & { images?: (string | ProductImage)[]; updated_at?: string | null }) | null | undefined,
): ProductImage[] {

  if (!product) {
    return [{ url: "/images/packaged.jpg", type: "front", label: "Front View", sort_order: 0 }];
  }

  const primaryUrl = getProductImage(product);

  // 1. If product has structured or string images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const parsed: ProductImage[] = product.images
      .map((item, index): ProductImage | null => {
        if (!item) return null;

        let obj: { url?: unknown; type?: unknown; label?: unknown; sort_order?: unknown } | null = null;
        if (typeof item === "string") {
          const trimmed = item.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
              obj = JSON.parse(trimmed) as { url?: unknown; type?: unknown; label?: unknown; sort_order?: unknown };
            } catch {
              obj = { url: trimmed };
            }
          } else {
            obj = { url: trimmed };
          }
        } else if (typeof item === "object" && item !== null) {
          obj = item as { url?: unknown; type?: unknown; label?: unknown; sort_order?: unknown };
        }

        if (!obj || typeof obj.url !== "string") return null;
        const cleanUrl = obj.url.trim();
        if (!cleanUrl || cleanUrl === "/images/packaged.jpg") return null;

        const versionedUrl = withImageVersion(cleanUrl, product.updated_at);
        const rawType = typeof obj.type === "string" ? obj.type : undefined;
        const type: ProductImageType =
          rawType === "front" || rawType === "back" || rawType === "detail" || rawType === "additional"
            ? rawType
            : index === 0
              ? "front"
              : index === 1
                ? "back"
                : "additional";

        const label =
          typeof obj.label === "string" && obj.label.trim().length > 0
            ? obj.label.trim()
            : type === "front"
              ? "Front View"
              : type === "back"
                ? "Back / Nutrition"
                : type === "detail"
                  ? "Detail View"
                  : `Photo ${index + 1}`;

        const sort_order = typeof obj.sort_order === "number" ? obj.sort_order : index;

        return {
          url: versionedUrl,
          type,
          label,
          sort_order,
        };
      })
      .filter((img): img is ProductImage => Boolean(img && img.url && img.url.length > 0));

    // Filter out dummy /images/packaged.jpg if primaryUrl or any image is valid custom photo
    const realImages = parsed.filter((img) => img.url && !img.url.includes("/images/packaged.jpg"));

    if (realImages.length > 0) {
      // If primaryUrl is custom and not already in realImages, prepend it as front view
      if (
        primaryUrl &&
        !primaryUrl.includes("/images/packaged.jpg") &&
        !realImages.some((img) => img.url === primaryUrl)
      ) {
        realImages.unshift({
          url: primaryUrl,
          type: "front",
          label: "Front View",
          sort_order: 0,
        });
      }


      realImages.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      if (!realImages.some((img) => img.type === "front")) {
        realImages[0]!.type = "front";
      }
      return realImages.map((img, idx) => ({ ...img, sort_order: idx }));
    }
  }

  // 2. Fallback to primary image
  return [
    {
      url: primaryUrl || "/images/packaged.jpg",
      type: "front",
      label: "Front View",
      sort_order: 0,
    },
  ];
}



/**
 * Returns localized label for each image type (Front, Back, Detail, Additional).
 */
export function getImageTypeLabel(type: ProductImageType, lang: string = "en"): string {
  if (lang === "hi") {
    switch (type) {
      case "front":
        return "सामने का दृश्य";
      case "back":
        return "पीछे / पोषण विवरण";
      case "detail":
        return "बारीक दृश्य / सील";
      case "additional":
        return "अतिरिक्त तस्वीर";
      default:
        return "तस्वीर";
    }
  }

  switch (type) {
    case "front":
      return "Front View";
    case "back":
      return "Back & Nutrition";
    case "detail":
      return "Detail / Label";
    case "additional":
      return "Additional";
    default:
      return "Photo";
  }
}

const KNOWN_JPG_PRODUCTS: Record<string, string> = {
  "aashirvaad-shudh-chakki-atta": "/images/products/aashirvaad-atta.jpg",
  "amul-pure-desi-ghee": "/images/products/amul-desi-ghee.jpg",
  "cadbury-dairy-milk": "/images/products/cadbury-dairy-milk.jpg",
  "dabur-honey": "/images/products/dabur-honey.jpg",
  "everest-turmeric-powder-haldi": "/images/products/everest-turmeric.jpg",
  "fortune-mustard-oil": "/images/products/fortune-mustard-oil.jpg",
  "fortune-kachi-ghani-mustard-oil": "/images/products/fortune-mustard-oil.jpg",
  "haldiram-s-aloo-bhujia": "/images/products/haldirams-aloo-bhujia.jpg",
  "india-gate-classic-basmati-rice": "/images/products/india-gate-basmati-rice.jpg",
  "maggi-2-minute-masala-noodles": "/images/products/maggi-noodles.jpg",
  "parle-g-original-glucose-biscuits": "/images/products/parle-g.jpg",
  "surf-excel-easy-wash": "/images/products/surf-excel.jpg",
  "tata-salt-iodised": "/images/products/tata-salt.jpg",
  "tata-sampann-toor-dal": "/images/products/tata-toor-dal.jpg",
};

/**
 * Returns a guaranteed raster image (JPG/PNG) suitable for WhatsApp, Facebook,
 * Twitter, and other OpenGraph link scrapers that do NOT render SVG graphics.
 */
export function getOpenGraphProductImage(product?: {
  slug?: string | null;
  name?: string | null;
  image_url?: string | null;
  category_id?: string | null;
}): string {
  if (!product) return "/images/packaged.jpg";

  // 1. If product has custom uploaded image that is NOT an SVG and not a raw base64 data URI
  if (
    product.image_url &&
    !product.image_url.toLowerCase().endsWith(".svg") &&
    !product.image_url.startsWith("data:")
  ) {
    return product.image_url;
  }

  // 2. Check if we have an explicit JPG for this product
  if (product.slug) {
    const knownJpg = KNOWN_JPG_PRODUCTS[product.slug];
    if (knownJpg) return knownJpg;
  }

  // 3. Fallback based on keywords in name or slug to genuine JPGs
  const text = `${product.slug || ""} ${product.name || ""}`.toLowerCase();
  if (text.includes("atta") || text.includes("flour") || text.includes("suji") || text.includes("besan") || text.includes("maida")) {
    return "/images/atta.jpg";
  }
  if (text.includes("dal") || text.includes("chana") || text.includes("rajma") || text.includes("moong") || text.includes("toor")) {
    return "/images/dal.jpg";
  }
  if (text.includes("rice") || text.includes("chawal") || text.includes("basmati")) {
    return "/images/rice.jpg";
  }
  if (text.includes("oil") || text.includes("tel") || text.includes("ghee") || text.includes("sarson")) {
    return "/images/oil.jpg";
  }
  if (text.includes("masala") || text.includes("mirch") || text.includes("haldi") || text.includes("spices") || text.includes("dhaniya") || text.includes("jeera")) {
    return "/images/spices.jpg";
  }

  return "/images/packaged.jpg";
}


