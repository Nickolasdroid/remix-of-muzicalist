DROP FUNCTION IF EXISTS public.suspend_account(uuid, text, text, text, boolean, text);
DROP FUNCTION IF EXISTS public.reactivate_account(uuid);
DROP FUNCTION IF EXISTS public.get_account_suspension_history(uuid);
DROP FUNCTION IF EXISTS public.auto_reactivate_expired_suspensions();

CREATE TABLE IF NOT EXISTS public.account_suspensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  other_reason TEXT,
  duration_key TEXT NOT NULL,
  suspended_until TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  notify_user BOOLEAN NOT NULL DEFAULT TRUE,
  internal_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  reactivated_at TIMESTAMPTZ,
  reactivated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.account_suspensions TO authenticated;
GRANT ALL ON public.account_suspensions TO service_role;

ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage account_suspensions" ON public.account_suspensions;
CREATE POLICY "Admins manage account_suspensions"
ON public.account_suspensions FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_account_suspensions_user_id ON public.account_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_suspensions_active ON public.account_suspensions(is_active) WHERE is_active = TRUE;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_permanent_suspension BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_suspension_id UUID REFERENCES public.account_suspensions(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.is_account_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), TRUE);
$$;

CREATE FUNCTION public.suspend_account(
  _user_id UUID,
  _reason TEXT,
  _other_reason TEXT,
  _duration_key TEXT,
  _notify_user BOOLEAN,
  _internal_notes TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_until TIMESTAMPTZ := NULL;
  v_perm BOOLEAN := FALSE;
  v_id UUID;
  v_admin UUID := auth.uid();
BEGIN
  IF NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _duration_key = '24h' THEN v_until := now() + interval '24 hours';
  ELSIF _duration_key = '7d' THEN v_until := now() + interval '7 days';
  ELSIF _duration_key = '30d' THEN v_until := now() + interval '30 days';
  ELSIF _duration_key = '90d' THEN v_until := now() + interval '90 days';
  ELSIF _duration_key = 'permanent' THEN v_perm := TRUE;
  ELSIF _duration_key = 'manual' THEN v_until := NULL;
  ELSE RAISE EXCEPTION 'Invalid duration';
  END IF;

  UPDATE public.account_suspensions
    SET is_active = FALSE, reactivated_at = now(), reactivated_by = v_admin, updated_at = now()
    WHERE user_id = _user_id AND is_active = TRUE;

  INSERT INTO public.account_suspensions (
    user_id, reason, other_reason, duration_key, suspended_until, is_permanent,
    notify_user, internal_notes, is_active, created_by
  ) VALUES (
    _user_id, _reason, _other_reason, _duration_key, v_until, v_perm,
    _notify_user, _internal_notes, TRUE, v_admin
  ) RETURNING id INTO v_id;

  UPDATE public.profiles
    SET is_active = FALSE,
        suspended_until = v_until,
        is_permanent_suspension = v_perm,
        suspension_reason = _reason,
        active_suspension_id = v_id,
        updated_at = now()
    WHERE id = _user_id;

  RETURN v_id;
END;
$$;

CREATE FUNCTION public.reactivate_account(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin UUID := auth.uid();
BEGIN
  IF NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.account_suspensions
    SET is_active = FALSE, reactivated_at = now(), reactivated_by = v_admin, updated_at = now()
    WHERE user_id = _user_id AND is_active = TRUE;

  UPDATE public.profiles
    SET is_active = TRUE,
        suspended_until = NULL,
        is_permanent_suspension = FALSE,
        suspension_reason = NULL,
        active_suspension_id = NULL,
        updated_at = now()
    WHERE id = _user_id;
END;
$$;

CREATE FUNCTION public.auto_reactivate_expired_suspensions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.account_suspensions
    SET is_active = FALSE, reactivated_at = now(), updated_at = now()
    WHERE is_active = TRUE
      AND is_permanent = FALSE
      AND suspended_until IS NOT NULL
      AND suspended_until <= now();

  UPDATE public.profiles p
    SET is_active = TRUE,
        suspended_until = NULL,
        is_permanent_suspension = FALSE,
        suspension_reason = NULL,
        active_suspension_id = NULL,
        updated_at = now()
    WHERE p.is_active = FALSE
      AND p.is_permanent_suspension = FALSE
      AND p.suspended_until IS NOT NULL
      AND p.suspended_until <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE FUNCTION public.get_account_suspension_history(_user_id UUID)
RETURNS TABLE (
  id UUID, user_id UUID, reason TEXT, other_reason TEXT, duration_key TEXT,
  suspended_until TIMESTAMPTZ, is_permanent BOOLEAN, notify_user BOOLEAN,
  internal_notes TEXT, is_active BOOLEAN, created_at TIMESTAMPTZ,
  reactivated_at TIMESTAMPTZ,
  admin_name TEXT, reactivator_name TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT s.id, s.user_id, s.reason, s.other_reason, s.duration_key,
         s.suspended_until, s.is_permanent, s.notify_user,
         s.internal_notes, s.is_active, s.created_at, s.reactivated_at,
         admin_p.stage_name, reactivator_p.stage_name
  FROM public.account_suspensions s
  LEFT JOIN public.profiles admin_p ON admin_p.id = s.created_by
  LEFT JOIN public.profiles reactivator_p ON reactivator_p.id = s.reactivated_by
  WHERE s.user_id = _user_id
  ORDER BY s.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_list_profiles();
CREATE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id UUID, first_name TEXT, last_name TEXT, stage_name TEXT, email TEXT,
  phone TEXT, country TEXT, county TEXT, plan TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ, stripe_subscription_id TEXT, subscription_status TEXT,
  subscription_current_period_end TIMESTAMPTZ, billing TEXT,
  specialization TEXT, is_verified BOOLEAN, verification_status TEXT,
  is_active BOOLEAN, last_sign_in_at TIMESTAMPTZ, avg_rating NUMERIC,
  reviews_count INTEGER,
  suspended_until TIMESTAMPTZ, is_permanent_suspension BOOLEAN,
  suspension_reason TEXT, active_suspension_id UUID
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.stage_name, p.email,
         p.phone, p.country, p.county, p.plan, p.avatar_url,
         p.created_at, p.stripe_subscription_id, p.subscription_status,
         p.subscription_current_period_end, p.billing::TEXT,
         p.specialization::TEXT, p.is_verified, p.verification_status::TEXT,
         p.is_active, u.last_sign_in_at,
         COALESCE(AVG(r.rating)::NUMERIC, 0),
         COALESCE(COUNT(r.id)::INTEGER, 0),
         p.suspended_until, p.is_permanent_suspension,
         p.suspension_reason, p.active_suspension_id
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.reviews r ON r.profile_id = p.id
  GROUP BY p.id, u.last_sign_in_at;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-reactivate-suspensions') THEN
      PERFORM cron.unschedule('auto-reactivate-suspensions');
    END IF;
    PERFORM cron.schedule(
      'auto-reactivate-suspensions',
      '0 * * * *',
      $c$ SELECT public.auto_reactivate_expired_suspensions(); $c$
    );
  END IF;
END $$;
