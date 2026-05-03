-- Revoke access to sensitive contact columns from anonymous visitors
REVOKE SELECT (email, phone) ON public.profiles FROM anon;

-- Keep authenticated access intact (explicit grant for clarity/idempotency)
GRANT SELECT ON public.profiles TO authenticated;