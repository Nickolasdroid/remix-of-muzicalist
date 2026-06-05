DROP TABLE IF EXISTS public.invoices CASCADE;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS billing_entity_type,
  DROP COLUMN IF EXISTS billing_name,
  DROP COLUMN IF EXISTS billing_cui,
  DROP COLUMN IF EXISTS billing_reg_com,
  DROP COLUMN IF EXISTS billing_address,
  DROP COLUMN IF EXISTS billing_city,
  DROP COLUMN IF EXISTS billing_county,
  DROP COLUMN IF EXISTS billing_country,
  DROP COLUMN IF EXISTS billing_vat_payer;