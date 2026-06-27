CREATE POLICY "verif_docs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "verif_docs_owner_or_admin_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
  );

CREATE POLICY "verif_docs_owner_or_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
  );