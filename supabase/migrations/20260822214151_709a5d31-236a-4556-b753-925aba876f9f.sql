CREATE OR REPLACE FUNCTION public.protect_post_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_service boolean := false;
  v_ctx text := '';
BEGIN
  BEGIN
    v_is_service := current_setting('request.jwt.claim.role', true) = 'service_role';
  EXCEPTION WHEN others THEN
    v_is_service := false;
  END;

  BEGIN
    v_ctx := coalesce(current_setting('app.promotion_ctx', true), '');
  EXCEPTION WHEN others THEN
    v_ctx := '';
  END;

  IF v_is_service OR v_ctx = 'on' OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid())) THEN
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

CREATE OR REPLACE FUNCTION public.protect_announcement_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_service boolean := false;
  v_ctx text := '';
BEGIN
  BEGIN
    v_is_service := current_setting('request.jwt.claim.role', true) = 'service_role';
  EXCEPTION WHEN others THEN
    v_is_service := false;
  END;

  BEGIN
    v_ctx := coalesce(current_setting('app.promotion_ctx', true), '');
  EXCEPTION WHEN others THEN
    v_ctx := '';
  END;

  IF v_is_service OR v_ctx = 'on' OR (auth.uid() IS NOT NULL AND public.is_admin(auth.uid())) THEN
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

  PERFORM set_config('app.promotion_ctx', 'on', true);

  UPDATE public.posts
  SET promoted_at = now(), promoted_until = v_until, updated_at = now()
  WHERE id = p_post_id;

  INSERT INTO public.consumed_ad_slots (profile_id, is_premium, kind, post_id, consumed_at)
  VALUES (v_uid, false, 'promotion', p_post_id, now());

  PERFORM set_config('app.promotion_ctx', '', true);

  RETURN jsonb_build_object(
    'promoted_until', v_until,
    'used', v_used + 1,
    'limit', v_limit
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_announcement(p_announcement_id uuid)
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
  FROM public.announcements WHERE id = p_announcement_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Announcement not found';
  END IF;
  IF v_owner <> v_uid THEN
    RAISE EXCEPTION 'Not authorized to promote this announcement';
  END IF;
  IF v_promoted_until IS NOT NULL AND v_promoted_until > now() THEN
    RAISE EXCEPTION 'Announcement is already promoted';
  END IF;

  SELECT COALESCE(plan, 'Free') INTO v_plan FROM public.profiles WHERE id = v_uid;
  v_limit := CASE v_plan WHEN 'Premium' THEN 3 WHEN 'Standard' THEN 1 ELSE 0 END;

  IF public.is_admin(v_uid) THEN
    v_limit := 1000000;
  END IF;

  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'Your plan does not include announcement promotions';
  END IF;

  v_start := public.billing_period_start(v_uid);

  SELECT count(*) INTO v_used
  FROM public.consumed_ad_slots
  WHERE profile_id = v_uid AND kind = 'announcement_promotion' AND consumed_at >= v_start;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'No announcement promotions available this period';
  END IF;

  v_until := now() + interval '15 days';

  PERFORM set_config('app.promotion_ctx', 'on', true);

  UPDATE public.announcements
  SET promoted_at = now(), promoted_until = v_until, updated_at = now()
  WHERE id = p_announcement_id;

  INSERT INTO public.consumed_ad_slots (profile_id, is_premium, kind, announcement_id, consumed_at)
  VALUES (v_uid, false, 'announcement_promotion', p_announcement_id, now());

  PERFORM set_config('app.promotion_ctx', '', true);

  RETURN jsonb_build_object(
    'promoted_until', v_until,
    'used', v_used + 1,
    'limit', v_limit
  );
END;
$$;