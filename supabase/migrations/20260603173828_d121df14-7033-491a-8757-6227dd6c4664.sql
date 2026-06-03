
-- 1) Billing fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_entity_type text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS billing_name text,
  ADD COLUMN IF NOT EXISTS billing_cui text,
  ADD COLUMN IF NOT EXISTS billing_reg_com text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_county text,
  ADD COLUMN IF NOT EXISTS billing_country text DEFAULT 'Romania',
  ADD COLUMN IF NOT EXISTS billing_vat_payer boolean NOT NULL DEFAULT false;

-- 2) Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  stripe_event_id text NOT NULL UNIQUE,
  stripe_invoice_id text,
  stripe_subscription_id text,
  smartbill_series text,
  smartbill_number text,
  smartbill_url text,
  amount numeric,
  currency text,
  status text NOT NULL DEFAULT 'issued',
  error_message text,
  issued_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update invoices"
  ON public.invoices FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS invoices_profile_id_idx ON public.invoices(profile_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
