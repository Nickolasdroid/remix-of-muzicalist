-- Opportunities: announcements become structured
--   kind = 'gig'    "Looking for an artist for an event" (organizers, and artists who subcontract)
--   kind = 'collab' "Looking for a collaborator"          (artists only)
-- Existing announcements keep kind = NULL and expire as before.
-- Artists answer a gig with a priced offer: it becomes a booking request linked to the
-- announcement, so the usual offer -> contract -> booked flow applies. Accepting one offer
-- closes the announcement and declines the others.

-- 1. New columns
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS seeking text,
  ADD COLUMN IF NOT EXISTS role_detail text,
  ADD COLUMN IF NOT EXISTS collab_type text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS event_on date,
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS budget_mode text,
  ADD COLUMN IF NOT EXISTS budget_min numeric(10,2),
  ADD COLUMN IF NOT EXISTS budget_max numeric(10,2),
  ADD COLUMN IF NOT EXISTS budget_currency text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_opportunity_check') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_opportunity_check CHECK (
      (kind IS NULL OR kind IN ('gig', 'collab'))
      AND (seeking IS NULL OR seeking IN ('DJ', 'Band', 'Singer', 'Instrumentalist', 'MC'))
      AND (collab_type IS NULL OR collab_type IN ('one_event', 'replacement', 'permanent'))
      AND (budget_mode IS NULL OR budget_mode IN ('range', 'negotiable', 'none'))
      AND (budget_currency IS NULL OR budget_currency ~ '^[A-Z]{3}$')
      AND (budget_min IS NULL OR budget_min >= 0)
      AND (budget_max IS NULL OR budget_max >= 0)
      AND (start_time IS NULL OR start_time ~ '^\d{2}:\d{2}$')
      AND (end_time IS NULL OR end_time ~ '^\d{2}:\d{2}$')
      AND status IN ('open', 'filled', 'closed')
      AND (role_detail IS NULL OR char_length(role_detail) <= 80)
      AND (event_type IS NULL OR char_length(event_type) <= 80)
      AND (county IS NULL OR char_length(county) <= 100)
      AND (city IS NULL OR char_length(city) <= 100)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS announcements_open_kind_idx
  ON public.announcements (kind, status, expires_at) WHERE kind IS NOT NULL;

-- 2. Validation: required fields per kind, server-computed expiry
CREATE OR REPLACE FUNCTION public.validate_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_user boolean;
BEGIN
  IF NEW.kind IS NULL THEN
    RETURN NEW;
  END IF;
  -- An announcement that found its artist stays closed
  IF TG_OP = 'UPDATE' AND OLD.status = 'filled' THEN
    NEW.status := 'filled';
  END IF;

  IF NEW.title IS NULL OR char_length(btrim(NEW.title)) < 3 OR char_length(NEW.title) > 120 THEN
    RAISE EXCEPTION 'OPPORTUNITY_TITLE_REQUIRED';
  END IF;
  IF NEW.seeking IS NULL OR NULLIF(btrim(NEW.county), '') IS NULL THEN
    RAISE EXCEPTION 'OPPORTUNITY_FIELDS_REQUIRED';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.profile_id AND user_type = 'user')
    INTO v_is_user;

  IF NEW.kind = 'gig' THEN
    IF NULLIF(btrim(NEW.event_type), '') IS NULL OR NEW.event_on IS NULL THEN
      RAISE EXCEPTION 'OPPORTUNITY_FIELDS_REQUIRED';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.event_on < (now() AT TIME ZONE 'Europe/Bucharest')::date THEN
      RAISE EXCEPTION 'OPPORTUNITY_DATE_PASSED';
    END IF;
    NEW.collab_type := NULL;
    -- Open until the end of the event day
    NEW.expires_at := ((NEW.event_on + 1)::timestamp AT TIME ZONE 'Europe/Bucharest');
  ELSE
    IF v_is_user THEN
      RAISE EXCEPTION 'OPPORTUNITY_COLLAB_ARTISTS_ONLY';
    END IF;
    IF NEW.collab_type IS NULL THEN
      RAISE EXCEPTION 'OPPORTUNITY_FIELDS_REQUIRED';
    END IF;
    NEW.expires_at := COALESCE(
      ((NEW.event_on + 1)::timestamp AT TIME ZONE 'Europe/Bucharest'),
      COALESCE(OLD.created_at, now()) + interval '30 days'
    );
  END IF;

  IF NEW.budget_mode = 'range' THEN
    IF NEW.budget_min IS NULL AND NEW.budget_max IS NULL THEN
      NEW.budget_mode := 'none';
    ELSIF NEW.budget_min IS NOT NULL AND NEW.budget_max IS NOT NULL AND NEW.budget_min > NEW.budget_max THEN
      RAISE EXCEPTION 'OPPORTUNITY_BUDGET_INVALID';
    END IF;
    NEW.budget_currency := COALESCE(NEW.budget_currency, 'RON');
  ELSE
    NEW.budget_min := NULL;
    NEW.budget_max := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_opportunity_trg ON public.announcements;
