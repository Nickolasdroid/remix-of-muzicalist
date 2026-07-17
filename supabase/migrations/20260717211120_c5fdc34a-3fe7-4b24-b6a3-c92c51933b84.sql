CREATE OR REPLACE FUNCTION public.try_lock_email_campaign(_campaign_id uuid)
RETURNS SETOF public.email_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_campaigns
     SET status = 'Sending',
         started_at = COALESCE(started_at, now()),
         last_error = NULL,
         updated_at = now()
   WHERE id = _campaign_id
     AND (
       status = 'Pending'
       OR (status = 'Sending' AND started_at IS NOT NULL AND started_at < now() - interval '15 minutes')
     )
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.try_lock_email_campaign(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_lock_email_campaign(uuid) TO service_role;