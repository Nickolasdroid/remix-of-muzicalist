CREATE POLICY "Artists can remove their followers"
ON public.followers
FOR DELETE
USING (auth.uid() = artist_id);