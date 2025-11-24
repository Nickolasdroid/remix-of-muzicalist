-- Add bio, pricing, and social media columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN estimated_price TEXT,
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT,
ADD COLUMN youtube_url TEXT,
ADD COLUMN tiktok_url TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.profiles.bio IS 'Artist biography/description';
COMMENT ON COLUMN public.profiles.estimated_price IS 'Estimated price range for services';
COMMENT ON COLUMN public.profiles.facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN public.profiles.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN public.profiles.youtube_url IS 'YouTube channel URL';
COMMENT ON COLUMN public.profiles.tiktok_url IS 'TikTok profile URL';