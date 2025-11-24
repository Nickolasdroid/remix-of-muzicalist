-- Add plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN plan TEXT NOT NULL DEFAULT 'Free';

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.plan IS 'User subscription plan (e.g., Free, Pro, Business)';