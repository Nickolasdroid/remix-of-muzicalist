CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_self_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user boolean := false;
  is_privileged boolean := false;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    is_privileged := true;
  END IF;
  IF NOT is_privileged AND auth.uid() IS NOT NULL THEN
    BEGIN
      SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO is_admin_user;
    EXCEPTION WHEN OTHERS THEN is_admin_user := false;
    END;
  END IF;
  IF is_privileged OR COALESCE(is_admin_user, false) THEN
    RETURN NEW;
  END IF;
  NEW.is_verified := OLD.is_verified;
  NEW.verification_status := OLD.verification_status;
  NEW.plan := OLD.plan;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_current_period_end := OLD.subscription_current_period_end;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  -- Identity fields are immutable for self-updates
  NEW.first_name := OLD.first_name;
  NEW.last_name := OLD.last_name;
  RETURN NEW;
END;
$function$;