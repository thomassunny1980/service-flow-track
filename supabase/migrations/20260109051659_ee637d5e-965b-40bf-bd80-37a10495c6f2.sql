-- Add quotation numbering fields to shop_settings
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS quotation_prefix TEXT DEFAULT 'QT',
ADD COLUMN IF NOT EXISTS quotation_year_format TEXT DEFAULT 'YYYY',
ADD COLUMN IF NOT EXISTS quotation_number_digits INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS last_quotation_number INTEGER DEFAULT 0;

-- Add quotation_number column to quotations table
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS quotation_number TEXT;