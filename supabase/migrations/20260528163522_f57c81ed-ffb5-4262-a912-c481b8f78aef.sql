-- 1. Revoke column-level SELECT for sensitive fields
REVOKE SELECT (email, phone, stripe_customer_id, stripe_subscription_id, billing, subscription_status, subscription_current_period_end)
  ON public.profiles FROM anon, authenticated;

-- 2. RPC: get masked contact details for a given profile
CREATE OR REPLACE FUNCTION public.get_profile_contact(_profile_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_owner boolean := (v_caller IS NOT NULL AND v_caller = _profile_id);
  v_is_admin boolean := (v_caller IS NOT NULL AND public.is_admin(v_caller));
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN v_is_owner OR v_is_admin OR p.hide_email = false THEN p.email ELSE NULL END AS email,
    CASE WHEN v_is_owner OR v_is_admin OR p.hide_phone = false THEN p.phone ELSE NULL END AS phone
  FROM public.profiles p
  WHERE p.id = _profile_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_profile_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_contact(uuid) TO anon, authenticated;

-- 3. RPC: full own profile (owner only)
CREATE OR REPLACE FUNCTION public.get_my_full_profile()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.profiles WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_full_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_full_profile() TO authenticated;