-- Profile view counter for every artist, on every plan.
-- One view per visitor per artist per day (Europe/Bucharest); the artist's own
-- visits are not counted. Rows are only reachable through the functions below.

CREATE TABLE IF NOT EXISTS public.artist_profile_views (
  artist_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day         date        NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Bucharest')::date,
  visitor_key text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artist_id, day, visitor_key)
);

ALTER TABLE public.artist_profile_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.artist_profile_views FROM PUBLIC, anon, authenticated;

-- Records a visit. Signed-in visitors are keyed by account, guests by a random
-- browser id (UUID) the site keeps in localStorage.
CREATE OR REPLACE FUNCTION public.record_profile_view(_artist_id uuid, _visitor_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_key text;
BEGIN
  IF _artist_id IS NULL THEN RETURN; END IF;
  IF v_uid IS NOT NULL AND v_uid = _artist_id THEN RETURN; END IF;

  IF v_uid IS NOT NULL THEN
    v_key := 'u:' || v_uid::text;
  ELSE
    IF _visitor_id IS NULL
       OR _visitor_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RETURN;
    END IF;
    v_key := 'a:' || lower(_visitor_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _artist_id) THEN RETURN; END IF;

  INSERT INTO public.artist_profile_views (artist_id, visitor_key)
  VALUES (_artist_id, v_key)
  ON CONFLICT DO NOTHING;
END;
$$;

-- The signed-in artist's own counts: last 30 days, the 30 days before, all time.
CREATE OR REPLACE FUNCTION public.get_my_profile_views()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH t AS (SELECT (now() AT TIME ZONE 'Europe/Bucharest')::date AS today)
  SELECT jsonb_build_object(
    'last_30', count(*) FILTER (WHERE v.day > t.today - 30),
    'prev_30', count(*) FILTER (WHERE v.day <= t.today - 30 AND v.day > t.today - 60),
    'total',   count(*)
  )
  FROM t
  LEFT JOIN public.artist_profile_views v ON v.artist_id = auth.uid()
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.record_profile_view(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_profile_views() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_profile_view(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_views() TO authenticated;
