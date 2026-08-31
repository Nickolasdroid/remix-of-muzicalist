CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_unique UNIQUE (blocker_user_id, blocked_user_id),
  CONSTRAINT user_blocks_no_self CHECK (blocker_user_id <> blocked_user_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blocks involving them"
ON public.user_blocks FOR SELECT TO authenticated
USING (auth.uid() = blocker_user_id OR auth.uid() = blocked_user_id);

CREATE POLICY "Users can create their own blocks"
ON public.user_blocks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = blocker_user_id AND blocker_user_id <> blocked_user_id);

CREATE POLICY "Users can remove their own blocks"
ON public.user_blocks FOR DELETE TO authenticated
USING (auth.uid() = blocker_user_id);

CREATE INDEX idx_user_blocks_blocker ON public.user_blocks(blocker_user_id);
CREATE INDEX idx_user_blocks_blocked ON public.user_blocks(blocked_user_id);

CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_user_id = _a AND blocked_user_id = _b)
       OR (blocker_user_id = _b AND blocked_user_id = _a)
  )
$$;

REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_block_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_blocked_between(NEW.follower_id, NEW.artist_id) THEN
    RAISE EXCEPTION 'Interaction not allowed between blocked users';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_block_on_follow_trg
BEFORE INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.enforce_block_on_follow();

CREATE OR REPLACE FUNCTION public.enforce_block_on_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_blocked_between(NEW.artist_id, NEW.participant_id) THEN
    RAISE EXCEPTION 'Interaction not allowed between blocked users';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_block_on_conversation_trg
BEFORE INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.enforce_block_on_conversation();

CREATE OR REPLACE FUNCTION public.enforce_block_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a uuid;
  p uuid;
BEGIN
  SELECT c.artist_id, c.participant_id INTO a, p
  FROM public.conversations c WHERE c.id = NEW.conversation_id;

  IF a IS NOT NULL AND public.is_blocked_between(a, p) THEN
    RAISE EXCEPTION 'Interaction not allowed between blocked users';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_block_on_message_trg
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_block_on_message();