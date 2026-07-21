
DROP FUNCTION IF EXISTS public.admin_list_profiles();

CREATE TABLE public.account_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  other_reason TEXT,
  duration_key TEXT NOT NULL,
  suspended_until TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  notify_user BOOLEAN NOT NULL DEFAULT true,
  internal_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  reactivated_at TIMESTAMPTZ,
  reactivated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_account_suspensions_user ON public.account_suspensions(user_id);
CREATE INDEX idx_account_suspensions_active ON public.account_suspensions(user_id) WHERE is_active = true;
CREATE INDEX idx_account_suspensions_until ON public.account_suspensions(suspended_until) WHERE is_active = true AND is_permanent = false;

GRANT SELECT ON public.account_suspensions TO authenticated;
GRANT ALL ON public.account_suspensions TO service_role;
ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view suspensions" ON public.account_suspensions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert suspensions" ON public.account_suspensions FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update suspensions" ON public.account_suspensions FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_account_suspensions_updated_at
  BEFORE UPDATE ON public.account_suspensions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.is_account_active(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), true);
$$;

CREATE OR REPLACE FUNCTION public.suspend_account(
  _user_id UUID, _reason TEXT, _other_reason TEXT, _duration_key TEXT,
  _notify_user BOOLEAN, _internal_notes TEXT
) RETURNS public.account_suspensions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_until TIMESTAMPTZ;
  v_permanent BOOLEAN := false;
  v_row public.account_suspensions;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF public.is_admin(_user_id) THEN RAISE EXCEPTION 'Cannot suspend an administrator'; END IF;

  v_until := CASE _duration_key
    WHEN '24h' THEN now() + interval '24 hours'
    WHEN '7d'  THEN now() + interval '7 days'
    WHEN '30d' THEN now() + interval '30 days'
    WHEN '90d' THEN now() + interval '90 days'
    ELSE NULL
  END;
  v_permanent := (_duration_key = 'permanent');

  UPDATE public.account_suspensions
    SET is_active = false, reactivated_at = now(), reactivated_by = v_admin
    WHERE user_id = _user_id AND is_active = true;

  INSERT INTO public.account_suspensions(user_id, reason, other_reason, duration_key, suspended_until, is_permanent, notify_user, internal_notes, created_by)
  VALUES (_user_id, _reason, _other_reason, _duration_key, v_until, v_permanent, COALESCE(_notify_user,true), _internal_notes, v_admin)
  RETURNING * INTO v_row;

  UPDATE public.profiles SET is_active = false WHERE id = _user_id;
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.reactivate_account(_user_id UUID)
RETURNS public.account_suspensions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID := auth.uid(); v_row public.account_suspensions;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.account_suspensions
    SET is_active = false, reactivated_at = now(), reactivated_by = v_admin
    WHERE user_id = _user_id AND is_active = true
    RETURNING * INTO v_row;
  UPDATE public.profiles SET is_active = true WHERE id = _user_id;
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.auto_reactivate_expired_suspensions()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT := 0;
BEGIN
  WITH expired AS (
    UPDATE public.account_suspensions
      SET is_active = false, reactivated_at = now()
      WHERE is_active = true AND is_permanent = false
        AND suspended_until IS NOT NULL AND suspended_until <= now()
      RETURNING user_id
  )
  UPDATE public.profiles p SET is_active = true FROM expired e WHERE p.id = e.user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.get_account_suspension_history(_user_id UUID)
RETURNS TABLE(
  id UUID, user_id UUID, reason TEXT, other_reason TEXT, duration_key TEXT,
  suspended_until TIMESTAMPTZ, is_permanent BOOLEAN, notify_user BOOLEAN,
  internal_notes TEXT, is_active BOOLEAN, created_by UUID, created_at TIMESTAMPTZ,
  reactivated_at TIMESTAMPTZ, reactivated_by UUID, admin_name TEXT, reactivator_name TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
    SELECT s.id, s.user_id, s.reason, s.other_reason, s.duration_key,
           s.suspended_until, s.is_permanent, s.notify_user, s.internal_notes,
           s.is_active, s.created_by, s.created_at, s.reactivated_at, s.reactivated_by,
           COALESCE(a.stage_name, a.first_name, a.email) AS admin_name,
           COALESCE(r.stage_name, r.first_name, r.email) AS reactivator_name
    FROM public.account_suspensions s
    LEFT JOIN public.profiles a ON a.id = s.created_by
    LEFT JOIN public.profiles r ON r.id = s.reactivated_by
    WHERE s.user_id = _user_id
    ORDER BY s.created_at DESC;
END; $$;

CREATE FUNCTION public.admin_list_profiles()
RETURNS TABLE(
  id uuid, first_name text, last_name text, stage_name text, email text,
  phone text, country text, county text, plan text, avatar_url text,
  created_at timestamptz, stripe_subscription_id text, subscription_status text,
  subscription_current_period_end timestamptz, billing text, specialization text,
  is_verified boolean, verification_status text, is_active boolean,
  last_sign_in_at timestamptz, avg_rating numeric, reviews_count integer,
  suspended_until timestamptz, is_permanent_suspension boolean,
  suspension_reason text, active_suspension_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  PERFORM public.auto_reactivate_expired_suspensions();
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.stage_name,
         p.email, p.phone, p.country, p.county, p.plan,
         p.avatar_url, p.created_at,
         p.stripe_subscription_id, p.subscription_status,
         p.subscription_current_period_end, p.billing,
         p.specialization::text,
         p.is_verified, p.verification_status, p.is_active,
         u.last_sign_in_at,
         COALESCE(r.avg_rating, 0)::numeric,
         COALESCE(r.reviews_count, 0)::int,
         s.suspended_until, s.is_permanent, s.reason, s.id
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN (
    SELECT profile_id, AVG(rating)::numeric AS avg_rating, COUNT(*)::int AS reviews_count
    FROM public.reviews GROUP BY profile_id
  ) r ON r.profile_id = p.id
  LEFT JOIN LATERAL (
    SELECT id, suspended_until, is_permanent, reason
    FROM public.account_suspensions
    WHERE user_id = p.id AND is_active = true
    ORDER BY created_at DESC LIMIT 1
  ) s ON true
  ORDER BY p.created_at DESC;
END; $$;

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id AND public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Users can create their own announcements" ON public.announcements;
CREATE POLICY "Users can create their own announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id AND public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Users can create their own comments" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND public.is_account_active(auth.uid())
    AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.artist_id = auth.uid() OR c.participant_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
CREATE POLICY "Anyone can create reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Anyone can create booking requests" ON public.booking_requests;
CREATE POLICY "Anyone can create booking requests" ON public.booking_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id AND public.is_account_active(auth.uid()))
  WITH CHECK (auth.uid() = id AND public.is_account_active(auth.uid()));
