-- ====================================================================
-- MIGRATION: Seed Admin User Role & Grant Full Database Permissions
-- User Phone: +916388354988
-- User ID: f71e956d-3fe8-4302-8717-f5df4a9ddb06
-- ====================================================================

-- 1. Insert admin role for Arun Gopal Traders store owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('f71e956d-3fe8-4302-8717-f5df4a9ddb06', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Also insert for any user matching the admin phone number
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE phone IN ('+916388354988', '6388354988', '+919621617360', '9621617360')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Ensure table permissions
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_events TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
