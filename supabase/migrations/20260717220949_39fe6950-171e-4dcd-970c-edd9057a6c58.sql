
-- Add moderator to user_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='user_type' AND e.enumlabel='moderator') THEN
    ALTER TYPE public.user_type ADD VALUE 'moderator';
  END IF;
END$$;
