-- Fix 1: Create a staff-safe view for inventory that excludes purchase_rate
CREATE VIEW public.inventory_staff_view AS
SELECT 
  id,
  item_name,
  item_code,
  description,
  sale_rate,
  quantity,
  min_stock_level,
  unit,
  created_at,
  updated_at,
  created_by
FROM public.inventory;

-- Grant access to the view
GRANT SELECT ON public.inventory_staff_view TO authenticated;

-- Fix 2: Update the update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;