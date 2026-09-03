REVOKE ALL ON FUNCTION public.record_content_creation_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consumed_creation_slots(uuid, text) FROM PUBLIC, anon, authenticated;