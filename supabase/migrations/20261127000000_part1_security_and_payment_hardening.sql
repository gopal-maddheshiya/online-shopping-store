-- ====================================================================
-- MIGRATION: Part 1 Security, Payment Verification & Data Integrity Hardening
-- Store: Arun Gopal Traders (Maharajganj, UP)
-- Scope:
--   1. Drop dev_reset_password backdoor RPC completely
--   2. Unified public.is_store_admin() RBAC helper + lock promote_owner_account & user_roles
--   3. Isolate secrets (telegram token/chat_id & bank details) in admin-only store_secrets table
--      and expose safe public.get_public_store_settings()
--   4. Lock catalog (categories, products, product_variants, coupons) & Storage (remove SVG, admin-only writes)
--   5. Harden orders, order_items, order_events, order_payments RLS & place_order() pricing/coupon/stock validation
--   6. Guard admin_update_order_status (with enum cast & stock restore) & admin_update_payment_status
--   7. Restrict verify_and_confirm_payment to service_role, add customer claim_upi_payment_submitted(),
--      lock customer_cancel_order row with FOR UPDATE
--   8. Fix exact 10-digit phone matching in lookup_order & lookup_order_invoice, restore & guard get_customer_orders,
--      guard generate_invoice_for_order, harden product_reviews + hide customer_phone via public_product_reviews view
-- ====================================================================

-- 1. REMOVE PASSWORD RESET BACKDOOR
REVOKE ALL ON FUNCTION public.dev_reset_password(text, text, text) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.dev_reset_password(text, text, text);

-- 2. UNIFIED STORE ADMIN CHECK & ROLE LOCKDOWN
CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid() = '3246a6a6-bceb-4112-8841-803bd01608f5'::uuid
      OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'gopalmaddheshiya138@gmail.com'
    );
$$;

REVOKE ALL ON FUNCTION public.is_store_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_admin() TO anon, authenticated, service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "own roles readable" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_admin());
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

DROP FUNCTION IF EXISTS public.promote_owner_account();
CREATE OR REPLACE FUNCTION public.promote_owner_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    auth.uid() = '3246a6a6-bceb-4112-8841-803bd01608f5'::uuid
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'gopalmaddheshiya138@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'role', 'admin');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Owner account not found.');
END;
$$;

REVOKE ALL ON FUNCTION public.promote_owner_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_owner_account() TO authenticated;

-- 3. SEPARATE ADMIN SECRETS FROM PUBLIC store_settings
CREATE TABLE IF NOT EXISTS public.store_secrets (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  telegram_bot_token text,
  telegram_chat_id text,
  bank_account_holder text,
  bank_name text,
  bank_account_number text,
  bank_ifsc text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Preserve existing values into store_secrets if columns exist on store_settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'store_settings' AND column_name = 'telegram_bot_token'
  ) THEN
    INSERT INTO public.store_secrets (
      id,
      telegram_bot_token,
      telegram_chat_id,
      bank_account_holder,
      bank_name,
      bank_account_number,
      bank_ifsc
    )
    SELECT
      1,
      s.telegram_bot_token,
      s.telegram_chat_id,
      s.bank_account_holder,
      s.bank_name,
      s.bank_account_number,
      s.bank_ifsc
    FROM public.store_settings s
    WHERE s.id = 1
    ON CONFLICT (id) DO UPDATE SET
      telegram_bot_token = COALESCE(NULLIF(EXCLUDED.telegram_bot_token, ''), public.store_secrets.telegram_bot_token),
      telegram_chat_id = COALESCE(NULLIF(EXCLUDED.telegram_chat_id, ''), public.store_secrets.telegram_chat_id),
      bank_account_holder = COALESCE(EXCLUDED.bank_account_holder, public.store_secrets.bank_account_holder),
      bank_name = COALESCE(EXCLUDED.bank_name, public.store_secrets.bank_name),
      bank_account_number = COALESCE(EXCLUDED.bank_account_number, public.store_secrets.bank_account_number),
      bank_ifsc = COALESCE(EXCLUDED.bank_ifsc, public.store_secrets.bank_ifsc),
      updated_at = now();

    -- Scrub secret fields from publicly readable store_settings row
    UPDATE public.store_settings
    SET
      telegram_bot_token = NULL,
      telegram_chat_id = NULL,
      bank_account_holder = NULL,
      bank_name = NULL,
      bank_account_number = NULL,
      bank_ifsc = NULL
    WHERE id = 1;
  ELSE
    INSERT INTO public.store_secrets (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE public.store_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_secrets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.store_secrets TO authenticated;
GRANT ALL ON public.store_secrets TO service_role;

DROP POLICY IF EXISTS "store_secrets_admin_only" ON public.store_secrets;
CREATE POLICY "store_secrets_admin_only" ON public.store_secrets
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- Lock public.store_settings writes strictly to store admins
DROP POLICY IF EXISTS "settings_public_all" ON public.store_settings;
DROP POLICY IF EXISTS "settings public read" ON public.store_settings;
DROP POLICY IF EXISTS "settings admin write" ON public.store_settings;
DROP POLICY IF EXISTS "settings_public_access" ON public.store_settings;
DROP POLICY IF EXISTS "settings_anon_all" ON public.store_settings;
DROP POLICY IF EXISTS "settings_auth_all" ON public.store_settings;

REVOKE ALL ON public.store_settings FROM anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

CREATE POLICY "settings_public_read" ON public.store_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "settings_admin_write" ON public.store_settings
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- Safe public settings RPC (returns ONLY non-secret storefront fields)
DROP FUNCTION IF EXISTS public.get_public_store_settings();
CREATE OR REPLACE FUNCTION public.get_public_store_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', s.id,
    'store_name', s.store_name,
    'tagline', s.tagline,
    'phone', s.phone,
    'whatsapp', s.whatsapp,
    'email', s.email,
    'address', s.address,
    'maps_link', s.maps_link,
    'announcement', s.announcement,
    'announcement_hi', s.announcement_hi,
    'hero_title', s.hero_title,
    'hero_subtitle', s.hero_subtitle,
    'delivery_fee', s.delivery_fee,
    'delivery_enabled', s.delivery_enabled,
    'free_delivery_threshold', s.free_delivery_threshold,
    'min_order_value', s.min_order_value,
    'payment_methods', s.payment_methods,
    'business_hours', s.business_hours,
    'gstin', s.gstin,
    'legal_name', s.legal_name,
    'state', s.state,
    'state_code', s.state_code,
    'tax_enabled', s.tax_enabled,
    'default_tax_rate', s.default_tax_rate,
    'invoice_prefix', s.invoice_prefix,
    'invoice_footer_note', s.invoice_footer_note,
    'terms_and_conditions', s.terms_and_conditions,
    'upi_vpa', s.upi_vpa,
    'upi_merchant_name', s.upi_merchant_name,
    'upi_registered_phone', s.upi_registered_phone,
    'qr_code_mode', s.qr_code_mode,
    'qr_custom_note', s.qr_custom_note,
    'enabled_payment_methods', s.enabled_payment_methods,
    'razorpay_key_id', s.razorpay_key_id,
    'online_payment_enabled', s.online_payment_enabled,
    'hero_image_url', s.hero_image_url,
    'hero2_image_url', s.hero2_image_url,
    'hero3_image_url', s.hero3_image_url,
    'hero4_image_url', s.hero4_image_url,
    'category_headings', s.category_headings
  )
  FROM public.store_settings s
  WHERE s.id = 1
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_store_settings() TO anon, authenticated;

