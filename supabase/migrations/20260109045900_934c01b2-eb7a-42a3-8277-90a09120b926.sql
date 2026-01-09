-- Add tax_rates column to shop_settings
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS tax_rates jsonb DEFAULT '[{"name": "GST 18%", "rate": 18}, {"name": "GST 12%", "rate": 12}, {"name": "GST 5%", "rate": 5}, {"name": "No Tax", "rate": 0}]'::jsonb;