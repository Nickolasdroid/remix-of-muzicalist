CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

GRANT SELECT ON public.comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes"
ON public.comment_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like comments"
ON public.comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON public.comment_likes FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);