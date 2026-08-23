CREATE OR REPLACE FUNCTION public.create_artist_joined_post(_artist_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.profiles%ROWTYPE;
  admin_id uuid;
  cat text;
  loc text;
  body text;
  new_id uuid;
BEGIN
  -- Only the official admin account (or trusted server-side callers) may generate posts
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

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

  IF new_id IS NULL THEN
    SELECT ur.user_id INTO admin_id
      FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
     WHERE ur.user_type = 'admin'
     ORDER BY p.created_at ASC LIMIT 1;
    IF admin_id IS NULL THEN
      RETURN NULL;
    END IF;

    cat := CASE a.specialization::text
             WHEN 'Singer' THEN 'Solist'
             WHEN 'Band' THEN 'Formație'
             WHEN 'Instrumentalist' THEN 'Instrumentist'
             WHEN 'DJ' THEN 'DJ'
             ELSE a.specialization::text
           END;

    loc := NULLIF(concat_ws(', ',
             NULLIF(a.county, ''),
             CASE WHEN a.country IN ('Romania','România') THEN 'România' ELSE NULLIF(a.country, '') END
           ), '');

    body := '@' || a.stage_name || ' este acum pe Muzicalist ca ' || cat || '.'
         || COALESCE(E'\n' || '📍 ' || loc || '. ', E'\n')
         || 'Descoperă profilul și află mai multe.';

    INSERT INTO public.posts (profile_id, content, media_url, media_type, post_kind, subject_profile_id)
    VALUES (admin_id, body, a.avatar_url, CASE WHEN a.avatar_url IS NULL THEN NULL ELSE 'image' END, 'artist_joined', a.id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_id;

    IF new_id IS NULL THEN
      SELECT id INTO new_id FROM public.posts
       WHERE post_kind = 'artist_joined' AND subject_profile_id = a.id LIMIT 1;
    END IF;
  END IF;

  IF new_id IS NOT NULL THEN
    INSERT INTO public.post_mentions (post_id, mentioned_profile_id)
    VALUES (new_id, a.id)
    ON CONFLICT (post_id, mentioned_profile_id) DO NOTHING;
  END IF;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_artist_joined_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_artist_joined_post(uuid) TO authenticated, service_role;

-- Read-only helper so the admin UI can see which artists already have a welcome post
CREATE OR REPLACE FUNCTION public.admin_list_artist_joined_posts()
RETURNS TABLE (post_id uuid, subject_profile_id uuid, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.subject_profile_id, p.created_at
    FROM public.posts p
   WHERE p.post_kind = 'artist_joined'
     AND p.subject_profile_id IS NOT NULL
     AND public.is_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.admin_list_artist_joined_posts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_artist_joined_posts() TO authenticated, service_role;