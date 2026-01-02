-- Drop and recreate the update policy as PERMISSIVE
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Users can update their conversations" 
ON public.conversations 
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING ((auth.uid() = artist_id) OR (auth.uid() = participant_id))
WITH CHECK ((auth.uid() = artist_id) OR (auth.uid() = participant_id));