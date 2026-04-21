CREATE TABLE public.announcement_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT announcement_likes_announcement_user_unique UNIQUE (announcement_id, user_id)
);

ALTER TABLE public.announcement_likes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_announcement_likes_announcement_id ON public.announcement_likes (announcement_id);
CREATE INDEX idx_announcement_likes_user_id ON public.announcement_likes (user_id);

CREATE POLICY "Anyone can view announcement likes"
ON public.announcement_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like announcements"
ON public.announcement_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike announcements"
ON public.announcement_likes
FOR DELETE
USING (auth.uid() = user_id);