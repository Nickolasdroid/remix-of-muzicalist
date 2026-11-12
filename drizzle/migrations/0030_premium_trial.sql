-- Free Premium for 30 days ("reverse trial"): every artist gets Premium once, without a
-- card. A week before the end they get a notification with what Premium brought them;
-- at the end they go back to Free automatically (nothing is deleted: content above the
-- Free limits is only hidden). Artists already on Free get it once too, on their next visit.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_reminder_sent_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end_seen_at timestamptz;

-- A paid subscription that is running (then the trial no longer matters)
CREATE OR REPLACE FUNCTION public.has_running_subscription(p public.profiles)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p.stripe_subscription_id IS NOT NULL
     AND coalesce(p.subscription_status, '') IN ('active', 'trialing', 'past_due')
$$;

-- Starts the trial for the signed-in artist if they never had one and never paid.
-- Returns when it ends, or NULL when they are not eligible.
CREATE OR REPLACE FUNCTION public.start_my_trial()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ends timestamptz;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND user_type = 'artist'::public.user_type) THEN
    RETURN NULL;
  END IF;

  UPDATE public.profiles
     SET plan = 'Premium',
         trial_started_at = now(),
         trial_ends_at = now() + interval '30 days'
   WHERE id = v_uid
     AND trial_started_at IS NULL
     AND coalesce(plan, 'Free') = 'Free'
     AND stripe_customer_id IS NULL
     AND stripe_subscription_id IS NULL
  RETURNING trial_ends_at INTO v_ends;

  RETURN v_ends;
END;
$$;

-- The signed-in artist's trial and what it brought them (views, booking requests,
-- new followers since it started).
CREATE OR REPLACE FUNCTION public.get_my_trial()
RETURNS TABLE (
  status text,             -- 'none' | 'active' | 'ended' | 'subscribed'
  started_at timestamptz,
  ends_at timestamptz,
  end_seen boolean,
  views integer,
  booking_requests integer,
  new_followers integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles;
  v_until timestamptz;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF p.id IS NULL OR p.trial_started_at IS NULL THEN
    RETURN QUERY SELECT 'none'::text, NULL::timestamptz, NULL::timestamptz, false, 0, 0, 0;
    RETURN;
  END IF;

  v_until := least(now(), p.trial_ends_at);

  RETURN QUERY SELECT
    CASE
      WHEN public.has_running_subscription(p) THEN 'subscribed'
      WHEN p.trial_ends_at > now() THEN 'active'
      ELSE 'ended'
    END,
    p.trial_started_at,
    p.trial_ends_at,
    p.trial_end_seen_at IS NOT NULL,
    (SELECT count(*)::integer FROM public.artist_profile_views v
      WHERE v.artist_id = p.id AND v.created_at >= p.trial_started_at AND v.created_at <= v_until),
    (SELECT count(*)::integer FROM public.booking_requests br
      WHERE br.profile_id = p.id AND br.created_at >= p.trial_started_at AND br.created_at <= v_until),
    (SELECT count(*)::integer FROM public.followers f
      WHERE f.artist_id = p.id AND f.created_at >= p.trial_started_at AND f.created_at <= v_until);
END;
$$;

-- The artist has seen the "your trial has ended" screen
CREATE OR REPLACE FUNCTION public.mark_trial_end_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET trial_end_seen_at = now()
   WHERE id = auth.uid() AND trial_started_at IS NOT NULL AND trial_end_seen_at IS NULL
$$;

-- Runs every hour: the reminder a week before the end, then the switch back to Free.
CREATE OR REPLACE FUNCTION public.process_premium_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A week before the end
  WITH due AS (
    UPDATE public.profiles p
       SET trial_reminder_sent_at = now()
     WHERE p.trial_ends_at IS NOT NULL
       AND p.trial_reminder_sent_at IS NULL
       AND p.trial_ends_at > now()
       AND p.trial_ends_at <= now() + interval '7 days'
       AND NOT public.has_running_subscription(p)
    RETURNING p.id
  )
  INSERT INTO public.notifications (user_id, type, title, message, reference_type)
  SELECT id, 'trial_ending', 'Premium trial',
         'Your free Premium ends in 7 days. See what it brought you and keep it.', 'plan'
    FROM due;

  -- The end: back to Free (unless they subscribed meanwhile)
  WITH ended AS (
    UPDATE public.profiles p
       SET plan = 'Free'
     WHERE p.trial_ends_at IS NOT NULL
       AND p.trial_ends_at <= now()
       AND p.plan = 'Premium'
       AND NOT public.has_running_subscription(p)
    RETURNING p.id
  )
  INSERT INTO public.notifications (user_id, type, title, message, reference_type)
  SELECT id, 'trial_ended', 'Premium trial',
         'Your free Premium has ended and you are on Free now. Nothing was deleted.', 'plan'
    FROM ended;
END;
$$;

REVOKE ALL ON FUNCTION public.start_my_trial() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_trial() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_trial_end_seen() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.process_premium_trials() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_my_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_trial_end_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_premium_trials() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'premium-trials') THEN
    PERFORM cron.unschedule('premium-trials');
  END IF;
  PERFORM cron.schedule('premium-trials', '0 * * * *', $cron$SELECT public.process_premium_trials();$cron$);
END $$;
