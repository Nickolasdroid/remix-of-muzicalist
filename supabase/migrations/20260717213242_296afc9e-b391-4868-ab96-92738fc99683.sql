
-- ============================================================
-- Email Templates: backend foundation (admin-only)
-- ============================================================

-- 1) email_template_categories -------------------------------
CREATE TABLE public.email_template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_categories TO authenticated;
GRANT ALL ON public.email_template_categories TO service_role;

ALTER TABLE public.email_template_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template categories"
  ON public.email_template_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) email_templates -----------------------------------------
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Active', 'Archived')),
  description text,
  active_version_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email templates"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_email_templates_status ON public.email_templates(status);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE INDEX idx_email_templates_type ON public.email_templates(type);
CREATE INDEX idx_email_templates_updated_at ON public.email_templates(updated_at DESC);

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3) email_template_versions ---------------------------------
CREATE TABLE public.email_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  subject text NOT NULL,
  html_content text,
  text_content text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_versions TO authenticated;
GRANT ALL ON public.email_template_versions TO service_role;

ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template versions"
  ON public.email_template_versions
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_email_template_versions_template_id
  ON public.email_template_versions(template_id);
CREATE INDEX idx_email_template_versions_template_created
  ON public.email_template_versions(template_id, created_at DESC);

-- active_version_id FK: added after the versions table exists
ALTER TABLE public.email_templates
  ADD CONSTRAINT email_templates_active_version_fk
  FOREIGN KEY (active_version_id)
  REFERENCES public.email_template_versions(id)
  ON DELETE SET NULL;

-- 4) email_template_variables --------------------------------
CREATE TABLE public.email_template_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  variable_name text NOT NULL,
  description text,
  required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, variable_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_variables TO authenticated;
GRANT ALL ON public.email_template_variables TO service_role;

ALTER TABLE public.email_template_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template variables"
  ON public.email_template_variables
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_email_template_variables_template_id
  ON public.email_template_variables(template_id);

-- 5) email_template_usage ------------------------------------
CREATE TABLE public.email_template_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  usage_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_usage TO authenticated;
GRANT ALL ON public.email_template_usage TO service_role;

ALTER TABLE public.email_template_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template usage"
  ON public.email_template_usage
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_email_template_usage_template_id
  ON public.email_template_usage(template_id);
CREATE INDEX idx_email_template_usage_module
  ON public.email_template_usage(module_name);

-- 6) Seed initial categories ---------------------------------
INSERT INTO public.email_template_categories (name, description) VALUES
  ('Marketing',     'Promotional emails, campaigns, announcements'),
  ('Transactional', 'Emails triggered by user actions (receipts, confirmations)'),
  ('System',        'Platform-generated notifications and system messages'),
  ('General',       'Uncategorized or shared-purpose templates')
ON CONFLICT (name) DO NOTHING;
