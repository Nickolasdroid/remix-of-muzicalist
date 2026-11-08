ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS advance_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS advance_due_date date,
  ADD COLUMN IF NOT EXISTS advance_received_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_offer_advance(_booking_id uuid DEFAULT NULL, _announcement_id uuid DEFAULT NULL, _amount numeric DEFAULT NULL, _due_date date DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); b public.booking_requests%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _booking_id IS NOT NULL THEN
    SELECT * INTO b FROM public.booking_requests WHERE id = _booking_id FOR UPDATE;
  ELSE
    SELECT * INTO b FROM public.booking_requests WHERE announcement_id = _announcement_id AND profile_id = uid
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  END IF;
  IF NOT FOUND OR b.profile_id <> uid THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND'; END IF;
  IF b.status <> 'offered' THEN RAISE EXCEPTION 'BOOKING_NO_OPEN_OFFER'; END IF;
  IF _amount IS NOT NULL THEN
    IF _amount <= 0 OR _amount > COALESCE(b.offer_price, 0) THEN RAISE EXCEPTION 'ADVANCE_INVALID_AMOUNT'; END IF;
    IF _due_date IS NULL OR _due_date < CURRENT_DATE OR _due_date > b.event_date THEN RAISE EXCEPTION 'ADVANCE_INVALID_DATE'; END IF;
  END IF;
  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests
  SET advance_amount = CASE WHEN _amount IS NULL THEN NULL ELSE round(_amount, 2) END,
      advance_due_date = CASE WHEN _amount IS NULL THEN NULL ELSE _due_date END,
      advance_received_at = NULL
  WHERE id = b.id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);
END;
$$;
REVOKE ALL ON FUNCTION public.set_offer_advance(uuid, uuid, numeric, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_offer_advance(uuid, uuid, numeric, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_advance_received(_booking_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); b public.booking_requests%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO b FROM public.booking_requests WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR b.profile_id <> uid THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND'; END IF;
  IF b.status <> 'accepted' OR b.advance_amount IS NULL THEN RAISE EXCEPTION 'ADVANCE_NOT_DUE'; END IF;
  PERFORM set_config('muzicalist.booking_rpc', 'on', true);
  UPDATE public.booking_requests SET advance_received_at = now() WHERE id = b.id;
  PERFORM set_config('muzicalist.booking_rpc', 'off', true);
END;
$$;
REVOKE ALL ON FUNCTION public.mark_advance_received(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_advance_received(uuid) TO authenticated;