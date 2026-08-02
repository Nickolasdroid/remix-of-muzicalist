-- Self-service downgrade to Free (only for users without an active Stripe customer)
CREATE OR REPLACE FUNCTION public.self_downgrade_to_free()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT stripe_customer_id INTO v_customer FROM public.profiles WHERE id = auth.uid();
  IF v_customer IS NOT NULL THEN
    RAISE EXCEPTION 'Manage your plan through the billing portal';
  END IF;

  UPDATE public.profiles
  SET plan = 'Free', billing = NULL, subscription_status = NULL
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.self_downgrade_to_free() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.self_downgrade_to_free() TO authenticated;

-- Admin-only plan change
CREATE OR REPLACE FUNCTION public.admin_set_profile_plan(_profile_id uuid, _plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _plan NOT IN ('Free', 'Standard', 'Premium') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;

  UPDATE public.profiles SET plan = _plan WHERE id = _profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_plan(uuid, text) TO authenticated;