-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view post likes"
ON public.post_likes
FOR SELECT
USING (true);

-- Authenticated users can like posts
CREATE POLICY "Authenticated users can like posts"
ON public.post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can unlike posts"
ON public.post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to notify on new review
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    NEW.profile_id,
    'review',
    'New Review',
    NEW.reviewer_name || ' left you a ' || NEW.rating || '-star review',
    NEW.id,
    'review',
    NEW.reviewer_user_id,
    NEW.reviewer_name
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new reviews
CREATE TRIGGER on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_review();

-- Create function to notify on new booking request
CREATE OR REPLACE FUNCTION public.notify_on_new_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_name)
  VALUES (
    NEW.profile_id,
    'booking_request',
    'New Booking Request',
    NEW.requester_name || ' sent you a booking request for ' || NEW.event_date,
    NEW.id,
    'booking_request',
    NEW.requester_name
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new booking requests
CREATE TRIGGER on_new_booking_request
AFTER INSERT ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_booking_request();

-- Create function to notify on new post like
CREATE OR REPLACE FUNCTION public.notify_on_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id uuid;
  v_liker_name text;
BEGIN
  -- Get the post owner
  SELECT profile_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the liker's name
  SELECT stage_name INTO v_liker_name FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type, actor_id, actor_name)
  VALUES (
    v_post_owner_id,
    'like',
    'New Like',
    COALESCE(v_liker_name, 'Someone') || ' liked your post',
    NEW.post_id,
    'post',
    NEW.user_id,
    v_liker_name
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new post likes
CREATE TRIGGER on_new_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_like();

-- Enable realtime for post_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;