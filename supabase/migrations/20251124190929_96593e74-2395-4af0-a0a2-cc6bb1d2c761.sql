-- Add is_premium field to announcements table
ALTER TABLE announcements ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;