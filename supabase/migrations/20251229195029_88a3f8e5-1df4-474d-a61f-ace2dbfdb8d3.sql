-- Add instruments column to profiles table for instrumentalists
ALTER TABLE public.profiles
ADD COLUMN instruments text NULL;