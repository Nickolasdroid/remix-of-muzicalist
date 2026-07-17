
CREATE OR REPLACE FUNCTION public.moderation_require_mod()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.is_moderator_or_admin(v_uid) THEN
    RAISE EXCEPTION 'MOD_PERMISSION_DENIED' USING HINT='Moderator or admin role required';
  END IF;
  RETURN v_uid;
END$$;
REVOKE EXECUTE ON FUNCTION public.moderation_require_mod() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.moderation_require_mod() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_moderation_case(
  _category_key text, _target_type_key text, _target_id uuid, _title text,
  _summary text DEFAULT NULL, _priority public.moderation_priority DEFAULT NULL,
  _reporter_id uuid DEFAULT NULL, _reporter_email text DEFAULT NULL,
  _reporter_reason text DEFAULT NULL, _target_snapshot jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.moderation_cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := public.moderation_require_mod();
  v_cat public.moderation_categories;
  v_tt  public.moderation_target_types;
  v_case public.moderation_cases;
BEGIN
  IF _title IS NULL OR btrim(_title) = '' THEN
    RAISE EXCEPTION 'MOD_VALIDATION_FAILED' USING HINT='title is required'; END IF;
  IF _target_id IS NULL THEN
    RAISE EXCEPTION 'MOD_VALIDATION_FAILED' USING HINT='target_id is required'; END IF;
  SELECT * INTO v_cat FROM public.moderation_categories WHERE key=_category_key AND is_active;
  IF v_cat.id IS NULL THEN RAISE EXCEPTION 'MOD_INVALID_CATEGORY' USING HINT=_category_key; END IF;
  SELECT * INTO v_tt FROM public.moderation_target_types WHERE key=_target_type_key AND is_active;
  IF v_tt.id IS NULL THEN RAISE EXCEPTION 'MOD_INVALID_TARGET' USING HINT=_target_type_key; END IF;

  INSERT INTO public.moderation_cases(
    category_id,target_type_id,target_id,title,summary,priority,
    reporter_id,target_snapshot,metadata,created_by
  ) VALUES (
    v_cat.id,v_tt.id,_target_id,_title,_summary,
    COALESCE(_priority, v_cat.default_priority),
    _reporter_id,_target_snapshot,COALESCE(_metadata,'{}'::jsonb),v_uid
  ) RETURNING * INTO v_case;

  IF _reporter_id IS NOT NULL OR _reporter_email IS NOT NULL OR _reporter_reason IS NOT NULL THEN
    INSERT INTO public.moderation_reports(case_id,reporter_id,reporter_email,description,source)
    VALUES (v_case.id,_reporter_id,_reporter_email,_reporter_reason,'user');
  END IF;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.assign_moderator(_case_id uuid, _moderator_id uuid)
RETURNS public.moderation_cases LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_case public.moderation_cases;
BEGIN
  SELECT * INTO v_case FROM public.moderation_cases WHERE id=_case_id;
  IF v_case.id IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  IF NOT public.is_moderator_or_admin(_moderator_id) THEN
    RAISE EXCEPTION 'MOD_INVALID_ASSIGNEE' USING HINT='User is not a moderator'; END IF;
  IF v_case.assigned_moderator_id = _moderator_id THEN
    RAISE EXCEPTION 'MOD_ALREADY_ASSIGNED'; END IF;
  UPDATE public.moderation_cases
    SET assigned_moderator_id=_moderator_id,
        status = CASE WHEN status='open' THEN 'triaged'::public.moderation_case_status ELSE status END
    WHERE id=_case_id RETURNING * INTO v_case;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.unassign_moderator(_case_id uuid)
RETURNS public.moderation_cases LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_case public.moderation_cases;
BEGIN
  SELECT * INTO v_case FROM public.moderation_cases WHERE id=_case_id;
  IF v_case.id IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  IF v_case.assigned_moderator_id IS NULL THEN RAISE EXCEPTION 'MOD_NOT_ASSIGNED'; END IF;
  UPDATE public.moderation_cases SET assigned_moderator_id=NULL
    WHERE id=_case_id RETURNING * INTO v_case;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.change_case_status(
  _case_id uuid, _next_status public.moderation_case_status, _note text DEFAULT NULL
) RETURNS public.moderation_cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_case public.moderation_cases;
BEGIN
  SELECT * INTO v_case FROM public.moderation_cases WHERE id=_case_id;
  IF v_case.id IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  BEGIN
    UPDATE public.moderation_cases SET status=_next_status
      WHERE id=_case_id RETURNING * INTO v_case;
  EXCEPTION WHEN raise_exception THEN
    RAISE EXCEPTION 'MOD_INVALID_TRANSITION' USING HINT=SQLERRM;
  END;
  IF _note IS NOT NULL AND btrim(_note)<>'' THEN
    INSERT INTO public.moderation_case_notes(case_id,author_id,body)
    VALUES (_case_id, v_uid, _note);
  END IF;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.change_case_priority(
  _case_id uuid, _priority public.moderation_priority
) RETURNS public.moderation_cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_case public.moderation_cases;
BEGIN
  SELECT * INTO v_case FROM public.moderation_cases WHERE id=_case_id;
  IF v_case.id IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  UPDATE public.moderation_cases SET priority=_priority
    WHERE id=_case_id RETURNING * INTO v_case;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.add_case_note(
  _case_id uuid, _body text, _is_internal boolean DEFAULT true
) RETURNS public.moderation_case_notes
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_row public.moderation_case_notes;
BEGIN
  IF _body IS NULL OR btrim(_body)='' THEN
    RAISE EXCEPTION 'MOD_VALIDATION_FAILED' USING HINT='note body required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.moderation_cases WHERE id=_case_id) THEN
    RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  INSERT INTO public.moderation_case_notes(case_id,author_id,body,is_internal)
  VALUES (_case_id,v_uid,_body,COALESCE(_is_internal,true))
  RETURNING * INTO v_row;
  RETURN v_row;
END$$;

CREATE OR REPLACE FUNCTION public.add_case_evidence(
  _case_id uuid, _kind text, _url text DEFAULT NULL,
  _content text DEFAULT NULL, _snapshot jsonb DEFAULT NULL
) RETURNS public.moderation_evidence
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_row public.moderation_evidence;
BEGIN
  IF _kind IS NULL OR btrim(_kind)='' THEN
    RAISE EXCEPTION 'MOD_VALIDATION_FAILED' USING HINT='kind required'; END IF;
  IF _url IS NULL AND _content IS NULL AND _snapshot IS NULL THEN
    RAISE EXCEPTION 'MOD_EVIDENCE_REQUIRED' USING HINT='provide url, content or snapshot'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.moderation_cases WHERE id=_case_id) THEN
    RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  INSERT INTO public.moderation_evidence(case_id,kind,url,content,snapshot,added_by)
  VALUES (_case_id,_kind,_url,_content,_snapshot,v_uid)
  RETURNING * INTO v_row;
  RETURN v_row;
