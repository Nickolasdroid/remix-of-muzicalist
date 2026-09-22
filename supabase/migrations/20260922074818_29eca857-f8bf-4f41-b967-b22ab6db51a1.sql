DROP FUNCTION public.get_platform_stats();

CREATE FUNCTION public.get_platform_stats()
RETURNS TABLE(
  artists integer,
  countries integer,
  average_rating numeric,
  users integer,
  events_booked integer,
  singers integer,
  instrumentalists integer,
  djs integer,
  bands integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH artist_stats AS (
    SELECT
      COUNT(*)::int AS artists,
      COUNT(DISTINCT NULLIF(p.country, ''))::int AS countries,
      COUNT(*) FILTER (WHERE p.specialization = 'Singer')::int AS singers,
      COUNT(*) FILTER (WHERE p.specialization = 'Instrumentalist')::int AS instrumentalists,
      COUNT(*) FILTER (WHERE p.specialization = 'DJ')::int AS djs,
      COUNT(*) FILTER (WHERE p.specialization = 'Band')::int AS bands
    FROM public.profiles p
    WHERE p.specialization IS NOT NULL
      AND p.is_active = true
  )
  SELECT
    a.artists,
    a.countries,
    (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.reviews r),
    (SELECT COUNT(*)::int FROM public.profiles p WHERE p.specialization IS NULL AND p.is_active),
    (SELECT COUNT(*)::int FROM public.booking_requests b WHERE b.status = 'accepted'),
    a.singers,
    a.instrumentalists,
    a.djs,
    a.bands
  FROM artist_stats a;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated, service_role;