REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, first_name, last_name, stage_name, county, country, specialization, music_genres,
  instruments, number_of_events, career_start_year, band_members, avatar_url, cover_url,
  cover_theme, bio, estimated_price, facebook_url, instagram_url, youtube_url, tiktok_url,
  spotify_url, hide_phone, hide_email, allow_promotion, plan, is_active, is_verified,
  verification_status, slug, gender, pending_account_type, comments_allow_from,
  comments_allow_gifs, notification_preferences, created_at, updated_at
) ON public.profiles TO anon;

GRANT SELECT (
  id, first_name, last_name, stage_name, county, country, specialization, music_genres,
  instruments, number_of_events, career_start_year, band_members, avatar_url, cover_url,
  cover_theme, bio, estimated_price, facebook_url, instagram_url, youtube_url, tiktok_url,
  spotify_url, hide_phone, hide_email, allow_promotion, plan, is_active, is_verified,
  verification_status, slug, gender, pending_account_type, comments_allow_from,
  comments_allow_gifs, notification_preferences, created_at, updated_at,
  billing, subscription_status, subscription_current_period_end,
  subscription_cancel_at_period_end, stripe_customer_id, stripe_subscription_id,
  suspended_until, is_permanent_suspension, suspension_reason, active_suspension_id
) ON public.profiles TO authenticated;

REVOKE ALL ON public.email_campaigns FROM anon;
REVOKE ALL ON public.email_campaign_recipients FROM anon;
REVOKE ALL ON public.reports FROM anon;

REVOKE ALL ON public.email_campaigns FROM authenticated;
REVOKE ALL ON public.email_campaign_recipients FROM authenticated;
REVOKE ALL ON public.reports FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaign_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;

GRANT ALL ON public.email_campaigns TO service_role;
GRANT ALL ON public.email_campaign_recipients TO service_role;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.email_campaigns REPLICA IDENTITY DEFAULT;