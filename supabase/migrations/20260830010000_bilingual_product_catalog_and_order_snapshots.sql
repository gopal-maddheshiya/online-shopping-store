-- ====================================================================
-- MIGRATION: Database-Backed Bilingual Product Localization & Order Snapshots
-- Store: Arun Gopal Traders
-- Description: Adds non-destructive bilingual columns (name_en, name_hi,
--              description_en, description_hi, label_en, label_hi)
--              to products, categories, product_variants, and order_items.
-- ====================================================================

-- 1. PRODUCTS TABLE
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_hi text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_hi text;

-- Backfill English from existing product name & description (Preserves ALL existing data)
UPDATE public.products
SET name_en = COALESCE(name_en, name),
    description_en = COALESCE(description_en, description)
WHERE name_en IS NULL OR description_en IS NULL;

-- 2. CATEGORIES TABLE
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_hi text;

UPDATE public.categories
SET name_en = COALESCE(name_en, name)
WHERE name_en IS NULL;

-- 3. PRODUCT VARIANTS TABLE
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS label_en text,
  ADD COLUMN IF NOT EXISTS label_hi text;

UPDATE public.product_variants
SET label_en = COALESCE(label_en, label)
WHERE label_en IS NULL;

-- 4. ORDER ITEMS TABLE (Preserves historical snapshots in both languages)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_hi text,
  ADD COLUMN IF NOT EXISTS variant_label_en text,
  ADD COLUMN IF NOT EXISTS variant_label_hi text;

UPDATE public.order_items
SET name_en = COALESCE(name_en, name),
    variant_label_en = COALESCE(variant_label_en, variant_label)
WHERE name_en IS NULL;

-- 5. RLS & PERMISSIONS VERIFICATION
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
