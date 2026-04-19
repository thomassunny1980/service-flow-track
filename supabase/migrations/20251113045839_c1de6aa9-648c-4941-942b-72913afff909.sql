-- Make customer_id NOT NULL to enforce data integrity and RLS policies
-- This ensures every product is linked to a customer account
ALTER TABLE public.products 
ALTER COLUMN customer_id SET NOT NULL;