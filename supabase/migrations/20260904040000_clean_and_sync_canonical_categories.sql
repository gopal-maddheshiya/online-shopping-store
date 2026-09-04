-- ====================================================================
-- MIGRATION: Clean Unused Subcategories, Seed Canonical Categories & Support Dynamic Headings
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Remove 39 empty/dummy subcategories (which have 0 products linked)
DELETE FROM public.categories
WHERE parent_id IS NOT NULL;

-- 2. Remove any miscellaneous testing categories with 0 products
DELETE FROM public.categories
WHERE slug IN ('gopal-ki-category', 'beverages-traditional', 'utensils-kitchen-tools', 'utensils-containers');

-- 3. Ensure authentic bilingual names and canonical slugs for all top-level categories
UPDATE public.categories SET
  name = 'Maida and Besan',
  name_en = 'Maida and Besan',
  name_hi = 'मैदा और बेसन',
  icon = '🌾'
WHERE slug = 'atta-flour';

UPDATE public.categories SET
  name = 'Basmati Rice',
  name_en = 'Basmati Rice',
  name_hi = 'बासमती चावल',
  icon = '🍚'
WHERE slug = 'rice';

UPDATE public.categories SET
  name = 'Pulses & Dal',
  name_en = 'Pulses & Dal',
  name_hi = 'दालें और दलहन',
  icon = '🥣',
  image_url = 'https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/categories/cat_1788300441434.webp'
WHERE slug = 'pulses-dal';

UPDATE public.categories SET
  name = 'Mustard & Cooking Oil',
  name_en = 'Mustard & Cooking Oil',
  name_hi = 'सरसों का तेल',
  icon = '🛢️'
WHERE slug = 'oil-ghee';

UPDATE public.categories SET
  name = 'Spices & Masala',
  name_en = 'Spices & Masala',
  name_hi = 'खड़े और पिसे मसाले',
  icon = '🌶️'
WHERE slug = 'spices-masala';

UPDATE public.categories SET
  name = 'Sugar, Jaggery & Salt',
  name_en = 'Sugar, Jaggery & Salt',
  name_hi = 'चीनी, गुड़ और नमक',
  icon = '🧂'
WHERE slug = 'salt-sugar';

UPDATE public.categories SET
  name = 'Dry Fruits',
  name_en = 'Dry Fruits',
  name_hi = 'सूखे मेवे (काजू, बादाम)',
  icon = '🥜'
WHERE slug = 'dry-fruits';

UPDATE public.categories SET
  name = 'Biscuits & Cookies',
  name_en = 'Biscuits & Cookies',
  name_hi = 'बिस्कुट और कुकीज',
  icon = '🍪'
WHERE slug = 'biscuits';

UPDATE public.categories SET
  name = 'Namkeen & Snacks',
  name_en = 'Namkeen & Snacks',
  name_hi = 'नमकीन और स्नैक्स',
  icon = '🥨'
WHERE slug = 'namkeen-snacks';

UPDATE public.categories SET
  name = 'Noodles & Pasta',
  name_en = 'Noodles & Pasta',
  name_hi = 'नूडल्स और पास्ता',
  icon = '🍜'
WHERE slug = 'noodles-pasta';

UPDATE public.categories SET
  name = 'Dairy Products',
  name_en = 'Dairy Products',
  name_hi = 'दूध और डेयरी उत्पाद',
  icon = '🥛'
WHERE slug = 'dairy';

UPDATE public.categories SET
  name = 'Breakfast Items',
  name_en = 'Breakfast Items',
  name_hi = 'नाश्ता और कॉर्नफ्लेक्स',
  icon = '🥣'
WHERE slug = 'breakfast';

UPDATE public.categories SET
  name = 'Household Cleaning',
  name_en = 'Household Cleaning',
  name_hi = 'घरेलू सफाई का सामान',
  icon = '🧹'
WHERE slug = 'household-cleaning';

UPDATE public.categories SET
  name = 'Laundry & Detergents',
  name_en = 'Laundry & Detergents',
  name_hi = 'डिटर्जेंट और कपड़े धोने का साबुन',
  icon = '🧼'
