
CREATE OR REPLACE FUNCTION public.auto_reject_expired_booking_requests()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec RECORD;
  v_start_time TEXT;
  v_event_timestamp TIMESTAMP;
BEGIN
  -- Reject all pending requests where event_date is in the past (no time consideration)
  UPDATE public.booking_requests
  SET status = 'rejected',
      updated_at = now()
  WHERE status = 'pending'
    AND event_date < CURRENT_DATE;

  -- For today's pending requests, check if the start time has passed
  FOR rec IN
    SELECT id, message, event_date
    FROM public.booking_requests
    WHERE status = 'pending'
      AND event_date = CURRENT_DATE
      AND message IS NOT NULL
      AND message LIKE 'Time: %'
  LOOP
    -- Extract start time from message format "Time: HH:MM - HH:MM" or "Time: ... HH:MM - ... HH:MM"
    -- Get text after "Time: ", then find the first HH:MM pattern
    v_start_time := substring(rec.message FROM 'Time: .*?(\d{2}:\d{2}) -');
    
    IF v_start_time IS NOT NULL THEN
      v_event_timestamp := (rec.event_date || ' ' || v_start_time)::TIMESTAMP;
      
      IF v_event_timestamp <= NOW() AT TIME ZONE 'Europe/Bucharest' THEN
        UPDATE public.booking_requests
        SET status = 'rejected',
            updated_at = now()
        WHERE id = rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;
