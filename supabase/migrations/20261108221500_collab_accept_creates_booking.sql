-- Accepting a collaborator also opens a booking request between the two artists,
-- so the existing flow applies: the chosen artist sends an offer (pre-filled with the fee),
-- the author accepts it, and the contract is generated as for any booking.
CREATE OR REPLACE FUNCTION public.choose_collaborator(_conversation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conv record;
  v_ann record;
  v_me record;
  v_chosen uuid;
  v_name text;
  v_msg text;
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_conv FROM public.conversations WHERE id = _conversation_id;
  IF NOT FOUND OR v_conv.announcement_id IS NULL THEN
    RAISE EXCEPTION 'CONVERSATION_NOT_FOUND' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_ann FROM public.announcements WHERE id = v_conv.announcement_id FOR UPDATE;
  IF NOT FOUND OR v_ann.profile_id <> v_uid THEN
    RAISE EXCEPTION 'NOT_OWNER' USING ERRCODE = 'check_violation';
  END IF;
  IF v_ann.kind IS DISTINCT FROM 'collab' THEN
    RAISE EXCEPTION 'NOT_A_COLLABORATION' USING ERRCODE = 'check_violation';
  END IF;
  IF v_ann.chosen_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_CHOSEN' USING ERRCODE = 'check_violation';
  END IF;

  v_chosen := CASE WHEN v_conv.artist_id = v_uid THEN v_conv.participant_id ELSE v_conv.artist_id END;

  UPDATE public.announcements
  SET chosen_profile_id = v_chosen, status = 'closed'
  WHERE id = v_ann.id;

  SELECT * INTO v_me FROM public.profiles WHERE id = v_uid;
  v_name := COALESCE(NULLIF(v_me.stage_name, ''), NULLIF(trim(COALESCE(v_me.first_name, '') || ' ' || COALESCE(v_me.last_name, '')), ''), 'Artist');

  -- Booking request author -> chosen artist (only when the collaboration has a date)
  IF v_ann.event_on IS NOT NULL THEN
    v_msg := '';
    IF v_ann.start_time IS NOT NULL AND v_ann.end_time IS NOT NULL THEN
      v_msg := 'Time: ' || to_char(v_ann.start_time, 'HH24:MI') || ' - ' || to_char(v_ann.end_time, 'HH24:MI') || E'\n';
    END IF;
    v_msg := v_msg || 'Collaboration: ' || COALESCE(NULLIF(v_ann.title, ''), 'Collaboration');
    IF v_ann.budget_min IS NOT NULL THEN
      v_msg := v_msg || E'\nFee: ' || trim(to_char(v_ann.budget_min, 'FM999999990.##')) || ' ' || COALESCE(v_ann.budget_currency, 'RON');
    END IF;

    INSERT INTO public.booking_requests (
      profile_id, requester_user_id, requester_name, requester_email, requester_phone,
      event_date, event_end_date, event_type, message, status
    ) VALUES (
      v_chosen, v_uid, v_name, COALESCE(v_me.email, ''), COALESCE(v_me.phone, ''),
      v_ann.event_on, COALESCE(v_ann.event_end_on, v_ann.event_on), v_ann.event_type, v_msg, 'pending'
    );
  END IF;

  -- Notifications never block the choice
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (v_chosen, 'collab_chosen', 'Collaboration', 'chose you for their collaboration', v_conv.id, 'conversation', v_uid, v_name);

    FOR r IN
      SELECT id, CASE WHEN artist_id = v_uid THEN participant_id ELSE artist_id END AS other
      FROM public.conversations
      WHERE announcement_id = v_ann.id AND id <> v_conv.id AND collab_rejected_at IS NULL
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
      VALUES (r.other, 'collab_filled', 'Collaboration', 'found a collaborator for the collaboration you answered', r.id, 'conversation', v_uid, v_name);
    END LOOP;
  EXCEPTION WHEN others THEN
    NULL;
  END;

  RETURN v_chosen;
END;
$$;

REVOKE ALL ON FUNCTION public.choose_collaborator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.choose_collaborator(uuid) TO authenticated;
