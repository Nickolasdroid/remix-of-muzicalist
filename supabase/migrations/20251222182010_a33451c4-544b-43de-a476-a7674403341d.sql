-- First, delete duplicate conversations (keeping oldest based on created_at)
DELETE FROM conversations 
WHERE id IN (
  SELECT c2.id 
  FROM conversations c1
  JOIN conversations c2 ON 
    LEAST(c1.artist_id, c1.participant_id) = LEAST(c2.artist_id, c2.participant_id)
    AND GREATEST(c1.artist_id, c1.participant_id) = GREATEST(c2.artist_id, c2.participant_id)
    AND c1.id != c2.id
    AND c1.created_at < c2.created_at
);

-- Add unique constraint on ordered user pair to prevent future duplicates
CREATE UNIQUE INDEX unique_conversation_pair 
ON conversations (LEAST(artist_id, participant_id), GREATEST(artist_id, participant_id));