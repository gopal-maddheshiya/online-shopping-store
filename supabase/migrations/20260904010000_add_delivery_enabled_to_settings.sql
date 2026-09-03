-- ====================================================================
-- MIGRATION: Add delivery_enabled toggle to store_settings
-- Store: Arun Gopal Traders
-- ====================================================================

-- Add delivery_enabled column (default true)
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS delivery_enabled boolean DEFAULT true;

-- Ensure existing row has delivery_enabled = true if null
UPDATE public.store_settings
SET delivery_enabled = true
WHERE delivery_enabled IS NULL;
