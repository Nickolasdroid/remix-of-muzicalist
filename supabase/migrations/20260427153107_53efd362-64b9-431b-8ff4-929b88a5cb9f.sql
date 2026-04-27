-- Add 'kind' column to track whether a consumed slot is for an ad/promotion or a post
ALTER TABLE public.consumed_ad_slots
ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'ad';

-- Backfill: existing rows are all ads/promotions
UPDATE public.consumed_ad_slots SET kind = 'ad' WHERE kind IS NULL OR kind = '';

-- Add a check constraint for valid values
ALTER TABLE public.consumed_ad_slots
DROP CONSTRAINT IF EXISTS consumed_ad_slots_kind_check;
ALTER TABLE public.consumed_ad_slots
ADD CONSTRAINT consumed_ad_slots_kind_check CHECK (kind IN ('ad', 'post'));

-- Backfill posts: insert one consumed slot per existing post (idempotent via NOT EXISTS)
INSERT INTO public.consumed_ad_slots (profile_id, is_premium, announcement_id, consumed_at, kind)
SELECT p.profile_id, false, p.id, p.created_at, 'post'
FROM public.posts p
WHERE NOT EXISTS (
  SELECT 1 FROM public.consumed_ad_slots s
  WHERE s.kind = 'post' AND s.announcement_id = p.id
);