END$$;

CREATE OR REPLACE FUNCTION public.add_case_action(
  _case_id uuid, _action_key text, _reason text DEFAULT NULL,
  _parameters jsonb DEFAULT '{}'::jsonb,
  _target_type_key text DEFAULT NULL, _target_id uuid DEFAULT NULL
) RETURNS public.moderation_actions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := public.moderation_require_mod();
  v_at public.moderation_action_types;
  v_tt_id uuid := NULL;
  v_row public.moderation_actions;
BEGIN
  SELECT * INTO v_at FROM public.moderation_action_types WHERE key=_action_key AND is_active;
  IF v_at.id IS NULL THEN RAISE EXCEPTION 'MOD_INVALID_ACTION' USING HINT=_action_key; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.moderation_cases WHERE id=_case_id) THEN
    RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  IF _target_type_key IS NOT NULL THEN
    SELECT id INTO v_tt_id FROM public.moderation_target_types WHERE key=_target_type_key AND is_active;
    IF v_tt_id IS NULL THEN RAISE EXCEPTION 'MOD_INVALID_TARGET' USING HINT=_target_type_key; END IF;
  END IF;

  BEGIN
    INSERT INTO public.moderation_actions(
      case_id,action_type_id,performed_by,target_type_id,target_id,reason,parameters
    ) VALUES (_case_id,v_at.id,v_uid,v_tt_id,_target_id,_reason,COALESCE(_parameters,'{}'::jsonb))
    RETURNING * INTO v_row;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'MOD_ACTION_FAILED' USING HINT=SQLERRM;
  END;
  RETURN v_row;
