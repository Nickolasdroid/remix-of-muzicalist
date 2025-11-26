-- Create user type enum
CREATE TYPE public.user_type AS ENUM ('artist', 'user');

-- Create user_roles table to store user types
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_type public.user_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own role during registration
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create security definer function to check user type
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id UUID)
RETURNS public.user_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Make certain profile fields nullable for normal users
ALTER TABLE public.profiles
ALTER COLUMN specialization DROP NOT NULL,
ALTER COLUMN career_start_year DROP NOT NULL,
ALTER COLUMN music_genres DROP NOT NULL,
ALTER COLUMN experience_level DROP NOT NULL;