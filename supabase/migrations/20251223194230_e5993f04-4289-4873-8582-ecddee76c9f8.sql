-- Add policy to allow users to delete their own conversations
CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
USING ((auth.uid() = artist_id) OR (auth.uid() = participant_id));

-- Add policy to allow deleting messages when conversation is deleted
CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = messages.conversation_id
  AND ((c.artist_id = auth.uid()) OR (c.participant_id = auth.uid()))
));