CREATE TABLE public.content_creation_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('post','announcement')),
  content_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.content_creation_events TO authenticated;
GRANT ALL ON public.content_creation_events TO service_role;

ALTER TABLE public.content_creation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own creation events"
ON public.content_creation_events FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE INDEX idx_content_creation_events_profile_kind_created
  ON public.content_creation_events (profile_id, kind, created_at DESC);

-- Recorder trigger (SECURITY DEFINER: clients cannot write directly)
CREATE OR REPLACE FUNCTION public.record_content_creation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.content_creation_events (profile_id, kind, content_id, created_at)
  VALUES (NEW.profile_id, TG_ARGV[0], NEW.id, COALESCE(NEW.created_at, now()));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_post_creation_event
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.record_content_creation_event('post');

CREATE TRIGGER trg_record_announcement_creation_event
AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.record_content_creation_event('announcement');

-- Backfill from currently existing content inside the rolling window
INSERT INTO public.content_creation_events (profile_id, kind, content_id, created_at)
SELECT profile_id, 'post', id, created_at FROM public.posts
WHERE created_at >= now() - interval '30 days';

INSERT INTO public.content_creation_events (profile_id, kind, content_id, created_at)
SELECT profile_id, 'announcement', id, created_at FROM public.announcements
WHERE created_at >= now() - interval '30 days';

-- Rolling 30-day consumed-slot counter
CREATE OR REPLACE FUNCTION public.consumed_creation_slots(_user_id uuid, _kind text)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int FROM public.content_creation_events
  WHERE profile_id = _user_id
    AND kind = _kind
    AND created_at >= now() - interval '30 days';
$$;

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

  v_used := public.consumed_creation_slots(NEW.profile_id, 'post');

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'POST_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

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

  v_used := public.consumed_creation_slots(NEW.profile_id, 'announcement');

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

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
      'posts', public.consumed_creation_slots(v_uid, 'post'),
      'announcements', public.consumed_creation_slots(v_uid, 'announcement'),
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