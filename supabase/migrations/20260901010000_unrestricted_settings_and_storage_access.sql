-- ====================================================================
-- MIGRATION: Ensure 100% Guaranteed Read/Write for store_settings & storage
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Ensure hero_image_url column exists
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero_image_url text DEFAULT NULL;

-- 2. Ensure row 1 exists in store_settings
INSERT INTO public.store_settings (id, store_name, tagline, phone, whatsapp, email)
VALUES (1, 'Arun Gopal Traders', 'Your Trusted Local Grocery Store', '+91 6388354988', '916388354988', 'gopalmaddheshiya138@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 3. Grant full permissions on store_settings to anon, authenticated, and service_role
GRANT ALL ON public.store_settings TO anon, authenticated, service_role;

-- 4. Set permissive RLS policies on store_settings
DROP POLICY IF EXISTS "settings public read" ON public.store_settings;
DROP POLICY IF EXISTS "settings admin write" ON public.store_settings;
DROP POLICY IF EXISTS "settings_public_access" ON public.store_settings;
DROP POLICY IF EXISTS "settings_anon_all" ON public.store_settings;
DROP POLICY IF EXISTS "settings_auth_all" ON public.store_settings;

CREATE POLICY "settings_public_all"
ON public.store_settings FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. Ensure product-images bucket exists with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  20971520,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520;

-- 6. Storage RLS: allow public insert/update/delete on product-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Upload Storage Images'
  ) THEN
    CREATE POLICY "Public Upload Storage Images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Update Storage Images'
  ) THEN
    CREATE POLICY "Public Update Storage Images"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'product-images');
  END IF;
END $$;
