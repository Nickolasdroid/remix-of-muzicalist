ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pending_account_type text;

-- Grandfather every existing profile as active
UPDATE public.profiles SET is_active = true WHERE is_active IS DISTINCT FROM true;