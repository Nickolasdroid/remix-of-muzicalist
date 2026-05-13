
CREATE TABLE public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('post','announcement','profile')),
  content_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reports"
ON public.content_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.content_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.content_reports FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
ON public.content_reports FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete reports"
ON public.content_reports FOR DELETE
USING (is_admin(auth.uid()));

CREATE INDEX idx_content_reports_content ON public.content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
