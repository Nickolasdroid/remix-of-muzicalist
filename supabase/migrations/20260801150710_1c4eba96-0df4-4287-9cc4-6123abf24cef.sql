DROP POLICY IF EXISTS "Anyone can create booking requests" ON public.booking_requests;

DROP POLICY IF EXISTS "Authenticated users can create booking requests" ON public.booking_requests;
CREATE POLICY "Authenticated users can create booking requests"
ON public.booking_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_user_id IS NOT NULL
  AND auth.uid() = requester_user_id
  AND public.is_account_active(auth.uid())
);