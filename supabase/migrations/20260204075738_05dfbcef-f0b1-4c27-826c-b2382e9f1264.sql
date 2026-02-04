-- Add columns for tracking financial year sequences and auto-reset option
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS quotation_fy_last_number integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quotation_fy_year text DEFAULT null,
ADD COLUMN IF NOT EXISTS invoice_fy_last_number integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_fy_year text DEFAULT null,
ADD COLUMN IF NOT EXISTS auto_reset_quotation_sequence boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_reset_invoice_sequence boolean DEFAULT true;