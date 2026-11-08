-- A phone number is required from both parties of a contract.
-- It lives with the private contract details (not on the public profile).
ALTER TABLE public.contract_profiles
  ADD COLUMN IF NOT EXISTS phone text CHECK (phone IS NULL OR char_length(phone) <= 30);

-- Phone of a contract party: contract details first, then the account phone
CREATE OR REPLACE FUNCTION public.contract_phone_of(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(btrim(c.phone), '') FROM public.contract_profiles c WHERE c.user_id = _user_id),
    (SELECT NULLIF(btrim(p.phone), '') FROM public.profiles p WHERE p.id = _user_id)
  );
$$;
REVOKE ALL ON FUNCTION public.contract_phone_of(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contract_phone_of(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.contract_party_snapshot(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
        'entity_type', c.entity_type,
        'legal_name', c.legal_name,
        'cui', c.cui,
        'reg_com', c.reg_com,
        'address', c.address,
        'city', c.city,
        'county', c.county,
        'country', c.country,
        'representative', c.representative,
        'vat_payer', c.vat_payer,
        'iban', c.iban,
        'bank', c.bank,
        'stage_name', p.stage_name,
        'email', p.email,
        'phone', COALESCE(NULLIF(btrim(c.phone), ''), p.phone),
        'complete', NULLIF(btrim(c.address), '') IS NOT NULL)
     FROM public.contract_profiles c
     JOIN public.profiles p ON p.id = c.user_id
     WHERE c.user_id = _user_id),
    (SELECT jsonb_build_object(
        'entity_type', 'individual',
        'legal_name', NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
        'stage_name', p.stage_name,
        'city', p.county,
        'country', p.country,
        'email', p.email,
        'phone', p.phone,
        'vat_payer', false,
        'complete', false)
     FROM public.profiles p
     WHERE p.id = _user_id)
  );
$$;
REVOKE ALL ON FUNCTION public.contract_party_snapshot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contract_party_snapshot(uuid) TO service_role;

-- Sending an offer needs the artist's phone; accepting it needs the organizer's phone
CREATE OR REPLACE FUNCTION public.require_contract_phones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'offered'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'offered' OR NEW.offer_sent_at IS DISTINCT FROM OLD.offer_sent_at)
     AND public.contract_phone_of(NEW.profile_id) IS NULL THEN
    RAISE EXCEPTION 'CONTRACT_PHONE_REQUIRED';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'offered'
     AND NEW.requester_user_id IS NOT NULL
     AND public.contract_phone_of(NEW.requester_user_id) IS NULL THEN
    RAISE EXCEPTION 'CONTRACT_PHONE_REQUIRED';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_contract_phones ON public.booking_requests;
CREATE TRIGGER require_contract_phones
  BEFORE INSERT OR UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.require_contract_phones();
