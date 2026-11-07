ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS chosen_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.choose_collaborator(_conversation_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conv record; v_ann record; v_chosen uuid; v_name text; r record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'check_violation'; END IF;

  SELECT * INTO v_conv FROM public.conversations WHERE id = _conversation_id;
  IF NOT FOUND OR v_conv.announcement_id IS NULL THEN
    RAISE EXCEPTION 'CONVERSATION_NOT_FOUND' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_ann FROM public.announcements WHERE id = v_conv.announcement_id FOR UPDATE;
  IF NOT FOUND OR v_ann.profile_id <> v_uid THEN RAISE EXCEPTION 'NOT_OWNER' USING ERRCODE = 'check_violation'; END IF;
  IF v_ann.kind IS DISTINCT FROM 'collab' THEN RAISE EXCEPTION 'NOT_A_COLLABORATION' USING ERRCODE = 'check_violation'; END IF;
  IF v_ann.chosen_profile_id IS NOT NULL THEN RAISE EXCEPTION 'ALREADY_CHOSEN' USING ERRCODE = 'check_violation'; END IF;

  v_chosen := CASE WHEN v_conv.artist_id = v_uid THEN v_conv.participant_id ELSE v_conv.artist_id END;

  UPDATE public.announcements SET chosen_profile_id = v_chosen, status = 'closed' WHERE id = v_ann.id;

  SELECT COALESCE(NULLIF(stage_name, ''), first_name) INTO v_name FROM public.profiles WHERE id = v_uid;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (v_chosen, 'collab_chosen', 'Collaboration', 'chose you for their collaboration', v_conv.id, 'conversation', v_uid, v_name);
    FOR r IN
      SELECT id, CASE WHEN artist_id = v_uid THEN participant_id ELSE artist_id END AS other
      FROM public.conversations WHERE announcement_id = v_ann.id AND id <> v_conv.id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
      VALUES (r.other, 'collab_filled', 'Collaboration', 'found a collaborator for the collaboration you answered', r.id, 'conversation', v_uid, v_name);
    END LOOP;
  EXCEPTION WHEN others THEN NULL;
  END;

  RETURN v_chosen;
END;
$$;

REVOKE ALL ON FUNCTION public.choose_collaborator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.choose_collaborator(uuid) TO authenticated;