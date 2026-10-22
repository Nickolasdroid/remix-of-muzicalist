CREATE TABLE IF NOT EXISTS public.contract_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL DEFAULT 'individual'
    CHECK (entity_type IN ('individual', 'pfa', 'ii', 'if', 'srl', 'other_company')),
  legal_name text NOT NULL CHECK (char_length(btrim(legal_name)) BETWEEN 2 AND 200),
  cui text CHECK (cui IS NULL OR char_length(cui) <= 20),
  reg_com text CHECK (reg_com IS NULL OR char_length(reg_com) <= 40),
  address text CHECK (address IS NULL OR char_length(address) <= 300),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  county text CHECK (county IS NULL OR char_length(county) <= 100),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  representative text CHECK (representative IS NULL OR char_length(representative) <= 150),
  vat_payer boolean NOT NULL DEFAULT false,
  iban text CHECK (iban IS NULL OR char_length(iban) <= 40),
  bank text CHECK (bank IS NULL OR char_length(bank) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage their contract details" ON public.contract_profiles;
CREATE POLICY "Owners manage their contract details"
  ON public.contract_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON public.contract_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_profiles TO authenticated;
GRANT ALL ON public.contract_profiles TO service_role;

DROP TRIGGER IF EXISTS contract_profiles_updated_at ON public.contract_profiles;
CREATE TRIGGER contract_profiles_updated_at
  BEFORE UPDATE ON public.contract_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE SEQUENCE IF NOT EXISTS public.booking_contract_number_seq;

CREATE TABLE IF NOT EXISTS public.booking_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id uuid NOT NULL UNIQUE REFERENCES public.booking_requests(id) ON DELETE CASCADE,
  contract_number text NOT NULL UNIQUE,
  artist_id uuid NOT NULL,
  organizer_id uuid NOT NULL,
  template_version text NOT NULL DEFAULT 'v1',
  artist_party jsonb NOT NULL,
  organizer_party jsonb NOT NULL,
  terms jsonb NOT NULL,
  artist_accepted_at timestamptz NOT NULL,
  organizer_accepted_at timestamptz NOT NULL,
  organizer_accept_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_contracts_artist_idx ON public.booking_contracts (artist_id);
CREATE INDEX IF NOT EXISTS booking_contracts_organizer_idx ON public.booking_contracts (organizer_id);

ALTER TABLE public.booking_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contract parties and admins can read contracts" ON public.booking_contracts;
CREATE POLICY "Contract parties and admins can read contracts"
  ON public.booking_contracts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = artist_id OR auth.uid() = organizer_id OR public.is_admin(auth.uid()));

REVOKE ALL ON public.booking_contracts FROM anon, authenticated;
GRANT SELECT ON public.booking_contracts TO authenticated;
GRANT ALL ON public.booking_contracts TO service_role;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS offer_terms_accepted_at timestamptz;

