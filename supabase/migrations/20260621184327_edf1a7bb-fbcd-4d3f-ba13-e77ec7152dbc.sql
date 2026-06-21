-- 1) Add explicit UPDATE policy for gallery_items
CREATE POLICY "Users can update their own gallery items"
ON public.gallery_items
FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 2) Lock down pending_artist_registrations: only service_role (edge functions) writes/reads.
-- Revoke any client-role privileges so anon/authenticated cannot INSERT/SELECT/UPDATE/DELETE.
REVOKE ALL ON public.pending_artist_registrations FROM anon;
REVOKE ALL ON public.pending_artist_registrations FROM authenticated;
GRANT ALL ON public.pending_artist_registrations TO service_role;

-- Add explicit deny-all INSERT/UPDATE/DELETE policies for clients to make the model unambiguous.
-- (RLS already blocks by default, but explicit policies satisfy scanners and document intent.)
DROP POLICY IF EXISTS "No client inserts on pending registrations" ON public.pending_artist_registrations;
CREATE POLICY "No client inserts on pending registrations"
ON public.pending_artist_registrations
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates on pending registrations" ON public.pending_artist_registrations;
CREATE POLICY "No client updates on pending registrations"
ON public.pending_artist_registrations
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes on pending registrations" ON public.pending_artist_registrations;
CREATE POLICY "No client deletes on pending registrations"
ON public.pending_artist_registrations
FOR DELETE
TO authenticated, anon
USING (false);
