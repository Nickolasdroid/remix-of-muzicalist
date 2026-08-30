REVOKE ALL ON FUNCTION public.search_mentionable_profiles(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_mention(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_mention_permission() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_mentionable_profiles(text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_mention(uuid, uuid) TO authenticated, service_role;