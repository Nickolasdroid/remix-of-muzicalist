-- Re-apply column-level REVOKEs on sensitive profile columns. The prior
-- table-wide GRANT (used to restore Data API access) implicitly re-granted
-- column-level SELECT on every column. Restrict the sensitive columns again
-- so anon/authenticated cannot read them via direct PostgREST queries.
-- Owners and admins continue to read these through the SECURITY DEFINER
-- RPCs get_my_full_profile() and get_profile_contact().

REVOKE SELECT (email, phone, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end, billing) ON public.profiles FROM anon, authenticated;