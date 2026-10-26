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
