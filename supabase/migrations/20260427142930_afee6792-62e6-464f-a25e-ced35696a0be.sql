-- Track consumed announcement/promotion slots so deleting an ad does not free its slot for 30 days.
CREATE TABLE public.consumed_ad_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  announcement_id UUID,
  consumed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_consumed_ad_slots_profile_consumed
  ON public.consumed_ad_slots(profile_id, consumed_at DESC);

ALTER TABLE public.consumed_ad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view consumed slots"
ON public.consumed_ad_slots
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own consumed slots"
ON public.consumed_ad_slots
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- No UPDATE/DELETE policies: slots are immutable to enforce the 30-day cooldown.

-- Backfill existing announcements so current ads are correctly counted as consumed.
INSERT INTO public.consumed_ad_slots (profile_id, is_premium, announcement_id, consumed_at, created_at)
SELECT profile_id, is_premium, id, created_at, created_at
FROM public.announcements;