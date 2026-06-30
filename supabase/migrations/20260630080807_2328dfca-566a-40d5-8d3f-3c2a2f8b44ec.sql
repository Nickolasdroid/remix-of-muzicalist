
-- 1) Storage policies for 'covers' bucket (owner-scoped writes, public reads)
DROP POLICY IF EXISTS "Covers are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cover" ON storage.objects;

CREATE POLICY "Covers are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own cover"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own cover"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2) Revoke column-level SELECT on profiles.email and profiles.phone
REVOKE SELECT (email, phone) ON public.profiles FROM anon;
REVOKE SELECT (email, phone) ON public.profiles FROM authenticated;
REVOKE SELECT (email, phone) ON public.profiles FROM PUBLIC;
