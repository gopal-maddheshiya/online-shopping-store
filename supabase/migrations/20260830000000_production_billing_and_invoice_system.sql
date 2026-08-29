-- ====================================================================
-- MIGRATION: Production-Grade Billing, Invoice & Receipt Management System
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Invoice Number Sequence
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001 MINVALUE 1;

-- 2. Enhance store_settings with Billing & Tax configuration
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS legal_name text DEFAULT 'Arun Gopal Traders';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS state text DEFAULT 'Uttar Pradesh';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS state_code text DEFAULT '09';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS tax_enabled boolean DEFAULT false;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS default_tax_rate numeric(5,2) DEFAULT 0;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'AGT-INV';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS invoice_footer_note text DEFAULT 'Thank you for shopping with Arun Gopal Traders! For inquiries or support, call/WhatsApp: +91 6388354988.';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS terms_and_conditions text DEFAULT '1. Goods once sold can only be returned within 24 hours in original packed condition.
2. Please retain this invoice/receipt for any verification or refund.
3. All disputes subject to Maharajganj jurisdiction.';

-- 3. Enhance orders table with billing references
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_no text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_amount numeric(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- 4. Create Invoices Table (Immutable Historical Billing Snapshots)
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_no text NOT NULL,
  user_id uuid REFERENCES auth.users(id),

  -- Customer snapshot
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Store snapshot (Frozen at billing time)
  store_name text NOT NULL DEFAULT 'Arun Gopal Traders',
  store_legal_name text DEFAULT 'Arun Gopal Traders',
  store_phone text NOT NULL DEFAULT '+916388354988',
  store_email text DEFAULT 'gopalmaddheshiya138@gmail.com',
  store_address text NOT NULL DEFAULT 'Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh',
  store_gstin text,
  store_state text NOT NULL DEFAULT 'Uttar Pradesh',
  store_state_code text NOT NULL DEFAULT '09',

  -- Items snapshot (Immutable array of frozen line items)
  items_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Financial totals (Numeric 12,2 precision)
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  item_discount numeric(12,2) NOT NULL DEFAULT 0,
  coupon_code text,
  coupon_discount numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,

  -- Tax calculations (Configurable GST / Retail)
  tax_enabled boolean NOT NULL DEFAULT false,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  taxable_amount numeric(12,2) NOT NULL DEFAULT 0,
  cgst_amount numeric(12,2) NOT NULL DEFAULT 0,
  sgst_amount numeric(12,2) NOT NULL DEFAULT 0,
  igst_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_tax numeric(12,2) NOT NULL DEFAULT 0,

  -- Settlement figures
  round_off numeric(6,2) NOT NULL DEFAULT 0,
  grand_total numeric(12,2) NOT NULL DEFAULT 0,

  -- Payment details
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  amount_due numeric(12,2) NOT NULL DEFAULT 0,
  paid_at timestamptz,
  transaction_id text,

  -- Refund & cancellation
  refund_status text NOT NULL DEFAULT 'none', -- 'none' | 'partial' | 'full'
  refund_amount numeric(12,2) NOT NULL DEFAULT 0,
  refund_reason text,
  refunded_at timestamptz,

  -- Metadata
  invoice_type text NOT NULL DEFAULT 'retail_invoice', -- 'retail_invoice' | 'tax_invoice' | 'bill_of_supply'
  notes text,
  footer_note text,
  terms text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups & filtering
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON public.invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_order_no ON public.invoices(order_no);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_phone ON public.invoices(customer_phone);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);

-- 5. Create Billing Audit Logs Table
CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'INVOICE_GENERATED', 'PAYMENT_UPDATED', 'REFUND_RECORDED', 'SETTINGS_UPDATED'
  previous_state jsonb,
  new_state jsonb,
  changed_by text NOT NULL DEFAULT 'System',
  changed_by_user_id uuid REFERENCES auth.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_order_id ON public.billing_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_invoice_id ON public.billing_audit_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_created_at ON public.billing_audit_logs(created_at DESC);

-- 6. Row Level Security Policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.invoices TO anon, authenticated;
GRANT INSERT, UPDATE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

GRANT SELECT, INSERT ON public.billing_audit_logs TO authenticated;
GRANT ALL ON public.billing_audit_logs TO service_role;

