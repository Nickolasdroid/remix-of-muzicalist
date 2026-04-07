ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_artist_id_participant_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_regular_pair_unique_idx
ON public.conversations (artist_id, participant_id)
WHERE announcement_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_ad_pair_unique_idx
ON public.conversations (artist_id, participant_id, announcement_id)
WHERE announcement_id IS NOT NULL;