-- 4. LOCK DOWN CATALOG, COUPONS & STORAGE RLS
DROP POLICY IF EXISTS "categories_insert_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_update_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "categories admin write" ON public.categories;
DROP POLICY IF EXISTS "categories public read" ON public.categories;

CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());
CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());
CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE TO authenticated
  USING (public.is_store_admin());

DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_update_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_delete_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "products admin write" ON public.products;
DROP POLICY IF EXISTS "products public read" ON public.products;

CREATE POLICY "products_select_all" ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE TO authenticated
  USING (public.is_store_admin());

DROP POLICY IF EXISTS "product_variants_insert_authenticated" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_update_authenticated" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_delete_authenticated" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_select_all" ON public.product_variants;
DROP POLICY IF EXISTS "variants admin write" ON public.product_variants;
DROP POLICY IF EXISTS "variants public read" ON public.product_variants;

CREATE POLICY "product_variants_select_all" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "product_variants_admin_insert" ON public.product_variants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());
CREATE POLICY "product_variants_admin_update" ON public.product_variants
  FOR UPDATE TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());
CREATE POLICY "product_variants_admin_delete" ON public.product_variants
  FOR DELETE TO authenticated
  USING (public.is_store_admin());

DROP POLICY IF EXISTS "coupons public read" ON public.coupons;
DROP POLICY IF EXISTS "coupons admin" ON public.coupons;
CREATE POLICY "coupons_public_read_active" ON public.coupons
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_store_admin());
CREATE POLICY "coupons_admin_write" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- Storage: remove SVG XSS vector and restrict product-images mutations to Admin
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
WHERE id = 'product-images';

DROP POLICY IF EXISTS "Public Upload Storage Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Storage Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;

CREATE POLICY "Admin Upload Product Images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_store_admin());

CREATE POLICY "Admin Update Product Images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_store_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_store_admin());

CREATE POLICY "Admin Delete Product Images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_store_admin());

-- 5. LOCK DOWN orders / order_items / order_events / order_payments DIRECT INSERTS & CONSTRAINTS
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_subtotal_nonneg;
ALTER TABLE public.orders ADD CONSTRAINT orders_subtotal_nonneg CHECK (subtotal >= 0) NOT VALID;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_total_nonneg;
ALTER TABLE public.orders ADD CONSTRAINT orders_total_nonneg CHECK (total >= 0) NOT VALID;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_nonneg;
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_nonneg CHECK (delivery_fee >= 0) NOT VALID;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_discount_nonneg;
ALTER TABLE public.orders ADD CONSTRAINT orders_discount_nonneg CHECK (discount >= 0) NOT VALID;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_qty_pos;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_qty_pos CHECK (qty > 0) NOT VALID;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_price_nonneg;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_price_nonneg CHECK (price >= 0) NOT VALID;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_mrp_nonneg;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_mrp_nonneg CHECK (mrp >= 0) NOT VALID;

ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS variants_stock_nonneg;
ALTER TABLE public.product_variants ADD CONSTRAINT variants_stock_nonneg CHECK (stock >= 0) NOT VALID;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS variants_price_nonneg;
ALTER TABLE public.product_variants ADD CONSTRAINT variants_price_nonneg CHECK (price >= 0) NOT VALID;

-- Direct table inserts restricted to Store Admin; customers use hardened place_order() RPC
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "place order auth" ON public.orders;
DROP POLICY IF EXISTS "place order guest" ON public.orders;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon;
CREATE POLICY "orders_admin_insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());

DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "own orders read" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_store_admin());

DROP POLICY IF EXISTS "admin update orders" ON public.orders;
CREATE POLICY "admin update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order items insert auth" ON public.order_items;
DROP POLICY IF EXISTS "order items insert guest" ON public.order_items;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon;
CREATE POLICY "order_items_admin_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());

DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order items read" ON public.order_items;
CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_store_admin())
    )
  );

DROP POLICY IF EXISTS "order_events_insert_policy" ON public.order_events;
DROP POLICY IF EXISTS "order events insert" ON public.order_events;
REVOKE INSERT, UPDATE, DELETE ON public.order_events FROM anon;
CREATE POLICY "order_events_admin_insert" ON public.order_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());

DROP POLICY IF EXISTS "order events read" ON public.order_events;
CREATE POLICY "order events read" ON public.order_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_events.order_id
        AND (o.user_id = auth.uid() OR public.is_store_admin())
    )
  );

-- Harden order_payments RLS (no anon wildcard read/insert/update)
REVOKE INSERT, UPDATE, DELETE ON public.order_payments FROM anon, authenticated;
DROP POLICY IF EXISTS "order_payments read" ON public.order_payments;
DROP POLICY IF EXISTS "order_payments insert" ON public.order_payments;
DROP POLICY IF EXISTS "order_payments update" ON public.order_payments;

CREATE POLICY "order_payments_read_restricted" ON public.order_payments
  FOR SELECT TO authenticated
  USING (
    public.is_store_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_payments.order_id AND o.user_id = auth.uid()
    )
  );

