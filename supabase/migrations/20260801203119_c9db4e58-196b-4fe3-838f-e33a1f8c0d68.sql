DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_user_id
  AND auth.uid() <> profile_id
  AND is_account_active(auth.uid())
);