END$$;

CREATE OR REPLACE FUNCTION public.reverse_case_action(_action_id uuid, _reason text)
RETURNS public.moderation_actions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := public.moderation_require_mod();
  v_row public.moderation_actions;
  v_reversible boolean;
BEGIN
  SELECT * INTO v_row FROM public.moderation_actions WHERE id=_action_id;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'MOD_ACTION_NOT_FOUND'; END IF;
  SELECT is_reversible INTO v_reversible FROM public.moderation_action_types WHERE id=v_row.action_type_id;
  IF NOT v_reversible THEN RAISE EXCEPTION 'MOD_ACTION_NOT_REVERSIBLE'; END IF;
  IF v_row.is_reversed THEN RAISE EXCEPTION 'MOD_ACTION_ALREADY_REVERSED'; END IF;

  UPDATE public.moderation_actions
    SET is_reversed=true, reversed_by=v_uid, reversed_at=now(), reversal_reason=_reason
    WHERE id=_action_id RETURNING * INTO v_row;
  RETURN v_row;
END$$;

CREATE OR REPLACE FUNCTION public.close_case(
  _case_id uuid, _resolution_notes text DEFAULT NULL,
  _resolution_action_key text DEFAULT NULL
) RETURNS public.moderation_cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := public.moderation_require_mod();
  v_case public.moderation_cases;
  v_at_id uuid;
BEGIN
  SELECT * INTO v_case FROM public.moderation_cases WHERE id=_case_id;
  IF v_case.id IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  IF _resolution_action_key IS NOT NULL THEN
    SELECT id INTO v_at_id FROM public.moderation_action_types WHERE key=_resolution_action_key;
    IF v_at_id IS NULL THEN RAISE EXCEPTION 'MOD_INVALID_ACTION' USING HINT=_resolution_action_key; END IF;
  END IF;
  BEGIN
    UPDATE public.moderation_cases
      SET status='closed',
          resolution_notes = COALESCE(_resolution_notes, resolution_notes),
          resolution_action_id = COALESCE(v_at_id, resolution_action_id)
      WHERE id=_case_id RETURNING * INTO v_case;
  EXCEPTION WHEN raise_exception THEN
    RAISE EXCEPTION 'MOD_INVALID_TRANSITION' USING HINT=SQLERRM;
  END;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.reopen_case(_case_id uuid, _reason text DEFAULT NULL)
RETURNS public.moderation_cases
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v_case public.moderation_cases;
BEGIN
  SELECT * INTO v_case FROM public.moderation_cases WHERE id=_case_id;
  IF v_case.id IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  BEGIN
    UPDATE public.moderation_cases SET status='reopened'
      WHERE id=_case_id RETURNING * INTO v_case;
  EXCEPTION WHEN raise_exception THEN
    RAISE EXCEPTION 'MOD_INVALID_TRANSITION' USING HINT=SQLERRM;
  END;
  IF _reason IS NOT NULL THEN
    INSERT INTO public.moderation_case_notes(case_id,author_id,body)
    VALUES (_case_id,v_uid,'[reopen] ' || _reason);
  END IF;
  RETURN v_case;
END$$;

