
-- 1. Restrict calendar_events SELECT to owner only
DROP POLICY IF EXISTS "Anyone can view calendar events" ON public.calendar_events;

CREATE POLICY "Owners can view their calendar events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- 2. Helper RPC for public queries: given a date and a set of artist profile ids,
--    return which of them are Booked or Blocked. Exposes no notes.
CREATE OR REPLACE FUNCTION public.get_booked_profile_ids(_event_date date, _profile_ids uuid[])
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile_id
  FROM public.calendar_events
  WHERE event_date = _event_date
    AND status IN ('Booked', 'Blocked')
    AND profile_id = ANY(_profile_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_profile_ids(date, uuid[]) TO anon, authenticated;

-- 3. Fix mutable search_path on email queue helper functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;
