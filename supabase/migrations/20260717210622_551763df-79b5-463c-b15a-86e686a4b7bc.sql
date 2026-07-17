ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.email_campaign_recipients
ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;