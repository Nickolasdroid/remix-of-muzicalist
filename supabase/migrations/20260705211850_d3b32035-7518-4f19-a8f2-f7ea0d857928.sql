
-- Ensure vault secret exists with a strong random value (idempotent)
DO $$
DECLARE
  v_existing_id uuid;
BEGIN
  SELECT id INTO v_existing_id FROM vault.secrets WHERE name = 'welcome_email_trigger_secret';
  IF v_existing_id IS NULL THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'welcome_email_trigger_secret',
      'Shared secret used by DB trigger to authenticate to send-welcome-email edge function'
    );
  END IF;
END $$;

-- RPC used by the edge function (via service_role) to verify the incoming secret
CREATE OR REPLACE FUNCTION public.verify_welcome_trigger_secret(_secret text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored text;
BEGIN
  SELECT decrypted_secret INTO v_stored
  FROM vault.decrypted_secrets
  WHERE name = 'welcome_email_trigger_secret'
  LIMIT 1;
  RETURN v_stored IS NOT NULL AND _secret IS NOT NULL AND v_stored = _secret;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_welcome_trigger_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_welcome_trigger_secret(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_welcome_trigger_secret(text) TO service_role;

-- Trigger function: fires once per new account (user_roles insert) and asynchronously
-- calls the edge function using pg_net, authenticated with the vault secret.
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_url text := 'https://ccdgoduekpiesdmkluff.supabase.co/functions/v1/send-welcome-email';
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'welcome_email_trigger_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE WARNING 'welcome_email_trigger_secret is missing; skipping welcome email';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-welcome-trigger-secret', v_secret
    ),
    body := jsonb_build_object('user_id', NEW.user_id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trigger_welcome_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_email ON public.user_roles;
CREATE TRIGGER trg_welcome_email
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.trigger_welcome_email();
