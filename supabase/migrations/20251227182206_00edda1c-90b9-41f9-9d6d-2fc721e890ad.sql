-- Add reviewer_user_id column to reviews table to track who created the review
ALTER TABLE public.reviews ADD COLUMN reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create policy for artists to delete reviews on their profile
CREATE POLICY "Artists can delete reviews on their profile" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = profile_id);

-- Create policy for reviewers to delete their own reviews
CREATE POLICY "Reviewers can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = reviewer_user_id);