-- ====================================================================
-- MIGRATION: Secure Admin Order Management & Live Status Sync System
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Ensure order_status_history Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by text DEFAULT 'System',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

GRANT SELECT, INSERT ON public.order_status_history TO anon, authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status history read own" ON public.order_status_history;
CREATE POLICY "status history read own" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

DROP POLICY IF EXISTS "status history insert" ON public.order_status_history;
CREATE POLICY "status history insert" ON public.order_status_history FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 2. Ensure payment_status and extra columns on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 3. Automatic Status History Logging Trigger
CREATE OR REPLACE FUNCTION public.log_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor text := 'System';
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF public.has_role(auth.uid(), 'admin') THEN
      _actor := 'Store Admin';
    ELSE
      _actor := 'Customer';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history(order_id, previous_status, new_status, changed_by, note)
    VALUES (NEW.id, NULL, NEW.status::text, _actor, 'Order placed successfully');

    INSERT INTO public.order_events(order_id, status, note)
    VALUES (NEW.id, NEW.status, 'Order placed successfully')
    ON CONFLICT DO NOTHING;

  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, previous_status, new_status, changed_by, note)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, _actor, COALESCE(NEW.notes, 'Status updated to ' || NEW.status::text));

    INSERT INTO public.order_events(order_id, status, note)
    VALUES (NEW.id, NEW.status, COALESCE(NEW.notes, 'Status updated to ' || NEW.status::text))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_status_transition_trigger ON public.orders;
CREATE TRIGGER orders_status_transition_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_transition();

-- 4. Atomic Order Placement Stored Procedure (Validates, Snapshots Historical Prices & Places Order)
CREATE OR REPLACE FUNCTION public.place_order(
  _order_payload jsonb,
  _items_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- 3. Insert Order Items Snapshots (Preserving Historical Price)
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

  -- 4. Return Order Result Payload
  RETURN jsonb_build_object(
    'success', true,
    'order_id', _new_order_id,
    'order_no', _new_order_no,
    'total', _final_total,
    'subtotal', _calc_subtotal,
    'delivery_fee', _delivery_fee,
    'discount', _discount,
    'status', 'placed'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;

-- 5. Admin Update Order Status Stored Procedure (RBAC Protected)
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  _order_id uuid,
  _new_status text,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  _is_admin boolean := false;
  _old_status text;
  _order_no text;
  _valid_status public.order_status;
  _actor text := 'Store Admin';
BEGIN
  -- Verify Admin authorization via PostgreSQL RBAC
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    _is_admin := true;
  END IF;

  IF NOT _is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin role privileges required.'
    );
  END IF;

  -- Validate Enum status mapping
  BEGIN
    _valid_status := _new_status::public.order_status;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid status: ' || _new_status
    );
  END;

  SELECT status::text, order_no INTO _old_status, _order_no
  FROM public.orders
  WHERE id = _order_id;

  IF _old_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found with ID ' || _order_id::text
    );
  END IF;

  -- Perform Status Update
  UPDATE public.orders
  SET status = _valid_status,
      notes = COALESCE(_note, notes),
      updated_at = now()
  WHERE id = _order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', _order_id,
    'order_no', _order_no,
    'previous_status', _old_status,
    'new_status', _valid_status::text,
    'updated_at', now()
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text, text) TO authenticated;


-- 6. Secure Customer Order Lookup RPC (Matches Order No + 10-digit Phone)
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
  _history jsonb;
  _clean_phone text;
BEGIN
  _clean_phone := regexp_replace(_phone, '\D', '', 'g');
  IF length(_clean_phone) > 10 THEN
    _clean_phone := right(_clean_phone, 10);
  END IF;

  SELECT *
  INTO _order
  FROM public.orders
  WHERE lower(order_no) = lower(trim(_order_no))
    AND (
      customer_phone LIKE ('%' || _clean_phone || '%')
      OR regexp_replace(customer_phone, '\D', '', 'g') = _clean_phone
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF _order.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'order_id', oi.order_id,
      'product_id', oi.product_id,
      'variant_id', oi.variant_id,
      'name', oi.name,
      'variant_label', oi.variant_label,
      'image_url', oi.image_url,
      'mrp', oi.mrp,
      'price', oi.price,
      'qty', oi.qty
    )
  ) INTO _items
  FROM public.order_items oi
  WHERE oi.order_id = _order.id;

  -- Fetch status history timeline
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', h.id,
      'order_id', h.order_id,
      'status', h.new_status,
      'previous_status', h.previous_status,
      'changed_by', h.changed_by,
      'note', h.note,
      'created_at', h.created_at
    ) ORDER BY h.created_at ASC
  ) INTO _history
  FROM public.order_status_history h
  WHERE h.order_id = _order.id;

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
    'created_at', _order.created_at,
    'updated_at', _order.updated_at,
    'order_items', COALESCE(_items, '[]'::jsonb),
    'order_events', COALESCE(_history, '[]'::jsonb),
    'order_status_history', COALESCE(_history, '[]'::jsonb)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated;

