-- Add 'admin' to user_type enum
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'admin';