-- Replace "everyone sees every row" read rules with rules that keep public
-- content public but hide content from suspended accounts (owners and admins
-- still see their own / all rows).

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Active profiles are public; owners and admins see all"
ON public.profiles FOR SELECT TO anon, authenticated
USING (
  is_active
  OR id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
);

-- posts
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Posts from active accounts are public; owners and admins see all"
ON public.posts FOR SELECT TO anon, authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(profile_id)
);

-- announcements
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
CREATE POLICY "Announcements from active accounts are public; owners and admins see all"
ON public.announcements FOR SELECT TO anon, authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(profile_id)
);

-- comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Comments from active accounts are public; authors and admins see all"
ON public.comments FOR SELECT TO anon, authenticated
USING (
  user_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(user_id)
);

-- post_likes
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
CREATE POLICY "Post likes from active accounts are public; owners and admins see all"
ON public.post_likes FOR SELECT TO anon, authenticated
USING (
  user_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(user_id)
);

-- comment_likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
CREATE POLICY "Comment likes from active accounts are public; owners and admins see all"
ON public.comment_likes FOR SELECT TO anon, authenticated
USING (
  user_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(user_id)
);

-- announcement_likes
DROP POLICY IF EXISTS "Anyone can view announcement likes" ON public.announcement_likes;
CREATE POLICY "Announcement likes from active accounts are public; owners and admins see all"
ON public.announcement_likes FOR SELECT TO anon, authenticated
USING (
  user_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(user_id)
);

-- followers
DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
CREATE POLICY "Follows between active accounts are public; participants and admins see all"
ON public.followers FOR SELECT TO anon, authenticated
USING (
  follower_id = (SELECT auth.uid())
  OR artist_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR (public.is_account_active(follower_id) AND public.is_account_active(artist_id))
);

-- post_mentions: visible when the caller can see the post, or is the one mentioned
DROP POLICY IF EXISTS "Mentions are viewable by everyone" ON public.post_mentions;
CREATE POLICY "Mentions follow post visibility"
ON public.post_mentions FOR SELECT TO anon, authenticated
USING (
  mentioned_profile_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_mentions.post_id)
);

-- pricing_entries
DROP POLICY IF EXISTS "Anyone can view pricing entries" ON public.pricing_entries;
CREATE POLICY "Pricing of active accounts is public; owners and admins see all"
ON public.pricing_entries FOR SELECT TO anon, authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(profile_id)
);

-- reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Reviews of active artists are public; participants and admins see all"
ON public.reviews FOR SELECT TO anon, authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR reviewer_user_id = (SELECT auth.uid())
  OR ((SELECT auth.uid()) IS NOT NULL AND public.is_admin((SELECT auth.uid())))
  OR public.is_account_active(profile_id)
);

-- Storage: avatars (public bucket — files are served by public URL without
-- this rule; the rule only governs listing/API reads, so bind it to the owner).
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can read their own avatar files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Storage: covers (private bucket) — owner only.
DROP POLICY IF EXISTS "Covers are publicly viewable" ON storage.objects;
CREATE POLICY "Users can read their own cover files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'covers'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Storage: stories (private bucket) — owner always; others only while the
-- story is still live (so expired or deleted story images can't be fetched).
DROP POLICY IF EXISTS "Story images are public" ON storage.objects;
CREATE POLICY "Story images readable while the story is live"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'stories'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.storage_path = objects.name
        AND s.expires_at > now()
    )
  )
);