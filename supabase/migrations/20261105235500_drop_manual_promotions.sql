-- Manual promotions are retired: visibility comes from the plan (feed ranking).
-- With 0 promotions on every plan, promote_post / promote_announcement refuse new ones;
-- promotions already running end on their own (promoted_until).
CREATE OR REPLACE FUNCTION public.plan_limits(_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE COALESCE(_plan, 'Free')
    WHEN 'Premium' THEN jsonb_build_object(
      'posts', 30, 'announcements', 30,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 15, 'gallery_videos', 5,
      'pricing_entries', 3, 'social_links', 5)
    WHEN 'Standard' THEN jsonb_build_object(
      'posts', 15, 'announcements', 15,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 10, 'gallery_videos', 3,
      'pricing_entries', 3, 'social_links', 5)
    ELSE jsonb_build_object(
      'posts', 3, 'announcements', 0,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 5, 'gallery_videos', 1,
      'pricing_entries', 3, 'social_links', 1)
  END;
$$;
