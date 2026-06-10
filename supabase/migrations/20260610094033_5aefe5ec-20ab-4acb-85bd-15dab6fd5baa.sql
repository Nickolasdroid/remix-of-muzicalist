
-- 1. profiles: column-level read access (owner reads via SECURITY DEFINER RPC get_my_full_profile)
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, first_name, last_name, stage_name, avatar_url, bio,
  country, county, specialization, experience_level, career_start_year,
  number_of_events, music_genres, instruments, estimated_price,
  facebook_url, instagram_url, youtube_url, tiktok_url, spotify_url,
  hide_email, hide_phone, allow_promotion, plan, is_active, gender,
  created_at, updated_at
) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. reviews: hide reviewer_email from public reads
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (
  id, profile_id, reviewer_user_id, reviewer_name, rating, comment, created_at
) ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- 3. consumed_ad_slots: owner + admin only
DROP POLICY IF EXISTS "Anyone can view consumed slots" ON public.consumed_ad_slots;
CREATE POLICY "Owners and admins can view consumed slots"
  ON public.consumed_ad_slots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));

-- 4. booking_requests: tighten INSERT policy to require non-null requester_user_id
DROP POLICY IF EXISTS "Authenticated users can create booking requests" ON public.booking_requests;
CREATE POLICY "Authenticated users can create booking requests"
  ON public.booking_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_user_id IS NOT NULL
    AND auth.uid() = requester_user_id
  );

-- 5. post_likes: remove from realtime publication to stop broadcasting per-user like events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'post_likes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.post_likes';
  END IF;
END $$;

-- 6. admin RPC for the admin dashboard (needs full profile rows)
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
  billing text
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
         p.subscription_current_period_end, p.billing
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
