-- Helper to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND user_type = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Admin-wide policies on profiles
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Admin-wide policies on user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any role"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any role"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Admin can see all subscription events
CREATE POLICY "Admins can view all subscription events"
  ON public.subscription_events FOR SELECT
  USING (public.is_admin(auth.uid()));