-- One sign-up for everyone. Email sign-ups say "artist" or "user" up front
-- (account_type in the sign-up data). Google sign-ups can't, so they choose on a
-- welcome screen right after, once: set_my_account_type.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type_chosen boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_avatar text;
  v_role public.user_type;
  v_phone text;
  v_country text;
  v_county text;
  v_stage_name text;
  v_specialization public.artist_specialization;
  v_career_start int;
  v_type_chosen boolean;
BEGIN
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

  IF COALESCE(v_meta->>'account_type','') = 'artist' THEN
    v_role := 'artist'::public.user_type;
  ELSE
    v_role := 'user'::public.user_type;
  END IF;

  -- No account type in the sign-up data (Google): ask on the welcome screen
  v_type_chosen := COALESCE(v_meta->>'account_type','') IN ('artist', 'user');

  v_phone := COALESCE(NULLIF(v_meta->>'phone',''), '');

  IF v_role = 'artist'::public.user_type THEN
    v_country := COALESCE(NULLIF(v_meta->>'country',''), 'Romania');
    v_county  := COALESCE(NULLIF(v_meta->>'county',''), '');
  ELSE
    v_country := NULLIF(v_meta->>'country','');
    v_county  := NULLIF(v_meta->>'county','');
  END IF;

  v_stage_name := COALESCE(NULLIF(v_meta->>'stage_name',''), v_full_name);

  BEGIN
    v_specialization := NULLIF(v_meta->>'specialization','')::public.artist_specialization;
  EXCEPTION WHEN others THEN v_specialization := NULL;
  END;

  BEGIN
    v_career_start := NULLIF(v_meta->>'career_start_year','')::int;
  EXCEPTION WHEN others THEN v_career_start := NULL;
  END;

  INSERT INTO public.profiles (
    id, first_name, last_name, stage_name, email, phone, country, county, avatar_url,
    specialization, career_start_year, account_type_chosen
  )
  VALUES (
    NEW.id, v_first_name, v_last_name, v_stage_name, NEW.email, v_phone,
    v_country, v_county, v_avatar, v_specialization, v_career_start, v_type_chosen
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, user_type)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Welcome screen choice (only once, only while not chosen yet)
CREATE OR REPLACE FUNCTION public.set_my_account_type(_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF _type NOT IN ('artist', 'user') THEN
    RAISE EXCEPTION 'INVALID_ACCOUNT_TYPE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND account_type_chosen = false) THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_ALREADY_CHOSEN';
  END IF;

  UPDATE public.user_roles SET user_type = _type::public.user_type WHERE user_id = v_uid;
  UPDATE public.profiles
     SET account_type_chosen = true,
         country = CASE WHEN _type = 'artist' THEN COALESCE(country, 'Romania') ELSE country END
   WHERE id = v_uid;
  RETURN _type;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_account_type(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_account_type(text) TO authenticated;
