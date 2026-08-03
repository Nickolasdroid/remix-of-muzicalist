-- Enforce premium entitlement at the policy level for consumed_ad_slots
DROP POLICY IF EXISTS "Users can insert their own consumed slots" ON public.consumed_ad_slots;
CREATE POLICY "Users can insert their own consumed slots"
ON public.consumed_ad_slots
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = profile_id
  AND (
    is_premium = false
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.plan = 'Premium'
    )
  )
);

-- Block self-service writes to suspension/status columns on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean := false;
  v_is_service boolean := false;
BEGIN
  BEGIN
    v_is_service := current_setting('request.jwt.claim.role', true) = 'service_role';
  EXCEPTION WHEN others THEN
    v_is_service := false;
  END;

  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    v_is_service := true;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_is_admin := public.is_admin(auth.uid());
  END IF;

  IF v_is_service OR v_is_admin THEN
    RETURN NEW;
  END IF;

  NEW.plan := OLD.plan;
  NEW.is_verified := OLD.is_verified;
  NEW.verification_status := OLD.verification_status;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_current_period_end := OLD.subscription_current_period_end;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.billing := OLD.billing;
  -- suspension / activation state is admin-only
  NEW.is_active := OLD.is_active;
  NEW.suspended_until := OLD.suspended_until;
  NEW.is_permanent_suspension := OLD.is_permanent_suspension;
  NEW.suspension_reason := OLD.suspension_reason;
  NEW.active_suspension_id := OLD.active_suspension_id;

  RETURN NEW;
END;
$function$;

-- Prevent self-insert of a profile pre-loaded with privileged values
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND COALESCE(is_verified, false) = false
  AND COALESCE(verification_status, 'unverified') IN ('unverified', 'pending')
  AND COALESCE(plan, 'Free') = 'Free'
  AND subscription_status IS NULL
  AND stripe_customer_id IS NULL
  AND stripe_subscription_id IS NULL
  AND suspended_until IS NULL
  AND active_suspension_id IS NULL
  AND COALESCE(is_permanent_suspension, false) = false
);