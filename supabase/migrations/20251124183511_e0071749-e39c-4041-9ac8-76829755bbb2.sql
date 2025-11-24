-- Create booking_requests table
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Artists can view booking requests for their profile
CREATE POLICY "Artists can view their booking requests"
ON public.booking_requests
FOR SELECT
USING (auth.uid() = profile_id);

-- Anyone can create a booking request
CREATE POLICY "Anyone can create booking requests"
ON public.booking_requests
FOR INSERT
WITH CHECK (true);

-- Artists can update their own booking requests (for accepting/declining)
CREATE POLICY "Artists can update their booking requests"
ON public.booking_requests
FOR UPDATE
USING (auth.uid() = profile_id);

-- Artists can delete their own booking requests
CREATE POLICY "Artists can delete their booking requests"
ON public.booking_requests
FOR DELETE
USING (auth.uid() = profile_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_booking_requests_updated_at
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();