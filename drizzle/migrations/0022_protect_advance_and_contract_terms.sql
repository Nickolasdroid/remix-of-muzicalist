CREATE OR REPLACE FUNCTION public.guard_booking_offer_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('muzicalist.booking_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.offer_price IS DISTINCT FROM OLD.offer_price
     OR NEW.offer_currency IS DISTINCT FROM OLD.offer_currency
     OR NEW.offer_note IS DISTINCT FROM OLD.offer_note
     OR NEW.offer_sent_at IS DISTINCT FROM OLD.offer_sent_at
     OR NEW.offer_terms_accepted_at IS DISTINCT FROM OLD.offer_terms_accepted_at
     OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
     OR NEW.advance_amount IS DISTINCT FROM OLD.advance_amount
     OR NEW.advance_due_date IS DISTINCT FROM OLD.advance_due_date
     OR NEW.advance_received_at IS DISTINCT FROM OLD.advance_received_at THEN
    RAISE EXCEPTION 'BOOKING_OFFER_FIELDS_READ_ONLY';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('offered', 'accepted') THEN
    RAISE EXCEPTION 'BOOKING_REQUIRES_ACCEPTED_OFFER';
  END IF;

  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' AND NEW.declined_by IS NULL
     AND auth.uid() IS NOT DISTINCT FROM NEW.profile_id THEN
    NEW.declined_by := 'artist';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.respond_to_booking_offer(_booking_id uuid, _accept boolean, _accept_terms boolean DEFAULT false, _event_location text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  b public.booking_requests%ROWTYPE;
  v_location text := NULLIF(btrim(_event_location), '');
  v_org jsonb;
  v_art jsonb;
  v_number text;
  v_ip text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO b FROM public.booking_requests WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.requester_user_id IS DISTINCT FROM uid THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF b.status <> 'offered' THEN
    RAISE EXCEPTION 'BOOKING_NO_OPEN_OFFER';
  END IF;

  IF NOT _accept THEN
    PERFORM set_config('muzicalist.booking_rpc', 'on', true);
    UPDATE public.booking_requests
    SET status = 'rejected', declined_by = 'requester'
    WHERE id = _booking_id;
    PERFORM set_config('muzicalist.booking_rpc', 'off', true);
    RETURN 'rejected';
  END IF;

  IF b.event_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'BOOKING_DATE_PASSED';
  END IF;
  IF _accept_terms IS NOT TRUE THEN
    RAISE EXCEPTION 'CONTRACT_TERMS_NOT_ACCEPTED';
  END IF;
  IF v_location IS NULL OR char_length(v_location) > 300 THEN
    RAISE EXCEPTION 'CONTRACT_LOCATION_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.contract_profiles
    WHERE user_id = uid AND NULLIF(btrim(address), '') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'CONTRACT_DETAILS_REQUIRED';
  END IF;

  v_org := public.contract_party_snapshot(uid);
  v_art := public.contract_party_snapshot(b.profile_id);
  v_number := 'MZ-' || to_char(now() AT TIME ZONE 'Europe/Bucharest', 'YYYY') || '-'
              || lpad(nextval('public.booking_contract_number_seq')::text, 6, '0');

  BEGIN
    v_ip := split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1);
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  INSERT INTO public.booking_contracts (
    booking_request_id, contract_number, artist_id, organizer_id, template_version,
    artist_party, organizer_party, terms,
    artist_accepted_at, organizer_accepted_at, organizer_accept_ip
  ) VALUES (
    b.id, v_number, b.profile_id, uid, 'v1',
    v_art, v_org,
    jsonb_build_object(
      'price', b.offer_price,
      'currency', b.offer_currency,
      'offer_note', b.offer_note,
      'advance_amount', b.advance_amount,
      'advance_due_date', b.advance_due_date,
      'event_date', b.event_date,
      'event_end_date', b.event_end_date,
      'event_type', b.event_type,
      'time', substring(b.message FROM 'Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2})'),
      'location', v_location,
      'request_created_at', b.created_at
    ),
    COALESCE(b.offer_terms_accepted_at, b.offer_sent_at, now()),
    now(),
    NULLIF(btrim(v_ip), '')
  );

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests
  SET status = 'accepted', confirmed_at = now(), declined_by = NULL
  WHERE id = _booking_id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);

  RETURN 'accepted';
END;
$function$;