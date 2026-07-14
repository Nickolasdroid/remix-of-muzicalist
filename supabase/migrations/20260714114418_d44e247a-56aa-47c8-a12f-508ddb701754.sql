CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE user_type = 'admin';
$$;

REVOKE ALL ON FUNCTION public.get_admin_user_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO anon, authenticated;