WHERE slug = 'laundry';

UPDATE public.categories SET
  name = 'Kitchen Essentials',
  name_en = 'Kitchen Essentials',
  name_hi = 'रसोई की आवश्यक वस्तुएं',
  icon = '🍳'
WHERE slug = 'kitchen-essentials';

UPDATE public.categories SET
  name = 'Personal Care',
  name_en = 'Personal Care',
  name_hi = 'पर्सनल केयर',
  icon = '🧴'
WHERE slug = 'personal-care';

UPDATE public.categories SET
  name = 'Hair Care',
  name_en = 'Hair Care',
  name_hi = 'हेयर केयर',
  icon = '💆'
WHERE slug = 'hair-care';

UPDATE public.categories SET
  name = 'Skin Care',
  name_en = 'Skin Care',
  name_hi = 'स्किन केयर',
  icon = '✨'
WHERE slug = 'skin-care';

UPDATE public.categories SET
  name = 'Oral Care',
  name_en = 'Oral Care',
  name_hi = 'ओरल केयर',
  icon = '🪥'
WHERE slug = 'oral-care';

UPDATE public.categories SET
  name = 'Baby Care',
  name_en = 'Baby Care',
  name_hi = 'बेबी केयर',
  icon = '👶'
WHERE slug = 'baby-products';

UPDATE public.categories SET
  name = 'Pooja Items',
  name_en = 'Pooja Items',
  name_hi = 'पूजा सामग्री',
  icon = '🪔'
WHERE slug = 'pooja-items';

UPDATE public.categories SET
  name = 'Stationery',
  name_en = 'Stationery',
  name_hi = 'स्टेशनरी',
  icon = '📚'
WHERE slug = 'stationery';

UPDATE public.categories SET
  name = 'Pet Supplies',
  name_en = 'Pet Supplies',
  name_hi = 'पेट सप्लाइज',
  icon = '🐾'
WHERE slug = 'pet-supplies';

UPDATE public.categories SET
  name = 'Miscellaneous & Home Needs',
  name_en = 'Miscellaneous & Home Needs',
  name_hi = 'अन्य घरेलू सामान',
  icon = '📦'
WHERE slug = 'misc-items';

-- 4. Ensure store_settings has the category_headings column
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS category_headings jsonb;

-- Initialize category_headings with the 4 canonical store headings matching the homepage layout
UPDATE public.store_settings
SET category_headings = '[
  {
    "id": "food",
    "title_hi": "खाने-पीने का सामान",
    "title_en": "Food & Kitchen Essentials",
    "icon": "UtensilsCrossed",
    "sort_order": 1,
    "banner_sub": "hero2",
    "slugs": ["atta-flour", "rice", "pulses-dal", "oil-ghee", "spices-masala", "salt-sugar", "dry-fruits", "biscuits", "namkeen-snacks", "noodles-pasta", "dairy", "breakfast"]
  },
  {
    "id": "household",
    "title_hi": "घर की सफ़ाई व बर्तन",
    "title_en": "Household & Cleaning",
    "icon": "Home",
    "sort_order": 2,
    "banner_sub": "hero3",
    "slugs": ["household-cleaning", "laundry", "kitchen-essentials"]
  },
  {
    "id": "personal",
    "title_hi": "पर्सनल केयर व ब्यूटी",
    "title_en": "Personal Care & Beauty",
    "icon": "Heart",
    "sort_order": 3,
    "banner_sub": "hero4",
    "slugs": ["personal-care", "hair-care", "skin-care", "oral-care", "baby-products"]
  },
  {
    "id": "pooja_misc",
    "title_hi": "पूजा, स्टेशनरी व अन्य",
    "title_en": "Pooja, Stationery & More",
    "icon": "Package",
    "sort_order": 4,
    "banner_sub": null,
    "slugs": ["pooja-items", "stationery", "pet-supplies", "misc-items"]
  }
]'::jsonb
WHERE id = 1 AND (category_headings IS NULL OR category_headings = '[]'::jsonb);
