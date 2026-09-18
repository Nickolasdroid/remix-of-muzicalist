CREATE OR REPLACE FUNCTION public.set_authenticated_review_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_id uuid := auth.uid();
  reviewer_profile public.profiles%ROWTYPE;
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

  SELECT *
  INTO reviewer_profile
  FROM public.profiles
  WHERE id = reviewer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reviewer profile not found';
  END IF;

  NEW.reviewer_user_id := reviewer_id;
  NEW.reviewer_name := trim(concat_ws(' ', reviewer_profile.first_name, reviewer_profile.last_name));
  NEW.reviewer_email := reviewer_profile.email;
  NEW.comment := NULLIF(trim(NEW.comment), '');

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_authenticated_review_identity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_authenticated_review_identity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_authenticated_review_identity() TO service_role;

DROP TRIGGER IF EXISTS set_authenticated_review_identity_trg ON public.reviews;
CREATE TRIGGER set_authenticated_review_identity_trg
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_authenticated_review_identity();

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_user_id
  AND auth.uid() <> profile_id
  AND public.is_account_active(auth.uid())
);