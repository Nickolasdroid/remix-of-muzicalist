-- Notify on announcement like
CREATE OR REPLACE FUNCTION public.notify_on_new_announcement_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_liker_name text;
BEGIN
  SELECT profile_id INTO v_owner_id FROM public.announcements WHERE id = NEW.announcement_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT stage_name INTO v_liker_name FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    v_owner_id,
    'like',
    'New Like',
    COALESCE(v_liker_name, 'Someone') || ' liked your announcement',
    NEW.announcement_id,
    'announcement',
    NEW.user_id,
    v_liker_name
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_announcement_like ON public.announcement_likes;
CREATE TRIGGER on_new_announcement_like
AFTER INSERT ON public.announcement_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_announcement_like();

-- Notify on new comment (on post or announcement)
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_ref_type text;
  v_ref_id uuid;
  v_commenter_name text;
  v_target text;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    SELECT profile_id INTO v_owner_id FROM public.posts WHERE id = NEW.post_id;
    v_ref_type := 'post';
    v_ref_id := NEW.post_id;
    v_target := 'post';
  ELSIF NEW.announcement_id IS NOT NULL THEN
    SELECT profile_id INTO v_owner_id FROM public.announcements WHERE id = NEW.announcement_id;
    v_ref_type := 'announcement';
    v_ref_id := NEW.announcement_id;
    v_target := 'announcement';
  ELSE
    RETURN NEW;
  END IF;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT stage_name INTO v_commenter_name FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    v_owner_id,
    'comment',
    'New Comment',
    COALESCE(v_commenter_name, 'Someone') || ' commented on your ' || v_target,
    v_ref_id,
    v_ref_type,
    NEW.user_id,
    v_commenter_name
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_comment();

-- Notify on comment like
CREATE OR REPLACE FUNCTION public.notify_on_new_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_liker_name text;
  v_ref_type text;
  v_ref_id uuid;
  v_post_id uuid;
  v_announcement_id uuid;
BEGIN
  SELECT user_id, post_id, announcement_id INTO v_owner_id, v_post_id, v_announcement_id
  FROM public.comments WHERE id = NEW.comment_id;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF v_post_id IS NOT NULL THEN
    v_ref_type := 'post';
    v_ref_id := v_post_id;
  ELSIF v_announcement_id IS NOT NULL THEN
    v_ref_type := 'announcement';
    v_ref_id := v_announcement_id;
  ELSE
    v_ref_type := 'comment';
    v_ref_id := NEW.comment_id;
  END IF;

  SELECT stage_name INTO v_liker_name FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    v_owner_id,
    'like',
    'New Like',
    COALESCE(v_liker_name, 'Someone') || ' liked your comment',
    v_ref_id,
    v_ref_type,
    NEW.user_id,
    v_liker_name
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_comment_like ON public.comment_likes;
CREATE TRIGGER on_new_comment_like
AFTER INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_comment_like();

-- Cleanup notifications when announcement is deleted
CREATE OR REPLACE FUNCTION public.delete_announcement_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE reference_id = OLD.id AND reference_type = 'announcement';
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_delete_announcement ON public.announcements;
CREATE TRIGGER on_delete_announcement
BEFORE DELETE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.delete_announcement_notifications();