-- Invoices RLS: User can read own invoices, admin can read all
DROP POLICY IF EXISTS "invoices customer read own" ON public.invoices;
CREATE POLICY "invoices customer read own" ON public.invoices FOR SELECT TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "invoices admin modify" ON public.invoices;
CREATE POLICY "invoices admin modify" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Billing Audit Logs RLS: Admin only
DROP POLICY IF EXISTS "billing logs admin only" ON public.billing_audit_logs;
CREATE POLICY "billing logs admin only" ON public.billing_audit_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. IDEMPOTENT INVOICE GENERATION STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.generate_invoice_for_order(
  p_order_id uuid
)
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
  -- 1. Check if invoice already exists (IDEMPOTENCY GUARANTEE)
  SELECT * INTO _existing_inv
  FROM public.invoices
  WHERE order_id = p_order_id;

  IF _existing_inv.id IS NOT NULL THEN
    RETURN to_jsonb(_existing_inv);
  END IF;

  -- 2. Fetch Order Data
  SELECT * INTO _ord
  FROM public.orders
  WHERE id = p_order_id;

  IF _ord.id IS NULL THEN
    RAISE EXCEPTION 'Order with ID % not found', p_order_id;
  END IF;

  -- 3. Fetch Store Settings
  SELECT * INTO _settings
  FROM public.store_settings
  WHERE id = 1;

  _tax_enabled := COALESCE(_settings.tax_enabled, false);
  _tax_rate := COALESCE(_settings.default_tax_rate, 0);
  _inv_prefix := COALESCE(_settings.invoice_prefix, 'AGT-INV');

  IF _tax_enabled AND _settings.gstin IS NOT NULL AND trim(_settings.gstin) != '' THEN
    _inv_type := 'tax_invoice';
  ELSE
    _inv_type := 'retail_invoice';
  END IF;

  -- 4. Build Items Snapshot from order_items
  FOR _item_rec IN (
    SELECT
      oi.id,
      oi.product_id,
      oi.variant_id,
      oi.name,
      COALESCE(oi.variant_label, 'Standard') AS variant_label,
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
      'variant_label', _item_rec.variant_label,
      'mrp', _item_rec.mrp,
      'price', _item_rec.price,
      'qty', _item_rec.qty,
      'line_total', _item_rec.line_total,
      'line_discount', _item_rec.line_discount,
      'image_url', _item_rec.image_url
    );
  END LOOP;

  -- Fallback if order_items was empty
  IF _subtotal = 0 THEN
    _subtotal := COALESCE(_ord.subtotal, _ord.total, 0);
  END IF;

  _delivery_fee := COALESCE(_ord.delivery_fee, 0);
  _coupon_disc := COALESCE(_ord.discount, 0);

  -- 5. Calculate Taxes
  _taxable_amount := GREATEST(_subtotal - _coupon_disc, 0);

  IF _tax_enabled AND _tax_rate > 0 THEN
    -- Check Intra-State vs Inter-State
    _cust_state := COALESCE(_ord.address->>'state', 'Uttar Pradesh');
    IF lower(trim(_cust_state)) = lower(trim(COALESCE(_settings.state, 'Uttar Pradesh'))) THEN
      -- Intra-State: CGST (half) + SGST (half)
      _cgst := ROUND((_taxable_amount * (_tax_rate / 2.0)) / 100.0, 2);
      _sgst := ROUND((_taxable_amount * (_tax_rate / 2.0)) / 100.0, 2);
      _igst := 0;
    ELSE
      -- Inter-State: IGST (full)
      _cgst := 0;
      _sgst := 0;
      _igst := ROUND((_taxable_amount * _tax_rate) / 100.0, 2);
    END IF;
    _total_tax := _cgst + _sgst + _igst;
  ELSE
    _cgst := 0;
    _sgst := 0;
    _igst := 0;
    _total_tax := 0;
  END IF;

  -- 6. Settlement Totals
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

  -- 7. Generate Sequential Unique Invoice Number
  _new_invoice_no := _inv_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  -- 8. Insert into public.invoices
  INSERT INTO public.invoices (
    invoice_no,
    order_id,
    order_no,
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    billing_address,
    delivery_address,
    store_name,
    store_legal_name,
    store_phone,
    store_email,
    store_address,
    store_gstin,
    store_state,
    store_state_code,
    items_snapshot,
    subtotal,
    item_discount,
    coupon_code,
    coupon_discount,
    delivery_fee,
    tax_enabled,
    tax_rate,
    taxable_amount,
    cgst_amount,
    sgst_amount,
    igst_amount,
    total_tax,
    round_off,
    grand_total,
    payment_method,
    payment_status,
    amount_paid,
    amount_due,
    paid_at,
    transaction_id,
    invoice_type,
    notes,
    footer_note,
    terms
  ) VALUES (
    _new_invoice_no,
    p_order_id,
    _ord.order_no,
    _ord.user_id,
    _ord.customer_name,
    _ord.customer_phone,
    _ord.customer_email,
    COALESCE(_ord.address, '{}'::jsonb),
    COALESCE(_ord.address, '{}'::jsonb),
    COALESCE(_settings.store_name, 'Arun Gopal Traders'),
    COALESCE(_settings.legal_name, 'Arun Gopal Traders'),
    COALESCE(_settings.phone, '+916388354988'),
    COALESCE(_settings.email, 'gopalmaddheshiya138@gmail.com'),
    COALESCE(_settings.address, 'Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh'),
    _settings.gstin,
    COALESCE(_settings.state, 'Uttar Pradesh'),
    COALESCE(_settings.state_code, '09'),
    _items_json,
    _subtotal,
    _item_discount,
    _ord.coupon_code,
    _coupon_disc,
    _delivery_fee,
    _tax_enabled,
    _tax_rate,
    _taxable_amount,
    _cgst,
    _sgst,
    _igst,
    _total_tax,
    _round_off,
    _final_grand_total,
    COALESCE(_ord.payment_method, 'cod'),
    COALESCE(_ord.payment_status, 'pending'),
    _amt_paid,
    _amt_due,
    _ord.paid_at,
    _ord.transaction_id,
    _inv_type,
    _ord.notes,
    COALESCE(_settings.invoice_footer_note, 'Thank you for shopping with Arun Gopal Traders! For inquiries: +91 6388354988.'),
    COALESCE(_settings.terms_and_conditions, 'Goods once sold can only be returned within 24 hours in original condition.')
  )
  RETURNING id INTO _inv_id;

  -- 9. Update invoice_no reference on orders table
  UPDATE public.orders
  SET invoice_no = _new_invoice_no
  WHERE id = p_order_id;

  -- 10. Audit Log Entry
  INSERT INTO public.billing_audit_logs (
    invoice_id,
    order_id,
    event_type,
    new_state,
    changed_by,
    note
  ) VALUES (
    _inv_id,
    p_order_id,
    'INVOICE_GENERATED',
    jsonb_build_object('invoice_no', _new_invoice_no, 'grand_total', _final_grand_total, 'type', _inv_type),
    'Billing Engine',
    'Initial immutable billing snapshot created'
  );

  SELECT * INTO _existing_inv FROM public.invoices WHERE id = _inv_id;
  RETURN to_jsonb(_existing_inv);
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_for_order(uuid) TO anon, authenticated;

