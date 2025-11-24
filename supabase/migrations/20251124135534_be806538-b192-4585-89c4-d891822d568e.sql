-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies for announcements
CREATE POLICY "Anyone can view announcements"
ON public.announcements FOR SELECT
USING (true);

CREATE POLICY "Users can create their own announcements"
ON public.announcements FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own announcements"
ON public.announcements FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own announcements"
ON public.announcements FOR DELETE
USING (auth.uid() = profile_id);

-- Create gallery_items table
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for gallery_items
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Policies for gallery_items
CREATE POLICY "Anyone can view gallery items"
ON public.gallery_items FOR SELECT
USING (true);

CREATE POLICY "Users can create their own gallery items"
ON public.gallery_items FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own gallery items"
ON public.gallery_items FOR DELETE
USING (auth.uid() = profile_id);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('busy', 'blocked', 'available')),
  event_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, event_date)
);

-- Enable RLS for calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_events
CREATE POLICY "Anyone can view calendar events"
ON public.calendar_events FOR SELECT
USING (true);

CREATE POLICY "Users can create their own calendar events"
ON public.calendar_events FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own calendar events"
ON public.calendar_events FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own calendar events"
ON public.calendar_events FOR DELETE
USING (auth.uid() = profile_id);

-- Add updated_at triggers
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();