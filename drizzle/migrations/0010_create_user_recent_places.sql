CREATE TABLE IF NOT EXISTS public.user_recent_places (
  user_id uuid        NOT NULL,
  label   text        NOT NULL CHECK (char_length(label) BETWEEN 2 AND 120),
  used_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, label)
);

GRANT SELECT, DELETE ON public.user_recent_places TO authenticated;
GRANT ALL ON public.user_recent_places TO service_role;

ALTER TABLE public.user_recent_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own recent places: read" ON public.user_recent_places;
CREATE POLICY "Own recent places: read" ON public.user_recent_places
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Own recent places: delete" ON public.user_recent_places;
CREATE POLICY "Own recent places: delete" ON public.user_recent_places
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.remember_recent_place(_label text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_label text := btrim(_label);
BEGIN
  IF v_uid IS NULL OR v_label IS NULL OR char_length(v_label) NOT BETWEEN 2 AND 120 THEN
    RETURN;
  END IF;

  INSERT INTO public.user_recent_places (user_id, label, used_at)
  VALUES (v_uid, v_label, now())
  ON CONFLICT (user_id, label) DO UPDATE SET used_at = now();

  DELETE FROM public.user_recent_places
  WHERE user_id = v_uid
    AND label NOT IN (
      SELECT label FROM public.user_recent_places
      WHERE user_id = v_uid
      ORDER BY used_at DESC
      LIMIT 10
    );
END;
$$;

REVOKE ALL ON FUNCTION public.remember_recent_place(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remember_recent_place(text) TO authenticated;