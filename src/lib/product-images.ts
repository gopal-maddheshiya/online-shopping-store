// Category-specific photo-realistic images map
export function getCategoryThumbnail(category: {
  slug?: string;
  name?: string;
  image_url?: string | null;
  icon?: string | null;
}): string {
  if (
    category.image_url &&
    category.image_url.startsWith("/images/") &&
    category.image_url.endsWith(".jpg")
  ) {
    return category.image_url;
  }
  const slug = (category.slug ?? "").toLowerCase();
  const name = (category.name ?? "").toLowerCase();

  if (
    slug.includes("atta") ||
    slug.includes("flour") ||
    name.includes("atta") ||
    name.includes("flour") ||
    name.includes("आटा")
  )
    return "/images/atta.jpg";
  if (
    slug.includes("rice") ||
    name.includes("rice") ||
    name.includes("chawal") ||
    name.includes("चावल")
  )
    return "/images/rice.jpg";
  if (
    slug.includes("dal") ||
    slug.includes("pulse") ||
    name.includes("dal") ||
    name.includes("lentil") ||
    name.includes("दाल")
  )
    return "/images/dal.jpg";
  if (
    slug.includes("oil") ||
    slug.includes("ghee") ||
    name.includes("oil") ||
    name.includes("ghee") ||
    name.includes("tel") ||
    name.includes("तेल") ||
    name.includes("घी")
  )
    return "/images/oil.jpg";
  if (
    slug.includes("spice") ||
    slug.includes("masala") ||
    name.includes("spice") ||
    name.includes("masala") ||
    name.includes("मसाला")
  )
    return "/images/spices.jpg";
  if (
    slug.includes("salt") ||
    slug.includes("sugar") ||
    name.includes("salt") ||
    name.includes("sugar") ||
    name.includes("नमक") ||
    name.includes("चीनी")
  )
    return "/images/products/tata-salt.jpg";
  if (
    slug.includes("dry-fruit") ||
    slug.includes("dryfruit") ||
    name.includes("dry fruit") ||
    name.includes("kaju") ||
    name.includes("badam") ||
    name.includes("मेवे")
  )
    return "/images/dryfruits.jpg";
  if (
    slug.includes("tea") ||
    slug.includes("coffee") ||
    name.includes("tea") ||
    name.includes("coffee") ||
    name.includes("chai") ||
    name.includes("चाय")
  )
    return "/images/tea.jpg";
  if (
    slug.includes("biscuit") ||
    slug.includes("cookie") ||
    name.includes("biscuit") ||
    name.includes("बिस्कुट")
  )
    return "/images/biscuits.jpg";
  if (
    slug.includes("snack") ||
    slug.includes("namkeen") ||
    name.includes("snack") ||
    name.includes("namkeen") ||
    name.includes("bhujia") ||
    name.includes("नमकीन")
  )
    return "/images/snacks.jpg";
  if (
    slug.includes("dairy") ||
    name.includes("dairy") ||
    name.includes("milk") ||
    name.includes("paneer") ||
    name.includes("dahi") ||
    name.includes("डेयरी") ||
    name.includes("पनीर")
  )
    return "/images/dairy.jpg";
  if (
    slug.includes("breakfast") ||
    name.includes("breakfast") ||
    name.includes("bread") ||
    name.includes("egg") ||
    name.includes("नाश्ता")
  )
    return "/images/packaged.jpg";
  if (
    slug.includes("chocolate") ||
    slug.includes("sweet") ||
    name.includes("chocolate") ||
    name.includes("mithai") ||
    name.includes("चॉकलेट")
  )
    return "/images/products/cadbury-dairy-milk.jpg";
  if (
    slug.includes("instant") ||
    slug.includes("noodle") ||
    name.includes("maggi") ||
    name.includes("मैगी")
  )
    return "/images/products/maggi-noodles.jpg";
  if (
    slug.includes("beverage") ||
    slug.includes("drink") ||
    slug.includes("juice") ||
    name.includes("juice") ||
    name.includes("पेय")
  )
    return "/images/beverages.jpg";
  if (slug.includes("baby") || name.includes("baby") || name.includes("diaper"))
    return "/images/baby.jpg";
  if (
    slug.includes("personal") ||
    slug.includes("soap") ||
    slug.includes("shampoo") ||
    name.includes("care") ||
    name.includes("साबुन")
  )
    return "/images/personal.jpg";
  if (
    slug.includes("clean") ||
    slug.includes("detergent") ||
    slug.includes("household") ||
    name.includes("clean") ||
    name.includes("detergent") ||
    name.includes("सफाई")
  )
    return "/images/products/surf-excel.jpg";
  if (
    slug.includes("utensil") ||
    slug.includes("cookware") ||
    name.includes("cooker") ||
    name.includes("utensil") ||
    name.includes("बर्तन")
  )
    return "/images/household.jpg";
  if (slug.includes("pooja") || name.includes("pooja") || name.includes("पूजा"))
    return "/images/pooja.jpg";
  if (
    slug.includes("stationery") ||
    slug.includes("misc") ||
    name.includes("misc") ||
    name.includes("stationery") ||
    name.includes("विविध")
  )
    return "/images/stationery.jpg";

  return category.image_url || "/images/packaged.jpg";
}

