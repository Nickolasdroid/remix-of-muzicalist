
CREATE OR REPLACE FUNCTION public.notify_on_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_follower_name text;
BEGIN
  -- Get follower's name (try profiles first, fall back to user_roles check)
  SELECT stage_name INTO v_follower_name FROM public.profiles WHERE id = NEW.follower_id;
  
  -- Don't notify if following yourself
  IF NEW.artist_id = NEW.follower_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    NEW.artist_id,
    'follow',
    'New Follower',
    COALESCE(v_follower_name, 'Someone') || ' started following you',
    NEW.id,
    'follower',
    NEW.follower_id,
    v_follower_name
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_follower();
