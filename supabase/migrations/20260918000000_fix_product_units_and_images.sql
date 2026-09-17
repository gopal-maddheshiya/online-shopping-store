-- ====================================================================
-- MIGRATION: Fix Product Units, Packaging Labels, and Clean Images
-- Store: Arun Gopal Traders
-- Description:
--   1. Corrects illogical pack quantities (e.g. Nescafe 1kg sachet -> 1 Sachet (2g))
--   2. Corrects Chandan ki Lakdi (1kg -> 1 Piece (~40g))
--   3. Corrects Yellow Mustard Seeds (100 ml -> 100 g)
--   4. Standardizes Hinglish units (1 dabba -> 1 Box (50g), 1 bundle -> 1 Bundle)
--   5. Fixes precision formatting (201.96 g -> 200 g)
--   6. Sets explicit Hindi labels (label_hi) for variants
--   7. Trims accidental trailing whitespace across variant labels
--   8. Replaces raw SVG inline data-URIs with clean catalog fallbacks
-- Note: Product prices, MRPs, and stock quantities are completely untouched!
-- ====================================================================

-- 1. Nescafe Instant Coffee Sachet: Fix 1 kg -> 1 Sachet (2 g)
UPDATE public.product_variants
SET label = '1 Sachet (2 g)',
    label_hi = '1 पाउच (2 ग्राम)',
    unit = 'पाउच'
WHERE id = '4fd2dda9-1f6e-48c1-9f95-fdcb6d8d7332';

-- 2. Sandalwood Stick (Chandan Ki Lakdi): Fix 1 kg -> 1 Piece (~40g) & clean placeholder
UPDATE public.product_variants
SET label = '1 Piece (~40g)',
    label_hi = '1 पीस (~40 ग्राम)',
    unit = 'पीस'
WHERE id = '7acde7ba-a5d2-494d-b085-632a62c382ee';

UPDATE public.products
SET image_url = '/images/packaged.jpg'
WHERE id = '601e4770-6779-4038-b393-3407f4b82191' AND image_url LIKE 'data:image%';

-- 3. 555 Brand Pure Wheat Bran Chokar: Set explicit Hindi label
UPDATE public.product_variants
SET label = '45 kg Bag',
    label_hi = '45 किलो बोरी',
    unit = 'बोरी'
WHERE id = 'e4aa2a41-c4fd-4ae7-965e-2b7e553f070d';

-- 4. Yellow Mustard Seeds: Fix liquid unit 100 ml -> weight unit 100 g
UPDATE public.product_variants
SET label = '100 g',
    label_hi = '100 ग्राम',
    unit = 'ग्राम'
WHERE id = '4c7d35cf-6902-4d80-ba05-ea88a37402ef';

-- 5. Cadbury Eclairs Candy: Fix awkward precision 201.96 g -> 200 g
UPDATE public.product_variants
SET label = '200 g',
    label_hi = '200 ग्राम',
    unit = 'ग्राम'
WHERE id = '9bc364da-28f0-44c8-815f-d9a709c4a5fb';

-- 6. Gul Tooth Powder: Fix '1 dabba' -> '1 Box (50 g)'
UPDATE public.product_variants
SET label = '1 Box (50 g)',
    label_hi = '1 डिब्बा (50 ग्राम)',
    unit = 'डिब्बा'
WHERE id = '8e5fa775-5c60-4203-8be2-c51d473e4bba';

-- 7. Jeera Crunch Biscuits: Set explicit Hindi label
UPDATE public.product_variants
SET label = 'Pack of 12',
    label_hi = '12 पीस का पैकेट',
    unit = 'पैकेट'
WHERE id = '7d26aa43-3cef-451e-8362-902e98acb488';

-- 8. Archita Agarbatti & Pooja Janeu: Standardize bundle
UPDATE public.product_variants
SET label = '1 Bundle',
    label_hi = '1 बंडल',
    unit = 'बंडल'
WHERE id = '9dd95c3d-ff03-49c5-93cd-69fd01e772a0';

UPDATE public.product_variants
SET label = '1 Bundle',
    label_hi = '1 बंडल',
    unit = 'बंडल'
WHERE id = '3bbc9349-c3a2-4e24-8488-5f3d23bc889d';

-- 9. Trim all trailing whitespaces across all variants
UPDATE public.product_variants
SET label = trim(label)
WHERE label <> trim(label);

-- 10. Automatically populate label_hi for variants where label_hi is null
-- Solid units
UPDATE public.product_variants
SET label_hi = regexp_replace(regexp_replace(label, '(\d+)\s*kg\b', '\1 किलो', 'i'), '(\d+)\s*g\b', '\1 ग्राम', 'i')
WHERE label_hi IS NULL AND (label ~* '\d+\s*(kg|g)\b');

-- Liquid units
UPDATE public.product_variants
SET label_hi = regexp_replace(regexp_replace(label, '(\d+)\s*ml\b', '\1 मिली', 'i'), '(\d+)\s*l\b', '\1 लीटर', 'i')
WHERE label_hi IS NULL AND (label ~* '\d+\s*(ml|l)\b');

-- Packs
UPDATE public.product_variants
SET label_hi = regexp_replace(label, 'pack of (\d+)', '\1 पीस का पैकेट', 'i')
WHERE label_hi IS NULL AND (label ~* 'pack of \d+');

UPDATE public.product_variants
SET label_hi = '1 पैकेट'
WHERE label_hi IS NULL AND (lower(label) = '1 pack' OR lower(label) = '1 packet');

-- 11. Replace temporary SVG data URIs with clean catalog fallbacks
-- Spice items -> /images/spices.jpg
UPDATE public.products
SET image_url = '/images/spices.jpg'
WHERE image_url LIKE 'data:image%'
  AND slug IN (
    'generic-coriander-powder',
    'generic-red-chilli-powder',
    'generic-whole-coriander',
    'generic-whole-red-chilli',
    'generic-turmeric-powder',
    'generic-cumin-seeds',
    'generic-black-pepper-whole',
    'generic-cumin-powder',
    'generic-black-pepper-powder'
  );

-- Other items -> /images/packaged.jpg
UPDATE public.products
SET image_url = '/images/packaged.jpg'
WHERE image_url LIKE 'data:image%';
