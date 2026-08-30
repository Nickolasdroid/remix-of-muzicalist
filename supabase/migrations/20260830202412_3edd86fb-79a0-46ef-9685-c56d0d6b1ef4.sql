DO $$ BEGIN
  CREATE TYPE public.mention_permission AS ENUM ('everyone','artists','following','nobody');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mentions_allow_from public.mention_permission NOT NULL DEFAULT 'everyone';

CREATE OR REPLACE FUNCTION public.can_mention(_actor uuid, _target uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pref public.mention_permission;
BEGIN
  IF _target IS NULL THEN RETURN false; END IF;
  IF _actor IS NULL THEN RETURN false; END IF;
  IF _actor = _target THEN RETURN true; END IF;

  SELECT mentions_allow_from INTO v_pref FROM public.profiles WHERE id = _target;
  IF v_pref IS NULL THEN RETURN false; END IF;

  -- Admins (official Muzicalist account) may always mention
  IF public.is_admin(_actor) THEN RETURN true; END IF;

  IF v_pref = 'everyone' THEN
    RETURN true;
  ELSIF v_pref = 'nobody' THEN
    RETURN false;
  ELSIF v_pref = 'artists' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _actor AND ur.user_type = 'artist');
  ELSIF v_pref = 'following' THEN
    -- the target follows the actor
    RETURN EXISTS (SELECT 1 FROM public.followers f WHERE f.artist_id = _actor AND f.follower_id = _target);
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_mention_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('service_role','postgres','supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NOT public.can_mention(v_actor, NEW.mentioned_profile_id) THEN
    RAISE EXCEPTION 'This person does not allow mentions from your account'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_mention_permission_trg ON public.post_mentions;
CREATE TRIGGER enforce_mention_permission_trg
BEFORE INSERT ON public.post_mentions
FOR EACH ROW EXECUTE FUNCTION public.enforce_mention_permission();

CREATE OR REPLACE FUNCTION public.search_mentionable_profiles(_query text, _limit integer DEFAULT 8)
RETURNS TABLE (id uuid, stage_name text, slug text, avatar_url text, specialization text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.stage_name, p.slug, p.avatar_url, p.specialization::text
  FROM public.profiles p
  WHERE p.is_active
    AND (
      _query IS NULL OR _query = ''
      OR public.unaccent(p.stage_name) ILIKE '%' || public.unaccent(_query) || '%'
    )
    AND public.can_mention(auth.uid(), p.id)
  ORDER BY p.stage_name
  LIMIT LEAST(COALESCE(_limit, 8), 25);
$$;

GRANT EXECUTE ON FUNCTION public.search_mentionable_profiles(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_mention(uuid, uuid) TO authenticated;
