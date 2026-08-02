-- 1) Harden premium announcements: require an actual Premium plan, not just a slot row
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
      -- Must be the owner
      IF auth.uid() IS NULL OR auth.uid() <> NEW.profile_id THEN
        RAISE EXCEPTION 'Not authorized to create premium announcement';
      END IF;

      -- Must actually be on the Premium plan
      SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.profile_id;
      IF COALESCE(v_plan, 'Free') <> 'Premium' THEN
        RAISE EXCEPTION 'Only Premium subscribers can create premium announcements';
      END IF;

      -- Must have a consumed premium slot
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
    NEW.is_premium := OLD.is_premium;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Consumed ad slots: keep plan check, run as SECURITY DEFINER so profile plan is always readable
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
    SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.profile_id;
    IF COALESCE(v_plan, 'Free') <> 'Premium' THEN
      RAISE EXCEPTION 'Only Premium subscribers can consume premium ad slots';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Column-level defence in depth on profiles: clients cannot even write these columns
REVOKE UPDATE (
  is_verified,
  verification_status,
  plan,
  billing,
  subscription_status,
  subscription_current_period_end,
  subscription_cancel_at_period_end,
  stripe_customer_id,
  stripe_subscription_id,
  is_active,
  suspended_until,
  is_permanent_suspension,
  suspension_reason,
  active_suspension_id
) ON public.profiles FROM authenticated, anon;

GRANT ALL ON public.profiles TO service_role;