
CREATE OR REPLACE FUNCTION public.generate_asset_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
DECLARE
  v_company_name text;
  v_company_short text;
  v_location_short text;
  v_product_short text;
  v_random text;
BEGIN
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' THEN
    -- Get company name
    SELECT name INTO v_company_name FROM public.companies WHERE id = NEW.company_id;
    
    -- Generate short forms: take first 3 uppercase letters, fallback to 'XXX'
    v_company_short := UPPER(COALESCE(LEFT(REGEXP_REPLACE(v_company_name, '[^a-zA-Z]', '', 'g'), 3), 'XXX'));
    v_location_short := UPPER(COALESCE(NULLIF(LEFT(REGEXP_REPLACE(NEW.location, '[^a-zA-Z]', '', 'g'), 3), ''), 'GEN'));
    v_product_short := UPPER(COALESCE(NULLIF(LEFT(REGEXP_REPLACE(NEW.product_type, '[^a-zA-Z]', '', 'g'), 3), ''), 'AST'));
    
    -- Generate 4 random digits
    v_random := LPAD((floor(random() * 10000))::int::text, 4, '0');
    
    NEW.asset_code := v_company_short || '-' || v_location_short || '-' || v_product_short || '-' || v_random;
  END IF;
  RETURN NEW;
END;
$$;
