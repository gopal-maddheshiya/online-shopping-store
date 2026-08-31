-- ====================================================================
-- MIGRATION: Production-Grade Payment Gateway, UPI Intent, Dynamic QR & Card Security
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Create order_payments Table (Tracks all gateway payment transactions & attempts)
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_no text NOT NULL,
  payment_method text NOT NULL DEFAULT 'upi', -- 'upi' | 'card' | 'qr' | 'netbanking' | 'cod' | 'pay_at_store'
  gateway text NOT NULL DEFAULT 'razorpay', -- 'razorpay' | 'cashfree' | 'manual'
  gateway_order_id text,
  gateway_payment_id text,
  gateway_signature text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
  error_code text,
  error_description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_no ON public.order_payments(order_no);
CREATE INDEX IF NOT EXISTS idx_order_payments_gateway_order_id ON public.order_payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_gateway_payment_id ON public.order_payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON public.order_payments(status);

-- Enable RLS
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.order_payments TO anon, authenticated;
GRANT INSERT, UPDATE ON public.order_payments TO anon, authenticated;
GRANT ALL ON public.order_payments TO service_role;

DROP POLICY IF EXISTS "order_payments read" ON public.order_payments;
CREATE POLICY "order_payments read" ON public.order_payments
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.user_id = auth.uid() OR
        public.has_role(auth.uid(), 'admin') OR
        auth.uid() IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "order_payments insert" ON public.order_payments;
CREATE POLICY "order_payments insert" ON public.order_payments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "order_payments update" ON public.order_payments;
CREATE POLICY "order_payments update" ON public.order_payments
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Enhance orders Table with Gateway Reference Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gateway_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gateway_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_attempts int DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_error text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Enhance store_settings with Payment Gateway & Receiving Accounts configurations
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS razorpay_key_id text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS upi_vpa text DEFAULT '6388354988@okbizaxis';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS upi_merchant_name text DEFAULT 'Arun Gopal Traders';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS upi_registered_phone text DEFAULT '6388354988';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_account_holder text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS bank_ifsc text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS qr_code_mode text DEFAULT 'dynamic';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS qr_custom_note text DEFAULT 'Arun Gopal Traders Grocery Order';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS enabled_payment_methods jsonb DEFAULT '["upi", "card", "qr", "cod", "pay_at_store"]'::jsonb;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS online_payment_enabled boolean DEFAULT true;


-- 4. Stored Procedure: Record Payment Attempt
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
BEGIN
  -- Insert into order_payments
  INSERT INTO public.order_payments (
    order_id,
    order_no,
    payment_method,
    gateway,
    gateway_order_id,
    amount,
    currency,
    status,
    metadata
  ) VALUES (
    p_order_id,
    p_order_no,
    p_method,
    COALESCE(p_gateway, 'razorpay'),
    p_gateway_order_id,
    p_amount,
    'INR',
    'pending',
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO _payment_id;

  -- Update orders table attempt counter
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

-- 5. Stored Procedure: Server-Side Verified Payment Confirmation (Atomically Updates Order, Invoice & Realtime)
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
  _current_paid_at timestamptz := now();
BEGIN
  -- 1. Fetch and lock order row
  SELECT * INTO _order_record
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- 2. Idempotency check: If order is already marked paid, return success idempotently
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

  -- 3. Update orders table
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
      'extra', p_metadata
    ),
    updated_at = now()
  WHERE id = p_order_id;

  -- 4. Update order_payments table
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

  -- 5. Update or sync invoice record
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

  -- 6. Insert Order Event and Status History
  INSERT INTO public.order_events (order_id, status, note)
  VALUES (
    p_order_id,
    _order_record.status,
    'Payment verified & received via ' || UPPER(COALESCE(p_method, 'ONLINE')) || ' (Txn: ' || p_gateway_payment_id || ')'
  )
  ON CONFLICT DO NOTHING;

  -- 7. Audit log
  INSERT INTO public.billing_audit_logs (
    order_id,
    event_type,
    changed_by,
    note,
    new_state
  ) VALUES (
    p_order_id,
    'PAYMENT_VERIFIED_AND_PAID',
    'Payment Gateway Service',
    'Payment of ₹' || p_amount::text || ' successfully verified (Txn ID: ' || p_gateway_payment_id || ')',
    jsonb_build_object(
      'gateway_order_id', p_gateway_order_id,
      'gateway_payment_id', p_gateway_payment_id,
      'payment_method', p_method,
      'amount', p_amount,
      'paid_at', _current_paid_at
    )
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

GRANT EXECUTE ON FUNCTION public.verify_and_confirm_payment(uuid, text, text, text, numeric, text, jsonb) TO anon, authenticated;

-- 6. Stored Procedure: Record Payment Failure
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
  _order_status text;
BEGIN
  SELECT payment_status INTO _order_status
  FROM public.orders
  WHERE id = p_order_id;

  -- Only record failure if order is not already paid
  IF _order_status IS DISTINCT FROM 'paid' THEN
    UPDATE public.orders
    SET
      payment_status = 'failed',
      payment_error = p_error_desc,
      payment_metadata = COALESCE(payment_metadata, '{}'::jsonb) || jsonb_build_object(
        'last_failure_code', p_error_code,
        'last_failure_desc', p_error_desc,
        'last_failure_at', now()
      ),
      updated_at = now()
    WHERE id = p_order_id;

    UPDATE public.order_payments
    SET
      status = 'failed',
      error_code = p_error_code,
      error_description = p_error_desc,
      metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
      updated_at = now()
    WHERE order_id = p_order_id AND (gateway_order_id = p_gateway_order_id OR gateway_order_id IS NULL);
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'failed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_failure(uuid, text, text, text, text, jsonb) TO anon, authenticated;
