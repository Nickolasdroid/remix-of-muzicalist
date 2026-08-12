CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE(artists integer, countries integer, average_rating numeric, events_booked integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.profiles p WHERE p.specialization IS NOT NULL AND p.is_active),
    (SELECT COUNT(DISTINCT p.country)::int FROM public.profiles p WHERE p.specialization IS NOT NULL AND p.is_active AND p.country IS NOT NULL AND p.country <> ''),
    (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.reviews r),
    (SELECT COUNT(*)::int FROM public.booking_requests b WHERE b.status = 'accepted')
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;