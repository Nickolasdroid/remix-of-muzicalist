-- Trigger function: when a message is inserted, reset the deleted flag for the other user
CREATE OR REPLACE FUNCTION public.handle_new_message_undelete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id uuid;
  v_participant_id uuid;
BEGIN
  -- Get conversation participants
  SELECT artist_id, participant_id
    INTO v_artist_id, v_participant_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- If sender is the artist, reset deleted_by_participant so participant sees the conversation again
  IF NEW.sender_id = v_artist_id THEN
    UPDATE public.conversations
      SET deleted_by_participant = false
    WHERE id = NEW.conversation_id AND deleted_by_participant = true;
  -- If sender is the participant, reset deleted_by_artist so artist sees the conversation again
  ELSIF NEW.sender_id = v_participant_id THEN
    UPDATE public.conversations
      SET deleted_by_artist = false
    WHERE id = NEW.conversation_id AND deleted_by_artist = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_message_insert_undelete ON public.messages;
CREATE TRIGGER on_message_insert_undelete
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message_undelete();