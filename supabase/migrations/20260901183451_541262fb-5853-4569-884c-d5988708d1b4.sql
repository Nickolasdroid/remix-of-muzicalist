REVOKE EXECUTE ON FUNCTION public.enforce_post_quota() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_announcement_quota() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_gallery_quota() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_pricing_quota() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.plan_limit(uuid, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_entitlements() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_entitlements() TO authenticated;