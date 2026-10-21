ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS booking_request_id uuid
    REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified_booking boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_request_id_key
  ON public.reviews (booking_request_id)
  WHERE booking_request_id IS NOT NULL;

GRANT SELECT (is_verified_booking) ON public.reviews TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.find_reviewable_booking(_profile_id uuid, _user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id
  FROM public.booking_requests b
  WHERE b.profile_id = _profile_id
    AND b.requester_user_id = _user_id
    AND b.status = 'accepted'
    AND COALESCE(b.event_end_date, b.event_date) < CURRENT_DATE
    AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.booking_request_id = b.id)
  ORDER BY COALESCE(b.event_end_date, b.event_date) DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_reviewable_booking(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_reviewable_booking(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.set_authenticated_review_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_id uuid := auth.uid();
  reviewer_profile public.profiles%ROWTYPE;
  v_booking uuid;
BEGIN
  IF reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit a review';
  END IF;
  IF NEW.profile_id = reviewer_id THEN
    RAISE EXCEPTION 'You cannot review your own profile';
  END IF;
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.comment IS NOT NULL AND char_length(NEW.comment) > 100 THEN
    RAISE EXCEPTION 'Review text must be 100 characters or fewer';
  END IF;

  SELECT * INTO reviewer_profile FROM public.profiles WHERE id = reviewer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reviewer profile not found';
  END IF;

  v_booking := public.find_reviewable_booking(NEW.profile_id, reviewer_id);
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'REVIEW_REQUIRES_COMPLETED_BOOKING';
  END IF;

  NEW.reviewer_user_id := reviewer_id;
  NEW.reviewer_name := trim(concat_ws(' ', reviewer_profile.first_name, reviewer_profile.last_name));
  NEW.reviewer_email := reviewer_profile.email;
  NEW.comment := NULLIF(trim(NEW.comment), '');
  NEW.booking_request_id := v_booking;
  NEW.is_verified_booking := true;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_review_artist(_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN 'login'; END IF;
  IF uid = _profile_id THEN RETURN 'own_profile'; END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE profile_id = _profile_id AND reviewer_user_id = uid) THEN
    RETURN 'already_reviewed';
  END IF;
  IF public.find_reviewable_booking(_profile_id, uid) IS NULL THEN
    RETURN 'no_completed_booking';
  END IF;
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.can_review_artist(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_review_artist(uuid) TO authenticated, service_role;

UPDATE public.reviews r
SET booking_request_id = m.booking_id,
    is_verified_booking = true
FROM (
  SELECT DISTINCT ON (r2.id) r2.id AS review_id, b.id AS booking_id
  FROM public.reviews r2
  JOIN public.booking_requests b
    ON b.profile_id = r2.profile_id
   AND b.requester_user_id = r2.reviewer_user_id
   AND b.status = 'accepted'
   AND COALESCE(b.event_end_date, b.event_date) < CURRENT_DATE
  WHERE r2.booking_request_id IS NULL
  ORDER BY r2.id, COALESCE(b.event_end_date, b.event_date) DESC
) m
WHERE r.id = m.review_id
  AND NOT EXISTS (SELECT 1 FROM public.reviews x WHERE x.booking_request_id = m.booking_id);