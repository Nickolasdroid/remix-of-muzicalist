
-- Add status to versions
ALTER TABLE public.email_template_versions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Draft'
  CHECK (status IN ('Draft','Published','Archived'));

-- Only one Published version per template
CREATE UNIQUE INDEX IF NOT EXISTS email_template_versions_one_published_per_template
  ON public.email_template_versions (template_id)
  WHERE status = 'Published';

-- Prevent deleting the version currently marked active on the template
CREATE OR REPLACE FUNCTION public.prevent_delete_active_template_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.email_templates
    WHERE active_version_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete the currently active version of a template';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_active_template_version
  ON public.email_template_versions;
CREATE TRIGGER trg_prevent_delete_active_template_version
  BEFORE DELETE ON public.email_template_versions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_active_template_version();

-- Create a new version with an auto-incremented version_number
CREATE OR REPLACE FUNCTION public.create_email_template_version(
  _template_id uuid,
  _subject text,
  _html_content text,
  _text_content text
)
RETURNS public.email_template_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_next int;
  v_row public.email_template_versions;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.email_templates WHERE id = _template_id) THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next
  FROM public.email_template_versions
  WHERE template_id = _template_id;

  INSERT INTO public.email_template_versions (
    template_id, version_number, subject, html_content, text_content, status, created_by
  ) VALUES (
    _template_id, v_next, _subject, _html_content, _text_content, 'Draft', auth.uid()
  )
  RETURNING * INTO v_row;

  UPDATE public.email_templates
    SET updated_at = now()
    WHERE id = _template_id;

  RETURN v_row;
END;
$$;

-- Publish a version: mark it Published, archive previously published, update template
CREATE OR REPLACE FUNCTION public.publish_email_template_version(_version_id uuid)
RETURNS public.email_template_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_template_id uuid;
  v_row public.email_template_versions;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT template_id INTO v_template_id
  FROM public.email_template_versions
  WHERE id = _version_id;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Archive previous published (there can be at most one)
  UPDATE public.email_template_versions
    SET status = 'Archived'
    WHERE template_id = v_template_id
      AND status = 'Published'
      AND id <> _version_id;

  UPDATE public.email_template_versions
    SET status = 'Published'
    WHERE id = _version_id
  RETURNING * INTO v_row;

  UPDATE public.email_templates
    SET active_version_id = _version_id,
        status = 'Active',
        updated_at = now()
    WHERE id = v_template_id;

  RETURN v_row;
END;
$$;

-- Restore: create a NEW Draft version copying selected version's content
CREATE OR REPLACE FUNCTION public.restore_email_template_version(_version_id uuid)
RETURNS public.email_template_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_src public.email_template_versions;
  v_row public.email_template_versions;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_src FROM public.email_template_versions WHERE id = _version_id;
  IF v_src.id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  SELECT * INTO v_row FROM public.create_email_template_version(
    v_src.template_id, v_src.subject, v_src.html_content, v_src.text_content
  );
  RETURN v_row;
END;
$$;
