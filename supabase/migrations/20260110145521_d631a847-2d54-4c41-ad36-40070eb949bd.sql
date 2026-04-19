
-- Create inventory table for stock items
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_code TEXT,
  description TEXT,
  purchase_rate NUMERIC NOT NULL DEFAULT 0,
  sale_rate NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  min_stock_level NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory
CREATE POLICY "Admins can do all operations on inventory" 
ON public.inventory FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view inventory" 
ON public.inventory FOR SELECT 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can create inventory" 
ON public.inventory FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update inventory" 
ON public.inventory FOR UPDATE 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT,
  quotation_id UUID REFERENCES public.quotations(id),
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Admins can do all operations on invoices" 
ON public.invoices FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view invoices" 
ON public.invoices FOR SELECT 
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can create invoices" 
ON public.invoices FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update invoices" 
ON public.invoices FOR UPDATE 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Add invoice numbering settings to shop_settings
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV',
ADD COLUMN IF NOT EXISTS invoice_year_format TEXT DEFAULT 'YYYY',
ADD COLUMN IF NOT EXISTS invoice_number_digits INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS last_invoice_number INTEGER DEFAULT 0;

-- Trigger for inventory updated_at
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for invoices updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
