-- 1. Mentions table
CREATE TABLE public.post_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, mentioned_profile_id)
);

GRANT SELECT ON public.post_mentions TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_mentions TO authenticated;
GRANT ALL ON public.post_mentions TO service_role;

ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentions are viewable by everyone"
  ON public.post_mentions FOR SELECT
  USING (true);

CREATE POLICY "Post authors can add mentions"
  ON public.post_mentions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.profile_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = mentioned_profile_id)
  );

CREATE POLICY "Post authors can remove mentions"
  ON public.post_mentions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.profile_id = auth.uid()));

CREATE INDEX idx_post_mentions_post_id ON public.post_mentions(post_id);
CREATE INDEX idx_post_mentions_mentioned_profile_id ON public.post_mentions(mentioned_profile_id);

-- 2. Idempotency for mention notifications: one per (user, post)
CREATE UNIQUE INDEX IF NOT EXISTS notifications_mention_unique
  ON public.notifications (user_id, reference_id)
  WHERE type = 'mention';

-- 3. Notify on mention
CREATE OR REPLACE FUNCTION public.notify_on_post_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author_id uuid;
  author_name text;
BEGIN
  SELECT p.profile_id INTO author_id FROM public.posts p WHERE p.id = NEW.post_id;
  IF author_id IS NULL OR author_id = NEW.mentioned_profile_id THEN
    RETURN NEW;
  END IF;

  SELECT stage_name INTO author_name FROM public.profiles WHERE id = author_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    NEW.mentioned_profile_id,
    'mention',
    'Mention',
    'mentioned you in a post',
    NEW.post_id,
    'post',
    author_id,
    author_name
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER post_mentions_notify
AFTER INSERT ON public.post_mentions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_mention();

-- 4. Artist introduction posts create a real mention
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

  IF new_id IS NULL THEN
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

    body := '🎶 Discover @' || a.stage_name || ', now on Muzicalist.' || E'\n\n'
         || '@' || a.stage_name || ' is a ' || spec
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
  END IF;

  IF new_id IS NOT NULL THEN
    INSERT INTO public.post_mentions (post_id, mentioned_profile_id)
    VALUES (new_id, a.id)
    ON CONFLICT (post_id, mentioned_profile_id) DO NOTHING;
  END IF;

  RETURN new_id;
END;
$$;

-- 5. Backfill the existing Lexya study-case post (no duplicate post created)
UPDATE public.posts
   SET content = regexp_replace(content, '(^|[^@\w])Lexya', '\1@Lexya', 'g')
 WHERE id = '79f7bc6a-c26d-4730-aa7f-cd685a5a0b8e'
   AND content NOT LIKE '%@Lexya%';

INSERT INTO public.post_mentions (post_id, mentioned_profile_id)
VALUES ('79f7bc6a-c26d-4730-aa7f-cd685a5a0b8e', '3640e87f-31f6-4576-b14b-da5d45064ccf')
ON CONFLICT (post_id, mentioned_profile_id) DO NOTHING;