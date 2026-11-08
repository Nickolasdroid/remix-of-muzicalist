CREATE OR REPLACE FUNCTION public.booking_day_time_range(_start text, _end text, _idx integer, _total integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _start IS NULL OR _end IS NULL THEN NULL
    WHEN COALESCE(_total, 1) <= 1 THEN _start || ' - ' || _end
    WHEN _idx = 1 THEN _start || ' - 23:59'
    WHEN _idx = _total THEN '00:00 - ' || _end
    ELSE '00:00 - 23:59'
  END;
$$;

GRANT EXECUTE ON FUNCTION public.booking_day_time_range(text, text, integer, integer) TO authenticated, service_role;