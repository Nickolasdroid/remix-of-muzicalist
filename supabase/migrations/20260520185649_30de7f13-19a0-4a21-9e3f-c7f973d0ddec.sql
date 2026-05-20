
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NULL,
  announcement_id UUID NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT comments_target_check CHECK (
    (post_id IS NOT NULL AND announcement_id IS NULL) OR
    (post_id IS NULL AND announcement_id IS NOT NULL)
  )
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_comments_announcement_id ON public.comments(announcement_id) WHERE announcement_id IS NOT NULL;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.comments FOR DELETE
USING (is_admin(auth.uid()));
