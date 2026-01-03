-- Fix soft-delete update failing due to WITH CHECK evaluation
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING ((auth.uid() = artist_id) OR (auth.uid() = participant_id))
WITH CHECK (true);