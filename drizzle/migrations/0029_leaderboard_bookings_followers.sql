-- Leaderboard: "Most booked" (last 30 days) and "Most followed".
--
-- Most booked counts only bookings made and confirmed through Muzicalist: requests an
-- organizer sent from their account and the artist accepted in the last 30 days. Days
-- an artist marks busy in their own calendar don't count, and one organizer counts once.
-- Only the order is returned, never the number of bookings, so artists' volumes stay private.
CREATE OR REPLACE FUNCTION public.get_leaderboard_most_booked()
RETURNS TABLE (profile_id uuid, rank_position integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT br.profile_id, count(DISTINCT br.requester_user_id) AS n
    FROM public.booking_requests br
    JOIN public.profiles p ON p.id = br.profile_id
    WHERE br.status = 'accepted'
      AND br.requester_user_id IS NOT NULL
      AND br.requester_user_id <> br.profile_id
      AND br.updated_at >= now() - interval '30 days'
    GROUP BY br.profile_id
  )
  SELECT c.profile_id, (rank() OVER (ORDER BY c.n DESC))::integer AS rank_position
  FROM counts c
  ORDER BY rank_position
  LIMIT 500
$$;

-- Most followed: followers that still have an account.
CREATE OR REPLACE FUNCTION public.get_leaderboard_most_followed()
RETURNS TABLE (profile_id uuid, followers integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.artist_id AS profile_id, count(*)::integer AS followers
  FROM public.followers f
  JOIN public.profiles a ON a.id = f.artist_id
  JOIN public.profiles u ON u.id = f.follower_id
  GROUP BY f.artist_id
  ORDER BY followers DESC
  LIMIT 500
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_most_booked() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_most_followed() TO anon, authenticated;
