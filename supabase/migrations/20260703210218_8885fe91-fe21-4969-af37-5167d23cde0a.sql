
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
DROP POLICY IF EXISTS "Update messages in own conversations" ON public.messages;

CREATE POLICY "Senders can update own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Profile owners can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Artists can delete reviews on their profile" ON public.reviews;
DROP POLICY IF EXISTS "Owners can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Delete reviews" ON public.reviews;

CREATE POLICY "Reviewers or admins can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid() = reviewer_user_id OR public.is_admin(auth.uid()));
