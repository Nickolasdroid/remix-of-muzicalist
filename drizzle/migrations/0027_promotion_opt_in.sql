-- Promotion on Muzicalist's social media becomes opt-in: artists are asked once
-- in the app and their answer is recorded. Until they answer, they are not promoted.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promotion_answered_at timestamptz;
ALTER TABLE public.profiles ALTER COLUMN allow_promotion SET DEFAULT false;
UPDATE public.profiles SET allow_promotion = false WHERE promotion_answered_at IS NULL;
GRANT SELECT (promotion_answered_at) ON public.profiles TO authenticated;
