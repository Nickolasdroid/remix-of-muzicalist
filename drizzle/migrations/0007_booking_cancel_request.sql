CREATE OR REPLACE FUNCTION public.cancel_booking_request(_booking_id uuid)
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
  IF b.status NOT IN ('pending', 'offered', 'accepted') THEN
    RAISE EXCEPTION 'BOOKING_NOT_OPEN';
  END IF;
  IF b.status = 'accepted' AND COALESCE(b.event_end_date, b.event_date) < CURRENT_DATE THEN
    RAISE EXCEPTION 'BOOKING_DATE_PASSED';
  END IF;

  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests
  SET status = 'rejected', declined_by = 'requester'
  WHERE id = _booking_id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);

  IF b.status IN ('pending', 'accepted') THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (b.profile_id, 'booking_update',
            CASE WHEN b.status = 'accepted' THEN 'Booking Cancelled' ELSE 'Request Cancelled' END,
            CASE WHEN b.status = 'accepted' THEN 'cancelled the confirmed booking.'
                 ELSE 'cancelled the booking request.' END,
            b.id, 'booking_request', uid, b.requester_name);
  END IF;

  RETURN 'rejected';
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking_request(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.prevent_contracted_booking_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.booking_contracts WHERE booking_request_id = OLD.id) THEN
    RAISE EXCEPTION 'BOOKING_HAS_CONTRACT';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_contracted_booking_delete_trg ON public.booking_requests;
CREATE TRIGGER prevent_contracted_booking_delete_trg
BEFORE DELETE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_contracted_booking_delete();

CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_artist_name text;
BEGIN
  IF OLD.status = 'accepted' AND NEW.status = 'rejected' AND NEW.requester_user_id IS NOT NULL
     AND NEW.declined_by IS DISTINCT FROM 'requester' THEN
    SELECT stage_name INTO v_artist_name FROM public.profiles WHERE id = NEW.profile_id;

    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
    VALUES (
      NEW.requester_user_id,
      'booking_update',
      'Booking Cancelled',
      COALESCE(v_artist_name, 'An artist') || ' is no longer available on ' || NEW.event_date || '. Your booking has been cancelled.',
      NEW.id,
      'booking_request',
      NEW.profile_id,
      v_artist_name
    );
  END IF;
  RETURN NEW;
END;
$$;