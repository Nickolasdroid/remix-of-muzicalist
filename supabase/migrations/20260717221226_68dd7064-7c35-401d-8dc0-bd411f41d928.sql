
CREATE OR REPLACE FUNCTION public.moderation_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END$$;

CREATE TYPE public.moderation_case_status AS ENUM (
  'open','triaged','in_review','waiting_for_response','resolved','closed','reopened'
);
CREATE TYPE public.moderation_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.moderation_event_type AS ENUM (
  'case_created','case_assigned','case_unassigned','status_changed','priority_changed',
  'category_changed','report_added','evidence_added','note_added','action_applied',
  'action_reversed','decision_changed','appeal_received','case_reopened','case_resolved',
  'case_closed','system_note'
);

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND user_type IN ('admin','moderator')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_moderator_or_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin(uuid) TO authenticated, service_role;

-- Categories ---------------------------------------------------------------
CREATE TABLE public.moderation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, label text NOT NULL, description text,
  default_priority public.moderation_priority NOT NULL DEFAULT 'medium',
  is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_categories TO authenticated;
GRANT ALL ON public.moderation_categories TO service_role;
ALTER TABLE public.moderation_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read categories" ON public.moderation_categories FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage categories" ON public.moderation_categories FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.moderation_categories(key,label,default_priority,sort_order) VALUES
  ('spam','Spam','low',10),('harassment','Harassment','high',20),
  ('fake_profile','Fake Profile','high',30),('inappropriate_content','Inappropriate Content','medium',40),
  ('copyright','Copyright','medium',50),('impersonation','Impersonation','high',60),
  ('fraud','Fraud','critical',70),('other','Other','low',999);

-- Target types -------------------------------------------------------------
CREATE TABLE public.moderation_target_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, label text NOT NULL, table_name text,
  is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_target_types TO authenticated;
GRANT ALL ON public.moderation_target_types TO service_role;
ALTER TABLE public.moderation_target_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read target types" ON public.moderation_target_types FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage target types" ON public.moderation_target_types FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.moderation_target_types(key,label,table_name,sort_order) VALUES
  ('artist','Artist','profiles',10),('user','User','profiles',20),
  ('post','Post','posts',30),('review','Review','reviews',40),
  ('advertisement','Advertisement','announcements',50),
  ('gallery_image','Gallery Image','gallery_items',60),
  ('video','Video','gallery_items',70),
  ('comment','Comment','comments',80),('message','Message','messages',90);

-- Action types -------------------------------------------------------------
CREATE TABLE public.moderation_action_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, label text NOT NULL,
  is_reversible boolean NOT NULL DEFAULT true, severity int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_action_types TO authenticated;
GRANT ALL ON public.moderation_action_types TO service_role;
ALTER TABLE public.moderation_action_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read action types" ON public.moderation_action_types FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage action types" ON public.moderation_action_types FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.moderation_action_types(key,label,is_reversible,severity) VALUES
  ('warn','Warn',true,1),('request_info','Request Info',true,1),
  ('hide_content','Hide Content',true,2),('remove_content','Remove Content',true,3),
  ('restore_content','Restore Content',true,0),
  ('suspend_user','Suspend User',true,4),('ban_user','Ban User',true,5),
  ('escalate','Escalate',true,2),('dismiss','Dismiss Report',false,0),
  ('no_action','No Action',false,0);

CREATE SEQUENCE public.moderation_case_number_seq START 1000;
CREATE OR REPLACE FUNCTION public.generate_moderation_case_number()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n bigint;
BEGIN
  n := nextval('public.moderation_case_number_seq');
  RETURN 'MC-' || to_char(now(),'YYYY') || '-' || lpad(n::text,6,'0');
END$$;

