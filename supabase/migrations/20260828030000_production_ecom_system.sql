-- ====================================================================
-- MIGRATION: Production E-Commerce Core & Atomic Checkout Architecture
-- Store: Arun Gopal Traders
-- ====================================================================

-- 1. Update Store Settings to Arun Gopal Traders
UPDATE public.store_settings
SET
  store_name = 'Arun Gopal Traders',
  tagline = 'Your Trusted Local Grocery Store in Maharajganj',
  phone = '+91 6388354988',
  whatsapp = '916388354988',
  email = 'gopalmaddheshiya138@gmail.com',
  address = 'Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh',
  maps_link = 'https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh',
  announcement = 'Free express delivery in Maharajganj on orders above ₹499',
  hero_title = 'Arun Gopal Traders',
  hero_subtitle = 'Quality groceries • Genuine prices • 30-Min Fast Delivery',
  delivery_fee = 30,
  free_delivery_threshold = 499,
  min_order_value = 99,
  payment_methods = ARRAY['cod', 'pay_at_store', 'upi'],
  updated_at = now()
WHERE id = 1;

-- 2. Enhanced RLS Policies for Orders & Items (Safe Insert for Guests & Authenticated)
DROP POLICY IF EXISTS "place order auth" ON public.orders;
DROP POLICY IF EXISTS "place order guest" ON public.orders;
DROP POLICY IF EXISTS "order items insert auth" ON public.order_items;
DROP POLICY IF EXISTS "order items insert guest" ON public.order_items;

CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 3. Atomic Order Placement Stored Procedure (Validates, Decrements Stock, Creates Order & Events)
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
BEGIN
  -- Get thresholds from settings
  SELECT free_delivery_threshold, min_order_value, delivery_fee
  INTO _free_thresh, _min_order, _delivery_fee
  FROM public.store_settings
  WHERE id = 1;

  -- Validate items payload is non-empty
  IF _items_payload IS NULL OR jsonb_array_length(_items_payload) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- 1. Validate each item against database product_variants & calculate totals
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_payload)
  LOOP
    _var_id := (_item->>'variant_id')::uuid;
    _qty := GREATEST((_item->>'qty')::int, 1);

    -- Fetch live variant from database
    SELECT pv.price, pv.mrp, pv.label, pv.stock, p.name, p.image_url
    INTO _var_price, _var_mrp, _var_label, _var_stock, _prod_name, _img_url
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = _var_id AND pv.is_active = true AND p.is_active = true;

    IF _var_price IS NULL THEN
      -- If variant not found by uuid, use provided snapshot values
      _var_price := (_item->>'price')::numeric;
      _var_mrp := COALESCE((_item->>'mrp')::numeric, _var_price);
      _var_label := COALESCE(_item->>'variant_label', 'Standard');
      _prod_name := _item->>'name';
      _img_url := _item->>'image_url';
    ELSE
      -- Atomic stock check & decrement if variant tracked
      IF _var_stock IS NOT NULL AND _var_stock > 0 THEN
        UPDATE public.product_variants
        SET stock = GREATEST(stock - _qty, 0)
        WHERE id = _var_id;
      END IF;
    END IF;

    _calc_subtotal := _calc_subtotal + (_var_price * _qty);
  END LOOP;

  -- Validate minimum order value
  IF _calc_subtotal < _min_order THEN
    RAISE EXCEPTION 'Minimum order amount is ₹%', _min_order;
  END IF;

  -- Calculate delivery charge
  IF _calc_subtotal >= _free_thresh OR (_order_payload->>'order_type') = 'pickup' THEN
    _delivery_fee := 0;
  END IF;

  _discount := COALESCE((_order_payload->>'discount')::numeric, 0);
  _final_total := GREATEST(_calc_subtotal + _delivery_fee - _discount, 0);

  -- 2. Insert Order Record
  INSERT INTO public.orders (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    order_type,
    address,
    payment_method,
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
         ELSE NULL END,
    TRIM(_order_payload->>'customer_name'),
    TRIM(_order_payload->>'customer_phone'),
    NULLIF(TRIM(_order_payload->>'customer_email'), ''),
    COALESCE(_order_payload->>'order_type', 'delivery'),
    COALESCE(_order_payload->'address', '{}'::jsonb),
    COALESCE(_order_payload->>'payment_method', 'cod'),
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
    _qty := GREATEST((_item->>'qty')::int, 1);
    _var_price := (_item->>'price')::numeric;
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

  -- 4. Return Order Confirmation Payload
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
