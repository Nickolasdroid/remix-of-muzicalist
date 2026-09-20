CREATE OR REPLACE FUNCTION public.get_artist_country_counts()
RETURNS TABLE(country text, artist_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.country, COUNT(*)::bigint AS artist_count
  FROM public.profiles p
  WHERE p.specialization IS NOT NULL
    AND p.country IS NOT NULL
    AND p.is_active = true
  GROUP BY p.country
  ORDER BY artist_count DESC, p.country ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_artist_country_counts() TO authenticated, anon, service_role;