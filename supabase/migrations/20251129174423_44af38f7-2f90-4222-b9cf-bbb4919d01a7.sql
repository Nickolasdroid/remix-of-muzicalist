-- Add media fields to announcements table
ALTER TABLE announcements 
ADD COLUMN media_url text,
ADD COLUMN media_type text;