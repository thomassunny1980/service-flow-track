-- Create quotation status enum
CREATE TYPE public.quotation_status AS ENUM ('pending', 'approved', 'rejected');

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  validity_date DATE NOT NULL,
  status quotation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can do all operations on quotations"
ON public.quotations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all quotations"
ON public.quotations
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can create quotations"
ON public.quotations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update quotations"
ON public.quotations
FOR UPDATE
USING (has_role(auth.uid(), 'staff'));

-- Add trigger for updated_at
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-delete expired unapproved quotations
CREATE OR REPLACE FUNCTION public.cleanup_expired_quotations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.quotations
  WHERE status = 'pending'
    AND validity_date < CURRENT_DATE;
END;
$$;