REVOKE ALL ON public.user_recent_places FROM anon;
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.user_recent_places FROM authenticated;
GRANT SELECT, DELETE ON public.user_recent_places TO authenticated;
GRANT ALL ON public.user_recent_places TO service_role;