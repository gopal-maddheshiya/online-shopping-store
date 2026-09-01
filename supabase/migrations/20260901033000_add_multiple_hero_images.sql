-- ====================================================================
-- MIGRATION: Add multiple hero image columns for category sections
-- Store: Arun Gopal Traders
-- ====================================================================

-- Add hero2, hero3, hero4 columns for hero banners between category sections
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero2_image_url text DEFAULT NULL;

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero3_image_url text DEFAULT NULL;

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero4_image_url text DEFAULT NULL;
