-- Add spotify_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN spotify_url text;