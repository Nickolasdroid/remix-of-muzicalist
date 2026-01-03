-- Function to get or restore/create a conversation
-- This bypasses RLS to find soft-deleted conversations and restore them
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_artist_id uuid, _participant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user uuid;
BEGIN
  v_current_user := auth.uid();
  
  -- Validate: current user must be one of the participants
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_current_user NOT IN (_artist_id, _participant_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if conversation exists (including soft-deleted) in either direction
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (artist_id = _artist_id AND participant_id = _participant_id)
     OR (artist_id = _participant_id AND participant_id = _artist_id);
  
  IF v_conversation_id IS NOT NULL THEN
    -- Conversation exists, restore it for the current user
    IF v_current_user = (SELECT artist_id FROM public.conversations WHERE id = v_conversation_id) THEN
      UPDATE public.conversations SET deleted_by_artist = false WHERE id = v_conversation_id;
    ELSE
      UPDATE public.conversations SET deleted_by_participant = false WHERE id = v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
  END IF;
  
  -- No conversation exists, create new one
  INSERT INTO public.conversations (artist_id, participant_id)
  VALUES (_artist_id, _participant_id)
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;