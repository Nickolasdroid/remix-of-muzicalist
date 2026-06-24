
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, first_name, last_name, stage_name, county, specialization, music_genres,
  experience_level, number_of_events, career_start_year, avatar_url,
  created_at, updated_at, plan, bio, estimated_price,
  facebook_url, instagram_url, youtube_url, tiktok_url, spotify_url,
  country, instruments, hide_phone, hide_email, allow_promotion,
  stripe_customer_id, stripe_subscription_id, billing, subscription_status,
  subscription_current_period_end, is_active, pending_account_type,
  comments_allow_from, comments_allow_gifs, notification_preferences,
  subscription_cancel_at_period_end, gender, cover_url, cover_theme
) ON public.profiles TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
