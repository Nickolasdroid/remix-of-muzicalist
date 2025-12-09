-- Create reviews table for artist ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews (public)
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Anyone can create reviews (guests can leave reviews)
CREATE POLICY "Anyone can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups by profile
CREATE INDEX idx_reviews_profile_id ON public.reviews(profile_id);

-- Create index for ordering by date
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);