CREATE TRIGGER validate_opportunity_trg
BEFORE INSERT OR UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.validate_opportunity();

-- 3. Quota: organizers post event announcements for free (max 5 open at a time);
--    artists keep their subscription quota for every kind.
CREATE OR REPLACE FUNCTION public.enforce_announcement_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limit int;
  v_used int;
  v_is_regular_user boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.profile_id AND user_type = 'user'
  ) AND NOT public.is_admin(NEW.profile_id)
  INTO v_is_regular_user;

  IF v_is_regular_user THEN
    IF NEW.media_url IS NOT NULL OR NEW.media_type IS NOT NULL OR COALESCE(NEW.is_premium, false) THEN
      RAISE EXCEPTION 'USER_ANNOUNCEMENT_TEXT_ONLY' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.kind IS DISTINCT FROM 'gig' THEN
      RAISE EXCEPTION 'USER_ANNOUNCEMENT_GIG_ONLY' USING ERRCODE = 'check_violation';
    END IF;
    SELECT count(*) INTO v_used FROM public.announcements
      WHERE profile_id = NEW.profile_id
        AND kind = 'gig'
        AND status = 'open'
        AND expires_at > now();
    IF v_used >= 5 THEN
      RAISE EXCEPTION 'USER_ANNOUNCEMENT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  v_limit := public.plan_limit(NEW.profile_id, 'announcements');
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  v_used := public.consumed_creation_slots(NEW.profile_id, 'announcement');

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Offers linked to an announcement
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS announcement_id uuid REFERENCES public.announcements(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_announcement_artist_key
  ON public.booking_requests (announcement_id, profile_id)
  WHERE announcement_id IS NOT NULL;

GRANT SELECT (announcement_id) ON public.booking_requests TO authenticated;

-- The artist starts this booking, so do not send them a "new booking request" notification
CREATE OR REPLACE FUNCTION public.notify_on_new_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.announcement_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_name)
  VALUES (
    NEW.profile_id,
    'booking_request',
    'New Booking Request',
    NEW.requester_name || ' sent you a booking request for ' || NEW.event_date,
    NEW.id,
    'booking_request',
    NEW.requester_name
  );
  RETURN NEW;
END;
$$;

