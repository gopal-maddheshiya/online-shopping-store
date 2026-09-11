-- ====================================================================
-- MIGRATION: Lockdown Admin RPC & user_roles Security
-- Store: Arun Gopal Traders
-- Prevents unauthenticated/anon callers from executing get_all_orders_for_admin
-- Prevents unauthorized users from escalating privileges via user_roles
-- ====================================================================

-- 1. Redefine get_all_orders_for_admin with strict authorization guard
CREATE OR REPLACE FUNCTION public.get_all_orders_for_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _result jsonb;
BEGIN
  -- Strict security guard: Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Strict security guard: Caller must have 'admin' role or be designated store owner
  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR (auth.jwt() ->> 'email') = 'gopalmaddheshiya138@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required' USING ERRCODE = '42501';
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
      'status', o.status,
      'notes', o.notes,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'invoice_no', o.invoice_no,
      'order_items', COALESCE(
        (
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
          )
          FROM public.order_items oi
          WHERE oi.order_id = o.id
        ),
        '[]'::jsonb
      ),
      'order_events', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', oe.id,
              'order_id', oe.order_id,
              'status', oe.status,
              'note', oe.note,
              'created_at', oe.created_at
            )
          )
          FROM public.order_events oe
          WHERE oe.order_id = o.id
        ),
        '[]'::jsonb
      )
    ) ORDER BY o.created_at DESC
  ) INTO _result
  FROM public.orders o;

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-- 2. Revoke execution from anon; allow ONLY authenticated users (checked inside function)
REVOKE EXECUTE ON FUNCTION public.get_all_orders_for_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_all_orders_for_admin() TO authenticated;

-- 3. Lock down public.user_roles to prevent privilege escalation
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
