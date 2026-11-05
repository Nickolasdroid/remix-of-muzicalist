CREATE OR REPLACE FUNCTION public.plan_limits(_plan text)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE COALESCE(_plan, 'Free')
    WHEN 'Premium' THEN jsonb_build_object(
      'posts', 30, 'announcements', 30,
      'post_promotions', 5, 'announcement_promotions', 3,
      'gallery_images', 15, 'gallery_videos', 5,
      'pricing_entries', 3, 'social_links', 5)
    WHEN 'Standard' THEN jsonb_build_object(
      'posts', 15, 'announcements', 15,
      'post_promotions', 2, 'announcement_promotions', 1,
      'gallery_images', 10, 'gallery_videos', 3,
      'pricing_entries', 3, 'social_links', 5)
    ELSE jsonb_build_object(
      'posts', 3, 'announcements', 0,
      'post_promotions', 0, 'announcement_promotions', 0,
      'gallery_images', 5, 'gallery_videos', 1,
      'pricing_entries', 3, 'social_links', 1)
  END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_post_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_limit int; v_used int;
BEGIN
  v_limit := public.plan_limit(NEW.profile_id, 'posts');
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'POST_PLAN_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;
  v_used := public.consumed_creation_slots(NEW.profile_id, 'post')
          + public.consumed_creation_slots(NEW.profile_id, 'announcement');
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'POST_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_shared_collab_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_limit int; v_used int;
BEGIN
  IF NEW.kind IS DISTINCT FROM 'collab' THEN RETURN NEW; END IF;
  v_limit := public.plan_limit(NEW.profile_id, 'posts');
  v_used := public.consumed_creation_slots(NEW.profile_id, 'post')
          + public.consumed_creation_slots(NEW.profile_id, 'announcement');
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'POST_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_shared_collab_quota_trg ON public.announcements;
CREATE TRIGGER enforce_shared_collab_quota_trg
BEFORE INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.enforce_shared_collab_quota();