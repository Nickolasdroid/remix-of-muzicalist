-- Remove broad column read access on reviews, then re-grant every column EXCEPT reviewer_email
REVOKE SELECT ON public.reviews FROM anon, authenticated;

GRANT SELECT (id, profile_id, reviewer_name, rating, comment, created_at, reviewer_user_id)
  ON public.reviews TO anon, authenticated;

GRANT ALL ON public.reviews TO service_role;
