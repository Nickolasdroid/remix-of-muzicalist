-- Collaborations: the author can turn down one reply (the collaboration stays open for the others).
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS collab_rejected_at timestamptz;

CREATE OR REPLACE FUNCTION public.reject_collab_reply(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conv record;
  v_ann record;
  v_other uuid;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_conv FROM public.conversations WHERE id = _conversation_id FOR UPDATE;
  IF NOT FOUND OR v_conv.announcement_id IS NULL THEN
    RAISE EXCEPTION 'CONVERSATION_NOT_FOUND' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_ann FROM public.announcements WHERE id = v_conv.announcement_id;
  IF NOT FOUND OR v_ann.profile_id <> v_uid OR v_ann.kind IS DISTINCT FROM 'collab' THEN
    RAISE EXCEPTION 'NOT_OWNER' USING ERRCODE = 'check_violation';
  END IF;
  IF v_conv.collab_rejected_at IS NOT NULL THEN
    RETURN;
  END IF;

  v_other := CASE WHEN v_conv.artist_id = v_uid THEN v_conv.participant_id ELSE v_conv.artist_id END;
  IF v_ann.chosen_profile_id = v_other THEN
    RAISE EXCEPTION 'ALREADY_CHOSEN' USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.conversations SET collab_rejected_at = now() WHERE id = v_conv.id;

  SELECT COALESCE(NULLIF(stage_name, ''), first_name) INTO v_name FROM public.profiles WHERE id = v_uid;
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (v_other, 'collab_rejected', 'Collaboration', 'chose someone else for their collaboration', v_conv.id, 'conversation', v_uid, v_name);
  EXCEPTION WHEN others THEN
    NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_collab_reply(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_collab_reply(uuid) TO authenticated;
