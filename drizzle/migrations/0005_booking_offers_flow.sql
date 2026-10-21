-- Booking offers: request -> artist sends a priced offer -> requester accepts -> confirmed.
-- Status flow on booking_requests.status:
--   pending  --(artist: send_booking_offer)-->   offered
--   offered  --(artist: send_booking_offer)-->   offered   (offer updated)
--   offered  --(requester: respond, accept)-->   accepted  (confirmed, calendar marked busy)
--   offered  --(requester: respond, decline)-->  rejected
--   pending/offered/accepted --(artist decline / calendar overwrite)--> rejected  (unchanged)
-- Only the RPCs below may set 'offered' or 'accepted' or touch the offer columns.
-- Columns are laid out so a deposit / platform fee can be added later.

-- 1. Offer columns
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS offer_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS offer_currency text,
  ADD COLUMN IF NOT EXISTS offer_note text,
  ADD COLUMN IF NOT EXISTS offer_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_by text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_requests_offer_price_check') THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_offer_price_check CHECK (offer_price IS NULL OR offer_price > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_requests_offer_currency_check') THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_offer_currency_check CHECK (offer_currency IS NULL OR offer_currency ~ '^[A-Z]{3}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_requests_declined_by_check') THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_declined_by_check CHECK (declined_by IS NULL OR declined_by IN ('artist', 'requester'));
  END IF;
END $$;

GRANT SELECT (offer_price, offer_currency, offer_note, offer_sent_at, confirmed_at, declined_by)
  ON public.booking_requests TO authenticated;

-- 2. Guard: offer columns and the 'offered' / 'accepted' statuses can only be set by the RPCs
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
     OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at THEN
    RAISE EXCEPTION 'BOOKING_OFFER_FIELDS_READ_ONLY';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('offered', 'accepted') THEN
    RAISE EXCEPTION 'BOOKING_REQUIRES_ACCEPTED_OFFER';
  END IF;

  -- A plain status change to 'rejected' (artist decline, calendar overwrite) is still allowed
  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' AND NEW.declined_by IS NULL
     AND auth.uid() IS NOT DISTINCT FROM NEW.profile_id THEN
    NEW.declined_by := 'artist';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_booking_offer_changes_trg ON public.booking_requests;
CREATE TRIGGER guard_booking_offer_changes_trg
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_booking_offer_changes();

-- 3. Artist sends (or updates) an offer
CREATE OR REPLACE FUNCTION public.send_booking_offer(
  _booking_id uuid,
  _price numeric,
  _currency text,
  _note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.booking_requests%ROWTYPE;
  v_note text := NULLIF(trim(_note), '');
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

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests
  SET status = 'offered',
      offer_price = round(_price, 2),
      offer_currency = upper(_currency),
      offer_note = v_note,
      offer_sent_at = now(),
      declined_by = NULL
  WHERE id = _booking_id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);
END;
$$;

-- 4. Requester accepts or declines the offer
CREATE OR REPLACE FUNCTION public.respond_to_booking_offer(_booking_id uuid, _accept boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  b public.booking_requests%ROWTYPE;
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

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  IF _accept THEN
    IF b.event_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'BOOKING_DATE_PASSED';
    END IF;
    UPDATE public.booking_requests
    SET status = 'accepted', confirmed_at = now(), declined_by = NULL
    WHERE id = _booking_id;
  ELSE
    UPDATE public.booking_requests
    SET status = 'rejected', declined_by = 'requester'
    WHERE id = _booking_id;
  END IF;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);

  RETURN CASE WHEN _accept THEN 'accepted' ELSE 'rejected' END;
END;
$$;

REVOKE ALL ON FUNCTION public.send_booking_offer(uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_booking_offer(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_booking_offer(uuid, numeric, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_booking_offer(uuid, boolean) TO authenticated, service_role;

-- 5. After a change: notifications + mark the artist's calendar when the booking is confirmed
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
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.offer_sent_at IS NOT DISTINCT FROM OLD.offer_sent_at THEN
    RETURN NEW;
  END IF;

  SELECT stage_name INTO v_artist_name FROM public.profiles WHERE id = NEW.profile_id;

  -- Offer sent or updated -> notify requester
  IF NEW.status = 'offered' AND NEW.requester_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.requester_user_id, 'booking_update',
            CASE WHEN OLD.status = 'offered' THEN 'Offer Updated' ELSE 'New Offer' END,
            CASE WHEN OLD.status = 'offered' THEN 'updated the offer for your booking request'
                 ELSE 'sent you an offer for your booking request' END,
            NEW.id, 'booking_request', NEW.profile_id, v_artist_name);
  END IF;

  -- Offer accepted -> notify artist + calendar
  IF NEW.status = 'accepted' AND OLD.status = 'offered' THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.profile_id, 'booking_update', 'Offer Accepted', 'accepted your offer. The booking is confirmed.',
            NEW.id, 'booking_request', NEW.requester_user_id, NEW.requester_name);

    v_time := substring(NEW.message FROM 'Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2})');
    v_details := NULLIF(btrim(regexp_replace(COALESCE(NEW.message, ''),
                   'Time:\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2}', '', 'i'), E' \n\r\t'), '');
    v_entry := concat_ws(E'\n',
      CASE WHEN v_time IS NOT NULL THEN 'Time: ' || v_time END,
      'Booked by: ' || NEW.requester_name,
      'Event: ' || COALESCE(NEW.event_type, 'Event'),
      'Agreed price: ' || to_char(NEW.offer_price, 'FM999999990.00') || ' ' || NEW.offer_currency,
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
  END IF;

  -- Offer declined by requester -> notify artist
  IF NEW.status = 'rejected' AND OLD.status = 'offered' AND NEW.declined_by = 'requester' THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.profile_id, 'booking_update', 'Offer Declined', 'declined your offer.',
            NEW.id, 'booking_request', NEW.requester_user_id, NEW.requester_name);
  END IF;

  -- Artist declined a request that had an open offer -> notify requester
  IF NEW.status = 'rejected' AND OLD.status = 'offered' AND NEW.declined_by = 'artist'
     AND NEW.requester_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (NEW.requester_user_id, 'booking_update', 'Offer Withdrawn', 'withdrew the offer for your booking request.',
            NEW.id, 'booking_request', NEW.profile_id, v_artist_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_booking_offer_events_trg ON public.booking_requests;
CREATE TRIGGER handle_booking_offer_events_trg
AFTER UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_offer_events();