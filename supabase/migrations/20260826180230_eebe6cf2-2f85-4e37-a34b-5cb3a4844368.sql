
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_order_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.lookup_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_customers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_customers() TO authenticated;
