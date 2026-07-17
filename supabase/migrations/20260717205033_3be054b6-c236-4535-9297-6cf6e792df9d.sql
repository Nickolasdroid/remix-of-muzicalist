
-- 1) Attach profile privileged-columns protection trigger
DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 2) Attach consumed_ad_slots validation trigger
DROP TRIGGER IF EXISTS trg_validate_consumed_ad_slot ON public.consumed_ad_slots;
CREATE TRIGGER trg_validate_consumed_ad_slot
BEFORE INSERT ON public.consumed_ad_slots
FOR EACH ROW EXECUTE FUNCTION public.validate_consumed_ad_slot();

-- 3) Protect announcements.is_premium from self-escalation
CREATE OR REPLACE FUNCTION public.protect_announcement_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := false;
  v_is_service boolean := false;
  v_has_slot boolean := false;
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
      -- Require an existing premium consumed ad slot for this profile
      SELECT EXISTS (
        SELECT 1 FROM public.consumed_ad_slots
        WHERE profile_id = NEW.profile_id
          AND is_premium = true
      ) INTO v_has_slot;
      IF NOT v_has_slot THEN
        RAISE EXCEPTION 'Not authorized to create premium announcement without a consumed premium slot';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Prevent users from flipping is_premium themselves
    NEW.is_premium := OLD.is_premium;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_announcement_premium ON public.announcements;
CREATE TRIGGER trg_protect_announcement_premium
BEFORE INSERT OR UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.protect_announcement_premium();
