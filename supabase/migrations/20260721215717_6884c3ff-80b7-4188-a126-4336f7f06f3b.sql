
DROP FUNCTION IF EXISTS public.admin_list_profiles();

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  stage_name text,
  email text,
  phone text,
  country text,
  county text,
  plan text,
  avatar_url text,
  created_at timestamptz,
  stripe_subscription_id text,
  subscription_status text,
  subscription_current_period_end timestamptz,
  billing text,
  specialization text,
  is_verified boolean,
  verification_status text,
  is_active boolean,
  last_sign_in_at timestamptz,
  avg_rating numeric,
  reviews_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.stage_name,
         p.email, p.phone, p.country, p.county, p.plan,
         p.avatar_url, p.created_at,
         p.stripe_subscription_id, p.subscription_status,
         p.subscription_current_period_end, p.billing,
         p.specialization::text,
         p.is_verified,
         p.verification_status,
         p.is_active,
         u.last_sign_in_at,
         COALESCE(r.avg_rating, 0)::numeric AS avg_rating,
         COALESCE(r.reviews_count, 0)::int AS reviews_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN (
    SELECT profile_id,
           AVG(rating)::numeric AS avg_rating,
           COUNT(*)::int AS reviews_count
    FROM public.reviews
    GROUP BY profile_id
  ) r ON r.profile_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
