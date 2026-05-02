
-- 1) notifications: remove public-anyone INSERT policy. Notifications are created exclusively
-- via SECURITY DEFINER triggers (notify_on_new_*), which bypass RLS, so no client-facing INSERT
-- is required.
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;

-- 2) user_roles: prevent users from self-assigning the 'admin' role.
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can insert their own non-admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND user_type IN ('artist'::public.user_type, 'user'::public.user_type)
);

-- Also prevent users from updating their own role to escalate privileges.
-- (Admins keep their existing "Admins can update any role" policy.)
-- No additional UPDATE policy is added for regular users.

-- 3) reviews: require authentication and tie submission to auth.uid().
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;

CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_user_id
  AND auth.uid() <> profile_id
);
