-- Add amount_paid column to invoices table for tracking payments
ALTER TABLE public.invoices 
ADD COLUMN amount_paid numeric DEFAULT 0;