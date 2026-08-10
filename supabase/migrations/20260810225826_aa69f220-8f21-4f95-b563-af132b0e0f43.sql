ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz;

ALTER TABLE public.consumed_ad_slots
  ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_promoted_until ON public.posts (promoted_until DESC NULLS LAST);

-- Billing period start (mirrors client logic: period_end minus 1 month/year, else start of month)
CREATE OR REPLACE FUNCTION public.billing_period_start(_user_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end timestamptz;
  v_billing text;
  v_start timestamptz;
BEGIN
  SELECT subscription_current_period_end, billing INTO v_end, v_billing
  FROM public.profiles WHERE id = _user_id;

  IF v_end IS NULL THEN
    RETURN date_trunc('month', now());
  END IF;

  IF v_billing = 'yearly' THEN
    v_start := v_end - interval '1 year';
  ELSE
    v_start := v_end - interval '1 month';
  END IF;

  IF v_start > now() THEN
    RETURN date_trunc('month', now());
  END IF;
  RETURN v_start;
END;
$$;

-- Prevent clients from setting promotion status directly
CREATE OR REPLACE FUNCTION public.protect_post_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_service boolean := false;
BEGIN
  BEGIN
    v_is_service := current_setting('request.jwt.claim.role', true) = 'service_role';
  EXCEPTION WHEN others THEN
    v_is_service := false;
  END;

  IF v_is_service OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid())) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.promoted_at := NULL;
    NEW.promoted_until := NULL;
  ELSE
    NEW.promoted_at := OLD.promoted_at;
    NEW.promoted_until := OLD.promoted_until;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_post_promotion_trg ON public.posts;
CREATE TRIGGER protect_post_promotion_trg
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.protect_post_promotion();

-- Promote an existing post using one monthly promotion entitlement
CREATE OR REPLACE FUNCTION public.promote_post(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_plan text;
  v_limit int;
  v_used int;
  v_start timestamptz;
  v_until timestamptz;
  v_promoted_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT profile_id, promoted_until INTO v_owner, v_promoted_until
  FROM public.posts WHERE id = p_post_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  IF v_owner <> v_uid THEN
    RAISE EXCEPTION 'Not authorized to promote this post';
  END IF;
  IF v_promoted_until IS NOT NULL AND v_promoted_until > now() THEN
    RAISE EXCEPTION 'Post is already promoted';
  END IF;

  SELECT COALESCE(plan, 'Free') INTO v_plan FROM public.profiles WHERE id = v_uid;
  v_limit := CASE v_plan WHEN 'Premium' THEN 5 WHEN 'Standard' THEN 2 ELSE 0 END;

  IF public.is_admin(v_uid) THEN
    v_limit := 1000000;
  END IF;

  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'Your plan does not include post promotions';
  END IF;

  v_start := public.billing_period_start(v_uid);

  SELECT count(*) INTO v_used
  FROM public.consumed_ad_slots
  WHERE profile_id = v_uid AND kind = 'promotion' AND consumed_at >= v_start;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'No promotions available this month';
  END IF;

  v_until := now() + interval '15 days';

  UPDATE public.posts
  SET promoted_at = now(), promoted_until = v_until, updated_at = now()
  WHERE id = p_post_id;

  INSERT INTO public.consumed_ad_slots (profile_id, is_premium, kind, post_id, consumed_at)
  VALUES (v_uid, false, 'promotion', p_post_id, now());

  RETURN jsonb_build_object(
    'promoted_until', v_until,
    'used', v_used + 1,
    'limit', v_limit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.promote_post(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.promote_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_period_start(uuid) TO authenticated, service_role;