
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  brand text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  image_url text,
  images text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sold_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX products_category_idx ON public.products(category_id);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  unit text,
  mrp numeric(10,2) NOT NULL,
  price numeric(10,2) NOT NULL,
  stock int NOT NULL DEFAULT 0,
  low_stock_threshold int NOT NULL DEFAULT 5,
  sku text,
  barcode text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "variants admin write" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX variants_product_idx ON public.product_variants(product_id);

-- ADDRESSES
CREATE TABLE public.addresses (
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
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());

-- WISHLIST
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlist FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('placed','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','rejected','returned');

CREATE SEQUENCE public.order_number_seq START 1001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE DEFAULT ('AGT-' || nextval('public.order_number_seq')::text),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  order_type text NOT NULL DEFAULT 'delivery',
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_method text NOT NULL DEFAULT 'cod',
  coupon_code text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'placed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "place order auth" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "place order guest" ON public.orders FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  name text NOT NULL,
  variant_label text,
  image_url text,
  mrp numeric(10,2) NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL,
  qty int NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order items insert auth" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL)));
CREATE POLICY "order items insert guest" ON public.order_items FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id IS NULL));

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT INSERT ON public.order_events TO anon;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order events read" ON public.order_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order events insert" ON public.order_events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_order_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_events(order_id, status) VALUES (NEW.id, NEW.status);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_events(order_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_event_insert AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_event();
CREATE TRIGGER orders_event_update AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_event();

-- guest / customer order lookup by order number + phone
CREATE OR REPLACE FUNCTION public.lookup_order(_order_no text, _phone text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  SELECT to_jsonb(o) || jsonb_build_object(
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(i)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb),
    'events', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at) FROM public.order_events e WHERE e.order_id = o.id), '[]'::jsonb)
  ) INTO result
  FROM public.orders o
  WHERE upper(o.order_no) = upper(trim(_order_no))
    AND right(regexp_replace(o.customer_phone,'\D','','g'),10) = right(regexp_replace(_phone,'\D','','g'),10);
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.lookup_order(text,text) TO anon, authenticated;

-- COUPONS
CREATE TABLE public.coupons (
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
CREATE POLICY "coupons public read" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "coupons admin" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- HELP REQUESTS
CREATE TABLE public.help_requests (
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
CREATE POLICY "help insert" ON public.help_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "help admin read" ON public.help_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "help admin update" ON public.help_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STORE SETTINGS (singleton)
CREATE TABLE public.store_settings (
  id int PRIMARY KEY DEFAULT 1,
  store_name text NOT NULL DEFAULT 'Arun Gopal Traders',
  tagline text NOT NULL DEFAULT 'Your Trusted Local Grocery Store',
  phone text NOT NULL DEFAULT '+916388354988',
  whatsapp text NOT NULL DEFAULT '916388354988',
  email text NOT NULL DEFAULT 'gopalmaddheshiya138@gmail.com',
  address text NOT NULL DEFAULT 'Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh',
  maps_link text NOT NULL DEFAULT 'https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh',
  announcement text DEFAULT 'Free home delivery in Maharajganj on orders above ₹499',
  hero_title text DEFAULT 'Arun Gopal Traders',
  hero_subtitle text DEFAULT 'Quality products • Genuine prices • Easy ordering',
  delivery_fee numeric(10,2) NOT NULL DEFAULT 30,
  free_delivery_threshold numeric(10,2) NOT NULL DEFAULT 499,
  min_order_value numeric(10,2) NOT NULL DEFAULT 99,
  payment_methods text[] NOT NULL DEFAULT ARRAY['cod','pay_at_store','upi'],
  business_hours jsonb NOT NULL DEFAULT '{"mon":{"open":"07:00","close":"21:00","closed":false},"tue":{"open":"07:00","close":"21:00","closed":false},"wed":{"open":"07:00","close":"21:00","closed":false},"thu":{"open":"07:00","close":"21:00","closed":false},"fri":{"open":"07:00","close":"21:00","closed":false},"sat":{"open":"07:00","close":"21:00","closed":false},"sun":{"open":"08:00","close":"14:00","closed":false}}'::jsonb,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE, INSERT ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.store_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.store_settings (id) VALUES (1);

-- admin customer directory (aggregated, admin-only)
CREATE OR REPLACE FUNCTION public.admin_customers()
RETURNS TABLE (customer_phone text, customer_name text, customer_email text, orders_count bigint, total_spent numeric, last_order timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.customer_phone,
         (array_agg(o.customer_name ORDER BY o.created_at DESC))[1],
         (array_agg(o.customer_email ORDER BY o.created_at DESC))[1],
         count(*), COALESCE(sum(o.total),0), max(o.created_at)
  FROM public.orders o
  WHERE public.has_role(auth.uid(),'admin')
  GROUP BY o.customer_phone
  ORDER BY max(o.created_at) DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_customers() TO authenticated;