-- Cases --------------------------------------------------------------------
CREATE TABLE public.moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL UNIQUE DEFAULT public.generate_moderation_case_number(),
  status public.moderation_case_status NOT NULL DEFAULT 'open',
  priority public.moderation_priority NOT NULL DEFAULT 'medium',
  category_id uuid NOT NULL REFERENCES public.moderation_categories(id),
  target_type_id uuid NOT NULL REFERENCES public.moderation_target_types(id),
  target_id uuid NOT NULL, target_snapshot jsonb,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_moderator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL, summary text, resolution_notes text,
  resolution_action_id uuid REFERENCES public.moderation_action_types(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reports_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  triaged_at timestamptz, first_review_at timestamptz,
  resolved_at timestamptz, closed_at timestamptz, reopened_at timestamptz
);
CREATE INDEX ix_mc_status ON public.moderation_cases(status);
CREATE INDEX ix_mc_priority ON public.moderation_cases(priority);
CREATE INDEX ix_mc_assigned ON public.moderation_cases(assigned_moderator_id);
CREATE INDEX ix_mc_target ON public.moderation_cases(target_type_id, target_id);
CREATE INDEX ix_mc_created ON public.moderation_cases(created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.moderation_cases TO authenticated;
GRANT ALL ON public.moderation_cases TO service_role;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read cases" ON public.moderation_cases FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods create cases" ON public.moderation_cases FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods update cases" ON public.moderation_cases FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()))
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins delete cases" ON public.moderation_cases FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_mc_updated_at BEFORE UPDATE ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION public.moderation_touch_updated_at();

-- Reports ------------------------------------------------------------------
CREATE TABLE public.moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email text, reason_key text, description text,
  source text NOT NULL DEFAULT 'user',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_mr_case ON public.moderation_reports(case_id);
GRANT SELECT, INSERT ON public.moderation_reports TO authenticated;
GRANT ALL ON public.moderation_reports TO service_role;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read reports" ON public.moderation_reports FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods insert reports" ON public.moderation_reports FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

-- Evidence -----------------------------------------------------------------
CREATE TABLE public.moderation_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  kind text NOT NULL, url text, content text, snapshot jsonb,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_me_case ON public.moderation_evidence(case_id);
GRANT SELECT, INSERT ON public.moderation_evidence TO authenticated;
GRANT ALL ON public.moderation_evidence TO service_role;
ALTER TABLE public.moderation_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read evidence" ON public.moderation_evidence FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods add evidence" ON public.moderation_evidence FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

-- Notes --------------------------------------------------------------------
CREATE TABLE public.moderation_case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL, is_internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_mcn_case ON public.moderation_case_notes(case_id);
GRANT SELECT, INSERT ON public.moderation_case_notes TO authenticated;
GRANT ALL ON public.moderation_case_notes TO service_role;
ALTER TABLE public.moderation_case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read notes" ON public.moderation_case_notes FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods add notes" ON public.moderation_case_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()) AND author_id = auth.uid());

-- Actions ------------------------------------------------------------------
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  action_type_id uuid NOT NULL REFERENCES public.moderation_action_types(id),
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type_id uuid REFERENCES public.moderation_target_types(id),
  target_id uuid, reason text,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_reversed boolean NOT NULL DEFAULT false,
  reversed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reversed_at timestamptz, reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ma_case ON public.moderation_actions(case_id);
GRANT SELECT, INSERT, UPDATE ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read actions" ON public.moderation_actions FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods add actions" ON public.moderation_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods reverse actions" ON public.moderation_actions FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()))
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.moderation_actions_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.case_id IS DISTINCT FROM OLD.case_id
  OR NEW.action_type_id IS DISTINCT FROM OLD.action_type_id
  OR NEW.performed_by IS DISTINCT FROM OLD.performed_by
  OR NEW.target_type_id IS DISTINCT FROM OLD.target_type_id
  OR NEW.target_id IS DISTINCT FROM OLD.target_id
  OR NEW.reason IS DISTINCT FROM OLD.reason
  OR NEW.parameters IS DISTINCT FROM OLD.parameters
  OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'moderation_actions are append-only; only reversal fields may change';
  END IF;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_ma_immutable BEFORE UPDATE ON public.moderation_actions
  FOR EACH ROW EXECUTE FUNCTION public.moderation_actions_immutable();

-- Timeline (immutable) -----------------------------------------------------
CREATE TABLE public.moderation_case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  event_type public.moderation_event_type NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text, from_value jsonb, to_value jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  message text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_mce_case ON public.moderation_case_events(case_id, created_at DESC);
CREATE INDEX ix_mce_type ON public.moderation_case_events(event_type);
GRANT SELECT, INSERT ON public.moderation_case_events TO authenticated;
GRANT ALL ON public.moderation_case_events TO service_role;
ALTER TABLE public.moderation_case_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mods read events" ON public.moderation_case_events FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Mods write events" ON public.moderation_case_events FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.moderation_case_events_no_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'moderation_case_events are immutable'; END$$;
CREATE TRIGGER trg_mce_no_update BEFORE UPDATE ON public.moderation_case_events
  FOR EACH ROW EXECUTE FUNCTION public.moderation_case_events_no_change();
CREATE TRIGGER trg_mce_no_delete BEFORE DELETE ON public.moderation_case_events
  FOR EACH ROW EXECUTE FUNCTION public.moderation_case_events_no_change();

