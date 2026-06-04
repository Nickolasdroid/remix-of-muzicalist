
-- 1) Profiles: restrict sensitive columns via column-level SELECT grants
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, first_name, last_name, stage_name, county, specialization, music_genres,
  experience_level, number_of_events, career_start_year, avatar_url, created_at,
  updated_at, plan, bio, estimated_price, facebook_url, instagram_url,
  youtube_url, tiktok_url, spotify_url, country, instruments, allow_promotion,
  subscription_status, subscription_current_period_end, is_active,
  pending_account_type, comments_allow_from, comments_allow_gifs,
  subscription_cancel_at_period_end, hide_email, hide_phone
) ON public.profiles TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2) Reviews: hide reviewer_email from public reads
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, profile_id, reviewer_name, rating, comment, created_at, reviewer_user_id)
  ON public.reviews TO anon, authenticated;
GRANT INSERT, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- 3) Conversations: tighten UPDATE with_check
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations"
  ON public.conversations
  FOR UPDATE
  USING ((auth.uid() = artist_id) OR (auth.uid() = participant_id))
  WITH CHECK ((auth.uid() = artist_id) OR (auth.uid() = participant_id));

-- 4) Consumed ad slots: enforce premium consumption matches Premium plan
CREATE OR REPLACE FUNCTION public.validate_consumed_ad_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_plan text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.profile_id THEN
    RAISE EXCEPTION 'Not authorized to insert ad slot for this profile';
  END IF;

  IF NEW.announcement_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.announcements
      WHERE id = NEW.announcement_id AND profile_id = NEW.profile_id
    ) THEN
      RAISE EXCEPTION 'Announcement does not exist or does not belong to this profile';
    END IF;
  END IF;

  IF NEW.is_premium THEN
    SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.profile_id;
    IF COALESCE(v_plan, 'Free') <> 'Premium' THEN
      RAISE EXCEPTION 'Only Premium subscribers can consume premium ad slots';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_consumed_ad_slot_trg ON public.consumed_ad_slots;
CREATE TRIGGER validate_consumed_ad_slot_trg
  BEFORE INSERT ON public.consumed_ad_slots
  FOR EACH ROW EXECUTE FUNCTION public.validate_consumed_ad_slot();
