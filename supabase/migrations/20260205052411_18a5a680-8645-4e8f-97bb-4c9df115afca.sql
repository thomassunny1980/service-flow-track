-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.inventory_staff_view;

CREATE VIEW public.inventory_staff_view 
WITH (security_invoker = true)
AS
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