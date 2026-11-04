-- Availability posts: optional hours (both or neither).
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS available_from time,
  ADD COLUMN IF NOT EXISTS available_until time;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_availability_hours_pair;
ALTER TABLE public.posts ADD CONSTRAINT posts_availability_hours_pair
  CHECK ((available_from IS NULL) = (available_until IS NULL));
