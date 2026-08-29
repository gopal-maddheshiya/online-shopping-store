-- =========================================================================
-- Enable Supabase Realtime Publication & Replica Identity FULL
-- Ensures all DB updates (Admin, Table Editor, SQL, RPCs) emit live WAL events
-- =========================================================================

-- 1. Set REPLICA IDENTITY FULL so all modified columns are sent in Realtime payloads
ALTER TABLE IF EXISTS public.products REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.product_variants REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.categories REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.order_items REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.order_events REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.store_settings REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.coupons REPLICA IDENTITY FULL;

-- 2. Add all core tables to supabase_realtime publication
DO $$
BEGIN
  -- products
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  -- product_variants
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'product_variants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
  END IF;

  -- categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  -- orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- order_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;

  -- order_events
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
  END IF;

  -- store_settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
  END IF;

  -- coupons
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coupons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  END IF;
END $$;
