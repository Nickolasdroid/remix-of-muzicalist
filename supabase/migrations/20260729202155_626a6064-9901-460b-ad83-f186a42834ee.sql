CREATE POLICY "Users upload own report attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'report-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own report attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'report-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));

CREATE POLICY "Admins delete report attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'report-attachments' AND public.is_admin(auth.uid()));