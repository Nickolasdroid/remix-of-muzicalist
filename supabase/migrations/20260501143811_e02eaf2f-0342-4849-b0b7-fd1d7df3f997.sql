-- Ensure one role per user (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- Trigger function: create profile + role for any new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_avatar text;
  v_role public.user_type;
BEGIN
  -- Resolve name from various provider shapes
  v_full_name := NULLIF(TRIM(COALESCE(
    v_meta->>'full_name',
    v_meta->>'name',
    CONCAT_WS(' ', v_meta->>'first_name', v_meta->>'last_name')
  )), '');

  IF v_full_name IS NULL THEN
    v_full_name := split_part(NEW.email, '@', 1);
  END IF;

  v_first_name := COALESCE(NULLIF(v_meta->>'first_name',''), split_part(v_full_name, ' ', 1));
  v_last_name  := COALESCE(NULLIF(v_meta->>'last_name',''),
                           NULLIF(TRIM(SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name) + 1)), ''),
                           '');
  IF v_last_name = v_first_name THEN
    v_last_name := '';
  END IF;

  v_avatar := NULLIF(COALESCE(v_meta->>'avatar_url', v_meta->>'picture'), '');

  -- Decide role: only 'artist' or 'user' here. Admin is set manually.
  IF COALESCE(v_meta->>'account_type','') = 'artist' THEN
    v_role := 'artist'::public.user_type;
  ELSE
    v_role := 'user'::public.user_type;
  END IF;

  -- Create profile if missing
  INSERT INTO public.profiles (
    id, first_name, last_name, stage_name, email, phone, county, avatar_url
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    v_full_name,
    NEW.email,
    '',
    '',
    v_avatar
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create role if missing
  INSERT INTO public.user_roles (user_id, user_type)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();