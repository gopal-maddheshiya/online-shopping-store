-- =====================================================================
-- Part 2 Catalog Data & Legacy Asset Cleanup
-- 1. Clears dead local '/images/spices.jpg' & '/images/packaged.jpg' paths
-- 2. Fixes known spelling typos in categories & product Hindi names
-- =====================================================================

-- 1. Clear broken local placeholder image paths so UI uses reliable fallbacks
UPDATE public.categories
SET image_url = NULL
WHERE image_url LIKE '%/images/spices.jpg%'
   OR image_url LIKE '%/images/packaged.jpg%';

UPDATE public.products
SET image_url = NULL
WHERE image_url LIKE '%/images/spices.jpg%'
   OR image_url LIKE '%/images/packaged.jpg%';

-- 2. Fix known spelling typos in categories & product titles
UPDATE public.categories
SET name = REPLACE(name, 'Agarbattti', 'Agarbatti')
WHERE name LIKE '%Agarbattti%';

UPDATE public.categories
SET name = REPLACE(name, 'Cceaners', 'Cleaners')
WHERE name LIKE '%Cceaners%';

UPDATE public.products
SET name_hi = REPLACE(name_hi, 'कएसआर', 'केसर')
WHERE name_hi LIKE '%कएसआर%';

UPDATE public.products
SET name = REPLACE(name, 'कएसआर', 'केसर')
WHERE name LIKE '%कएसआर%';
