-- Add event_end_date column to booking_requests table
ALTER TABLE public.booking_requests
ADD COLUMN event_end_date date;

-- Set default value for existing rows (end date = start date)
UPDATE public.booking_requests
SET event_end_date = event_date
WHERE event_end_date IS NULL;