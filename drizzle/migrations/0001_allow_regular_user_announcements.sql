CREATE OR REPLACE FUNCTION public.enforce_announcement_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limit int;
  v_used int;
  v_is_regular_user boolean;
BEGIN
  -- Regular (non-artist) accounts: opportunity announcements, independent of artist plans.
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.profile_id AND user_type = 'user'
  ) AND NOT public.is_admin(NEW.profile_id)
  INTO v_is_regular_user;

  IF v_is_regular_user THEN
    IF NEW.media_url IS NOT NULL OR NEW.media_type IS NOT NULL OR COALESCE(NEW.is_premium, false) THEN
      RAISE EXCEPTION 'USER_ANNOUNCEMENT_TEXT_ONLY' USING ERRCODE = 'check_violation';
    END IF;
    SELECT count(*) INTO v_used FROM public.announcements
      WHERE profile_id = NEW.profile_id AND COALESCE(is_premium, false) = false;
    IF v_used >= 1 THEN
      RAISE EXCEPTION 'USER_ANNOUNCEMENT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  -- Artists: subscription-based quota (unchanged).
  v_limit := public.plan_limit(NEW.profile_id, 'announcements');
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  v_used := public.consumed_creation_slots(NEW.profile_id, 'announcement');

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;