-- Tighten access: anon and authenticated can no longer read the email/phone columns of profiles directly.
-- Owners still read their own row via the SECURITY DEFINER function get_my_full_profile,
-- and anyone can fetch contact info via get_profile_contact (which honours hide_email/hide_phone).
REVOKE SELECT (email, phone) ON public.profiles FROM anon, authenticated, PUBLIC;

-- Admin helper to fetch basic profile info (including email) for the verification review screen.
CREATE OR REPLACE FUNCTION public.admin_get_profiles_basic(_ids uuid[])
RETURNS TABLE(id uuid, stage_name text, email text, avatar_url text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.stage_name, p.email, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_ids);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_get_profiles_basic(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_profiles_basic(uuid[]) TO authenticated, service_role;