export const PRODUCT_SPECIFIC_IMAGES: Record<string, string> = {
  // Atta, Flour & Grains
  "fortune-chakki-fresh-atta": "/images/products/aashirvaad-atta.jpg",
  "aashirvaad-shudh-chakki-atta": "/images/products/aashirvaad-atta.jpg",
  "rajdhani-besan": "/images/products/rajdhani-besan.svg",
  "bansi-suji-rava": "/images/products/bansi-suji.svg",
  "shakti-bhog-maida": "/images/products/shakti-bhog-maida.svg",

  // Rice
  "india-gate-classic-basmati-rice": "/images/products/india-gate-basmati-rice.jpg",
  "daawat-rozana-gold-basmati": "/images/products/daawat-basmati-rice.svg",
  "sona-masoori-rice-local": "/images/products/sona-masoori-rice.svg",

  // Pulses & Dal
  "tata-sampann-toor-dal": "/images/products/tata-toor-dal.jpg",
  "moong-dal-dhuli": "/images/products/moong-dal.svg",
  "masoor-dal": "/images/products/masoor-dal.svg",
  "rajma-chitra": "/images/products/rajma-chitra.svg",
  "kabuli-chana": "/images/products/kabuli-chana.svg",

  // Mustard Oil, Refined Oil & Ghee
  "fortune-kachi-ghani-mustard-oil": "/images/products/fortune-mustard-oil.jpg",
  "patanjali-kachi-ghani-sarson-tel": "/images/products/patanjali-mustard-oil.svg",
  "fortune-sunlite-refined-sunflower-oil": "/images/products/fortune-sunflower-oil.svg",
  "amul-pure-desi-ghee": "/images/products/amul-desi-ghee.jpg",

  // Spices & Masala
  "everest-turmeric-powder-haldi": "/images/products/everest-turmeric.jpg",
  "mdh-deggi-mirch": "/images/products/mdh-deggi-mirch.svg",
  "everest-garam-masala": "/images/products/everest-garam-masala.svg",
  "catch-jeera-whole": "/images/products/catch-jeera.svg",
  "everest-dhaniya-powder": "/images/products/everest-dhaniya.svg",

  // Salt, Sugar & Sweeteners
  "tata-salt-iodised": "/images/products/tata-salt.jpg",
  "madhur-pure-sugar": "/images/products/madhur-sugar.svg",
  "organic-gud-jaggery-block": "/images/products/organic-gud.svg",
  "dabur-honey": "/images/products/dabur-honey.jpg",

  // Dry Fruits & Nuts
  "california-almonds-badam": "/images/products/california-almonds.svg",
  "whole-cashew-w320-kaju": "/images/products/whole-cashew.svg",
  "kishmish-raisins": "/images/products/kishmish.svg",

  // Tea & Coffee
  "tata-tea-premium": "/images/products/tata-tea-premium.svg",
  "red-label-natural-care-tea": "/images/products/red-label-tea.svg",
  "nescafe-classic-instant-coffee": "/images/products/nescafe-coffee.svg",

  // Biscuits & Cookies
  "parle-g-original-glucose-biscuits": "/images/products/parle-g.jpg",
  "britannia-good-day-cashew-cookies": "/images/products/britannia-good-day.svg",
  "sunfeast-marie-light": "/images/products/sunfeast-marie-light.svg",

  // Snacks & Namkeen
  "haldiram-s-aloo-bhujia": "/images/products/haldirams-aloo-bhujia.jpg",
  "bikaji-bikaneri-bhujia": "/images/products/bikaji-bhujia.svg",
  "lay-s-india-s-magic-masala": "/images/products/lays-magic-masala.svg",
  "cadbury-dairy-milk": "/images/products/cadbury-dairy-milk.jpg",

  // Instant Foods & Sauces
  "maggi-2-minute-masala-noodles": "/images/products/maggi-noodles.jpg",
  "sunfeast-yippee-pasta-masala": "/images/products/sunfeast-yippee.svg",
  "kissan-fresh-tomato-ketchup": "/images/products/kissan-ketchup.svg",
  "mother-s-recipe-mango-pickle": "/images/products/mothers-pickle.svg",

  // Dairy & Cold Beverages
  "amul-taaza-toned-milk": "/images/products/amul-milk.svg",
  "amul-butter": "/images/products/amul-butter.svg",
  "bisleri-mineral-water": "/images/products/bisleri-water.svg",
  "coca-cola-soft-drink": "/images/products/coca-cola.svg",
  "real-mixed-fruit-juice": "/images/products/real-fruit-juice.svg",

  // Breakfast Items
  "kellogg-s-corn-flakes": "/images/products/kelloggs-cornflakes.svg",
  "aashirvaad-poha": "/images/products/aashirvaad-poha.svg",
  "saffola-oats": "/images/products/saffola-oats.svg",

  // Baby Care
  "johnson-s-baby-powder": "/images/products/johnsons-powder.svg",
  "pampers-baby-dry-pants": "/images/products/pampers-diapers.svg",

  // Personal Care & Soaps
  "lifebuoy-total-10-soap": "/images/products/lifebuoy-soap.svg",
  "dettol-handwash-refill": "/images/products/dettol-handwash.svg",
  "parachute-coconut-hair-oil": "/images/products/parachute-oil.svg",
  "clinic-plus-strong-long-shampoo": "/images/products/clinic-plus-shampoo.svg",
  "nivea-soft-light-moisturiser": "/images/products/nivea-soft.svg",
  "colgate-strong-teeth-toothpaste": "/images/products/colgate-toothpaste.svg",

  // Household & Cleaning
  "lizol-disinfectant-floor-cleaner": "/images/products/lizol-cleaner.svg",
  "harpic-power-plus-toilet-cleaner": "/images/products/harpic-cleaner.svg",
  "vim-dishwash-bar": "/images/products/vim-bar.svg",
  "surf-excel-easy-wash-detergent-powder": "/images/products/surf-excel.jpg",
  "rin-detergent-bar": "/images/products/rin-bar.svg",
  "comfort-fabric-conditioner": "/images/products/comfort-fabric.svg",
  "scotch-brite-scrub-pad": "/images/products/scotch-brite.svg",
  "homefoil-aluminium-foil": "/images/products/homefoil-foil.svg",

  // Pooja & Devotion
  "cycle-pure-agarbatti-three-in-one": "/images/products/cycle-agarbatti.svg",
  "mangaldeep-camphor-kapoor": "/images/products/mangaldeep-kapoor.svg",

  "classmate-notebook-172-pages": "/images/products/classmate-notebook.svg",
  "cello-butterflow-ball-pen": "/images/products/cello-pen.svg",
  "pedigree-adult-dog-food-chicken": "/images/products/pedigree-food.svg",

  // New Pulses & Grains
  "chana-dal": "/images/products/chana-dal.svg",
  "urad-dal-dhuli": "/images/products/urad-dal.svg",
  "pearl-millet-bajra": "/images/products/pearl-millet-bajra.svg",
  "sorghum-jowar": "/images/products/sorghum-jowar.svg",
  "black-chickpeas-kala-chana": "/images/products/kala-chana.svg",
  "whole-red-lentils-sabut-masoor": "/images/products/sabut-masoor.svg",
  "green-gram-sabut-moong": "/images/products/sabut-moong.svg",
  "black-lentils-urad-sabut": "/images/products/urad-sabut.svg",

  // New Spices
  "catch-hing-asafoetida": "/images/products/catch-hing.svg",
  "green-cardamom-choti-elaichi": "/images/products/cardamom.svg",
  "cinnamon-sticks-dalchini": "/images/products/cinnamon.svg",
  "whole-cloves-laung": "/images/products/cloves.svg",
  "black-pepper-kali-mirch": "/images/products/black-pepper.svg",
  "fennel-seeds-saunf": "/images/products/fennel-seeds.svg",
  "fenugreek-seeds-methi": "/images/products/methi-seeds.svg",
  "dry-mango-powder-amchur": "/images/products/amchur.svg",
  "bay-leaves-tej-patta": "/images/products/tej-patta.svg",
  "pure-kashmiri-saffron-kesar": "/images/products/saffron-kesar.svg",
  "carom-seeds-ajwain": "/images/products/ajwain.svg",
  "whole-nutmeg-jaiphal": "/images/products/nutmeg.svg",
  "star-anise-chakra-phool": "/images/products/star-anise.svg",

  // New Oils
  "fortune-soyabean-oil": "/images/products/soyabean-oil.svg",
  "dhara-peanut-oil": "/images/products/peanut-oil.svg",
  "figaro-pure-olive-oil": "/images/products/olive-oil.svg",
  "tilsona-sesame-oil": "/images/products/sesame-oil.svg",
  "fortune-rice-bran-oil": "/images/products/rice-bran-oil.svg",
  "dalda-vanaspati-ghee": "/images/products/dalda-ghee.svg",

  // New Dairy
  "amul-masti-dahi": "/images/products/amul-dahi.svg",
  "amul-fresh-malai-paneer": "/images/products/amul-paneer.svg",
  "amul-fresh-cream": "/images/products/amul-cream.svg",
  "amul-spiced-buttermilk": "/images/products/amul-chhaachh.svg",
  "nestle-everyday-milk-powder": "/images/products/milk-powder.svg",
  "nestle-milkmaid-condensed-milk": "/images/products/condensed-milk.svg",
  "amul-cheese-slices": "/images/products/cheese-slices.svg",

  // New Sweets & Snacks
  "haldiram-rasgulla-tin": "/images/products/rasgulla.svg",
  "haldiram-gulab-jamun-tin": "/images/products/gulab-jamun.svg",
  "mtr-breakfast-poha": "/images/products/mtr-poha.svg",
  "mtr-instant-rava-upma": "/images/products/mtr-upma.svg",

  // New Beverages
  "lipton-green-tea-honey-lemon": "/images/products/green-tea.svg",
  "red-bull-energy-drink": "/images/products/red-bull.svg",
  "amul-kool-cafe": "/images/products/amul-kool.svg",
  "real-tender-coconut-water": "/images/products/coconut-water.svg",

  // New Breakfast
  "britannia-whole-wheat-bread": "/images/products/wheat-bread.svg",
  "fresh-farm-white-eggs-6pcs": "/images/products/farm-eggs.svg",
  "kissan-mixed-fruit-jam": "/images/products/kissan-jam.svg",
  "pintola-peanut-butter-crunchy": "/images/products/peanut-butter.svg",
  "kellogg-muesli-fruit-nut": "/images/products/muesli.svg",
  "nutella-hazelnut-spread": "/images/products/nutella.svg",

  // New Personal Care
  "dettol-original-soap": "/images/products/dettol-soap.svg",
  "head-shoulders-cool-menthol": "/images/products/head-shoulders.svg",
  "oral-b-toothbrush-shiny-clean": "/images/products/oral-b-brush.svg",
  "gillette-foamy-shaving-foam": "/images/products/shaving-foam.svg",
  "nivea-body-lotion-deep-moisture": "/images/products/nivea-lotion.svg",
  "fogg-scent-deodorant": "/images/products/fogg-deo.svg",
  "garnier-men-acno-fight-facewash": "/images/products/garnier-facewash.svg",

  // New Cleaning & Household
  "colin-glass-cleaner-spray": "/images/products/colin-spray.svg",
  "pril-dishwash-gel-liquid": "/images/products/pril-liquid.svg",
  "trishul-white-phenyl": "/images/products/phenyl-bottle.svg",
  "odonil-air-freshener-lavender": "/images/products/odonil-block.svg",
  "shalimar-garbage-bags-medium": "/images/products/garbage-bags.svg",
  "gala-king-kong-grass-broom": "/images/products/gala-broom.svg",
  "scotch-brite-cotton-floor-mop": "/images/products/floor-mop.svg",
  "plastic-water-bucket-18l": "/images/products/water-bucket.svg",

  // Cookware & Utensils
  "hawkins-pressure-cooker-3l": "/images/products/pressure-cooker.svg",
  "prestige-nonstick-dosa-tawa": "/images/products/dosa-tawa.svg",
  "prestige-anodised-kadhai": "/images/products/anodised-kadhai.svg",
  "bajaj-mixer-grinder-500w": "/images/products/mixer-grinder.svg",
  "wooden-chakla-belan-set": "/images/products/chakla-belan.svg",
  "steel-knife-peeler-set": "/images/products/knife-peeler.svg",
  "steel-storage-jars-4pcs": "/images/products/storage-jars.svg",
  "steel-colander-chhalni": "/images/products/colander-chhalni.svg",

  // Misc & Electrical
  "duracell-aa-batteries-4pcs": "/images/products/duracell-batteries.svg",
  "wipro-9w-led-bulb": "/images/products/led-bulb.svg",
  "household-white-candles-12pcs": "/images/products/white-candles.svg",
  "ship-safety-matchboxes-10pk": "/images/products/matchboxes.svg",
  "fevicol-mr-glue-100g": "/images/products/fevicol-glue.svg",
  "craft-kitchen-scissors": "/images/products/craft-scissors.svg",
  "emergency-sewing-needle-kit": "/images/products/sewing-kit.svg",
  "chef-gas-stove-lighter": "/images/products/gas-lighter.svg",
};

