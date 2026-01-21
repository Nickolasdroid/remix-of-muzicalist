-- First, remove duplicate reviews by email, keeping only the most recent one
DELETE FROM public.reviews a
USING public.reviews b
WHERE a.profile_id = b.profile_id 
  AND a.reviewer_email = b.reviewer_email 
  AND a.created_at < b.created_at;

-- Add unique constraint to prevent multiple reviews from the same email for the same artist
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_profile_email_unique UNIQUE (profile_id, reviewer_email);