-- 5. Artist sends (or updates) an offer for an event announcement
CREATE OR REPLACE FUNCTION public.send_announcement_offer(
  _announcement_id uuid,
  _price numeric,
  _currency text,
  _note text DEFAULT NULL,
  _accept_terms boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  a public.announcements%ROWTYPE;
  o public.profiles%ROWTYPE;
  v_booking uuid;
  v_status text;
  v_message text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND user_type = 'artist') THEN
    RAISE EXCEPTION 'OPPORTUNITY_ARTISTS_ONLY';
  END IF;

  SELECT * INTO a FROM public.announcements WHERE id = _announcement_id;
  IF NOT FOUND OR a.kind IS DISTINCT FROM 'gig' THEN
    RAISE EXCEPTION 'OPPORTUNITY_NOT_FOUND';
  END IF;
  IF a.profile_id = uid THEN
    RAISE EXCEPTION 'OPPORTUNITY_OWN';
  END IF;
  IF a.status <> 'open' OR a.expires_at <= now() THEN
    RAISE EXCEPTION 'OPPORTUNITY_CLOSED';
  END IF;

  SELECT id, status INTO v_booking, v_status
  FROM public.booking_requests
  WHERE announcement_id = _announcement_id AND profile_id = uid;

  IF v_booking IS NULL THEN
    SELECT * INTO o FROM public.profiles WHERE id = a.profile_id;
    v_message := concat_ws(E'\n',
      CASE WHEN a.start_time IS NOT NULL AND a.end_time IS NOT NULL
           THEN 'Time: ' || a.start_time || ' - ' || a.end_time END,
      'Location: ' || concat_ws(', ', NULLIF(btrim(a.city), ''), a.county),
      NULLIF(btrim(a.description), ''));

    INSERT INTO public.booking_requests (
      profile_id, requester_user_id, requester_name, requester_email, requester_phone,
      event_date, event_end_date, event_type, message, status, announcement_id
    ) VALUES (
      uid, a.profile_id,
      COALESCE(NULLIF(btrim(concat_ws(' ', o.first_name, o.last_name)), ''), o.stage_name, 'Organizer'),
      COALESCE(o.email, ''), COALESCE(o.phone, ''),
      a.event_on, a.event_on, a.event_type, v_message, 'pending', a.id
    )
    RETURNING id INTO v_booking;
  ELSIF v_status NOT IN ('pending', 'offered') THEN
    RAISE EXCEPTION 'OPPORTUNITY_ALREADY_ANSWERED';
  END IF;

  -- Same rules as any other offer (terms checkbox, price, currency, note)
  PERFORM public.send_booking_offer(v_booking, _price, _currency, _note, _accept_terms);
  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.send_announcement_offer(uuid, numeric, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_announcement_offer(uuid, numeric, text, text, boolean) TO authenticated, service_role;

-- 6. Number of offers per announcement (counts only, safe to show to everyone signed in)
CREATE OR REPLACE FUNCTION public.get_announcement_offer_counts(_ids uuid[])
RETURNS TABLE (announcement_id uuid, offers integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.announcement_id, count(*)::int
  FROM public.booking_requests b
  WHERE b.announcement_id = ANY(_ids)
    AND b.status IN ('offered', 'accepted', 'rejected')
    AND b.offer_sent_at IS NOT NULL
  GROUP BY b.announcement_id;
$$;

REVOKE ALL ON FUNCTION public.get_announcement_offer_counts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_announcement_offer_counts(uuid[]) TO authenticated, service_role;

-- 7. Accepting an announcement offer closes the announcement and declines the others
CREATE OR REPLACE FUNCTION public.handle_booking_offer_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_name text;
  v_start text;
  v_end text;
  v_details text;
  v_entry text;
  v_notes text;
  v_day date;
  v_last date;
  v_total int;
  v_idx int := 0;
  v_existing public.calendar_events%ROWTYPE;
  v_contract_no text;
  v_range text;
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
                 WHEN NEW.announcement_id IS NOT NULL THEN 'sent you an offer for your announcement'
                 ELSE 'sent you an offer for your booking request' END,
            NEW.id, 'booking_request', NEW.profile_id, v_artist_name);
  END IF;

  IF NEW.status = 'accepted' AND OLD.status = 'offered' THEN
    -- Booked through an announcement: close it and decline the other offers
    IF NEW.announcement_id IS NOT NULL THEN
      UPDATE public.announcements SET status = 'filled' WHERE id = NEW.announcement_id;
      PERFORM set_config('muzicalist.booking_rpc', 'on', true);
      UPDATE public.booking_requests
      SET status = 'rejected', declined_by = 'requester'
      WHERE announcement_id = NEW.announcement_id
        AND id <> NEW.id
        AND status IN ('pending', 'offered');
    END IF;

    SELECT contract_number INTO v_contract_no FROM public.booking_contracts WHERE booking_request_id = NEW.id;

    v_start := substring(NEW.message FROM 'Time:\s*(?:[\w\s,.]+\s+)?(\d{1,2}:\d{2})\s*-');
    v_end := substring(NEW.message FROM 'Time:[^\n]*-\s*(?:[\w\s,.]+\s+)?(\d{1,2}:\d{2})');
    v_details := NULLIF(btrim(regexp_replace(COALESCE(NEW.message, ''),
                   '^Time:[^\n]*', '', 'i'), E' \n\r\t'), '');

    v_last := GREATEST(NEW.event_date, COALESCE(NEW.event_end_date, NEW.event_date));
    -- Overnight event stored as a single day: it really ends the next day
    IF v_last = NEW.event_date AND v_start IS NOT NULL AND v_end IS NOT NULL
       AND v_end::time <= v_start::time THEN
      v_last := NEW.event_date + 1;
    END IF;
    v_total := (v_last - NEW.event_date) + 1;
    v_day := NEW.event_date;

    WHILE v_day <= v_last LOOP
      v_idx := v_idx + 1;
      v_range := public.booking_day_time_range(v_start, v_end, v_idx, v_total);
      v_entry := concat_ws(E'\n',
        CASE WHEN v_range IS NOT NULL THEN 'Time: ' || v_range END,
        'Booked by: ' || NEW.requester_name,
        'Event: ' || COALESCE(NEW.event_type, 'Event'),
        'Agreed price: ' || to_char(NEW.offer_price, 'FM999999990.00') || ' ' || NEW.offer_currency,
        CASE WHEN v_contract_no IS NOT NULL THEN 'Contract: ' || v_contract_no END,
        CASE WHEN NEW.requester_email IS NOT NULL AND NEW.requester_email <> '' THEN 'Contact: ' || NEW.requester_email END,
        CASE WHEN NEW.requester_phone IS NOT NULL AND NEW.requester_phone <> '' THEN 'Phone: ' || NEW.requester_phone END,
        CASE WHEN v_details IS NOT NULL THEN 'Details: ' || v_details END,
        CASE WHEN v_total > 1 THEN '(Day ' || v_idx || ' of ' || v_total || ')' END);

      v_notes := v_entry;
      SELECT * INTO v_existing FROM public.calendar_events
      WHERE profile_id = NEW.profile_id AND event_date = v_day;
      IF FOUND AND v_existing.status = 'busy' AND v_existing.notes IS NOT NULL AND v_existing.notes <> '' THEN
        v_notes := v_existing.notes || E'\n\n---\n\n' || v_entry;
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
    VALUES (NEW.profile_id, 'booking_update', 'Offer Declined',
            CASE WHEN NEW.announcement_id IS NOT NULL AND EXISTS (
                   SELECT 1 FROM public.booking_requests o
                   WHERE o.announcement_id = NEW.announcement_id AND o.status = 'accepted')
                 THEN 'chose another artist for this event.'
                 ELSE 'declined your offer.' END,
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
-- Opportunities: events that last several days (same as booking requests)
-- event_end_on = last day of the event; NULL means a single day.
-- An offer for such an announcement becomes a multi-day booking request, so the calendar
-- is filled day by day when the offer is accepted (handle_booking_offer_events).

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS event_end_on date;

CREATE OR REPLACE FUNCTION public.validate_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_user boolean;
BEGIN
  IF NEW.kind IS NULL THEN
    RETURN NEW;
  END IF;
  -- An announcement that found its artist stays closed
  IF TG_OP = 'UPDATE' AND OLD.status = 'filled' THEN
    NEW.status := 'filled';
  END IF;

  IF NEW.title IS NULL OR char_length(btrim(NEW.title)) < 3 OR char_length(NEW.title) > 120 THEN
    RAISE EXCEPTION 'OPPORTUNITY_TITLE_REQUIRED';
  END IF;
  IF NEW.seeking IS NULL OR NULLIF(btrim(NEW.county), '') IS NULL THEN
    RAISE EXCEPTION 'OPPORTUNITY_FIELDS_REQUIRED';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.profile_id AND user_type = 'user')
    INTO v_is_user;

  IF NEW.kind = 'gig' THEN
    IF NULLIF(btrim(NEW.event_type), '') IS NULL OR NEW.event_on IS NULL THEN
      RAISE EXCEPTION 'OPPORTUNITY_FIELDS_REQUIRED';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.event_on < (now() AT TIME ZONE 'Europe/Bucharest')::date THEN
      RAISE EXCEPTION 'OPPORTUNITY_DATE_PASSED';
    END IF;
    NEW.collab_type := NULL;
    -- Open until the end of the event day
    NEW.expires_at := ((NEW.event_on + 1)::timestamp AT TIME ZONE 'Europe/Bucharest');
  ELSE
    IF v_is_user THEN
      RAISE EXCEPTION 'OPPORTUNITY_COLLAB_ARTISTS_ONLY';
    END IF;
    IF NEW.collab_type IS NULL THEN
      RAISE EXCEPTION 'OPPORTUNITY_FIELDS_REQUIRED';
    END IF;
    NEW.expires_at := COALESCE(
      ((NEW.event_on + 1)::timestamp AT TIME ZONE 'Europe/Bucharest'),
      COALESCE(OLD.created_at, now()) + interval '30 days'
    );
  END IF;

  -- Several days: the last day of the event (NULL = a single day)
  IF NEW.event_end_on IS NOT NULL THEN
    IF NEW.event_on IS NULL OR NEW.event_end_on = NEW.event_on
       OR (NEW.kind = 'collab' AND NEW.collab_type = 'permanent') THEN
      NEW.event_end_on := NULL;
    ELSIF NEW.event_end_on < NEW.event_on THEN
      RAISE EXCEPTION 'OPPORTUNITY_END_BEFORE_START';
    ELSIF NEW.event_end_on > NEW.event_on + 30 THEN
      RAISE EXCEPTION 'OPPORTUNITY_TOO_LONG';
    END IF;
  END IF;

  IF NEW.budget_mode = 'range' THEN
    IF NEW.budget_min IS NULL AND NEW.budget_max IS NULL THEN
      NEW.budget_mode := 'none';
    ELSIF NEW.budget_min IS NOT NULL AND NEW.budget_max IS NOT NULL AND NEW.budget_min > NEW.budget_max THEN
      RAISE EXCEPTION 'OPPORTUNITY_BUDGET_INVALID';
    END IF;
    NEW.budget_currency := COALESCE(NEW.budget_currency, 'RON');
  ELSE
    NEW.budget_min := NULL;
    NEW.budget_max := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_announcement_offer(
  _announcement_id uuid,
  _price numeric,
  _currency text,
  _note text DEFAULT NULL,
  _accept_terms boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  a public.announcements%ROWTYPE;
  o public.profiles%ROWTYPE;
  v_booking uuid;
  v_status text;
  v_message text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND user_type = 'artist') THEN
    RAISE EXCEPTION 'OPPORTUNITY_ARTISTS_ONLY';
  END IF;

  SELECT * INTO a FROM public.announcements WHERE id = _announcement_id;
  IF NOT FOUND OR a.kind IS DISTINCT FROM 'gig' THEN
    RAISE EXCEPTION 'OPPORTUNITY_NOT_FOUND';
  END IF;
  IF a.profile_id = uid THEN
    RAISE EXCEPTION 'OPPORTUNITY_OWN';
  END IF;
  IF a.status <> 'open' OR a.expires_at <= now() THEN
    RAISE EXCEPTION 'OPPORTUNITY_CLOSED';
  END IF;

  SELECT id, status INTO v_booking, v_status
  FROM public.booking_requests
  WHERE announcement_id = _announcement_id AND profile_id = uid;

  IF v_booking IS NULL THEN
    SELECT * INTO o FROM public.profiles WHERE id = a.profile_id;
    v_message := concat_ws(E'\n',
      CASE WHEN a.start_time IS NOT NULL AND a.end_time IS NOT NULL
           THEN 'Time: ' || a.start_time || ' - ' || a.end_time END,
      'Location: ' || concat_ws(', ', NULLIF(btrim(a.city), ''), a.county),
      NULLIF(btrim(a.description), ''));

    INSERT INTO public.booking_requests (
      profile_id, requester_user_id, requester_name, requester_email, requester_phone,
      event_date, event_end_date, event_type, message, status, announcement_id
    ) VALUES (
      uid, a.profile_id,
      COALESCE(NULLIF(btrim(concat_ws(' ', o.first_name, o.last_name)), ''), o.stage_name, 'Organizer'),
      COALESCE(o.email, ''), COALESCE(o.phone, ''),
      a.event_on, COALESCE(a.event_end_on, a.event_on), a.event_type, v_message, 'pending', a.id
    )
    RETURNING id INTO v_booking;
  ELSIF v_status NOT IN ('pending', 'offered') THEN
    RAISE EXCEPTION 'OPPORTUNITY_ALREADY_ANSWERED';
  END IF;

  -- Same rules as any other offer (terms checkbox, price, currency, note)
  PERFORM public.send_booking_offer(v_booking, _price, _currency, _note, _accept_terms);
  RETURN v_booking;
END;
$$;
