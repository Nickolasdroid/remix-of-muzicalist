ALTER TABLE public.posts DROP CONSTRAINT posts_media_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_media_type_check
  CHECK (media_type IS NULL OR media_type = ANY (ARRAY['image'::text, 'video'::text]));
UPDATE public.posts SET media_type = NULL, media_url = NULL WHERE COALESCE(media_url, '') = '';