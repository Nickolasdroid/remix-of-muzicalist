REVOKE ALL ON public.pending_artist_registrations FROM anon, authenticated, public;
GRANT ALL ON public.pending_artist_registrations TO service_role;
ALTER TABLE public.pending_artist_registrations ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pending_artist_registrations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pending_artist_registrations', pol.policyname);
  END LOOP;
END $$;