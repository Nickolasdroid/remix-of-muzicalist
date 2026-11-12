-- Events an artist has played through Muzicalist, for the public profile.
-- Only the event type and the month are shown: no client names, places or prices.
CREATE OR REPLACE FUNCTION public.get_public_past_events(_profile_id uuid)
RETURNS TABLE (event_type text, event_month date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT br.event_type::text, date_trunc('month', br.event_date)::date AS event_month
  FROM public.booking_requests br
  WHERE br.profile_id = _profile_id
    AND br.status = 'accepted'
    AND br.event_date IS NOT NULL
    AND br.event_date <= current_date
  ORDER BY br.event_date DESC
  LIMIT 24
$$;

GRANT EXECUTE ON FUNCTION public.get_public_past_events(uuid) TO anon, authenticated;
