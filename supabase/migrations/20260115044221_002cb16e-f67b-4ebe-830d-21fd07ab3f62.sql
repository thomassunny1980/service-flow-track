-- Add customer address columns to quotations and invoices
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS customer_state text;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_state text;

-- Create customers table for saving customer details
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  address TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Admins can do all operations on customers" 
ON public.customers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view customers" 
ON public.customers 
FOR SELECT 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update customers" 
ON public.customers 
FOR UPDATE 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for automatic timestamp updates on customers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Sync last_quotation_number and last_invoice_number with actual max values
UPDATE public.shop_settings 
SET last_quotation_number = COALESCE((
  SELECT MAX(COALESCE(CAST(SUBSTRING(quotation_number FROM '[0-9]+$') AS INTEGER), 0))
  FROM public.quotations
), 0),
last_invoice_number = COALESCE((
  SELECT MAX(COALESCE(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER), 0))
  FROM public.invoices
), 0);