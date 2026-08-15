ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subject text;