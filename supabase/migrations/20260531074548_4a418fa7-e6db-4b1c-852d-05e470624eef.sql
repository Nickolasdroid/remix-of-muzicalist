ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS comments_allow_from text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS comments_allow_gifs boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_comments_allow_from_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_comments_allow_from_check
  CHECK (comments_allow_from IN ('everyone','following','off'));