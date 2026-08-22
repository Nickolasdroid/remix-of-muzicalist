-- 1. Contact details are never public anymore: only the owner or an admin can read them.
CREATE OR REPLACE FUNCTION public.get_profile_contact(_profile_id uuid)
RETURNS TABLE(email text, phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_allowed boolean := (v_caller IS NOT NULL AND (v_caller = _profile_id OR public.is_admin(v_caller)));
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN v_allowed THEN p.email ELSE NULL END AS email,
    CASE WHEN v_allowed THEN p.phone ELSE NULL END AS phone
  FROM public.profiles p
  WHERE p.id = _profile_id;
END;
$$;

-- 2. Requester contact snapshot on a booking is not directly readable anymore.
REVOKE SELECT (requester_email, requester_phone) ON public.booking_requests FROM anon, authenticated;

-- 3. Booking-scoped contact exchange: only participants of an ACCEPTED booking.
CREATE OR REPLACE FUNCTION public.get_booking_contact(_booking_id uuid)
RETURNS TABLE(email text, phone text, name text, available boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  b RECORD;
BEGIN
  IF v_caller IS NULL THEN
    RETURN;
  END IF;

  SELECT br.id, br.profile_id, br.requester_user_id, br.status,
         br.requester_email, br.requester_name, br.requester_phone
    INTO b
  FROM public.booking_requests br
  WHERE br.id = _booking_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Caller must be a participant of this specific booking.
  IF v_caller <> b.profile_id AND (b.requester_user_id IS NULL OR v_caller <> b.requester_user_id) THEN
    RETURN;
  END IF;

  -- Access is granted only by an accepted (confirmed) booking.
  IF lower(b.status) NOT IN ('accepted', 'confirmed', 'completed') THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false;
    RETURN;
  END IF;

  IF v_caller = b.profile_id THEN
    -- Artist sees the requester's contact details.
    RETURN QUERY SELECT b.requester_email, b.requester_phone, b.requester_name, true;
  ELSE
    -- Requester sees the artist's contact details.
    RETURN QUERY
    SELECT p.email, p.phone, p.stage_name, true
    FROM public.profiles p
    WHERE p.id = b.profile_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booking_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_contact(uuid) TO authenticated, service_role;