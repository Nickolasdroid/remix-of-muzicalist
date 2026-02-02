-- Create function to delete notifications when a post is deleted
CREATE OR REPLACE FUNCTION public.delete_post_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE reference_id = OLD.id AND reference_type = 'post';
  RETURN OLD;
END;
$$;

-- Create trigger for post deletion
CREATE TRIGGER on_post_delete_notifications
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_post_notifications();

-- Create function to delete notifications when a review is deleted
CREATE OR REPLACE FUNCTION public.delete_review_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE reference_id = OLD.id AND reference_type = 'review';
  RETURN OLD;
END;
$$;

-- Create trigger for review deletion
CREATE TRIGGER on_review_delete_notifications
  BEFORE DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_review_notifications();

-- Create function to delete notifications when a booking request is deleted
CREATE OR REPLACE FUNCTION public.delete_booking_request_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE reference_id = OLD.id AND reference_type = 'booking_request';
  RETURN OLD;
END;
$$;

-- Create trigger for booking request deletion
CREATE TRIGGER on_booking_request_delete_notifications
  BEFORE DELETE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_booking_request_notifications();