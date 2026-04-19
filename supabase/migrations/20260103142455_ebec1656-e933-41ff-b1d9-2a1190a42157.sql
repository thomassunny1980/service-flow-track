-- Fix function search path for cleanup_expired_quotations
DROP FUNCTION IF EXISTS public.cleanup_expired_quotations();

CREATE OR REPLACE FUNCTION public.cleanup_expired_quotations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.quotations
  WHERE status = 'pending'
    AND validity_date < CURRENT_DATE;
END;
$$;