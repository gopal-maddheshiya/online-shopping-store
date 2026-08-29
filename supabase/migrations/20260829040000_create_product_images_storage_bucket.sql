-- ====================================================================
-- MIGRATION: Create product-images Storage Bucket & RLS Policies
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Create product-images storage bucket with 10MB limit and public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- 2. Allow Public Read Access to all product photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Product Images'
  ) THEN
    CREATE POLICY "Public Read Product Images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 3. Allow Authenticated users & Admins to upload product photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Upload Product Images'
  ) THEN
    CREATE POLICY "Authenticated Upload Product Images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

-- 4. Allow Authenticated users & Admins to update product photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Update Product Images'
  ) THEN
    CREATE POLICY "Authenticated Update Product Images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 5. Allow Authenticated users & Admins to delete product photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Delete Product Images'
  ) THEN
    CREATE POLICY "Authenticated Delete Product Images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');
  END IF;
END $$;
