-- 1. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  name text NOT NULL,
  phone text NOT NULL,
  house text,
  area text,
  landmark text,
  city text NOT NULL DEFAULT 'Maharajganj',
  pincode text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own addresses" ON public.addresses;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());

-- 2. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own wishlist" ON public.wishlist;
CREATE POLICY "own wishlist" ON public.wishlist FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percent',
  value numeric(10,2) NOT NULL,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons public read" ON public.coupons;
DROP POLICY IF EXISTS "coupons admin" ON public.coupons;
CREATE POLICY "coupons public read" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "coupons admin" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. HELP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  order_no text,
  problem_type text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.help_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "help insert" ON public.help_requests;
DROP POLICY IF EXISTS "help admin read" ON public.help_requests;
DROP POLICY IF EXISTS "help admin update" ON public.help_requests;
CREATE POLICY "help insert" ON public.help_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "help admin read" ON public.help_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "help admin update" ON public.help_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 5. DEV PASSWORD RESET RPC FUNCTION
CREATE OR REPLACE FUNCTION public.dev_reset_password(
  p_phone text,
  p_code text,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id uuid;
  v_normalized_phone text;
  v_clean text;
BEGIN
  IF p_code IS NULL OR trim(p_code) NOT IN ('AGT7799', 'AGT-RECOVER-2026') THEN
    RETURN jsonb_build_object('success', false, 'error', 'अमान्य रिकवरी कोड। कृपया सही कोड (AGT7799) दर्ज करें।');
  END IF;

  IF length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
  END IF;

  v_clean := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean) = 10 THEN
    v_normalized_phone := '+91' || v_clean;
  ELSIF length(v_clean) = 12 AND v_clean LIKE '91%' THEN
    v_normalized_phone := '+' || v_clean;
  ELSE
    v_normalized_phone := '+' || v_clean;
  END IF;

  SELECT id INTO v_user_id FROM auth.users
  WHERE phone = v_normalized_phone OR phone = v_clean OR phone = ('91' || right(v_clean, 10))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'इस मोबाइल नंबर से कोई पंजीकृत खाता नहीं मिला। कृपया पहले नया खाता बनाएं।');
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'पासवर्ड सफलतापूर्वक बदल गया! कृपया नए पासवर्ड के साथ लॉगिन करें।'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.dev_reset_password(text, text, text) TO anon, authenticated;
