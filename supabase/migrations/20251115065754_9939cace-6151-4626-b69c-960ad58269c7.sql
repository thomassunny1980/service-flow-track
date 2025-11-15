-- Add service charge and delivery fields to products table
ALTER TABLE public.products 
ADD COLUMN service_charge DECIMAL(10,2),
ADD COLUMN payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'partial')) DEFAULT 'pending',
ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN completed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivered_to TEXT,
ADD COLUMN received_by TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.products.service_charge IS 'Total service charge for the repair/service';
COMMENT ON COLUMN public.products.payment_status IS 'Payment status: pending, paid, or partial';
COMMENT ON COLUMN public.products.amount_paid IS 'Amount paid by customer';
COMMENT ON COLUMN public.products.completed_date IS 'Date when service was completed';
COMMENT ON COLUMN public.products.delivered_to IS 'Name of person item was delivered to';
COMMENT ON COLUMN public.products.received_by IS 'Name of staff who handed over the item';