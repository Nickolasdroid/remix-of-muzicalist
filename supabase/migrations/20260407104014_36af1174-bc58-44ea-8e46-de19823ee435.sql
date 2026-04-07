CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_artist_id uuid, _participant_id uuid, _announcement_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user uuid;
BEGIN
  v_current_user := auth.uid();
  
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_current_user NOT IN (_artist_id, _participant_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- If announcement_id is provided, check for existing conversation with same announcement
  IF _announcement_id IS NOT NULL THEN
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE announcement_id = _announcement_id
      AND ((artist_id = _artist_id AND participant_id = _participant_id)
        OR (artist_id = _participant_id AND participant_id = _artist_id));
    
    IF v_conversation_id IS NOT NULL THEN
      IF v_current_user = (SELECT artist_id FROM public.conversations WHERE id = v_conversation_id) THEN
        UPDATE public.conversations SET deleted_by_artist = false WHERE id = v_conversation_id;
      ELSE
        UPDATE public.conversations SET deleted_by_participant = false WHERE id = v_conversation_id;
      END IF;
      RETURN v_conversation_id;
    END IF;
  END IF;
  
  -- Check for existing conversation without announcement (regular chat)
  IF _announcement_id IS NULL THEN
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE announcement_id IS NULL
      AND ((artist_id = _artist_id AND participant_id = _participant_id)
        OR (artist_id = _participant_id AND participant_id = _artist_id));
    
    IF v_conversation_id IS NOT NULL THEN
      IF v_current_user = (SELECT artist_id FROM public.conversations WHERE id = v_conversation_id) THEN
        UPDATE public.conversations SET deleted_by_artist = false WHERE id = v_conversation_id;
      ELSE
        UPDATE public.conversations SET deleted_by_participant = false WHERE id = v_conversation_id;
      END IF;
      RETURN v_conversation_id;
    END IF;
  END IF;
  
  -- Create new conversation
  INSERT INTO public.conversations (artist_id, participant_id, announcement_id)
  VALUES (_artist_id, _participant_id, _announcement_id)
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;