-- 8. UPDATE PLACE_ORDER PROCEDURE TO ATOMICALLY GENERATE INVOICE
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
  _var_stock int;
  _qty int;
  _var_price numeric(10,2);
  _var_mrp numeric(10,2);
  _var_label text;
  _prod_name text;
  _img_url text;
  _calc_subtotal numeric(10,2) := 0;
  _delivery_fee numeric(10,2) := 0;
  _discount numeric(10,2) := 0;
  _final_total numeric(10,2) := 0;
  _free_thresh numeric(10,2) := 499;
  _min_order numeric(10,2) := 99;
  _clean_phone text;
  _invoice_json jsonb;
BEGIN
  -- Get thresholds from settings
  SELECT free_delivery_threshold, min_order_value, delivery_fee
  INTO _free_thresh, _min_order, _delivery_fee
  FROM public.store_settings
  WHERE id = 1;

  IF _items_payload IS NULL OR jsonb_array_length(_items_payload) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- 1. Validate each item & build historical snapshots
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_payload)
  LOOP
    _var_id := NULLIF(_item->>'variant_id', '')::uuid;
    _qty := GREATEST(COALESCE((_item->>'qty')::int, 1), 1);

    IF _var_id IS NOT NULL THEN
      SELECT pv.price, pv.mrp, pv.label, pv.stock, p.name, p.image_url
      INTO _var_price, _var_mrp, _var_label, _var_stock, _prod_name, _img_url
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = _var_id;
    END IF;

    IF _var_price IS NULL THEN
      _var_price := COALESCE((_item->>'price')::numeric, 0);
      _var_mrp := COALESCE((_item->>'mrp')::numeric, _var_price);
      _var_label := COALESCE(_item->>'variant_label', 'Standard');
      _prod_name := COALESCE(_item->>'name', 'Grocery Item');
      _img_url := _item->>'image_url';
    ELSE
      IF _var_stock IS NOT NULL AND _var_stock > 0 THEN
        UPDATE public.product_variants
        SET stock = GREATEST(stock - _qty, 0)
        WHERE id = _var_id;
      END IF;
    END IF;

    _calc_subtotal := _calc_subtotal + (_var_price * _qty);
  END LOOP;

  -- Calculate delivery charge
  IF _calc_subtotal >= _free_thresh OR (_order_payload->>'order_type') = 'pickup' THEN
    _delivery_fee := 0;
  END IF;

  _discount := COALESCE((_order_payload->>'discount')::numeric, 0);
  _final_total := GREATEST(_calc_subtotal + _delivery_fee - _discount, 0);

  _clean_phone := regexp_replace(COALESCE(_order_payload->>'customer_phone', ''), '\D', '', 'g');
  IF length(_clean_phone) > 10 THEN
    _clean_phone := right(_clean_phone, 10);
  END IF;

  -- 2. Insert Order Record
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
    CASE WHEN (_order_payload->>'user_id') IS NOT NULL AND (_order_payload->>'user_id') != ''
         THEN (_order_payload->>'user_id')::uuid
         ELSE auth.uid() END,
    TRIM(COALESCE(_order_payload->>'customer_name', 'Customer')),
    COALESCE(_clean_phone, TRIM(_order_payload->>'customer_phone')),
    NULLIF(TRIM(_order_payload->>'customer_email'), ''),
    COALESCE(_order_payload->>'order_type', 'delivery'),
    COALESCE(_order_payload->'address', '{}'::jsonb),
    COALESCE(_order_payload->>'payment_method', 'cod'),
    COALESCE(_order_payload->>'payment_status', 'pending'),
    NULLIF(TRIM(_order_payload->>'coupon_code'), ''),
    _calc_subtotal,
    _discount,
    _delivery_fee,
    _final_total,
    'placed',
    NULLIF(TRIM(_order_payload->>'notes'), '')
  )
  RETURNING id, order_no INTO _new_order_id, _new_order_no;

  -- 3. Insert Order Items Snapshots
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_payload)
  LOOP
    _var_id := NULLIF(_item->>'variant_id', '')::uuid;
    _qty := GREATEST(COALESCE((_item->>'qty')::int, 1), 1);
    _var_price := COALESCE((_item->>'price')::numeric, 0);
    _var_mrp := COALESCE((_item->>'mrp')::numeric, _var_price);
    _var_label := COALESCE(_item->>'variant_label', 'Standard');
    _prod_name := COALESCE(_item->>'name', 'Grocery Item');
    _img_url := _item->>'image_url';

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      name,
      variant_label,
      image_url,
      mrp,
      price,
      qty
    ) VALUES (
      _new_order_id,
      NULLIF(_item->>'product_id', '')::uuid,
      _var_id,
      _prod_name,
      _var_label,
      _img_url,
      _var_mrp,
      _var_price,
      _qty
    );
  END LOOP;

  -- 4. Atomically Generate Immutable Invoice Snapshot
  _invoice_json := public.generate_invoice_for_order(_new_order_id);

  -- 5. Return Order & Invoice Result Payload
  RETURN jsonb_build_object(
    'success', true,
    'order_id', _new_order_id,
    'order_no', _new_order_no,
    'invoice_no', _invoice_json->>'invoice_no',
    'total', _final_total,
    'subtotal', _calc_subtotal,
    'delivery_fee', _delivery_fee,
    'discount', _discount,
    'status', 'placed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;

-- 9. ADMIN UPDATE PAYMENT & REFUND STORED PROCEDURE
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
  _is_admin boolean := false;
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
  -- RBAC Admin check
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    _is_admin := true;
  END IF;

  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required');
  END IF;

  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id;
  IF _ord.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Ensure invoice exists
  PERFORM public.generate_invoice_for_order(p_order_id);
  SELECT * INTO _inv FROM public.invoices WHERE order_id = p_order_id;

  _prev_status := _inv.payment_status;
  _prev_paid := _inv.amount_paid;
  _prev_refund := _inv.refund_amount;
  _grand_total := _inv.grand_total;

  IF p_amount_paid IS NOT NULL THEN
    _new_paid := GREATEST(p_amount_paid, 0);
  ELSIF p_payment_status = 'paid' THEN
    _new_paid := _grand_total;
  ELSIF p_payment_status = 'pending' OR p_payment_status = 'failed' THEN
    _new_paid := 0;
  ELSE
    _new_paid := _prev_paid;
  END IF;

  _new_due := GREATEST(_grand_total - _new_paid, 0);

  -- Handle Refund Validation
  IF p_refund_amount > 0 THEN
    IF p_refund_amount > _new_paid AND _new_paid > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Refund amount cannot exceed amount paid (₹' || _new_paid || ')');
    END IF;

    IF p_refund_amount >= _grand_total THEN
      _refund_status := 'full';
    ELSE
      _refund_status := 'partial';
    END IF;
  ELSE
    _refund_status := 'none';
  END IF;

  -- Update Invoices table
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

  -- Update Orders table
  UPDATE public.orders
  SET
    payment_status = p_payment_status,
    paid_at = CASE WHEN p_payment_status = 'paid' AND paid_at IS NULL THEN now() ELSE paid_at END,
    refund_amount = p_refund_amount,
    refund_reason = COALESCE(p_refund_reason, refund_reason),
    refunded_at = CASE WHEN p_refund_amount > 0 AND refunded_at IS NULL THEN now() ELSE refunded_at END,
    updated_at = now()
  WHERE id = p_order_id;

  -- Log into billing_audit_logs
  INSERT INTO public.billing_audit_logs (
    invoice_id,
    order_id,
    event_type,
    previous_state,
    new_state,
    changed_by,
    changed_by_user_id,
    note
  ) VALUES (
    _inv.id,
    p_order_id,
    'PAYMENT_AND_REFUND_UPDATED',
    jsonb_build_object('payment_status', _prev_status, 'amount_paid', _prev_paid, 'refund_amount', _prev_refund),
    jsonb_build_object('payment_status', p_payment_status, 'amount_paid', _new_paid, 'amount_due', _new_due, 'refund_amount', p_refund_amount, 'refund_status', _refund_status),
    'Store Admin',
    auth.uid(),
    COALESCE(p_refund_reason, 'Payment status updated by Admin')
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'invoice_no', _inv.invoice_no,
    'payment_status', p_payment_status,
    'amount_paid', _new_paid,
    'amount_due', _new_due,
    'refund_amount', p_refund_amount,
    'refund_status', _refund_status
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_payment_and_refund(uuid, text, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_payment_and_refund(uuid, text, numeric, numeric, text) TO authenticated;

-- 10. SECURE LOOKUP ORDER INVOICE (FOR CUSTOMER & GUEST TRACKING)
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
  _invoice_json jsonb;
BEGIN
  _clean_phone := regexp_replace(_phone, '\D', '', 'g');
  IF length(_clean_phone) > 10 THEN
    _clean_phone := right(_clean_phone, 10);
  END IF;

  -- 1. Verify matching order exists
  SELECT id INTO _order_id
  FROM public.orders
  WHERE lower(order_no) = lower(trim(_order_no))
    AND (
      customer_phone LIKE ('%' || _clean_phone || '%')
      OR regexp_replace(customer_phone, '\D', '', 'g') = _clean_phone
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF _order_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Generate or retrieve existing invoice
  _invoice_json := public.generate_invoice_for_order(_order_id);
  RETURN _invoice_json;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order_invoice(text, text) TO anon, authenticated;

-- 11. Realtime Publication Integration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'invoices'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'billing_audit_logs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_audit_logs;
    END IF;
  END IF;
END $$;
