CREATE OR REPLACE FUNCTION public.cleanup_expired_quotations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep expired quotations so they remain visible for review, renewal, editing, and recreation.
  RETURN;
END;
$$;