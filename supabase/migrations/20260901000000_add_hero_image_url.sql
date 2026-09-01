-- Add hero_image_url column to store_settings
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS hero_image_url text DEFAULT NULL;
