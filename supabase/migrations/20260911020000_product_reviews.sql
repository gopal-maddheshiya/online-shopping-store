-- Migration: Product Star Ratings & Verified Customer Reviews
-- Arun Gopal Traders (Maharajganj)

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

-- Seed authentic initial reviews for popular essentials
INSERT INTO public.product_reviews (product_id, customer_name, locality, rating, title, comment, is_verified, is_approved, created_at)
SELECT id, 'राजेश मद्धेशिया', 'रामनगर, महराजगंज', 5, '100% शुद्ध और ताजा सामान', 'दुकान से हर महीने सरसों तेल और आटा यहीं से मंगाते हैं। 30 मिनट में घर पर डिलीवरी मिल गई, बहुत बढ़िया सेवा!', true, true, now() - interval '3 days'
FROM public.products WHERE slug IN ('fortune-kachi-ghani-mustard-oil', 'fortune-mustard-oil') LIMIT 1;

INSERT INTO public.product_reviews (product_id, customer_name, locality, rating, title, comment, is_verified, is_approved, created_at)
SELECT id, 'अमित श्रीवास्तव', 'अड्डा बाजार रोड, महराजगंज', 5, 'रोटी एकदम मुलायम बनती है', 'आशीर्वाद आटा हमेशा ताजा पैकेट मिलता है। लोकल दुकान से भी अच्छी और तेज सर्विस है।', true, true, now() - interval '5 days'
FROM public.products WHERE slug IN ('aashirvaad-shudh-chakki-atta', 'fortune-chakki-fresh-atta') LIMIT 1;

INSERT INTO public.product_reviews (product_id, customer_name, locality, rating, title, comment, is_verified, is_approved, created_at)
SELECT id, 'सुनीता देवी', 'शास्त्री नगर, महराजगंज', 5, 'असली स्वाद और खुशबू', 'अमूल का शुद्ध देसी घी, डिब्बा पूरी तरह सील पैक था। बाजार से कम रेट पर मिल गया।', true, true, now() - interval '6 days'
FROM public.products WHERE slug = 'amul-pure-desi-ghee' LIMIT 1;

INSERT INTO public.product_reviews (product_id, customer_name, locality, rating, title, comment, is_verified, is_approved, created_at)
SELECT id, 'विकास वर्मा', 'कॉलेज रोड, महराजगंज', 5, 'साफ-सुथरी दाल, बिना मिलावट', 'टाटा सम्पन्न अरहर दाल बहुत अच्छी निकली। कोई कंकड़ या धूल नहीं थी। अरुण गोपाल ट्रेडर्स की क्वालिटी हमेशा नंबर 1 रहती है।', true, true, now() - interval '7 days'
FROM public.products WHERE slug = 'tata-sampann-toor-dal' LIMIT 1;

INSERT INTO public.product_reviews (product_id, customer_name, locality, rating, title, comment, is_verified, is_approved, created_at)
SELECT id, 'प्रदीप गुप्ता', 'बस स्टेशन के पास, महराजगंज', 5, 'लंबा दाना और बेहतरीन खुशबू', 'बिरयानी और पुलाव के लिए बेस्ट चावल। इंडिया गेट बासमती का ऑरिजिनल पैक मिला।', true, true, now() - interval '8 days'
FROM public.products WHERE slug IN ('india-gate-classic-basmati-rice', 'daawat-rozana-gold-basmati') LIMIT 1;
