ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media jsonb,
  ADD COLUMN IF NOT EXISTS available_on date,
  ADD COLUMN IF NOT EXISTS available_from time,
  ADD COLUMN IF NOT EXISTS available_until time;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_media_is_short_array;
ALTER TABLE public.posts ADD CONSTRAINT posts_media_is_short_array
  CHECK (media IS NULL OR (jsonb_typeof(media) = 'array' AND jsonb_array_length(media) BETWEEN 1 AND 10));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_availability_has_date;
ALTER TABLE public.posts ADD CONSTRAINT posts_availability_has_date
  CHECK (post_kind <> 'availability' OR available_on IS NOT NULL);

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_availability_hours_pair;
ALTER TABLE public.posts ADD CONSTRAINT posts_availability_hours_pair
  CHECK ((available_from IS NULL) = (available_until IS NULL));

CREATE INDEX IF NOT EXISTS idx_posts_available_on ON public.posts (available_on) WHERE available_on IS NOT NULL;

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
      'posts', 3, 'announcements', 0,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 5, 'gallery_videos', 1,
      'pricing_entries', 3, 'social_links', 1)
  END;
$$;