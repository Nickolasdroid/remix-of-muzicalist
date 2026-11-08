-- Advance (deposit) on booking offers. No payment goes through the app: the artist asks for
-- an amount and a due date, it is written into the contract, the organizer pays by bank
-- transfer and the artist marks it as received.
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS advance_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS advance_due_date date,
  ADD COLUMN IF NOT EXISTS advance_received_at timestamptz;

-- Artist: set or clear the advance on their open offer (by booking, or by event for event offers)
CREATE OR REPLACE FUNCTION public.set_offer_advance(
  _booking_id uuid DEFAULT NULL,
  _announcement_id uuid DEFAULT NULL,
  _amount numeric DEFAULT NULL,
  _due_date date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.booking_requests%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _booking_id IS NOT NULL THEN
    SELECT * INTO b FROM public.booking_requests WHERE id = _booking_id FOR UPDATE;
  ELSE
    SELECT * INTO b FROM public.booking_requests
    WHERE announcement_id = _announcement_id AND profile_id = uid
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  END IF;

  IF NOT FOUND OR b.profile_id <> uid THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF b.status <> 'offered' THEN
    RAISE EXCEPTION 'BOOKING_NO_OPEN_OFFER';
  END IF;

  IF _amount IS NOT NULL THEN
    IF _amount <= 0 OR _amount > COALESCE(b.offer_price, 0) THEN
      RAISE EXCEPTION 'ADVANCE_INVALID_AMOUNT';
    END IF;
    IF _due_date IS NULL OR _due_date < CURRENT_DATE OR _due_date > b.event_date THEN
      RAISE EXCEPTION 'ADVANCE_INVALID_DATE';
    END IF;
  END IF;

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests
  SET advance_amount = CASE WHEN _amount IS NULL THEN NULL ELSE round(_amount, 2) END,
      advance_due_date = CASE WHEN _amount IS NULL THEN NULL ELSE _due_date END,
      advance_received_at = NULL
  WHERE id = b.id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_offer_advance(uuid, uuid, numeric, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_offer_advance(uuid, uuid, numeric, date) TO authenticated;

-- Artist: the advance arrived
CREATE OR REPLACE FUNCTION public.mark_advance_received(_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.booking_requests%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT * INTO b FROM public.booking_requests WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.profile_id <> uid THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF b.status <> 'accepted' OR b.advance_amount IS NULL THEN
    RAISE EXCEPTION 'ADVANCE_NOT_DUE';
  END IF;

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests SET advance_received_at = now() WHERE id = b.id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_advance_received(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_advance_received(uuid) TO authenticated;

-- Contract: same as before, plus the advance in the terms
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
      'event_date', b.event_date,
      'event_end_date', b.event_end_date,
      'event_type', b.event_type,
      'time', substring(b.message FROM 'Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2})'),
      'location', v_location,
      'request_created_at', b.created_at,
      'advance_amount', b.advance_amount,
      'advance_due_date', b.advance_due_date
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
