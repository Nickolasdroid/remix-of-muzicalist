CREATE TABLE public.pricing_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0 AND amount <= 9999999),
  currency TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_entries_profile ON public.pricing_entries(profile_id);

ALTER TABLE public.pricing_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing entries"
ON public.pricing_entries FOR SELECT
USING (true);

CREATE POLICY "Users can create their own pricing entries"
ON public.pricing_entries FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own pricing entries"
ON public.pricing_entries FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own pricing entries"
ON public.pricing_entries FOR DELETE
USING (auth.uid() = profile_id);

CREATE TRIGGER update_pricing_entries_updated_at
BEFORE UPDATE ON public.pricing_entries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();