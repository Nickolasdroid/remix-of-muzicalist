
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_email_last_attempt_at timestamptz;

-- Retry sweeper: picks accounts whose welcome email has not been marked sent,
-- is under the attempt cap, and has waited long enough since the last try.
CREATE OR REPLACE FUNCTION public.retry_pending_welcome_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_url text := 'https://ccdgoduekpiesdmkluff.supabase.co/functions/v1/send-welcome-email';
  r RECORD;
  v_count integer := 0;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'welcome_email_trigger_secret'
  LIMIT 1;
  IF v_secret IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT p.id
    FROM public.profiles p
    WHERE p.welcome_email_sent_at IS NULL
      AND p.welcome_email_attempts < 5
      AND p.created_at < now() - interval '2 minutes'
      AND (
        p.welcome_email_last_attempt_at IS NULL
        OR p.welcome_email_last_attempt_at < now() - interval '4 minutes'
      )
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
    ORDER BY p.created_at
    LIMIT 50
  LOOP
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-welcome-trigger-secret', v_secret
      ),
      body := jsonb_build_object('user_id', r.id)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.retry_pending_welcome_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.retry_pending_welcome_emails() TO service_role;

-- Schedule every 5 minutes (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'welcome-email-retry') THEN
    PERFORM cron.unschedule('welcome-email-retry');
  END IF;
  PERFORM cron.schedule(
    'welcome-email-retry',
    '*/5 * * * *',
    $cron$SELECT public.retry_pending_welcome_emails();$cron$
  );
END $$;