GRANT SELECT (offer_terms_accepted_at) ON public.booking_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_booking_offer_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('muzicalist.booking_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.offer_price IS DISTINCT FROM OLD.offer_price
     OR NEW.offer_currency IS DISTINCT FROM OLD.offer_currency
     OR NEW.offer_note IS DISTINCT FROM OLD.offer_note
     OR NEW.offer_sent_at IS DISTINCT FROM OLD.offer_sent_at
     OR NEW.offer_terms_accepted_at IS DISTINCT FROM OLD.offer_terms_accepted_at
     OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at THEN
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
$$;

DROP FUNCTION IF EXISTS public.send_booking_offer(uuid, numeric, text, text);

CREATE OR REPLACE FUNCTION public.send_booking_offer(
  _booking_id uuid,
  _price numeric,
  _currency text,
  _note text DEFAULT NULL,
  _accept_terms boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.booking_requests%ROWTYPE;
  v_note text := NULLIF(btrim(_note), '');
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO b FROM public.booking_requests WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.profile_id <> uid THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;
  IF b.status NOT IN ('pending', 'offered') THEN
    RAISE EXCEPTION 'BOOKING_NOT_OPEN';
  END IF;
  IF b.event_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'BOOKING_DATE_PASSED';
  END IF;
  IF _price IS NULL OR _price <= 0 OR _price > 10000000 THEN
    RAISE EXCEPTION 'OFFER_INVALID_PRICE';
  END IF;
  IF _currency IS NULL OR upper(_currency) !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'OFFER_INVALID_CURRENCY';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'OFFER_NOTE_TOO_LONG';
  END IF;
  IF _accept_terms IS NOT TRUE THEN
    RAISE EXCEPTION 'CONTRACT_TERMS_NOT_ACCEPTED';
  END IF;

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests
  SET status = 'offered',
      offer_price = round(_price, 2),
      offer_currency = upper(_currency),
      offer_note = v_note,
      offer_sent_at = now(),
      offer_terms_accepted_at = now(),
      declined_by = NULL
  WHERE id = _booking_id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.contract_party_snapshot(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
        'entity_type', c.entity_type,
        'legal_name', c.legal_name,
        'cui', c.cui,
        'reg_com', c.reg_com,
        'address', c.address,
        'city', c.city,
        'county', c.county,
        'country', c.country,
        'representative', c.representative,
        'vat_payer', c.vat_payer,
        'iban', c.iban,
        'bank', c.bank,
        'stage_name', p.stage_name,
        'email', p.email,
        'phone', p.phone,
        'complete', true)
     FROM public.contract_profiles c
     JOIN public.profiles p ON p.id = c.user_id
     WHERE c.user_id = _user_id),
    (SELECT jsonb_build_object(
        'entity_type', 'individual',
        'legal_name', NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
        'stage_name', p.stage_name,
        'city', p.county,
        'country', p.country,
        'email', p.email,
        'phone', p.phone,
        'vat_payer', false,
        'complete', false)
     FROM public.profiles p
     WHERE p.id = _user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.contract_party_snapshot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contract_party_snapshot(uuid) TO service_role;

DROP FUNCTION IF EXISTS public.respond_to_booking_offer(uuid, boolean);

CREATE OR REPLACE FUNCTION public.respond_to_booking_offer(
  _booking_id uuid,
  _accept boolean,
  _accept_terms boolean DEFAULT false,
  _event_location text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.send_booking_offer(uuid, numeric, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_booking_offer(uuid, boolean, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_booking_offer(uuid, numeric, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_booking_offer(uuid, boolean, boolean, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_booking_offer_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_name text;
  v_time text;
  v_details text;
  v_entry text;
  v_notes text;
  v_day date;
  v_last date;
  v_total int;
  v_idx int := 0;
  v_existing public.calendar_events%ROWTYPE;
  v_contract_no text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.offer_sent_at IS NOT DISTINCT FROM OLD.offer_sent_at THEN
    RETURN NEW;
  END IF;

  SELECT stage_name INTO v_artist_name FROM public.profiles WHERE id = NEW.profile_id;

  IF NEW.status = 'offered' AND NEW.requester_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.requester_user_id, 'booking_update',
            CASE WHEN OLD.status = 'offered' THEN 'Offer Updated' ELSE 'New Offer' END,
            CASE WHEN OLD.status = 'offered' THEN 'updated the offer for your booking request'
                 ELSE 'sent you an offer for your booking request' END,
            NEW.id, 'booking_request', NEW.profile_id, v_artist_name);
  END IF;

  IF NEW.status = 'accepted' AND OLD.status = 'offered' THEN
    SELECT contract_number INTO v_contract_no FROM public.booking_contracts WHERE booking_request_id = NEW.id;

    v_time := substring(NEW.message FROM 'Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2})');
    v_details := NULLIF(btrim(regexp_replace(COALESCE(NEW.message, ''),
                   'Time:\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2}', '', 'i'), E' \n\r\t'), '');
    v_entry := concat_ws(E'\n',
      CASE WHEN v_time IS NOT NULL THEN 'Time: ' || v_time END,
      'Booked by: ' || NEW.requester_name,
      'Event: ' || COALESCE(NEW.event_type, 'Event'),
      'Agreed price: ' || to_char(NEW.offer_price, 'FM999999990.00') || ' ' || NEW.offer_currency,
      CASE WHEN v_contract_no IS NOT NULL THEN 'Contract: ' || v_contract_no END,
      CASE WHEN NEW.requester_email IS NOT NULL AND NEW.requester_email <> '' THEN 'Contact: ' || NEW.requester_email END,
      CASE WHEN NEW.requester_phone IS NOT NULL AND NEW.requester_phone <> '' THEN 'Phone: ' || NEW.requester_phone END,
      CASE WHEN v_details IS NOT NULL THEN 'Details: ' || v_details END);

    v_last := GREATEST(NEW.event_date, COALESCE(NEW.event_end_date, NEW.event_date));
    v_total := (v_last - NEW.event_date) + 1;
    v_day := NEW.event_date;
    WHILE v_day <= v_last LOOP
      v_idx := v_idx + 1;
      v_notes := v_entry || CASE WHEN v_total > 1 THEN E'\n(Day ' || v_idx || ' of ' || v_total || ')' ELSE '' END;
      SELECT * INTO v_existing FROM public.calendar_events
      WHERE profile_id = NEW.profile_id AND event_date = v_day;
      IF FOUND AND v_existing.status = 'busy' AND v_existing.notes IS NOT NULL AND v_existing.notes <> '' THEN
        v_notes := v_existing.notes || E'\n\n---\n\n' || v_notes;
      END IF;
      INSERT INTO public.calendar_events (profile_id, event_date, status, notes)
      VALUES (NEW.profile_id, v_day, 'busy', v_notes)
      ON CONFLICT (profile_id, event_date)
      DO UPDATE SET status = 'busy', notes = EXCLUDED.notes;
      v_day := v_day + 1;
    END LOOP;

    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.profile_id, 'booking_update', 'Date Booked',
            'accepted your offer. The date is now booked and the contract has been generated.',
            NEW.id, 'booking_request', NEW.requester_user_id, NEW.requester_name);
    IF NEW.requester_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
      VALUES (NEW.requester_user_id, 'booking_update', 'Date Booked',
              'The date is now booked. Your contract with the artist is ready.',
              NEW.id, 'booking_request', NEW.profile_id, v_artist_name);
    END IF;
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'offered' AND NEW.declined_by = 'requester' THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.profile_id, 'booking_update', 'Offer Declined', 'declined your offer.',
            NEW.id, 'booking_request', NEW.requester_user_id, NEW.requester_name);
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'offered' AND NEW.declined_by = 'artist'
     AND NEW.requester_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.requester_user_id, 'booking_update', 'Offer Withdrawn', 'withdrew the offer for your booking request.',
            NEW.id, 'booking_request', NEW.profile_id, v_artist_name);
  END IF;

  RETURN NEW;
END;
$$;