CREATE OR REPLACE FUNCTION public.list_moderation_cases(
  _statuses public.moderation_case_status[] DEFAULT NULL,
  _priorities public.moderation_priority[] DEFAULT NULL,
  _category_keys text[] DEFAULT NULL,
  _target_type_keys text[] DEFAULT NULL,
  _assigned_to uuid DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit int DEFAULT 50, _offset int DEFAULT 0
) RETURNS TABLE(
  id uuid, case_number text, status public.moderation_case_status,
  priority public.moderation_priority, category_key text, category_label text,
  target_type_key text, target_id uuid, title text, summary text,
  reporter_id uuid, assigned_moderator_id uuid, reports_count int,
  created_at timestamptz, updated_at timestamptz, resolved_at timestamptz,
  closed_at timestamptz, total_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod();
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT c.*, cat.key AS category_key, cat.label AS category_label, tt.key AS target_type_key
    FROM public.moderation_cases c
    JOIN public.moderation_categories cat ON cat.id = c.category_id
    JOIN public.moderation_target_types tt ON tt.id = c.target_type_id
    WHERE (_statuses IS NULL OR c.status = ANY(_statuses))
      AND (_priorities IS NULL OR c.priority = ANY(_priorities))
      AND (_category_keys IS NULL OR cat.key = ANY(_category_keys))
      AND (_target_type_keys IS NULL OR tt.key = ANY(_target_type_keys))
      AND (_assigned_to IS NULL OR c.assigned_moderator_id = _assigned_to)
      AND (_search IS NULL OR c.title ILIKE '%'||_search||'%' OR c.case_number ILIKE '%'||_search||'%')
  ), counted AS (SELECT count(*) AS n FROM filtered)
  SELECT f.id,f.case_number,f.status,f.priority,f.category_key,f.category_label,
         f.target_type_key,f.target_id,f.title,f.summary,f.reporter_id,
         f.assigned_moderator_id,f.reports_count,f.created_at,f.updated_at,
         f.resolved_at,f.closed_at,(SELECT n FROM counted)
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit,200)) OFFSET GREATEST(0,_offset);
END$$;

CREATE OR REPLACE FUNCTION public.get_moderation_case_details(_case_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod(); v jsonb;
BEGIN
  SELECT jsonb_build_object(
    'case', to_jsonb(c),
    'category', to_jsonb(cat),
    'target_type', to_jsonb(tt),
    'reports_count',  (SELECT count(*) FROM public.moderation_reports  WHERE case_id=c.id),
    'evidence_count', (SELECT count(*) FROM public.moderation_evidence WHERE case_id=c.id),
    'notes_count',    (SELECT count(*) FROM public.moderation_case_notes WHERE case_id=c.id),
    'actions_count',  (SELECT count(*) FROM public.moderation_actions  WHERE case_id=c.id AND NOT is_reversed),
    'events_count',   (SELECT count(*) FROM public.moderation_case_events WHERE case_id=c.id)
  ) INTO v
  FROM public.moderation_cases c
  JOIN public.moderation_categories cat ON cat.id=c.category_id
  JOIN public.moderation_target_types tt ON tt.id=c.target_type_id
  WHERE c.id=_case_id;
  IF v IS NULL THEN RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  RETURN v;
END$$;

CREATE OR REPLACE FUNCTION public.get_moderation_case_timeline(_case_id uuid)
RETURNS SETOF public.moderation_case_events
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := public.moderation_require_mod();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.moderation_cases WHERE id=_case_id) THEN
    RAISE EXCEPTION 'MOD_CASE_NOT_FOUND'; END IF;
  RETURN QUERY SELECT * FROM public.moderation_case_events
    WHERE case_id=_case_id ORDER BY created_at ASC, id ASC;
END$$;

DO $$ DECLARE r record; BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (
      'create_moderation_case','assign_moderator','unassign_moderator',
      'change_case_status','change_case_priority',
      'add_case_note','add_case_evidence','add_case_action','reverse_case_action',
      'close_case','reopen_case','list_moderation_cases',
      'get_moderation_case_details','get_moderation_case_timeline'
    )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM public, anon;', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role;', r.sig);
  END LOOP;
END $$;
