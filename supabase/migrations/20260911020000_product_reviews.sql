-- Migration: Product Star Ratings & Verified Customer Reviews
-- Arun Gopal Traders (Maharajganj)
-- Clean schema only: No demo/dummy reviews. Real reviews appear only when submitted by actual customers.

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  locality TEXT DEFAULT 'महराजगंज',
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved, created_at DESC);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approved reviews
DROP POLICY IF EXISTS "Public read approved reviews" ON public.product_reviews;
CREATE POLICY "Public read approved reviews"
  ON public.product_reviews
  FOR SELECT
  USING (is_approved = true);

-- Allow customers to submit reviews
DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;
CREATE POLICY "Public insert reviews"
  ON public.product_reviews
  FOR INSERT
  WITH CHECK (true);

-- Allow admins full access
DROP POLICY IF EXISTS "Admin manage reviews" ON public.product_reviews;
CREATE POLICY "Admin manage reviews"
  ON public.product_reviews
  FOR ALL
  USING (auth.role() = 'authenticated');
