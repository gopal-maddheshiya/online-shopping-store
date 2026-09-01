-- ====================================================================
-- MIGRATION: Fix Admin RLS Policies for Categories & Products
-- Store: Arun Gopal Traders
-- Issue: Categories and Products couldn't be updated/deleted by admins
-- ====================================================================

-- 1. Fix Categories RLS Policies
-- Drop incomplete policies
DROP POLICY IF EXISTS "categories public read" ON public.categories;
DROP POLICY IF EXISTS "categories admin write" ON public.categories;

-- Create proper RLS policies for categories
CREATE POLICY "categories_select_all"
ON public.categories FOR SELECT
TO public
USING (true);

CREATE POLICY "categories_insert_authenticated"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "categories_update_authenticated"
ON public.categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "categories_delete_authenticated"
ON public.categories FOR DELETE
TO authenticated
USING (true);

-- 2. Fix Products RLS Policies
-- Drop incomplete policies
DROP POLICY IF EXISTS "products public read" ON public.products;
DROP POLICY IF EXISTS "products admin write" ON public.products;
DROP POLICY IF EXISTS "products_admin_write" ON public.products;

-- Create proper RLS policies for products
CREATE POLICY "products_select_all"
ON public.products FOR SELECT
TO public
USING (true);

CREATE POLICY "products_insert_authenticated"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "products_update_authenticated"
ON public.products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "products_delete_authenticated"
ON public.products FOR DELETE
TO authenticated
USING (true);

-- 3. Fix Product Variants RLS Policies
DROP POLICY IF EXISTS "product_variants_admin_write" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants public read" ON public.product_variants;

CREATE POLICY "product_variants_select_all"
ON public.product_variants FOR SELECT
TO public
USING (true);

CREATE POLICY "product_variants_insert_authenticated"
ON public.product_variants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "product_variants_update_authenticated"
ON public.product_variants FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "product_variants_delete_authenticated"
ON public.product_variants FOR DELETE
TO authenticated
USING (true);

-- 4. Grant explicit permissions
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
