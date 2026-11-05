ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS collab_status text;

DO $$

BEGIN

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_collab_status_check') THEN

    ALTER TABLE public.profiles

      ADD CONSTRAINT profiles_collab_status_check

      CHECK (collab_status IS NULL OR collab_status IN ('free', 'band_open', 'band_closed'));

  END IF;

END $$;

GRANT SELECT (collab_status) ON public.profiles TO anon, authenticated;

CREATE INDEX IF NOT EXISTS profiles_collab_status_idx

  ON public.profiles (collab_status) WHERE collab_status IS NOT NULL;