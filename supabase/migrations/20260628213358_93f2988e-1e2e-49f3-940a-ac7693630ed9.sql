ALTER TABLE public.profiles ALTER COLUMN county DROP NOT NULL;

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
  v_experience public.experience_level;
  v_career_start int;
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
    v_experience := NULLIF(v_meta->>'experience_level','')::public.experience_level;
  EXCEPTION WHEN others THEN v_experience := NULL;
  END;

  BEGIN
    v_career_start := NULLIF(v_meta->>'career_start_year','')::int;
  EXCEPTION WHEN others THEN v_career_start := NULL;
  END;

  INSERT INTO public.profiles (
    id, first_name, last_name, stage_name, email, phone, country, county, avatar_url,
    specialization, experience_level, career_start_year
  )
  VALUES (
    NEW.id, v_first_name, v_last_name, v_stage_name, NEW.email, v_phone,
    v_country, v_county, v_avatar, v_specialization, v_experience, v_career_start
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, user_type)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

UPDATE public.profiles p
SET country = NULL,
    county = NULL
FROM public.user_roles ur
WHERE ur.user_id = p.id
  AND ur.user_type = 'user'
  AND p.specialization IS NULL
  AND p.country = 'Romania'
  AND (p.county IS NULL OR p.county = '');