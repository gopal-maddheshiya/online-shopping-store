-- ====================================================================
-- MIGRATION: Customer Self-Order Cancellation with Automatic Stock Restoration
-- Store: Arun Gopal Traders, Maharajganj
-- Allows cancellation only when status is 'placed'
-- Restores stock to product_variants and records audit in order_events
-- ====================================================================

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
  -- 1. Fetch target order
  SELECT * INTO _order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- 2. Verify order is in 'placed' status (cannot cancel after store preparation / dispatch)
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

  -- 3. Authorization check: Either authenticated user is owner/admin OR phone matches 10 digits
  _clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF length(_clean_phone) >= 10 THEN
    _clean_phone := right(_clean_phone, 10);
  END IF;

  _order_clean_phone := regexp_replace(COALESCE(_order.customer_phone, ''), '\D', '', 'g');
  IF length(_order_clean_phone) >= 10 THEN
    _order_clean_phone := right(_order_clean_phone, 10);
  END IF;

  IF auth.uid() IS NOT NULL AND _order.user_id = auth.uid() THEN
    -- Authorized by auth session
  ELSIF _clean_phone <> '' AND _clean_phone = _order_clean_phone THEN
    -- Authorized by verified customer phone
  ELSIF public.has_role(auth.uid(), 'admin') THEN
    -- Authorized by admin
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to cancel this order');
  END IF;

  -- 4. Update order status to 'cancelled'
  UPDATE public.orders
  SET status = 'cancelled',
      notes = COALESCE(_order.notes || E'\n', '') || 'Cancelled by customer: ' || COALESCE(p_reason, 'No reason specified'),
      updated_at = now()
  WHERE id = p_order_id;

  -- 5. Record order event
  INSERT INTO public.order_events (order_id, status, note, created_at)
  VALUES (
    p_order_id,
    'cancelled',
    'Order cancelled by customer: ' || COALESCE(p_reason, 'No reason specified'),
    now()
  );

  -- 6. Restore stock in product_variants
  FOR _item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    IF _item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = stock + _item.qty,
          updated_at = now()
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

-- Grant execution to anon (for guest tracking) and authenticated users
GRANT EXECUTE ON FUNCTION public.customer_cancel_order(uuid, text, text) TO anon, authenticated;
