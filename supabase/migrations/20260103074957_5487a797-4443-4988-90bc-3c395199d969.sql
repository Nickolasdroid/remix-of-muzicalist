-- Backend function: soft-delete a conversation for the current user only
-- This avoids client-side UPDATE/RLS edge cases.

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
      SET deleted_by_artist = true
    WHERE id = _conversation_id;
  ELSIF auth.uid() = v_participant_id THEN
    UPDATE public.conversations
      SET deleted_by_participant = true
    WHERE id = _conversation_id;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$$;

-- Lock down who can call it
REVOKE ALL ON FUNCTION public.soft_delete_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_conversation(uuid) TO authenticated;