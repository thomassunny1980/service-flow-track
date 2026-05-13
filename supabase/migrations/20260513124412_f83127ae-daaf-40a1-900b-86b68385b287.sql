ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS invoice_terms text,
ADD COLUMN IF NOT EXISTS quotation_terms text;

UPDATE public.shop_settings 
SET invoice_terms = COALESCE(invoice_terms, terms_and_conditions),
    quotation_terms = COALESCE(quotation_terms, terms_and_conditions)
WHERE terms_and_conditions IS NOT NULL;