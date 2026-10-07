-- =====================================================================
-- Stories: 24h image stories shown at the top of the feed.
-- Publishing is limited to artists on the Standard or Premium plan.
-- Views are stored per user so the ring disappears on every device and
-- the author can see how many people viewed each story.
-- =====================================================================

-- 1) Stories --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS stories_active_idx
  ON public.stories (expires_at DESC, profile_id);
CREATE INDEX IF NOT EXISTS stories_profile_idx
  ON public.stories (profile_id, created_at);

GRANT SELECT ON public.stories TO anon;
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Everyone (guests included) sees active stories; authors always see their own.
DROP POLICY IF EXISTS "Active stories are public" ON public.stories;
CREATE POLICY "Active stories are public"
  ON public.stories FOR SELECT
  TO anon, authenticated
  USING (expires_at > now() OR profile_id = auth.uid());

-- Only artists with an effective Standard/Premium plan may publish.
DROP POLICY IF EXISTS "Paid artists can publish stories" ON public.stories;
CREATE POLICY "Paid artists can publish stories"
  ON public.stories FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND public.effective_plan(auth.uid()) IN ('Standard', 'Premium')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.specialization IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Authors and admins can delete stories" ON public.stories;
CREATE POLICY "Authors and admins can delete stories"
  ON public.stories FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

-- Server-controlled lifetime: clients cannot extend a story past 24h.
CREATE OR REPLACE FUNCTION public.stories_set_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.created_at := now();
  NEW.expires_at := now() + interval '24 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stories_set_expiry ON public.stories;
CREATE TRIGGER stories_set_expiry
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stories_set_expiry();

-- 2) Story views -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS story_views_viewer_idx
  ON public.story_views (viewer_id);

GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users record their own story views" ON public.story_views;
CREATE POLICY "Users record their own story views"
  ON public.story_views FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

-- Viewers see their own rows; authors see who viewed their stories.
DROP POLICY IF EXISTS "Viewers and authors can read story views" ON public.story_views;
CREATE POLICY "Viewers and authors can read story views"
  ON public.story_views FOR SELECT
  TO authenticated
  USING (
    viewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_views.story_id AND s.profile_id = auth.uid()
    )
  );

-- 3) Storage bucket policies (bucket itself created via the storage tool) -----
DROP POLICY IF EXISTS "Story images are public" ON storage.objects;
CREATE POLICY "Story images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Users upload story images to own folder" ON storage.objects;
CREATE POLICY "Users upload story images to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'stories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own story images" ON storage.objects;
CREATE POLICY "Users delete own story images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'stories'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );