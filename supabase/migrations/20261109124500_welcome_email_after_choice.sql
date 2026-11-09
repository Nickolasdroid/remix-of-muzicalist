-- Google sign-ups choose artist/user after the account exists. Their welcome email
-- waits for that choice, so artists get the artist email.

-- Sends the welcome email for one account (same call the trigger and sweeper make)
CREATE OR REPLACE FUNCTION public.send_welcome_email_now(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'welcome_email_trigger_secret'
  LIMIT 1;
  IF v_secret IS NULL THEN
    RAISE WARNING 'welcome_email_trigger_secret is missing; skipping welcome email';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := 'https://ccdgoduekpiesdmkluff.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-welcome-trigger-secret', v_secret),
    body := jsonb_build_object('user_id', _user_id)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send_welcome_email_now failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.send_welcome_email_now(uuid) FROM PUBLIC, anon, authenticated;

-- New account: send now, unless it still has to choose artist/user
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND account_type_chosen = false) THEN
    RETURN NEW;
  END IF;
  PERFORM public.send_welcome_email_now(NEW.user_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trigger_welcome_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Retry sweeper: also skips accounts that haven't chosen yet
CREATE OR REPLACE FUNCTION public.retry_pending_welcome_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_count integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'welcome_email_trigger_secret') THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT p.id
    FROM public.profiles p
    WHERE p.welcome_email_sent_at IS NULL
      AND p.account_type_chosen = true
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
    PERFORM public.send_welcome_email_now(r.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.retry_pending_welcome_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.retry_pending_welcome_emails() TO service_role;

-- Welcome screen choice: save it, then send the welcome email for that role
CREATE OR REPLACE FUNCTION public.set_my_account_type(_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF _type NOT IN ('artist', 'user') THEN
    RAISE EXCEPTION 'INVALID_ACCOUNT_TYPE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND account_type_chosen = false) THEN
    RAISE EXCEPTION 'ACCOUNT_TYPE_ALREADY_CHOSEN';
  END IF;

  UPDATE public.user_roles SET user_type = _type::public.user_type WHERE user_id = v_uid;
  UPDATE public.profiles
     SET account_type_chosen = true,
         country = CASE WHEN _type = 'artist' THEN COALESCE(country, 'Romania') ELSE country END
   WHERE id = v_uid;

  PERFORM public.send_welcome_email_now(v_uid);
  RETURN _type;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_account_type(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_account_type(text) TO authenticated;