-- 7. Get Customer Orders Secure RPC (For /account and Order History)
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
  _clean_phone text;
  _result jsonb;
BEGIN
  IF _phone IS NOT NULL THEN
    _clean_phone := regexp_replace(_phone, '\D', '', 'g');
    IF length(_clean_phone) > 10 THEN
      _clean_phone := right(_clean_phone, 10);
    END IF;
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
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'order_items', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'name', oi.name,
            'variant_label', oi.variant_label,
            'image_url', oi.image_url,
            'mrp', oi.mrp,
            'price', oi.price,
            'qty', oi.qty
          )
        ) FROM public.order_items oi WHERE oi.order_id = o.id
      ),
      'order_events', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', h.id,
            'status', h.new_status,
            'note', h.note,
            'created_at', h.created_at
          ) ORDER BY h.created_at ASC
        ) FROM public.order_status_history h WHERE h.order_id = o.id
      )
    ) ORDER BY o.created_at DESC
  ) INTO _result
  FROM public.orders o
  WHERE (
    (_user_id IS NOT NULL AND o.user_id = _user_id)
    OR (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
    OR (_clean_phone IS NOT NULL AND (o.customer_phone LIKE ('%' || _clean_phone || '%') OR regexp_replace(o.customer_phone, '\D', '', 'g') = _clean_phone))
  );

  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(text, uuid) TO anon, authenticated;

-- 8. Get Admin Dashboard Real Analytics RPC
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  _is_admin boolean := false;
  _total_orders int := 0;
  _placed_count int := 0;
  _confirmed_count int := 0;
  _preparing_count int := 0;
  _ready_count int := 0;
  _out_delivery_count int := 0;
  _delivered_count int := 0;
  _cancelled_count int := 0;
  _today_orders int := 0;
  _today_sales numeric(10,2) := 0;
  _total_sales numeric(10,2) := 0;
  _total_customers int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    _is_admin := true;
  END IF;

  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required.');
  END IF;

  SELECT COUNT(*) INTO _total_orders FROM public.orders;
  SELECT COUNT(*) INTO _placed_count FROM public.orders WHERE status IN ('placed');
  SELECT COUNT(*) INTO _confirmed_count FROM public.orders WHERE status IN ('confirmed');
  SELECT COUNT(*) INTO _preparing_count FROM public.orders WHERE status IN ('preparing');
  SELECT COUNT(*) INTO _ready_count FROM public.orders WHERE status IN ('ready');
  SELECT COUNT(*) INTO _out_delivery_count FROM public.orders WHERE status IN ('out_for_delivery');
  SELECT COUNT(*) INTO _delivered_count FROM public.orders WHERE status IN ('delivered');
  SELECT COUNT(*) INTO _cancelled_count FROM public.orders WHERE status IN ('cancelled', 'rejected', 'returned');

  -- Today's stats (IST midnight / UTC offset)
  SELECT COUNT(*), COALESCE(SUM(total), 0)
  INTO _today_orders, _today_sales
  FROM public.orders
  WHERE created_at >= (now() - interval '24 hours');

  SELECT COALESCE(SUM(total), 0) INTO _total_sales FROM public.orders WHERE status != 'cancelled';
  SELECT COUNT(DISTINCT customer_phone) INTO _total_customers FROM public.orders;

  RETURN jsonb_build_object(
    'success', true,
    'total_orders', _total_orders,
    'placed', _placed_count,
    'confirmed', _confirmed_count,
    'preparing', _preparing_count,
    'ready', _ready_count,
    'out_for_delivery', _out_delivery_count,
    'delivered', _delivered_count,
    'cancelled', _cancelled_count,
    'today_orders', _today_orders,
    'today_sales', _today_sales,
    'total_sales', _total_sales,
    'total_customers', _total_customers
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- 9. Promote Store Owner Account to Admin Role
CREATE OR REPLACE FUNCTION public.promote_owner_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Restrict to store owner's verified phone/email
  SELECT id INTO v_user_id FROM auth.users
  WHERE phone LIKE '%6388354988%' OR email = 'gopalmaddheshiya138@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'role', 'admin');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Store owner user account not found.');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.promote_owner_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_owner_account() TO authenticated;

-- 10. Realtime Publication Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;


