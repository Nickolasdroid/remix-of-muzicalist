
-- 1. Profiles: revoke direct column SELECT for sensitive fields
REVOKE SELECT (email, phone, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, billing) ON public.profiles FROM anon, authenticated;

-- subscription_cancel_at_period_end may or may not exist; revoke conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_cancel_at_period_end') THEN
    EXECUTE 'REVOKE SELECT (subscription_cancel_at_period_end) ON public.profiles FROM anon, authenticated';
  END IF;
END$$;

-- 2. Reviews: hide reviewer_email column from public reads
REVOKE SELECT (reviewer_email) ON public.reviews FROM anon, authenticated;

-- 3. Calendar events: hide private notes column from public reads
REVOKE SELECT (notes) ON public.calendar_events FROM anon, authenticated;

-- 4. user_roles: remove client-side self-insert policy (roles assigned by handle_new_user trigger only)
DROP POLICY IF EXISTS "Users can insert their own non-admin role" ON public.user_roles;

-- 5. consumed_ad_slots: scope INSERT policy to authenticated only
DROP POLICY IF EXISTS "Users can insert their own consumed slots" ON public.consumed_ad_slots;
CREATE POLICY "Users can insert their own consumed slots"
  ON public.consumed_ad_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- 6. pending_artist_registrations: explicit admin-only SELECT (document intent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='pending_artist_registrations') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view pending registrations" ON public.pending_artist_registrations';
    EXECUTE 'CREATE POLICY "Admins can view pending registrations" ON public.pending_artist_registrations FOR SELECT TO authenticated USING (public.is_admin(auth.uid()))';
  END IF;
END$$;

-- 7. booking_requests: requester self-read
DROP POLICY IF EXISTS "Requesters can view their own booking requests" ON public.booking_requests;
CREATE POLICY "Requesters can view their own booking requests"
  ON public.booking_requests
  FOR SELECT
  TO authenticated
  USING (requester_user_id IS NOT NULL AND auth.uid() = requester_user_id);

-- 8. Realtime: restrict broadcast/presence to user-scoped topics matching their auth.uid()
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can use own uid topic" ON realtime.messages';
    EXECUTE $POLICY$
      CREATE POLICY "Authenticated users can use own uid topic"
        ON realtime.messages
        FOR SELECT
        TO authenticated
        USING (
          (realtime.topic() = auth.uid()::text)
          OR (realtime.topic() LIKE 'user-' || auth.uid()::text || '%')
        )
    $POLICY$;
  END IF;
END$$;
