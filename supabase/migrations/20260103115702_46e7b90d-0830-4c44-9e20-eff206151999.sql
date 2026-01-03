
-- Add deletion timestamp columns to track when each user deleted the conversation
ALTER TABLE public.conversations 
ADD COLUMN deleted_at_by_artist timestamp with time zone DEFAULT NULL,
ADD COLUMN deleted_at_by_participant timestamp with time zone DEFAULT NULL;

-- Update soft_delete_conversation to set timestamp
CREATE OR REPLACE FUNCTION public.soft_delete_conversation(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id uuid;
  v_participant_id uuid;
BEGIN
  SELECT artist_id, participant_id
    INTO v_artist_id, v_participant_id
  FROM public.conversations
  WHERE id = _conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF auth.uid() = v_artist_id THEN
    UPDATE public.conversations
      SET deleted_by_artist = true,
          deleted_at_by_artist = now()
    WHERE id = _conversation_id;
  ELSIF auth.uid() = v_participant_id THEN
    UPDATE public.conversations
      SET deleted_by_participant = true,
          deleted_at_by_participant = now()
    WHERE id = _conversation_id;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$$;
