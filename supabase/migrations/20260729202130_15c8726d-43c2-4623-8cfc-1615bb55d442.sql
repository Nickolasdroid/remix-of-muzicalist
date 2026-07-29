-- Reports (ticket) system
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  artist_id uuid,
  role text NOT NULL DEFAULT 'user',
  type text NOT NULL DEFAULT 'other',
  title text NOT NULL DEFAULT '',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'medium',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  reporter_name text,
  reporter_email text,
  browser text,
  os text,
  device text,
  language text,
  page_url text,
  country text,
  app_version text,
  admin_notes text,
  assigned_to uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  CONSTRAINT reports_status_check CHECK (status IN ('new','under_review','in_progress','resolved','closed')),
  CONSTRAINT reports_priority_check CHECK (priority IN ('low','medium','high','critical')),
  CONSTRAINT reports_type_check CHECK (type IN ('bug','account','abuse','feature','payment','subscription','other')),
  CONSTRAINT reports_role_check CHECK (role IN ('user','artist','admin','guest'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Internal admin notes (scalable: multiple notes, authors, timestamps)
CREATE TABLE public.report_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_notes TO authenticated;
GRANT ALL ON public.report_notes TO service_role;
ALTER TABLE public.report_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage report notes"
  ON public.report_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_report_notes_report ON public.report_notes(report_id, created_at);

-- Activity timeline (future scalability)
CREATE TABLE public.report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid,
  from_value jsonb,
  to_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.report_events TO authenticated;
GRANT ALL ON public.report_events TO service_role;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read report events"
  ON public.report_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins write report events"
  ON public.report_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_report_events_report ON public.report_events(report_id, created_at);

-- Log status/priority changes + resolution stamps
CREATE OR REPLACE FUNCTION public.reports_log_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.report_events(report_id, event_type, actor_id, from_value, to_value)
    VALUES (NEW.id, 'status_changed', auth.uid(), to_jsonb(OLD.status), to_jsonb(NEW.status));
    IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
      NEW.resolved_at := now();
      NEW.resolved_by := auth.uid();
    END IF;
  END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.report_events(report_id, event_type, actor_id, from_value, to_value)
    VALUES (NEW.id, 'priority_changed', auth.uid(), to_jsonb(OLD.priority), to_jsonb(NEW.priority));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reports_log_changes
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_log_changes();

-- Notify all admins when a new report arrives
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  SELECT ur.user_id,
         'report',
         'New Report',
         COALESCE(NEW.reporter_name, 'Someone') || ' submitted a report: ' || COALESCE(NULLIF(NEW.title, ''), NEW.type),
         NEW.id,
         'report',
         NEW.user_id,
         NEW.reporter_name
  FROM public.user_roles ur
  WHERE ur.user_type = 'admin';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_on_new_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_new_report();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;