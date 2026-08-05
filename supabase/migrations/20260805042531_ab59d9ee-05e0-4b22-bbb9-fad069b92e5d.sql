-- 1. consumed_ad_slots: enforce immutability at the privilege level (audit trail)
REVOKE UPDATE, DELETE ON public.consumed_ad_slots FROM authenticated, anon;
REVOKE ALL ON public.consumed_ad_slots FROM anon;

-- 2. email_campaign_recipients: stop broadcasting full old-row payloads over Realtime
ALTER TABLE public.email_campaign_recipients REPLICA IDENTITY DEFAULT;
REVOKE ALL ON public.email_campaign_recipients FROM anon;

-- 3. reports: no anonymous access; realtime payloads remain RLS-scoped to owner/admin
REVOKE ALL ON public.reports FROM anon;