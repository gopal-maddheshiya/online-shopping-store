-- ====================================================================
-- MIGRATION: Admin Order Status & Customer Live Sync RPC Procedures
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Admin Update Order Status Procedure (SECURITY DEFINER to reliably update PostgreSQL)
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
  _updated_order record;
BEGIN
  -- 1. Validate status
  IF _new_status NOT IN ('placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'returned') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid order status value');
  END IF;

  -- 2. Update order row in public.orders
  UPDATE public.orders
  SET
    status = _new_status,
    notes = COALESCE(_note, notes),
    updated_at = now()
  WHERE id = _order_id
  RETURNING id, order_no, status, updated_at, notes INTO _updated_order;

  IF _updated_order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- 3. Insert audit log event
  INSERT INTO public.order_events (order_id, status, note, created_at)
  VALUES (_order_id, _new_status, COALESCE(_note, 'Status changed to ' || _new_status), now());

  RETURN jsonb_build_object(
    'success', true,
    'order_id', _updated_order.id,
    'order_no', _updated_order.order_no,
    'status', _updated_order.status,
    'updated_at', _updated_order.updated_at,
    'notes', _updated_order.notes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text, text) TO anon, authenticated;

-- 2. Admin Update Payment Status Procedure
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
  _updated_id uuid;
BEGIN
  IF _payment_status NOT IN ('pending', 'paid', 'failed', 'refunded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment status value');
  END IF;

  UPDATE public.orders
  SET
    payment_status = _payment_status,
    paid_at = CASE WHEN _payment_status = 'paid' THEN now() ELSE paid_at END,
    updated_at = now()
  WHERE id = _order_id
  RETURNING id INTO _updated_id;

  IF _updated_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', _updated_id, 'payment_status', _payment_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_payment_status(uuid, text) TO anon, authenticated;

-- 3. Comprehensive Admin All-Orders Fetch Procedure
CREATE OR REPLACE FUNCTION public.get_all_orders_for_admin()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(o) || jsonb_build_object(
        'order_items', COALESCE((SELECT jsonb_agg(to_jsonb(i)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb),
        'order_events', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at ASC) FROM public.order_events e WHERE e.order_id = o.id), '[]'::jsonb)
      )
      ORDER BY o.created_at DESC
    ),
    '[]'::jsonb
  ) INTO _result
  FROM public.orders o;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_orders_for_admin() TO anon, authenticated;
