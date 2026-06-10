CREATE OR REPLACE FUNCTION public.get_accepted_events_count(_profile_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.booking_requests
  WHERE profile_id = _profile_id
    AND status = 'accepted'
$$;

GRANT EXECUTE ON FUNCTION public.get_accepted_events_count(uuid) TO anon, authenticated;