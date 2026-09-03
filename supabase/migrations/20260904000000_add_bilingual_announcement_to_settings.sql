-- ====================================================================
-- MIGRATION: Add announcement_hi column without hardcoded defaults
-- Store: Arun Gopal Traders
-- ====================================================================

-- Add announcement_hi column with NULL as default (purely user-controlled)
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS announcement_hi text DEFAULT NULL;
