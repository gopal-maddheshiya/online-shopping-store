-- ====================================================================
-- MIGRATION: Fix Mismatched Category Slugs, Headings & Assign Orphans
-- Store: Arun Gopal Traders
-- Description:
--   1. Updates category slugs to match authentic product names:
--      - 'pet-supplies' -> 'dhoop-batti' (धूप बत्ती)
--      - 'kitchen-essentials' -> 'bathroom-cleaning' (बाथरूम सफ़ाई के सामान)
--      - 'stationery' -> 'agarbatti' (अगरबत्ती)
--   2. Updates 'store_settings.category_headings' configuration with clean slugs
--   3. Categorizes 11 previously unassigned products (null category_id)
-- ====================================================================

-- 1. Fix Mismatched Category Slugs in categories table
UPDATE public.categories
SET slug = 'dhoop-batti',
    name = 'Dhoop Batti',
    name_hi = 'धूप बत्ती',
    icon = '🪔'
WHERE slug = 'pet-supplies';

UPDATE public.categories
SET slug = 'bathroom-cleaning',
    name = 'Bathroom Cleaning',
    name_hi = 'बाथरूम सफ़ाई के सामान',
    icon = '🧹'
WHERE slug = 'kitchen-essentials';

UPDATE public.categories
SET slug = 'agarbatti',
    name = 'Agarbatti',
    name_hi = 'अगरबत्ती',
    icon = '🪔'
WHERE slug = 'stationery';

-- Fix minor descriptive labels
UPDATE public.categories
SET name = 'Atta, Maida & Besan',
    name_hi = 'आटा, मैदा और बेसन'
WHERE slug = 'atta-flour' AND name_hi = 'मैदा और बेसन';

UPDATE public.categories
SET name = 'Salt, Sugar & Jaggery',
    name_hi = 'नमक, चीनी और गुड़'
WHERE slug = 'salt-sugar' AND name_hi = 'चीनी और गुड';

-- 2. Assign categories to the 11 unassigned products
-- Safety Matchbox -> pooja-items
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'pooja-items' LIMIT 1)
WHERE slug = 'safety-matchbox-bundle' AND category_id IS NULL;

-- Tea powders -> breakfast
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'breakfast' LIMIT 1)
WHERE slug IN ('taaza-tea-powder', 'tulsi-tea-leaves') AND category_id IS NULL;

-- Soya chunks -> pulses-dal
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'pulses-dal' LIMIT 1)
WHERE slug IN ('generic-soya-badi', 'generic-soya-chhoti') AND category_id IS NULL;

-- Sauces & Vinegar -> spices-masala (Kitchen spices & condiments)
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'spices-masala' LIMIT 1)
WHERE slug IN ('tomato-ketchup-sauce', 'generic-dark-soya-sauce', 'generic-red-chilli-sauce', 'generic-synthetic-food-vinegar') AND category_id IS NULL;

-- Disposable Wooden Spoon -> household-cleaning
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'household-cleaning' LIMIT 1)
WHERE slug = 'disposable-wooden-spoon-set' AND category_id IS NULL;

-- Wrapping paper -> pooja-items / misc
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug = 'pooja-items' LIMIT 1)
WHERE slug = 'packing-wrapping-waste-paper' AND category_id IS NULL;

-- 3. Synchronize store_settings.category_headings with clean slugs
UPDATE public.store_settings
SET category_headings = '[
  {
    "id": "food",
    "icon": "🍲",
    "slugs": [
      "oil-ghee",
      "biscuits",
      "rice",
      "spices-masala",
      "namkeen-snacks",
      "noodles-pasta",
      "dairy",
      "breakfast",
      "salt-sugar",
      "pulses-dal",
      "dry-fruits",
      "atta-flour"
    ],
    "title_en": "Food & Kitchen Essentials",
    "title_hi": "खाने-पीने का सामान",
    "banner_sub": null,
    "sort_order": 1,
    "banner_image_url": null
  },
  {
    "id": "household",
    "icon": "🧹",
    "slugs": [
      "household-cleaning",
      "laundry",
      "bathroom-cleaning",
      "pots-cleaners"
    ],
    "title_en": "Household & Cleaning",
    "title_hi": "घर की सफ़ाई व बर्तन",
    "banner_sub": null,
    "sort_order": 2,
    "banner_image_url": null
  },
  {
    "id": "personal",
    "icon": "🧴",
    "slugs": [
      "personal-care",
      "hair-care",
      "oral-care",
      "baby-products",
      "skin-care"
    ],
    "title_en": "Personal Care & Beauty",
    "title_hi": "पर्सनल केयर व ब्यूटी",
    "banner_sub": null,
    "sort_order": 3,
    "banner_image_url": null
  },
  {
    "id": "pooja_misc",
    "icon": "🪔",
    "slugs": [
      "pooja-items",
      "agarbatti",
      "dhoop-batti",
      "kapoor"
    ],
    "title_en": "Pooja, Stationery & More",
    "title_hi": "पूजा, स्टेशनरी व अन्य",
    "banner_sub": null,
    "sort_order": 4,
    "banner_image_url": null
  },
  {
    "id": "sec_1788513799616",
    "icon": "🐄",
    "slugs": [
      "kapila-pasuahar",
      "555-brand-chokar",
      "kapila-hara-pasuahar"
    ],
    "title_en": "Pasuahar - Chokar",
    "title_hi": "पशुआहार - चोकर",
    "banner_sub": null,
    "sort_order": 5,
    "banner_image_url": null
  }
]'::jsonb
WHERE id = (SELECT id FROM public.store_settings LIMIT 1);
