-- profiles uses column-level SELECT grants: the app must be able to read
-- account_type_chosen to show the welcome screen after a Google sign-up.
GRANT SELECT (account_type_chosen) ON public.profiles TO authenticated;