/**
 * Returns the exact verified local product packaging image.
 * Uses exact slug mapping, fuzzy name matching, and category fallback.
 */
export function getProductImage(product?: {
  slug?: string | null;
  name?: string | null;
  image_url?: string | null;
  category_id?: string | null;
}): string {
  if (!product) return "/images/packaged.jpg";

  // 1. Check exact slug match
  if (product.slug) {
    const direct = PRODUCT_SPECIFIC_IMAGES[product.slug];
    if (direct) return direct;
  }

  // 2. Check normalized slug
  if (product.slug) {
    const norm = product.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const normMatch = PRODUCT_SPECIFIC_IMAGES[norm];
    if (normMatch) return normMatch;
  }

  // 3. Check name lookup
  if (product.name) {
    const normName = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const nameMatch = PRODUCT_SPECIFIC_IMAGES[normName];
    if (nameMatch) return nameMatch;

    // Fuzzy keywords for accurate matching
    const lower = product.name.toLowerCase();
    if (lower.includes("rajma")) return "/images/products/rajma-chitra.svg";
    if (lower.includes("moong") || lower.includes("mung")) return "/images/products/moong-dal.svg";
    if (lower.includes("masoor")) return "/images/products/masoor-dal.svg";
    if (lower.includes("toor") || lower.includes("arhar") || lower.includes("tur"))
      return "/images/products/tata-toor-dal.jpg";
    if (lower.includes("chana") || lower.includes("chole") || lower.includes("kabuli"))
      return "/images/products/kabuli-chana.svg";
    if (lower.includes("dal") || lower.includes("pulse") || lower.includes("lentil"))
      return "/images/products/tata-toor-dal.jpg";

    if (lower.includes("besan")) return "/images/products/rajdhani-besan.svg";
    if (lower.includes("suji") || lower.includes("rava") || lower.includes("sooji"))
      return "/images/products/bansi-suji.svg";
    if (lower.includes("maida")) return "/images/products/shakti-bhog-maida.svg";
    if (lower.includes("atta") || lower.includes("flour") || lower.includes("wheat"))
      return "/images/products/aashirvaad-atta.jpg";

    if (lower.includes("basmati") || lower.includes("rice") || lower.includes("chawal"))
      return "/images/products/india-gate-basmati-rice.jpg";

    if (lower.includes("mustard") || lower.includes("sarson"))
      return "/images/products/fortune-mustard-oil.jpg";
    if (lower.includes("sunflower")) return "/images/products/fortune-sunflower-oil.svg";
    if (lower.includes("ghee")) return "/images/products/amul-desi-ghee.jpg";
    if (lower.includes("oil") || lower.includes("tel"))
      return "/images/products/fortune-mustard-oil.jpg";

    if (lower.includes("turmeric") || lower.includes("haldi"))
      return "/images/products/everest-turmeric.jpg";
    if (lower.includes("mirch") || lower.includes("chilli"))
      return "/images/products/mdh-deggi-mirch.svg";
    if (lower.includes("garam masala")) return "/images/products/everest-garam-masala.svg";
    if (lower.includes("jeera") || lower.includes("cumin"))
      return "/images/products/catch-jeera.svg";
    if (lower.includes("dhaniya") || lower.includes("coriander"))
      return "/images/products/everest-dhaniya.svg";

    if (lower.includes("salt") || lower.includes("namak")) return "/images/products/tata-salt.jpg";
    if (lower.includes("sugar") || lower.includes("chini"))
      return "/images/products/madhur-sugar.svg";
    if (lower.includes("gud") || lower.includes("jaggery") || lower.includes("gur"))
      return "/images/products/organic-gud.svg";
    if (lower.includes("honey") || lower.includes("shahad"))
      return "/images/products/dabur-honey.jpg";

    if (lower.includes("almond") || lower.includes("badam"))
      return "/images/products/california-almonds.svg";
    if (lower.includes("cashew") || lower.includes("kaju"))
      return "/images/products/whole-cashew.svg";
    if (lower.includes("raisin") || lower.includes("kishmish"))
      return "/images/products/kishmish.svg";

    if (lower.includes("tea") || lower.includes("chai"))
      return "/images/products/tata-tea-premium.svg";
    if (lower.includes("coffee")) return "/images/products/nescafe-coffee.svg";

    if (lower.includes("parle") || lower.includes("glucose")) return "/images/products/parle-g.jpg";
    if (lower.includes("good day") || lower.includes("cookie"))
      return "/images/products/britannia-good-day.svg";
    if (lower.includes("marie")) return "/images/products/sunfeast-marie-light.svg";
    if (lower.includes("biscuit")) return "/images/products/parle-g.jpg";

    if (lower.includes("bhujia") || lower.includes("namkeen") || lower.includes("sev"))
      return "/images/products/haldirams-aloo-bhujia.jpg";
    if (lower.includes("chips") || lower.includes("lays"))
      return "/images/products/lays-magic-masala.svg";
    if (lower.includes("dairy milk") || lower.includes("cadbury") || lower.includes("chocolate"))
      return "/images/products/cadbury-dairy-milk.jpg";

    if (lower.includes("maggi") || lower.includes("noodle"))
      return "/images/products/maggi-noodles.jpg";
    if (lower.includes("pasta") || lower.includes("yippee"))
      return "/images/products/sunfeast-yippee.svg";
    if (lower.includes("ketchup") || lower.includes("sauce"))
      return "/images/products/kissan-ketchup.svg";
    if (lower.includes("pickle") || lower.includes("achar"))
      return "/images/products/mothers-pickle.svg";

    if (lower.includes("milk") || lower.includes("doodh")) return "/images/products/amul-milk.svg";
    if (lower.includes("butter") || lower.includes("makkhan"))
      return "/images/products/amul-butter.svg";
    if (lower.includes("water") || lower.includes("bisleri"))
      return "/images/products/bisleri-water.svg";
    if (
      lower.includes("coca") ||
      lower.includes("coke") ||
      lower.includes("pepsi") ||
      lower.includes("cold drink")
    )
      return "/images/products/coca-cola.svg";
    if (lower.includes("juice")) return "/images/products/real-fruit-juice.svg";

    if (lower.includes("corn flakes") || lower.includes("cornflakes") || lower.includes("cereal"))
      return "/images/products/kelloggs-cornflakes.svg";
    if (lower.includes("poha")) return "/images/products/aashirvaad-poha.svg";
    if (lower.includes("oat")) return "/images/products/saffola-oats.svg";

    if (lower.includes("dettol") || lower.includes("handwash"))
      return "/images/products/dettol-handwash.svg";
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
    return product.image_url;
  }

  return "/images/packaged.jpg";
}
