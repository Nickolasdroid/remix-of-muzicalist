-- Add columns to track soft deletion per user
ALTER TABLE public.conversations 
ADD COLUMN deleted_by_artist boolean NOT NULL DEFAULT false,
ADD COLUMN deleted_by_participant boolean NOT NULL DEFAULT false;

-- Update the SELECT policy to exclude conversations deleted by the viewing user
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" 
ON public.conversations 
FOR SELECT 
USING (
  (auth.uid() = artist_id AND deleted_by_artist = false) OR 
  (auth.uid() = participant_id AND deleted_by_participant = false)
);

-- Add UPDATE policy for soft delete
CREATE POLICY "Users can update their conversations" 
ON public.conversations 
FOR UPDATE 
USING ((auth.uid() = artist_id) OR (auth.uid() = participant_id))
WITH CHECK ((auth.uid() = artist_id) OR (auth.uid() = participant_id));