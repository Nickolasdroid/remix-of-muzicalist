-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id, participant_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies: participants can view their conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = artist_id OR auth.uid() = participant_id);

-- Users can create conversations with artists (not themselves)
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  auth.uid() = participant_id 
  AND auth.uid() != artist_id
);

-- Messages policies: participants can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.artist_id = auth.uid() OR c.participant_id = auth.uid())
  )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.artist_id = auth.uid() OR c.participant_id = auth.uid())
  )
);

-- Users can update their own messages (for read receipts)
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.artist_id = auth.uid() OR c.participant_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add trigger for updated_at on conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();