-- 6. INTERNAL INVOICE GENERATOR + GUARDED PUBLIC WRAPPER
DROP FUNCTION IF EXISTS public._generate_invoice_for_order_internal(uuid);
CREATE OR REPLACE FUNCTION public._generate_invoice_for_order_internal(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _existing_inv record;
  _ord record;
  _settings record;
  _items_json jsonb := '[]'::jsonb;
  _item_rec record;
  _subtotal numeric(12,2) := 0;
  _item_discount numeric(12,2) := 0;
  _coupon_disc numeric(12,2) := 0;
  _delivery_fee numeric(12,2) := 0;
  _tax_enabled boolean := false;
  _tax_rate numeric(5,2) := 0;
  _taxable_amount numeric(12,2) := 0;
  _cgst numeric(12,2) := 0;
  _sgst numeric(12,2) := 0;
  _igst numeric(12,2) := 0;
  _total_tax numeric(12,2) := 0;
  _calc_grand_total numeric(12,2) := 0;
  _final_grand_total numeric(12,2) := 0;
  _round_off numeric(6,2) := 0;
  _amt_paid numeric(12,2) := 0;
  _amt_due numeric(12,2) := 0;
  _inv_prefix text := 'AGT-INV';
  _new_invoice_no text;
  _inv_id uuid;
  _inv_type text := 'retail_invoice';
  _cust_state text := 'Uttar Pradesh';
BEGIN
  SELECT * INTO _existing_inv
  FROM public.invoices
  WHERE order_id = p_order_id;

  IF _existing_inv.id IS NOT NULL THEN
    RETURN to_jsonb(_existing_inv);
  END IF;

  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id;
  IF _ord.id IS NULL THEN
    RAISE EXCEPTION 'Order with ID % not found', p_order_id;
  END IF;

  SELECT * INTO _settings FROM public.store_settings WHERE id = 1;

  _tax_enabled := COALESCE(_settings.tax_enabled, false);
  _tax_rate := COALESCE(_settings.default_tax_rate, 0);
  _inv_prefix := COALESCE(_settings.invoice_prefix, 'AGT-INV');

  IF _tax_enabled AND _settings.gstin IS NOT NULL AND trim(_settings.gstin) != '' THEN
    _inv_type := 'tax_invoice';
  ELSE
    _inv_type := 'retail_invoice';
  END IF;

  FOR _item_rec IN (
    SELECT
      oi.id,
      oi.product_id,
      oi.variant_id,
      oi.name,
      oi.name_en,
      oi.name_hi,
      COALESCE(oi.variant_label, 'Standard') AS variant_label,
      oi.variant_label_en,
      oi.variant_label_hi,
      COALESCE(oi.mrp, oi.price) AS mrp,
      oi.price,
      oi.qty,
      (oi.price * oi.qty) AS line_total,
      ((COALESCE(oi.mrp, oi.price) - oi.price) * oi.qty) AS line_discount,
      oi.image_url
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
  ) LOOP
    _subtotal := _subtotal + _item_rec.line_total;
    _item_discount := _item_discount + _item_rec.line_discount;
    _items_json := _items_json || jsonb_build_object(
      'product_id', _item_rec.product_id,
      'variant_id', _item_rec.variant_id,
      'name', _item_rec.name,
      'name_en', _item_rec.name_en,
      'name_hi', _item_rec.name_hi,
      'variant_label', _item_rec.variant_label,
      'variant_label_en', _item_rec.variant_label_en,
      'variant_label_hi', _item_rec.variant_label_hi,
      'mrp', _item_rec.mrp,
      'price', _item_rec.price,
      'qty', _item_rec.qty,
      'line_total', _item_rec.line_total,
      'line_discount', _item_rec.line_discount,
      'image_url', _item_rec.image_url
    );
  END LOOP;

  IF _subtotal = 0 THEN
    _subtotal := COALESCE(_ord.subtotal, _ord.total, 0);
  END IF;

  _delivery_fee := COALESCE(_ord.delivery_fee, 0);
  _coupon_disc := COALESCE(_ord.discount, 0);
  _taxable_amount := GREATEST(_subtotal - _coupon_disc, 0);

  IF _tax_enabled AND _tax_rate > 0 THEN
    _cust_state := COALESCE(_ord.address->>'state', 'Uttar Pradesh');
    IF lower(trim(_cust_state)) = lower(trim(COALESCE(_settings.state, 'Uttar Pradesh'))) THEN
      _cgst := ROUND((_taxable_amount * (_tax_rate / 2.0)) / 100.0, 2);
      _sgst := ROUND((_taxable_amount * (_tax_rate / 2.0)) / 100.0, 2);
      _igst := 0;
    ELSE
      _cgst := 0;
      _sgst := 0;
      _igst := ROUND((_taxable_amount * _tax_rate) / 100.0, 2);
    END IF;
    _total_tax := _cgst + _sgst + _igst;
  END IF;

  _calc_grand_total := _taxable_amount + _total_tax + _delivery_fee;
  _final_grand_total := COALESCE(_ord.total, ROUND(_calc_grand_total, 2));
  _round_off := _final_grand_total - (_taxable_amount + _total_tax + _delivery_fee);

  IF _ord.payment_status = 'paid' THEN
    _amt_paid := _final_grand_total;
    _amt_due := 0;
  ELSE
    _amt_paid := 0;
    _amt_due := _final_grand_total;
  END IF;

  _new_invoice_no := _inv_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  INSERT INTO public.invoices (
    invoice_no, order_id, order_no, user_id,
    customer_name, customer_phone, customer_email,
    billing_address, delivery_address,
    store_name, store_legal_name, store_phone, store_email, store_address, store_gstin, store_state, store_state_code,
    items_snapshot, subtotal, item_discount, coupon_code, coupon_discount, delivery_fee,
    tax_enabled, tax_rate, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_tax,
    round_off, grand_total, payment_method, payment_status, amount_paid, amount_due, paid_at,
    transaction_id, invoice_type, notes, footer_note, terms
  ) VALUES (
    _new_invoice_no, p_order_id, _ord.order_no, _ord.user_id,
    _ord.customer_name, _ord.customer_phone, _ord.customer_email,
    COALESCE(_ord.address, '{}'::jsonb), COALESCE(_ord.address, '{}'::jsonb),
    COALESCE(_settings.store_name, 'Arun Gopal Traders'),
    COALESCE(_settings.legal_name, 'Arun Gopal Traders'),
    COALESCE(_settings.phone, '+916388354988'),
    COALESCE(_settings.email, 'gopalmaddheshiya138@gmail.com'),
    COALESCE(_settings.address, 'Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh'),
    _settings.gstin,
    COALESCE(_settings.state, 'Uttar Pradesh'),
    COALESCE(_settings.state_code, '09'),
    _items_json, _subtotal, _item_discount, _ord.coupon_code, _coupon_disc, _delivery_fee,
    _tax_enabled, _tax_rate, _taxable_amount, _cgst, _sgst, _igst, _total_tax,
    _round_off, _final_grand_total,
    COALESCE(_ord.payment_method, 'cod'),
    COALESCE(_ord.payment_status, 'pending'),
    _amt_paid, _amt_due, _ord.paid_at,
    _ord.transaction_id, _inv_type, _ord.notes,
    COALESCE(_settings.invoice_footer_note, 'Thank you for shopping with Arun Gopal Traders!'),
    COALESCE(_settings.terms_and_conditions, 'Goods once sold can only be returned within 24 hours in original condition.')
  )
  RETURNING id INTO _inv_id;

  UPDATE public.orders SET invoice_no = _new_invoice_no WHERE id = p_order_id;

  INSERT INTO public.billing_audit_logs (
    invoice_id, order_id, event_type, new_state, changed_by, note
  ) VALUES (
    _inv_id, p_order_id, 'INVOICE_GENERATED',
    jsonb_build_object('invoice_no', _new_invoice_no, 'grand_total', _final_grand_total, 'type', _inv_type),
    'Billing Engine', 'Initial immutable billing snapshot created'
  );

  SELECT * INTO _existing_inv FROM public.invoices WHERE id = _inv_id;
  RETURN to_jsonb(_existing_inv);
END;
$$;

REVOKE ALL ON FUNCTION public._generate_invoice_for_order_internal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._generate_invoice_for_order_internal(uuid) TO service_role;

DROP FUNCTION IF EXISTS public.generate_invoice_for_order(uuid);
CREATE OR REPLACE FUNCTION public.generate_invoice_for_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _ord_owner uuid;
BEGIN
  SELECT user_id INTO _ord_owner FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF NOT (
    public.is_store_admin()
    OR (auth.uid() IS NOT NULL AND _ord_owner = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized to access invoice for order %', p_order_id USING ERRCODE = '42501';
  END IF;

  RETURN public._generate_invoice_for_order_internal(p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.generate_invoice_for_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_invoice_for_order(uuid) TO authenticated, service_role;

-- 7. HARDENED ATOMIC place_order() (SERVER-AUTHORITATIVE PRICING, STOCK LOCKING & COUPON VALIDATION)
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb);
CREATE OR REPLACE FUNCTION public.place_order(
  _order_payload jsonb,
  _items_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _new_order_id uuid;
  _new_order_no text;
  _item jsonb;
  _var_id uuid;
  _prod_id uuid;
  _var_stock int;
  _qty int;
  _var_price numeric(10,2);
  _var_mrp numeric(10,2);
  _var_label text;
  _var_label_en text;
  _var_label_hi text;
  _prod_name text;
  _prod_name_en text;
  _prod_name_hi text;
  _img_url text;
  _calc_subtotal numeric(10,2) := 0;
  _delivery_fee numeric(10,2) := 0;
  _delivery_enabled boolean := true;
  _discount numeric(10,2) := 0;
  _final_total numeric(10,2) := 0;
  _free_thresh numeric(10,2) := 499;
  _min_order numeric(10,2) := 99;
  _clean_phone text;
  _order_type text;
  _payment_method text;
  _coupon_code text;
  _coupon record;
  _validated_items jsonb := '[]'::jsonb;
  _invoice_json jsonb;
BEGIN
  IF _items_payload IS NULL OR jsonb_typeof(_items_payload) <> 'array' OR jsonb_array_length(_items_payload) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  SELECT
    free_delivery_threshold,
    min_order_value,
    delivery_fee,
    COALESCE(delivery_enabled, true)
  INTO _free_thresh, _min_order, _delivery_fee, _delivery_enabled
  FROM public.store_settings
  WHERE id = 1;

  _order_type := lower(trim(COALESCE(_order_payload->>'order_type', 'delivery')));
  IF _order_type NOT IN ('delivery', 'pickup') THEN
    _order_type := 'delivery';
  END IF;
  IF NOT _delivery_enabled THEN
    _order_type := 'pickup';
  END IF;

  _payment_method := lower(trim(COALESCE(_order_payload->>'payment_method', 'cod')));
  IF _payment_method NOT IN ('cod', 'pay_at_store', 'upi', 'qr', 'card') THEN
    RAISE EXCEPTION 'Unsupported payment method: %', _payment_method;
  END IF;
  IF _order_type = 'pickup' AND _payment_method = 'cod' THEN
    _payment_method := 'pay_at_store';
  END IF;

  _clean_phone := regexp_replace(COALESCE(_order_payload->>'customer_phone', ''), '\D', '', 'g');
  IF length(_clean_phone) > 10 THEN
    _clean_phone := right(_clean_phone, 10);
  END IF;
  IF length(_clean_phone) <> 10 THEN
    RAISE EXCEPTION 'Please provide a valid 10-digit mobile number';
  END IF;

  -- Lock & validate every variant strictly from DB catalog (no client-trusted prices)
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_payload)
  LOOP
    _var_id := NULLIF(trim(_item->>'variant_id'), '')::uuid;
    _qty := COALESCE((_item->>'qty')::int, 1);

    IF _var_id IS NULL THEN
      RAISE EXCEPTION 'Each order item must reference a valid variant_id';
    END IF;
    IF _qty <= 0 OR _qty > 200 THEN
      RAISE EXCEPTION 'Invalid item quantity: %', _qty;
    END IF;

    SELECT
      pv.product_id,
      pv.price,
      pv.mrp,
      pv.label,
      pv.label_en,
      pv.label_hi,
      pv.stock,
      p.name,
      p.name_en,
      p.name_hi,
      p.image_url
    INTO
      _prod_id,
      _var_price,
      _var_mrp,
      _var_label,
      _var_label_en,
      _var_label_hi,
      _var_stock,
      _prod_name,
      _prod_name_en,
      _prod_name_hi,
      _img_url
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = _var_id
      AND pv.is_active = true
      AND p.is_active = true
    FOR UPDATE OF pv;

    IF NOT FOUND OR _var_price IS NULL THEN
      RAISE EXCEPTION 'Product variant % is unavailable or inactive', _var_id;
    END IF;

    IF _var_stock < _qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (%) — only % left', _prod_name, _var_label, _var_stock;
    END IF;

    UPDATE public.product_variants
    SET stock = stock - _qty
    WHERE id = _var_id;

    _calc_subtotal := _calc_subtotal + (_var_price * _qty);

    _validated_items := _validated_items || jsonb_build_object(
      'product_id', _prod_id,
      'variant_id', _var_id,
      'name', _prod_name,
      'name_en', COALESCE(_prod_name_en, _prod_name),
      'name_hi', _prod_name_hi,
      'variant_label', COALESCE(_var_label, 'Standard'),
      'variant_label_en', COALESCE(_var_label_en, _var_label, 'Standard'),
      'variant_label_hi', _var_label_hi,
      'image_url', _img_url,
      'mrp', GREATEST(COALESCE(_var_mrp, _var_price), _var_price),
      'price', _var_price,
      'qty', _qty
    );
  END LOOP;

  -- Enforce minimum order threshold
  IF _calc_subtotal < COALESCE(_min_order, 0) THEN
    RAISE EXCEPTION 'Minimum order amount is ₹%', _min_order;
  END IF;

  -- Compute delivery charge server-side
  IF _order_type = 'pickup' OR _calc_subtotal >= COALESCE(_free_thresh, 499) THEN
    _delivery_fee := 0;
  ELSE
    _delivery_fee := GREATEST(COALESCE(_delivery_fee, 0), 0);
  END IF;

  -- Authoritative coupon validation & redemption tracking
  _coupon_code := upper(NULLIF(trim(_order_payload->>'coupon_code'), ''));
  _discount := 0;

  IF _coupon_code IS NOT NULL THEN
    SELECT * INTO _coupon
    FROM public.coupons
    WHERE upper(code) = _coupon_code
      AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or inactive coupon code: %', _coupon_code;
    END IF;

    IF _coupon.starts_at IS NOT NULL AND now() < _coupon.starts_at THEN
      RAISE EXCEPTION 'Coupon % is not active yet', _coupon_code;
    END IF;
    IF _coupon.ends_at IS NOT NULL AND now() > _coupon.ends_at THEN
      RAISE EXCEPTION 'Coupon % has expired', _coupon_code;
    END IF;
    IF _coupon.usage_limit IS NOT NULL AND _coupon.used_count >= _coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon % usage limit has been reached', _coupon_code;
    END IF;
    IF _calc_subtotal < COALESCE(_coupon.min_order, 0) THEN
      RAISE EXCEPTION 'Minimum order ₹% required for coupon %', _coupon.min_order, _coupon_code;
    END IF;

    IF _coupon.discount_type = 'percent' THEN
      _discount := ROUND((_calc_subtotal * _coupon.value) / 100.0, 2);
      IF _coupon.max_discount IS NOT NULL AND _coupon.max_discount > 0 THEN
        _discount := LEAST(_discount, _coupon.max_discount);
      END IF;
    ELSE
      _discount := _coupon.value;
    END IF;

    _discount := LEAST(GREATEST(_discount, 0), _calc_subtotal);

    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = _coupon.id;
  END IF;

  _final_total := GREATEST(_calc_subtotal + _delivery_fee - _discount, 0);

  -- Insert order (always force status='placed', payment_status='pending', user_id=auth.uid())
  INSERT INTO public.orders (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    order_type,
    address,
    payment_method,
    payment_status,
    coupon_code,
    subtotal,
    discount,
    delivery_fee,
    total,
    status,
    notes
  ) VALUES (
    auth.uid(),
    NULLIF(TRIM(COALESCE(_order_payload->>'customer_name', '')), '') ,
    _clean_phone,
    NULLIF(TRIM(_order_payload->>'customer_email'), ''),
    _order_type,
    COALESCE(_order_payload->'address', '{}'::jsonb),
    _payment_method,
    'pending',
    _coupon_code,
    _calc_subtotal,
    _discount,
    _delivery_fee,
    _final_total,
    'placed',
    NULLIF(TRIM(_order_payload->>'notes'), '')
  )
  RETURNING id, order_no INTO _new_order_id, _new_order_no;

  -- Insert strictly server-verified order_items rows
  FOR _item IN SELECT * FROM jsonb_array_elements(_validated_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      name,
      name_en,
      name_hi,
      variant_label,
      variant_label_en,
      variant_label_hi,
      image_url,
      mrp,
      price,
      qty
    ) VALUES (
      _new_order_id,
      (_item->>'product_id')::uuid,
      (_item->>'variant_id')::uuid,
      _item->>'name',
      _item->>'name_en',
      NULLIF(_item->>'name_hi', ''),
      _item->>'variant_label',
      _item->>'variant_label_en',
      NULLIF(_item->>'variant_label_hi', ''),
      NULLIF(_item->>'image_url', ''),
      (_item->>'mrp')::numeric,
      (_item->>'price')::numeric,
      (_item->>'qty')::int
    );
  END LOOP;

  _invoice_json := public._generate_invoice_for_order_internal(_new_order_id);

  RETURN jsonb_build_object(
    'success', true,
    'order_id', _new_order_id,
    'order_no', _new_order_no,
    'invoice_no', _invoice_json->>'invoice_no',
    'total', _final_total,
    'subtotal', _calc_subtotal,
    'delivery_fee', _delivery_fee,
    'discount', _discount,
    'status', 'placed',
    'payment_status', 'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;

-- 8. LOCK DOWN ADMIN ORDER & PAYMENT STATUS MUTATION RPCs
DROP FUNCTION IF EXISTS public.admin_update_order_status(uuid, text, text);
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  _order_id uuid,
  _new_status text,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _valid_status text;
  _old_status text;
  _order_no text;
  _item record;
BEGIN
  IF NOT public.is_store_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: admin privileges required');
  END IF;

  _valid_status := lower(trim(COALESCE(_new_status, '')));
  IF _valid_status NOT IN ('placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'returned') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid order status value');
  END IF;

  SELECT status::text, order_no INTO _old_status, _order_no
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  UPDATE public.orders
  SET
    status = _valid_status,
    notes = COALESCE(_note, notes),
    updated_at = now()
  WHERE id = _order_id;

  -- Restore stock once if transitioning from an active state into a terminal cancel/reject/return state
  IF COALESCE(_old_status, '') NOT IN ('cancelled', 'rejected', 'returned')
     AND _valid_status IN ('cancelled', 'rejected', 'returned') THEN
    FOR _item IN SELECT * FROM public.order_items WHERE order_id = _order_id LOOP
      IF _item.variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock + _item.qty
        WHERE id = _item.variant_id;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.order_events (order_id, status, note, created_at)
  VALUES (_order_id, _valid_status, COALESCE(_note, 'Status changed to ' || _valid_status), now());

  RETURN jsonb_build_object(
    'success', true,
    'order_id', _order_id,
    'order_no', _order_no,
    'status', _valid_status,
    'updated_at', now(),
    'notes', _note
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_update_payment_status(uuid, text);
CREATE OR REPLACE FUNCTION public.admin_update_payment_status(
  _order_id uuid,
  _payment_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _ord record;
  _now timestamptz := now();
BEGIN
  IF NOT public.is_store_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: admin privileges required');
  END IF;

  IF _payment_status NOT IN ('pending', 'paid', 'failed', 'refunded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment status value');
  END IF;

  SELECT * INTO _ord FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  UPDATE public.orders
  SET
    payment_status = _payment_status,
    amount_paid = CASE
      WHEN _payment_status = 'paid' THEN COALESCE(total, 0)
      WHEN _payment_status IN ('pending', 'failed') THEN 0
      ELSE amount_paid
    END,
    paid_at = CASE WHEN _payment_status = 'paid' THEN COALESCE(paid_at, _now) ELSE paid_at END,
    updated_at = _now
  WHERE id = _order_id;

  UPDATE public.invoices
  SET
    payment_status = _payment_status,
    amount_paid = CASE
      WHEN _payment_status = 'paid' THEN grand_total
      WHEN _payment_status IN ('pending', 'failed') THEN 0
      ELSE amount_paid
    END,
    amount_due = CASE
      WHEN _payment_status = 'paid' THEN 0
      WHEN _payment_status IN ('pending', 'failed') THEN grand_total
      ELSE amount_due
    END,
    paid_at = CASE WHEN _payment_status = 'paid' THEN COALESCE(paid_at, _now) ELSE paid_at END,
    updated_at = _now
  WHERE order_id = _order_id;

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'payment_status', _payment_status);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_payment_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_payment_status(uuid, text) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_update_payment_and_refund(uuid, text, numeric, numeric, text);
CREATE OR REPLACE FUNCTION public.admin_update_payment_and_refund(
  p_order_id uuid,
  p_payment_status text,
  p_amount_paid numeric DEFAULT NULL,
  p_refund_amount numeric DEFAULT 0,
  p_refund_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _ord record;
  _inv record;
  _prev_status text;
  _prev_paid numeric(12,2);
  _prev_refund numeric(12,2);
  _new_paid numeric(12,2);
  _new_due numeric(12,2);
  _refund_status text := 'none';
  _grand_total numeric(12,2);
BEGIN
  IF NOT public.is_store_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required');
  END IF;

  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF _ord.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  PERFORM public._generate_invoice_for_order_internal(p_order_id);
  SELECT * INTO _inv FROM public.invoices WHERE order_id = p_order_id;

  _prev_status := _inv.payment_status;
  _prev_paid := _inv.amount_paid;
  _prev_refund := _inv.refund_amount;
  _grand_total := _inv.grand_total;

  IF p_amount_paid IS NOT NULL THEN
    _new_paid := GREATEST(p_amount_paid, 0);
  ELSIF p_payment_status = 'paid' THEN
    _new_paid := _grand_total;
  ELSIF p_payment_status IN ('pending', 'failed') THEN
    _new_paid := 0;
  ELSE
    _new_paid := _prev_paid;
  END IF;

  _new_due := GREATEST(_grand_total - _new_paid, 0);

  IF p_refund_amount > 0 THEN
    IF p_refund_amount > _grand_total THEN
      RETURN jsonb_build_object('success', false, 'error', 'Refund amount cannot exceed invoice total');
    END IF;
    _refund_status := CASE WHEN p_refund_amount >= _grand_total THEN 'full' ELSE 'partial' END;
  ELSE
    _refund_status := 'none';
  END IF;

  UPDATE public.invoices
  SET
    payment_status = p_payment_status,
    amount_paid = _new_paid,
    amount_due = _new_due,
    paid_at = CASE WHEN p_payment_status = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END,
    refund_status = _refund_status,
    refund_amount = p_refund_amount,
    refund_reason = COALESCE(p_refund_reason, refund_reason),
    refunded_at = CASE WHEN p_refund_amount > 0 AND refunded_at IS NULL THEN now() ELSE refunded_at END,
    updated_at = now()
  WHERE order_id = p_order_id;

  UPDATE public.orders
  SET
    payment_status = p_payment_status,
    paid_at = CASE WHEN p_payment_status = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END,
    refund_amount = p_refund_amount,
    refund_reason = COALESCE(p_refund_reason, refund_reason),
    refunded_at = CASE WHEN p_refund_amount > 0 AND refunded_at IS NULL THEN now() ELSE refunded_at END,
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.billing_audit_logs (
    invoice_id, order_id, event_type, previous_state, new_state, changed_by, changed_by_user_id, note
  ) VALUES (
    _inv.id, p_order_id, 'PAYMENT_AND_REFUND_UPDATED',
    jsonb_build_object('payment_status', _prev_status, 'amount_paid', _prev_paid, 'refund_amount', _prev_refund),
    jsonb_build_object('payment_status', p_payment_status, 'amount_paid', _new_paid, 'amount_due', _new_due, 'refund_amount', p_refund_amount, 'refund_status', _refund_status),
    'Store Admin', auth.uid(), COALESCE(p_refund_reason, 'Payment status updated by Admin')
  );

  RETURN jsonb_build_object(
    'success', true, 'order_id', p_order_id, 'invoice_no', _inv.invoice_no,
    'payment_status', p_payment_status, 'amount_paid', _new_paid, 'amount_due', _new_due,
    'refund_amount', p_refund_amount, 'refund_status', _refund_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_payment_and_refund(uuid, text, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_payment_and_refund(uuid, text, numeric, numeric, text) TO authenticated;

-- 9. LOCK PAYMENT GATEWAY RPCs + SAFE CUSTOMER UPI CLAIM + ATOMIC CANCEL
-- verify_and_confirm_payment may ONLY execute under trusted server service_role after HMAC check
REVOKE ALL ON FUNCTION public.verify_and_confirm_payment(uuid, text, text, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_confirm_payment(uuid, text, text, text, numeric, text, jsonb) TO service_role;

DROP FUNCTION IF EXISTS public.verify_and_confirm_payment(uuid, text, text, text, numeric, text, jsonb);
CREATE OR REPLACE FUNCTION public.verify_and_confirm_payment(
  p_order_id uuid,
  p_gateway_order_id text,
  p_gateway_payment_id text,
  p_signature text,
  p_amount numeric,
  p_method text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_record record;
  _replay_exists boolean;
  _current_paid_at timestamptz := now();
BEGIN
  IF p_gateway_payment_id IS NULL OR trim(p_gateway_payment_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing gateway payment ID');
  END IF;

  SELECT * INTO _order_record
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF _order_record.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_paid', true,
      'order_id', p_order_id,
      'order_no', _order_record.order_no,
      'payment_status', 'paid',
      'amount_paid', _order_record.amount_paid
    );
  END IF;

  -- Prevent cross-order payment replay
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE gateway_payment_id = p_gateway_payment_id
      AND id <> p_order_id
      AND payment_status = 'paid'
  ) INTO _replay_exists;

  IF _replay_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment ID already used for another order');
  END IF;

  -- Verify paid amount meets order total
  IF p_amount IS NULL OR p_amount < COALESCE(_order_record.total, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paid amount is less than order total');
  END IF;

  UPDATE public.orders
  SET
    payment_status = 'paid',
    payment_method = COALESCE(p_method, payment_method),
    gateway_order_id = COALESCE(p_gateway_order_id, gateway_order_id),
    gateway_payment_id = p_gateway_payment_id,
    transaction_id = p_gateway_payment_id,
    amount_paid = p_amount,
    paid_at = _current_paid_at,
    payment_error = NULL,
    payment_metadata = COALESCE(payment_metadata, '{}'::jsonb) || jsonb_build_object(
      'verified_signature', p_signature,
      'verified_at', _current_paid_at,
      'extra', COALESCE(p_metadata, '{}'::jsonb)
    ),
    updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.order_payments
  SET
    status = 'paid',
    gateway_payment_id = p_gateway_payment_id,
    gateway_signature = p_signature,
    amount = p_amount,
    verified_at = _current_paid_at,
    metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
    updated_at = now()
  WHERE order_id = p_order_id AND (gateway_order_id = p_gateway_order_id OR gateway_order_id IS NULL);

  UPDATE public.invoices
  SET
    payment_status = 'paid',
    payment_method = COALESCE(p_method, payment_method),
    amount_paid = p_amount,
    amount_due = 0,
    paid_at = _current_paid_at,
    transaction_id = p_gateway_payment_id,
    updated_at = now()
  WHERE order_id = p_order_id;

  INSERT INTO public.order_events (order_id, status, note)
  VALUES (
    p_order_id,
    _order_record.status,
    'Payment verified & received via ' || UPPER(COALESCE(p_method, 'ONLINE')) || ' (Txn: ' || p_gateway_payment_id || ')'
  );

  INSERT INTO public.billing_audit_logs (
    order_id, event_type, changed_by, note, new_state
  ) VALUES (
    p_order_id, 'PAYMENT_VERIFIED_AND_PAID', 'Payment Gateway Service',
    'Payment of ₹' || p_amount::text || ' verified (Txn: ' || p_gateway_payment_id || ')',
    jsonb_build_object('gateway_order_id', p_gateway_order_id, 'gateway_payment_id', p_gateway_payment_id, 'payment_method', p_method, 'amount', p_amount)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_no', _order_record.order_no,
    'payment_status', 'paid',
    'amount_paid', p_amount,
    'transaction_id', p_gateway_payment_id,
    'paid_at', _current_paid_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_and_confirm_payment(uuid, text, text, text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_confirm_payment(uuid, text, text, text, numeric, text, jsonb) TO service_role;

-- Safe customer self-attestation for direct P2P UPI/QR (records claim without marking paid)
DROP FUNCTION IF EXISTS public.claim_upi_payment_submitted(uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.claim_upi_payment_submitted(
  p_order_id uuid,
  p_phone text,
  p_method text,
  p_utr_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ord record;
  _clean_phone text;
  _ord_phone text;
  _clean_utr text;
BEGIN
  IF p_method NOT IN ('upi', 'qr') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid UPI payment method');
  END IF;

  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  _clean_phone := right(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 10);
  _ord_phone := right(regexp_replace(COALESCE(_ord.customer_phone, ''), '\D', '', 'g'), 10);

  IF NOT (
    public.is_store_admin()
    OR (auth.uid() IS NOT NULL AND _ord.user_id = auth.uid())
    OR (length(_clean_phone) = 10 AND _clean_phone = _ord_phone)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF _ord.payment_status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'already_paid', true, 'payment_status', 'paid');
  END IF;

  _clean_utr := NULLIF(regexp_replace(COALESCE(p_utr_ref, ''), '[^A-Za-z0-9_-]', '', 'g'), '');

  UPDATE public.orders
  SET
    payment_method = p_method,
    payment_status = 'pending',
    transaction_id = COALESCE(_clean_utr, transaction_id),
    payment_metadata = COALESCE(payment_metadata, '{}'::jsonb) || jsonb_build_object(
      'customer_claimed_paid', true,
      'claimed_at', now(),
      'claimed_method', p_method,
      'utr_ref', _clean_utr
    ),
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, status, note)
  VALUES (
    p_order_id,
    _ord.status,
    'ग्राहक ने UPI/QR भुगतान करने की पुष्टि की (एडमिन सत्यापन लंबित)'
      || CASE WHEN _clean_utr IS NOT NULL THEN ' — Ref: ' || _clean_utr ELSE '' END
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_no', _ord.order_no,
    'payment_status', 'pending',
    'verification_pending', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_upi_payment_submitted(uuid, text, text, text) TO anon, authenticated;

-- Harden record_payment_attempt & record_payment_failure to check order existence/ownership
DROP FUNCTION IF EXISTS public.record_payment_attempt(uuid, text, text, text, text, numeric, jsonb);
CREATE OR REPLACE FUNCTION public.record_payment_attempt(
  p_order_id uuid,
  p_order_no text,
  p_method text,
  p_gateway text,
  p_gateway_order_id text,
  p_amount numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payment_id uuid;
  _ord record;
BEGIN
  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR upper(COALESCE(_ord.order_no, '')) <> upper(COALESCE(p_order_no, '')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order mismatch');
  END IF;

  INSERT INTO public.order_payments (
    order_id, order_no, payment_method, gateway, gateway_order_id, amount, currency, status, metadata
  ) VALUES (
    p_order_id, _ord.order_no, p_method, COALESCE(p_gateway, 'razorpay'),
    p_gateway_order_id, COALESCE(_ord.total, p_amount), 'INR', 'pending', COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO _payment_id;

  UPDATE public.orders
  SET
    gateway_order_id = p_gateway_order_id,
    payment_method = p_method,
    payment_attempts = COALESCE(payment_attempts, 0) + 1,
    payment_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'pending' END,
    payment_metadata = COALESCE(payment_metadata, '{}'::jsonb) || jsonb_build_object('last_attempt_id', _payment_id),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', _payment_id,
    'order_id', p_order_id,
    'gateway_order_id', p_gateway_order_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_attempt(uuid, text, text, text, text, numeric, jsonb) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.record_payment_failure(uuid, text, text, text, text, jsonb);
CREATE OR REPLACE FUNCTION public.record_payment_failure(
  p_order_id uuid,
  p_gateway_order_id text,
  p_gateway_payment_id text,
  p_error_code text,
  p_error_desc text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ord record;
BEGIN
  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Require caller ownership or matching gateway_order_id bound to this order
  IF NOT (
    public.is_store_admin()
    OR (auth.uid() IS NOT NULL AND _ord.user_id = auth.uid())
    OR (p_gateway_order_id IS NOT NULL AND p_gateway_order_id = _ord.gateway_order_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF _ord.payment_status IS DISTINCT FROM 'paid' THEN
    UPDATE public.orders
    SET
      payment_status = 'failed',
      payment_error = left(COALESCE(p_error_desc, 'Payment cancelled'), 240),
      payment_metadata = COALESCE(payment_metadata, '{}'::jsonb) || jsonb_build_object(
        'last_failure_code', p_error_code,
        'last_failure_desc', left(COALESCE(p_error_desc, 'Payment cancelled'), 240),
        'last_failure_at', now()
      ),
      updated_at = now()
    WHERE id = p_order_id;

    UPDATE public.order_payments
    SET
      status = 'failed',
      error_code = p_error_code,
      error_description = left(COALESCE(p_error_desc, 'Payment cancelled'), 240),
      metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
      updated_at = now()
    WHERE order_id = p_order_id AND (gateway_order_id = p_gateway_order_id OR gateway_order_id IS NULL);
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'failed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_failure(uuid, text, text, text, text, jsonb) TO anon, authenticated;

-- Atomic FOR UPDATE lock in customer_cancel_order to prevent double stock inflation
DROP FUNCTION IF EXISTS public.customer_cancel_order(uuid, text, text);
CREATE OR REPLACE FUNCTION public.customer_cancel_order(
  p_order_id uuid,
  p_reason text,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _order record;
  _item record;
  _clean_phone text;
  _order_clean_phone text;
BEGIN
  SELECT * INTO _order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  IF _order.status <> 'placed' THEN
    IF _order.status = 'cancelled' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Order is already cancelled');
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Order is already being packed or out for delivery. Please call Arun Gopal Traders directly at +91 6388354988 to request changes.'
      );
    END IF;
  END IF;

  _clean_phone := right(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 10);
  _order_clean_phone := right(regexp_replace(COALESCE(_order.customer_phone, ''), '\D', '', 'g'), 10);

  IF auth.uid() IS NOT NULL AND _order.user_id = auth.uid() THEN
    NULL;
  ELSIF length(_clean_phone) = 10 AND _clean_phone = _order_clean_phone THEN
    NULL;
  ELSIF public.is_store_admin() THEN
    NULL;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to cancel this order');
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      notes = COALESCE(_order.notes || E'\n', '') || 'Cancelled by customer: ' || COALESCE(p_reason, 'No reason specified'),
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, status, note, created_at)
  VALUES (
    p_order_id,
    'cancelled',
    'Order cancelled by customer: ' || COALESCE(p_reason, 'No reason specified'),
    now()
  );

  FOR _item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    IF _item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = stock + _item.qty
      WHERE id = _item.variant_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_no', _order.order_no,
    'status', 'cancelled'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.customer_cancel_order(uuid, text, text) TO anon, authenticated;

-- 10. EXACT 10-DIGIT PHONE MATCHING FOR GUEST LOOKUPS & AUTHENTICATED get_customer_orders
DROP FUNCTION IF EXISTS public.lookup_order(text, text);
CREATE OR REPLACE FUNCTION public.lookup_order(
  _order_no text,
  _phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order record;
  _items jsonb;
  _events jsonb;
  _clean_phone text;
BEGIN
  _clean_phone := regexp_replace(COALESCE(_phone, ''), '\D', '', 'g');
  IF length(_clean_phone) >= 10 THEN
    _clean_phone := right(_clean_phone, 10);
  ELSE
    RETURN NULL;
  END IF;

  IF NULLIF(trim(_order_no), '') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO _order
  FROM public.orders
  WHERE lower(order_no) = lower(trim(_order_no))
    AND right(regexp_replace(customer_phone, '\D', '', 'g'), 10) = _clean_phone
  ORDER BY created_at DESC
  LIMIT 1;

  IF _order.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'order_id', oi.order_id,
      'product_id', oi.product_id,
      'variant_id', oi.variant_id,
      'name', oi.name,
      'name_en', oi.name_en,
      'name_hi', oi.name_hi,
      'variant_label', oi.variant_label,
      'variant_label_en', oi.variant_label_en,
      'variant_label_hi', oi.variant_label_hi,
      'image_url', oi.image_url,
      'mrp', oi.mrp,
      'price', oi.price,
      'qty', oi.qty
    )
  ) INTO _items
  FROM public.order_items oi
  WHERE oi.order_id = _order.id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oe.id,
      'order_id', oe.order_id,
      'status', oe.status,
      'note', oe.note,
      'created_at', oe.created_at
    ) ORDER BY oe.created_at ASC
  ) INTO _events
  FROM public.order_events oe
  WHERE oe.order_id = _order.id;

  RETURN jsonb_build_object(
    'id', _order.id,
    'order_no', _order.order_no,
    'user_id', _order.user_id,
    'customer_name', _order.customer_name,
    'customer_phone', _order.customer_phone,
    'customer_email', _order.customer_email,
    'order_type', _order.order_type,
    'address', _order.address,
    'payment_method', _order.payment_method,
    'payment_status', _order.payment_status,
    'coupon_code', _order.coupon_code,
    'subtotal', _order.subtotal,
    'discount', _order.discount,
    'delivery_fee', _order.delivery_fee,
    'total', _order.total,
    'status', _order.status::text,
    'notes', _order.notes,
    'invoice_no', _order.invoice_no,
    'created_at', _order.created_at,
    'updated_at', _order.updated_at,
    'order_items', COALESCE(_items, '[]'::jsonb),
    'order_events', COALESCE(_events, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.lookup_order_invoice(text, text);
CREATE OR REPLACE FUNCTION public.lookup_order_invoice(
  _order_no text,
  _phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _clean_phone text;
  _order_id uuid;
BEGIN
  _clean_phone := regexp_replace(COALESCE(_phone, ''), '\D', '', 'g');
  IF length(_clean_phone) >= 10 THEN
    _clean_phone := right(_clean_phone, 10);
  ELSE
    RETURN NULL;
  END IF;

  IF NULLIF(trim(_order_no), '') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO _order_id
  FROM public.orders
  WHERE lower(order_no) = lower(trim(_order_no))
    AND right(regexp_replace(customer_phone, '\D', '', 'g'), 10) = _clean_phone
  ORDER BY created_at DESC
  LIMIT 1;

  IF _order_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN public._generate_invoice_for_order_internal(_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order_invoice(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_customer_orders(text, uuid);
CREATE OR REPLACE FUNCTION public.get_customer_orders(
  _phone text DEFAULT NULL,
  _user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_uid uuid := auth.uid();
  _is_admin boolean := public.is_store_admin();
  _auth_phone text;
  _clean_phone text;
  _result jsonb;
BEGIN
  IF _auth_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Resolve the caller's own verified/profile 10-digit phone
  SELECT right(regexp_replace(COALESCE(p.phone, auth.jwt() ->> 'phone', ''), '\D', '', 'g'), 10)
  INTO _auth_phone
  FROM public.profiles p
  WHERE p.id = _auth_uid;

  IF _is_admin AND _phone IS NOT NULL THEN
    _clean_phone := right(regexp_replace(_phone, '\D', '', 'g'), 10);
  ELSIF length(COALESCE(_auth_phone, '')) = 10 THEN
    _clean_phone := _auth_phone;
  ELSE
    _clean_phone := NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'order_no', o.order_no,
      'user_id', o.user_id,
      'customer_name', o.customer_name,
      'customer_phone', o.customer_phone,
      'customer_email', o.customer_email,
      'order_type', o.order_type,
      'address', o.address,
      'payment_method', o.payment_method,
      'payment_status', o.payment_status,
      'coupon_code', o.coupon_code,
      'subtotal', o.subtotal,
      'discount', o.discount,
      'delivery_fee', o.delivery_fee,
      'total', o.total,
      'status', o.status::text,
      'notes', o.notes,
      'invoice_no', o.invoice_no,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'order_items', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', oi.id,
              'name', oi.name,
              'name_en', oi.name_en,
              'name_hi', oi.name_hi,
              'variant_label', oi.variant_label,
              'variant_label_en', oi.variant_label_en,
              'variant_label_hi', oi.variant_label_hi,
              'image_url', oi.image_url,
              'mrp', oi.mrp,
              'price', oi.price,
              'qty', oi.qty
            )
          ) FROM public.order_items oi WHERE oi.order_id = o.id
        ),
        '[]'::jsonb
      ),
      'order_events', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', oe.id,
              'status', oe.status,
              'note', oe.note,
              'created_at', oe.created_at
            ) ORDER BY oe.created_at ASC
          ) FROM public.order_events oe WHERE oe.order_id = o.id
        ),
        '[]'::jsonb
      )
    ) ORDER BY o.created_at DESC
  ) INTO _result
  FROM public.orders o
  WHERE (
    (_is_admin AND ((_user_id IS NOT NULL AND o.user_id = _user_id) OR (_clean_phone IS NOT NULL AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 10) = _clean_phone)))
    OR o.user_id = _auth_uid
    OR (_clean_phone IS NOT NULL AND length(_clean_phone) = 10 AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 10) = _clean_phone)
  );

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_customer_orders(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(text, uuid) TO authenticated;

-- 11. PRODUCT REVIEWS PRIVACY & REAL PURCHASE VERIFICATION
DROP POLICY IF EXISTS "Admin manage reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public read approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;

-- Only admins can select raw product_reviews (which contains customer_phone); customers use public_product_reviews view
CREATE POLICY "reviews_admin_all" ON public.product_reviews
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

CREATE POLICY "reviews_public_insert" ON public.product_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.enforce_review_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clean_phone text;
  _has_purchase boolean := false;
BEGIN
  _clean_phone := right(regexp_replace(COALESCE(NEW.customer_phone, ''), '\D', '', 'g'), 10);

  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE oi.product_id = NEW.product_id
      AND o.status NOT IN ('cancelled', 'rejected')
      AND (
        (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
        OR (length(_clean_phone) = 10 AND right(regexp_replace(o.customer_phone, '\D', '', 'g'), 10) = _clean_phone)
      )
  ) INTO _has_purchase;

  NEW.is_verified := _has_purchase;
  NEW.is_approved := true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_verification ON public.product_reviews;
CREATE TRIGGER trg_enforce_review_verification
  BEFORE INSERT ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_review_verification();

-- Safe public view excluding customer_phone PII
CREATE OR REPLACE VIEW public.public_product_reviews AS
SELECT
  id,
  product_id,
  customer_name,
  locality,
  rating,
  title,
  comment,
  is_verified,
  is_approved,
  created_at
FROM public.product_reviews
WHERE is_approved = true;

GRANT SELECT ON public.public_product_reviews TO anon, authenticated;
