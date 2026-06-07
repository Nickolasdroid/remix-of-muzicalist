
-- Profiles: hide sensitive columns from public reads
REVOKE SELECT (email, phone, stripe_customer_id, stripe_subscription_id) ON public.profiles FROM anon, authenticated;

-- Reviews: hide reviewer email from public reads
REVOKE SELECT (reviewer_email) ON public.reviews FROM anon, authenticated;

-- Calendar events: hide private notes from public reads
REVOKE SELECT (notes) ON public.calendar_events FROM anon, authenticated;

-- Owner-scoped helper to read own calendar events including notes
CREATE OR REPLACE FUNCTION public.get_my_calendar_events()
RETURNS SETOF public.calendar_events
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.calendar_events WHERE profile_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_calendar_events() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_calendar_events() TO authenticated;

-- Owner-scoped helper to read a single own calendar event for a date
CREATE OR REPLACE FUNCTION public.get_my_calendar_event_for_date(_event_date date)
RETURNS SETOF public.calendar_events
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.calendar_events
    WHERE profile_id = auth.uid() AND event_date = _event_date
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_calendar_event_for_date(date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_calendar_event_for_date(date) TO authenticated;
