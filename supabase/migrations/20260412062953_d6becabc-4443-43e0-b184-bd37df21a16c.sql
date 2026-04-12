
-- Add requester_user_id column
ALTER TABLE public.booking_requests
ADD COLUMN requester_user_id uuid DEFAULT NULL;

-- Create trigger function to notify requester when accepted booking is rejected
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_artist_name text;
BEGIN
  -- Only fire when status changes from 'accepted' to 'rejected'
  IF OLD.status = 'accepted' AND NEW.status = 'rejected' AND NEW.requester_user_id IS NOT NULL THEN
    -- Get artist name
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

-- Create the trigger
CREATE TRIGGER on_booking_status_change
AFTER UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking_status_change();
