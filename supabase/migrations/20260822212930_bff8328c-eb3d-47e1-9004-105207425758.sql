REVOKE ALL ON FUNCTION public.promote_announcement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_announcement(uuid) TO authenticated;