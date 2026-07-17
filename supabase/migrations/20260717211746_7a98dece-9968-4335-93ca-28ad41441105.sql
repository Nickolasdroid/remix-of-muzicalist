DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_campaigns;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_campaign_recipients;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
ALTER TABLE public.email_campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.email_campaign_recipients REPLICA IDENTITY FULL;