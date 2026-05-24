
-- 1. Tighten booking_requests INSERT: require auth + match requester_user_id
DROP POLICY IF EXISTS "Anyone can create booking requests" ON public.booking_requests;
CREATE POLICY "Authenticated users can create booking requests"
ON public.booking_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_user_id);

-- 2. Restrict reviewer_email column reads (only writable on insert; not needed client-side)
REVOKE SELECT (reviewer_email) ON public.reviews FROM anon, authenticated;

-- 3. Restrict Stripe identifiers from client roles (only used by edge functions / service_role)
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.profiles FROM anon, authenticated;

-- 4. Validate consumed_ad_slots inserts via trigger:
--    - profile_id must equal auth.uid()
--    - if announcement_id is provided, it must belong to the same profile
CREATE OR REPLACE FUNCTION public.validate_consumed_ad_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.profile_id THEN
    RAISE EXCEPTION 'Not authorized to insert ad slot for this profile';
  END IF;

  IF NEW.announcement_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.announcements
      WHERE id = NEW.announcement_id AND profile_id = NEW.profile_id
    ) THEN
      RAISE EXCEPTION 'Announcement does not exist or does not belong to this profile';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_consumed_ad_slot_trigger ON public.consumed_ad_slots;
CREATE TRIGGER validate_consumed_ad_slot_trigger
BEFORE INSERT ON public.consumed_ad_slots
FOR EACH ROW EXECUTE FUNCTION public.validate_consumed_ad_slot();
