
-- Create function to auto-reject expired pending booking requests
CREATE OR REPLACE FUNCTION public.auto_reject_expired_booking_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.booking_requests
  SET status = 'rejected',
      updated_at = now()
  WHERE status = 'pending'
    AND event_date < CURRENT_DATE;
END;
$$;
