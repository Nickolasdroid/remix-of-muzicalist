ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_kind text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS subject_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS posts_one_artist_joined_per_profile
  ON public.posts (subject_profile_id)
  WHERE post_kind = 'artist_joined';

CREATE OR REPLACE FUNCTION public.create_artist_joined_post(_artist_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.profiles%ROWTYPE;
  admin_id uuid;
  spec text;
  loc text;
  genres text;
  body text;
  link text;
  new_id uuid;
BEGIN
  IF _artist_id IS NULL THEN
    SELECT * INTO a FROM public.profiles
     WHERE specialization IS NOT NULL AND is_active IS TRUE
     ORDER BY created_at DESC LIMIT 1;
  ELSE
    SELECT * INTO a FROM public.profiles WHERE id = _artist_id;
  END IF;

  IF a.id IS NULL OR a.specialization IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO new_id FROM public.posts
   WHERE post_kind = 'artist_joined' AND subject_profile_id = a.id LIMIT 1;
  IF new_id IS NOT NULL THEN
    RETURN new_id;
  END IF;

  SELECT ur.user_id INTO admin_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
   WHERE ur.user_type = 'admin'
   ORDER BY p.created_at ASC LIMIT 1;
  IF admin_id IS NULL THEN
    RETURN NULL;
  END IF;

  spec := lower(a.specialization::text);
  loc := NULLIF(concat_ws(', ', NULLIF(a.county, ''), NULLIF(a.country, '')), '');
  genres := NULLIF(a.music_genres, '');
  link := 'https://muzicalist.com/artist/' || COALESCE(a.slug, a.id::text);

  body := '🎶 Discover ' || a.stage_name || ', now on Muzicalist.' || E'\n\n'
       || a.stage_name || ' is a ' || spec
       || COALESCE(' from ' || loc, '')
       || ' and is now part of the Muzicalist platform.'
       || COALESCE(E'\n' || 'Genres: ' || genres || '.', '')
       || E'\n\n' || 'View profile → ' || link;

  INSERT INTO public.posts (profile_id, content, media_url, media_type, post_kind, subject_profile_id)
  VALUES (admin_id, body, a.avatar_url, CASE WHEN a.avatar_url IS NULL THEN NULL ELSE 'image' END, 'artist_joined', a.id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO new_id;

  IF new_id IS NULL THEN
    SELECT id INTO new_id FROM public.posts
     WHERE post_kind = 'artist_joined' AND subject_profile_id = a.id LIMIT 1;
  END IF;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_artist_joined_post(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_artist_joined_post(uuid) TO service_role;