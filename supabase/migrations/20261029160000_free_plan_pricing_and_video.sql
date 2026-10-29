-- Free plan: estimated pricing (3 entries) and 1 gallery video.
-- Organizers need prices to book, and one video shows the act.
-- Enforcement triggers read these limits, so only plan_limits changes.
CREATE OR REPLACE FUNCTION public.plan_limits(_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE COALESCE(_plan, 'Free')
    WHEN 'Premium' THEN jsonb_build_object(
      'posts', 30, 'announcements', 10,
      'post_promotions', 5, 'announcement_promotions', 3,
      'gallery_images', 15, 'gallery_videos', 5,
      'pricing_entries', 3, 'social_links', 5)
    WHEN 'Standard' THEN jsonb_build_object(
      'posts', 15, 'announcements', 5,
      'post_promotions', 2, 'announcement_promotions', 1,
      'gallery_images', 10, 'gallery_videos', 3,
      'pricing_entries', 3, 'social_links', 5)
    ELSE jsonb_build_object(
      'posts', 0, 'announcements', 0,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 5, 'gallery_videos', 1,
      'pricing_entries', 3, 'social_links', 1)
  END;
$$;
