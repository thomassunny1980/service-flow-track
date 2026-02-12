
-- Add payment_mode column to invoices table
ALTER TABLE public.invoices ADD COLUMN payment_mode text DEFAULT 'cash';

-- Add payment_mode column to products table (for service payment tracking)
ALTER TABLE public.products ADD COLUMN payment_mode text DEFAULT 'cash';