-- Status transition validation --------------------------------------------
CREATE OR REPLACE FUNCTION public.moderation_validate_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE allowed text[];
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    allowed := CASE OLD.status
      WHEN 'open'                 THEN ARRAY['triaged','in_review','closed']
      WHEN 'triaged'              THEN ARRAY['in_review','waiting_for_response','closed']
      WHEN 'in_review'            THEN ARRAY['waiting_for_response','resolved','closed']
      WHEN 'waiting_for_response' THEN ARRAY['in_review','resolved','closed']
      WHEN 'resolved'             THEN ARRAY['closed','reopened']
      WHEN 'closed'               THEN ARRAY['reopened']
      WHEN 'reopened'             THEN ARRAY['in_review','triaged','closed']
      ELSE ARRAY[]::text[]
    END;
    IF NOT (NEW.status::text = ANY(allowed)) THEN
      RAISE EXCEPTION 'Invalid moderation case transition: % -> %', OLD.status, NEW.status;
    END IF;
    IF NEW.status = 'resolved'  AND NEW.resolved_at    IS NULL THEN NEW.resolved_at    := now(); END IF;
    IF NEW.status = 'closed'    AND NEW.closed_at      IS NULL THEN NEW.closed_at      := now(); END IF;
    IF NEW.status = 'triaged'   AND NEW.triaged_at     IS NULL THEN NEW.triaged_at     := now(); END IF;
    IF NEW.status = 'in_review' AND NEW.first_review_at IS NULL THEN NEW.first_review_at := now(); END IF;
    IF NEW.status = 'reopened' THEN
      NEW.reopened_at := now(); NEW.resolved_at := NULL; NEW.closed_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_mc_validate_transition BEFORE UPDATE ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION public.moderation_validate_transition();

-- Auto-log events ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.moderation_log_case_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,to_value,message)
    VALUES (NEW.id,'case_created',NEW.created_by,
      jsonb_build_object('status',NEW.status,'priority',NEW.priority),
      'Case ' || NEW.case_number || ' created');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,from_value,to_value)
    VALUES (NEW.id,
      CASE NEW.status
        WHEN 'resolved' THEN 'case_resolved'::public.moderation_event_type
        WHEN 'closed'   THEN 'case_closed'::public.moderation_event_type
        WHEN 'reopened' THEN 'case_reopened'::public.moderation_event_type
        ELSE 'status_changed'::public.moderation_event_type END,
      auth.uid(), to_jsonb(OLD.status), to_jsonb(NEW.status));
  END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,from_value,to_value)
    VALUES (NEW.id,'priority_changed',auth.uid(),to_jsonb(OLD.priority),to_jsonb(NEW.priority));
  END IF;
  IF NEW.category_id IS DISTINCT FROM OLD.category_id THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,from_value,to_value)
    VALUES (NEW.id,'category_changed',auth.uid(),to_jsonb(OLD.category_id),to_jsonb(NEW.category_id));
  END IF;
  IF NEW.assigned_moderator_id IS DISTINCT FROM OLD.assigned_moderator_id THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,from_value,to_value)
    VALUES (NEW.id,
      CASE WHEN NEW.assigned_moderator_id IS NULL
           THEN 'case_unassigned'::public.moderation_event_type
           ELSE 'case_assigned'::public.moderation_event_type END,
      auth.uid(), to_jsonb(OLD.assigned_moderator_id), to_jsonb(NEW.assigned_moderator_id));
  END IF;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_mc_log_insert AFTER INSERT ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_case_event();
CREATE TRIGGER trg_mc_log_update AFTER UPDATE ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_case_event();

CREATE OR REPLACE FUNCTION public.moderation_log_report_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,payload)
  VALUES (NEW.case_id,'report_added',NEW.reporter_id,
    jsonb_build_object('report_id',NEW.id,'source',NEW.source));
  UPDATE public.moderation_cases SET reports_count = reports_count + 1 WHERE id = NEW.case_id;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_mr_log AFTER INSERT ON public.moderation_reports
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_report_event();

CREATE OR REPLACE FUNCTION public.moderation_log_evidence_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,payload)
  VALUES (NEW.case_id,'evidence_added',NEW.added_by,
    jsonb_build_object('evidence_id',NEW.id,'kind',NEW.kind));
  RETURN NEW;
END$$;
CREATE TRIGGER trg_me_log AFTER INSERT ON public.moderation_evidence
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_evidence_event();

CREATE OR REPLACE FUNCTION public.moderation_log_note_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,payload)
  VALUES (NEW.case_id,'note_added',NEW.author_id,jsonb_build_object('note_id',NEW.id));
  RETURN NEW;
END$$;
CREATE TRIGGER trg_mcn_log AFTER INSERT ON public.moderation_case_notes
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_note_event();

CREATE OR REPLACE FUNCTION public.moderation_log_action_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,payload)
    VALUES (NEW.case_id,'action_applied',NEW.performed_by,
      jsonb_build_object('action_id',NEW.id,'action_type_id',NEW.action_type_id));
  ELSIF TG_OP = 'UPDATE' AND NEW.is_reversed = true AND OLD.is_reversed = false THEN
    INSERT INTO public.moderation_case_events(case_id,event_type,actor_id,payload)
    VALUES (NEW.case_id,'action_reversed',NEW.reversed_by,
      jsonb_build_object('action_id',NEW.id,'reason',NEW.reversal_reason));
  END IF;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_ma_log_ins AFTER INSERT ON public.moderation_actions
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_action_event();
CREATE TRIGGER trg_ma_log_upd AFTER UPDATE ON public.moderation_actions
  FOR EACH ROW EXECUTE FUNCTION public.moderation_log_action_event();
