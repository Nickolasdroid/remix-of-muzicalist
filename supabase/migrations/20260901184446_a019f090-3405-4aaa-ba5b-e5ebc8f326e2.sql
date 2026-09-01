-- 1. Premium announcement entitlement via effective_plan + period-scoped slot
CREATE OR REPLACE FUNCTION public.protect_announcement_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean := false;
  v_is_service boolean := false;
  v_has_slot boolean := false;
  v_plan text;
  v_start timestamptz;
BEGIN
  BEGIN
    v_is_service := current_setting('request.jwt.claim.role', true) = 'service_role';
  EXCEPTION WHEN others THEN
    v_is_service := false;
  END;

  IF auth.uid() IS NOT NULL THEN
    v_is_admin := public.is_admin(auth.uid());
  END IF;

  IF v_is_service OR v_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_premium, false) = true THEN
      IF auth.uid() IS NULL OR auth.uid() <> NEW.profile_id THEN
        RAISE EXCEPTION 'Not authorized to create premium announcement';
      END IF;

      v_plan := public.effective_plan(NEW.profile_id);
      IF COALESCE(v_plan, 'Free') <> 'Premium' THEN
        RAISE EXCEPTION 'Only Premium subscribers can create premium announcements';
      END IF;

      v_start := public.billing_period_start(NEW.profile_id);

      SELECT EXISTS (
        SELECT 1 FROM public.consumed_ad_slots
        WHERE profile_id = NEW.profile_id
          AND is_premium = true
          AND consumed_at >= v_start
      ) INTO v_has_slot;

      IF NOT v_has_slot THEN
        RAISE EXCEPTION 'Not authorized to create premium announcement without a consumed premium slot';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.is_premium := OLD.is_premium;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Ad slot validation via effective_plan
CREATE OR REPLACE FUNCTION public.validate_consumed_ad_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan text;
  v_is_service boolean := false;
BEGIN
  BEGIN
    v_is_service := current_setting('request.jwt.claim.role', true) = 'service_role';
  EXCEPTION WHEN others THEN
    v_is_service := false;
  END;

  IF NOT v_is_service THEN
    IF auth.uid() IS NULL OR auth.uid() <> NEW.profile_id THEN
      RAISE EXCEPTION 'Not authorized to insert ad slot for this profile';
    END IF;
  END IF;

  IF NEW.announcement_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.announcements
      WHERE id = NEW.announcement_id AND profile_id = NEW.profile_id
    ) THEN
      RAISE EXCEPTION 'Announcement does not exist or does not belong to this profile';
    END IF;
  END IF;

  IF NEW.is_premium AND NOT v_is_service THEN
    v_plan := public.effective_plan(NEW.profile_id);
    IF COALESCE(v_plan, 'Free') <> 'Premium' THEN
      RAISE EXCEPTION 'Only Premium subscribers can consume premium ad slots';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Remove duplicate triggers (keep trg_validate_consumed_ad_slot)
DROP TRIGGER IF EXISTS validate_consumed_ad_slot_trg ON public.consumed_ad_slots;
DROP TRIGGER IF EXISTS validate_consumed_ad_slot_trigger ON public.consumed_ad_slots;

-- 4. Server-side social link enforcement (never deletes existing data)
CREATE OR REPLACE FUNCTION public.enforce_social_link_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_limit int;
  v_new int;
  v_old int := 0;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  v_new := (CASE WHEN NULLIF(btrim(COALESCE(NEW.facebook_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
         + (CASE WHEN NULLIF(btrim(COALESCE(NEW.instagram_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
         + (CASE WHEN NULLIF(btrim(COALESCE(NEW.youtube_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
         + (CASE WHEN NULLIF(btrim(COALESCE(NEW.tiktok_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
         + (CASE WHEN NULLIF(btrim(COALESCE(NEW.spotify_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END);

  IF TG_OP = 'UPDATE' THEN
    v_old := (CASE WHEN NULLIF(btrim(COALESCE(OLD.facebook_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
           + (CASE WHEN NULLIF(btrim(COALESCE(OLD.instagram_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
           + (CASE WHEN NULLIF(btrim(COALESCE(OLD.youtube_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
           + (CASE WHEN NULLIF(btrim(COALESCE(OLD.tiktok_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END)
           + (CASE WHEN NULLIF(btrim(COALESCE(OLD.spotify_url,'')),'') IS NOT NULL THEN 1 ELSE 0 END);
  END IF;

  -- nothing added -> always allowed (preserves grandfathered data, allows removals)
  IF v_new <= v_old THEN
    RETURN NEW;
  END IF;

  v_limit := public.plan_limit(NEW.id, 'social_links');

  IF v_new > COALESCE(v_limit, 1) THEN
    RAISE EXCEPTION 'SOCIAL_LINK_LIMIT_REACHED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_social_link_quota_trg ON public.profiles;
CREATE TRIGGER enforce_social_link_quota_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_social_link_quota();

-- Public-facing entitled social links
CREATE OR REPLACE FUNCTION public.get_public_social_links(_profile_id uuid)
RETURNS TABLE(platform text, url text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_limit int;
BEGIN
  v_limit := COALESCE((public.plan_limits(public.effective_plan(_profile_id)) ->> 'social_links')::int, 1);

  RETURN QUERY
  SELECT l.platform, l.url
  FROM (
    SELECT 'facebook'::text AS platform, p.facebook_url AS url, 1 AS ord FROM public.profiles p WHERE p.id = _profile_id
    UNION ALL SELECT 'instagram', p.instagram_url, 2 FROM public.profiles p WHERE p.id = _profile_id
    UNION ALL SELECT 'youtube', p.youtube_url, 3 FROM public.profiles p WHERE p.id = _profile_id
    UNION ALL SELECT 'tiktok', p.tiktok_url, 4 FROM public.profiles p WHERE p.id = _profile_id
    UNION ALL SELECT 'spotify', p.spotify_url, 5 FROM public.profiles p WHERE p.id = _profile_id
  ) l
  WHERE NULLIF(btrim(COALESCE(l.url, '')), '') IS NOT NULL
  ORDER BY l.ord
  LIMIT v_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_social_links(uuid) TO anon, authenticated, service_role;

-- 5. Remove unnecessary anon write grants (RLS unchanged)
REVOKE INSERT, UPDATE, DELETE ON public.posts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.announcements FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.gallery_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.pricing_entries FROM anon;

-- 6. Reduce public execution surface on entitlement helpers
REVOKE ALL ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.billing_period_start(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.plan_limits(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.plan_limit(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promote_post(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promote_announcement(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_entitlements() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.billing_period_start(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.plan_limits(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.plan_limit(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_post(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_announcement(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_entitlements() TO authenticated, service_role;