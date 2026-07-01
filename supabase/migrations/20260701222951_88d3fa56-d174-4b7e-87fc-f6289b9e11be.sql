
-- 1) calendar_events: revoke public access to private notes
REVOKE SELECT (notes) ON public.calendar_events FROM anon, authenticated;

-- Helper RPC exposing availability + parsed booked slots without leaking notes
CREATE OR REPLACE FUNCTION public.get_public_calendar(_profile_id uuid)
RETURNS TABLE(event_date date, status text, slots jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ce.event_date,
    ce.status,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('startTime', m[1], 'endTime', m[2]))
      FROM regexp_matches(
        COALESCE(ce.notes, ''),
        'Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})',
        'g'
      ) AS m
    ), '[]'::jsonb) AS slots
  FROM public.calendar_events ce
  WHERE ce.profile_id = _profile_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_calendar(uuid) TO anon, authenticated;

-- 2) profiles: revoke public access to Stripe/billing columns
REVOKE SELECT (stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, billing)
  ON public.profiles FROM anon, authenticated;

-- 3) reviews: revoke public access to reviewer email
REVOKE SELECT (reviewer_email) ON public.reviews FROM anon, authenticated;
