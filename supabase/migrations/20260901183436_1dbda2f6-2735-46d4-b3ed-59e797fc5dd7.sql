-- 1. Authoritative effective plan
CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan text;
  v_status text;
  v_end timestamptz;
BEGIN
  SELECT COALESCE(plan, 'Free'), subscription_status, subscription_current_period_end
    INTO v_plan, v_status, v_end
  FROM public.profiles WHERE id = _user_id;

  IF v_plan IS NULL OR v_plan = 'Free' THEN
    RETURN 'Free';
  END IF;

  IF v_status IS NULL THEN
    -- legacy / manually assigned plans without Stripe data
    RETURN v_plan;
  END IF;

  IF v_status IN ('active', 'trialing') THEN
    RETURN v_plan;
  END IF;

  IF v_status = 'past_due' THEN
    IF v_end IS NOT NULL AND now() <= (v_end + interval '7 days') THEN
      RETURN v_plan;
    END IF;
    RETURN 'Free';
  END IF;

  RETURN 'Free';
END;
$$;

-- 2. Single definition of plan limits
CREATE OR REPLACE FUNCTION public.plan_limits(_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE COALESCE(_plan, 'Free')
    WHEN 'Premium' THEN jsonb_build_object(
      'posts', 30, 'announcements', 10,
      'post_promotions', 5, 'announcement_promotions', 3,
      'gallery_images', 15, 'gallery_videos', 5,
      'pricing_entries', 3, 'social_links', 5)
    WHEN 'Standard' THEN jsonb_build_object(
      'posts', 15, 'announcements', 5,
      'post_promotions', 2, 'announcement_promotions', 1,
      'gallery_images', 10, 'gallery_videos', 3,
      'pricing_entries', 3, 'social_links', 5)
    ELSE jsonb_build_object(
      'posts', 0, 'announcements', 0,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 5, 'gallery_videos', 0,
      'pricing_entries', 0, 'social_links', 1)
  END;
$$;

CREATE OR REPLACE FUNCTION public.plan_limit(_user_id uuid, _key text)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN public.is_admin(_user_id) THEN 1000000
              ELSE (public.plan_limits(public.effective_plan(_user_id)) ->> _key)::int END;
$$;

-- 3. Creation quotas enforced server-side
CREATE OR REPLACE FUNCTION public.enforce_post_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit int;
  v_used int;
BEGIN
  v_limit := public.plan_limit(NEW.profile_id, 'posts');
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'POST_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_used
  FROM public.posts
  WHERE profile_id = NEW.profile_id
    AND created_at >= public.billing_period_start(NEW.profile_id);

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'POST_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_post_quota_trg ON public.posts;
CREATE TRIGGER enforce_post_quota_trg
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.enforce_post_quota();

CREATE OR REPLACE FUNCTION public.enforce_announcement_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit int;
  v_used int;
BEGIN
  v_limit := public.plan_limit(NEW.profile_id, 'announcements');
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_used
  FROM public.announcements
  WHERE profile_id = NEW.profile_id
    AND created_at >= public.billing_period_start(NEW.profile_id);

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_announcement_quota_trg ON public.announcements;
CREATE TRIGGER enforce_announcement_quota_trg
BEFORE INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.enforce_announcement_quota();

CREATE OR REPLACE FUNCTION public.enforce_gallery_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit int;
  v_used int;
BEGIN
  IF NEW.type = 'video' THEN
    v_limit := public.plan_limit(NEW.profile_id, 'gallery_videos');
  ELSE
    v_limit := public.plan_limit(NEW.profile_id, 'gallery_images');
  END IF;

  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'GALLERY_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_used
  FROM public.gallery_items
  WHERE profile_id = NEW.profile_id AND type = NEW.type;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'GALLERY_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_gallery_quota_trg ON public.gallery_items;
CREATE TRIGGER enforce_gallery_quota_trg
BEFORE INSERT ON public.gallery_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_gallery_quota();

CREATE OR REPLACE FUNCTION public.enforce_pricing_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit int;
  v_used int;
BEGIN
  v_limit := public.plan_limit(NEW.profile_id, 'pricing_entries');
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'PRICING_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO v_used
  FROM public.pricing_entries
  WHERE profile_id = NEW.profile_id;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'PRICING_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_pricing_quota_trg ON public.pricing_entries;
CREATE TRIGGER enforce_pricing_quota_trg
BEFORE INSERT ON public.pricing_entries
FOR EACH ROW EXECUTE FUNCTION public.enforce_pricing_quota();

-- 4. Promotions use the shared entitlement definitions
CREATE OR REPLACE FUNCTION public.promote_post(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
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

  v_limit := public.plan_limit(v_uid, 'post_promotions');

  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'Your plan does not include post promotions';
  END IF;

  v_start := public.billing_period_start(v_uid);

  SELECT count(*) INTO v_used
  FROM public.consumed_ad_slots
  WHERE profile_id = v_uid AND kind = 'promotion' AND consumed_at >= v_start;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'No post promotions available this period';
  END IF;

  v_until := now() + interval '15 days';

  PERFORM set_config('app.promotion_ctx', 'on', true);

  UPDATE public.posts
  SET promoted_at = now(), promoted_until = v_until, updated_at = now()
  WHERE id = p_post_id;

  INSERT INTO public.consumed_ad_slots (profile_id, is_premium, kind, post_id, consumed_at)
  VALUES (v_uid, false, 'promotion', p_post_id, now());

  PERFORM set_config('app.promotion_ctx', '', true);

  RETURN jsonb_build_object('promoted_until', v_until, 'used', v_used + 1, 'limit', v_limit);
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_announcement(p_announcement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
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

  v_limit := public.plan_limit(v_uid, 'announcement_promotions');

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

  RETURN jsonb_build_object('promoted_until', v_until, 'used', v_used + 1, 'limit', v_limit);
END;
$$;

-- 5. consumed_ad_slots is no longer client-writable (existing rows untouched)
DROP POLICY IF EXISTS "Users can insert their own consumed slots" ON public.consumed_ad_slots;
REVOKE INSERT, UPDATE, DELETE ON public.consumed_ad_slots FROM authenticated;
GRANT SELECT ON public.consumed_ad_slots TO authenticated;
GRANT ALL ON public.consumed_ad_slots TO service_role;

-- 6. Server-side usage summary for the dashboard
CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan text;
  v_limits jsonb;
  v_start timestamptz;
  v_admin boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  v_admin := public.is_admin(v_uid);
  v_plan := public.effective_plan(v_uid);
  v_limits := public.plan_limits(v_plan);
  v_start := public.billing_period_start(v_uid);

  RETURN jsonb_build_object(
    'effective_plan', v_plan,
    'is_admin', v_admin,
    'period_start', v_start,
    'limits', v_limits,
    'usage', jsonb_build_object(
      'posts', (SELECT count(*) FROM public.posts WHERE profile_id = v_uid AND created_at >= v_start),
      'announcements', (SELECT count(*) FROM public.announcements WHERE profile_id = v_uid AND created_at >= v_start),
      'post_promotions', (SELECT count(*) FROM public.consumed_ad_slots WHERE profile_id = v_uid AND kind = 'promotion' AND consumed_at >= v_start),
      'announcement_promotions', (SELECT count(*) FROM public.consumed_ad_slots WHERE profile_id = v_uid AND kind = 'announcement_promotion' AND consumed_at >= v_start),
      'gallery_images', (SELECT count(*) FROM public.gallery_items WHERE profile_id = v_uid AND type = 'image'),
      'gallery_videos', (SELECT count(*) FROM public.gallery_items WHERE profile_id = v_uid AND type = 'video'),
      'pricing_entries', (SELECT count(*) FROM public.pricing_entries WHERE profile_id = v_uid)
    ),
    'totals', jsonb_build_object(
      'posts', (SELECT count(*) FROM public.posts WHERE profile_id = v_uid),
      'announcements', (SELECT count(*) FROM public.announcements WHERE profile_id = v_uid)
    )
  );
END;
$$;