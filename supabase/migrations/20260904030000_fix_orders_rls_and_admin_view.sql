-- ====================================================================
-- MIGRATION: Fix Orders RLS, Guest Checkouts & Grant Full Admin Visibility
-- Store: Arun Gopal Traders
-- Admin: gopalmaddheshiya138@gmail.com / +91 6388354988
-- ====================================================================

-- 1. Ensure public.user_roles has the Admin assigned
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'gopalmaddheshiya138@gmail.com'
   OR phone IN ('+916388354988', '6388354988', '+919621617360', '9621617360', '+918960908972', '8960908972')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also explicitly assign to Gopal's known user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('3246a6a6-bceb-4112-8841-803bd01608f5', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Allow unrestricted INSERT on orders (for both logged-in users & guest checkout)
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "place order auth" ON public.orders;
DROP POLICY IF EXISTS "place order guest" ON public.orders;

CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 3. Allow unrestricted INSERT on order_items
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order items insert auth" ON public.order_items;
DROP POLICY IF EXISTS "order items insert guest" ON public.order_items;

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 4. Allow unrestricted INSERT on order_events
DROP POLICY IF EXISTS "order_events_insert_policy" ON public.order_events;
DROP POLICY IF EXISTS "order events insert" ON public.order_events;

CREATE POLICY "order_events_insert_policy" ON public.order_events
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 5. Fix SELECT policy on orders so admin can view ALL orders
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "own orders read" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (auth.jwt() ->> 'email') = 'gopalmaddheshiya138@gmail.com'
);

-- 6. Fix SELECT policy on order_items
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order items read" ON public.order_items;

CREATE POLICY "order_items_select_policy" ON public.order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR (auth.jwt() ->> 'email') = 'gopalmaddheshiya138@gmail.com'
    )
  )
);

-- 7. Fix UPDATE policy on orders
DROP POLICY IF EXISTS "admin update orders" ON public.orders;

CREATE POLICY "admin update orders" ON public.orders
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (auth.jwt() ->> 'email') = 'gopalmaddheshiya138@gmail.com'
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (auth.jwt() ->> 'email') = 'gopalmaddheshiya138@gmail.com'
);

-- 8. Stored Procedure: get_all_orders_for_admin (SECURITY DEFINER)
-- Bypasses RLS to guarantee store owner always sees every order with complete item snapshots
CREATE OR REPLACE FUNCTION public.get_all_orders_for_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _result jsonb;
BEGIN
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

GRANT EXECUTE ON FUNCTION public.get_all_orders_for_admin() TO authenticated, anon;

-- 9. Table level grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_events TO authenticated;
GRANT INSERT ON public.order_events TO anon;
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
