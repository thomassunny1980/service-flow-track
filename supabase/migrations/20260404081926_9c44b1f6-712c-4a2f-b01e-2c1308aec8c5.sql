
-- Function to generate next invoice number atomically
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(p_invoice_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_year_format text;
  v_digits int;
  v_auto_reset boolean;
  v_stored_fy text;
  v_last_number int;
  v_settings_id uuid;
  v_new_number int;
  v_current_fy text;
  v_fy_start_year int;
  v_fy_end_year int;
  v_year_part text;
  v_month int;
  v_year int;
BEGIN
  -- Get settings
  SELECT id, 
         COALESCE(invoice_prefix, 'INV'),
         COALESCE(invoice_year_format, 'FY-YY'),
         COALESCE(invoice_number_digits, 4),
         COALESCE(auto_reset_invoice_sequence, true),
         invoice_fy_year,
         COALESCE(last_invoice_number, 0)
  INTO v_settings_id, v_prefix, v_year_format, v_digits, v_auto_reset, v_stored_fy, v_last_number
  FROM shop_settings
  LIMIT 1
  FOR UPDATE;

  -- Calculate current financial year from the invoice date
  v_month := EXTRACT(MONTH FROM p_invoice_date)::int;
  v_year := EXTRACT(YEAR FROM p_invoice_date)::int;
  
  IF v_month < 4 THEN
    v_fy_start_year := v_year - 1;
  ELSE
    v_fy_start_year := v_year;
  END IF;
  v_fy_end_year := v_fy_start_year + 1;
  v_current_fy := v_fy_start_year || '-' || v_fy_end_year;

  -- Determine new number
  IF v_auto_reset AND (v_stored_fy IS NULL OR v_stored_fy <> v_current_fy) THEN
    v_new_number := 1;
  ELSE
    v_new_number := v_last_number + 1;
  END IF;

  -- Update settings
  UPDATE shop_settings
  SET last_invoice_number = v_new_number,
      invoice_fy_year = v_current_fy,
      invoice_fy_last_number = v_new_number
  WHERE id = v_settings_id;

  -- Build year part
  CASE v_year_format
    WHEN 'FY-YY' THEN
      v_year_part := RIGHT(v_fy_start_year::text, 2) || '-' || RIGHT(v_fy_end_year::text, 2);
    WHEN 'FY-YYYY' THEN
      v_year_part := v_fy_start_year::text || '-' || RIGHT(v_fy_end_year::text, 2);
    WHEN 'YYYY' THEN
      v_year_part := v_year::text;
    WHEN 'YY' THEN
      v_year_part := RIGHT(v_year::text, 2);
    ELSE
      v_year_part := '';
  END CASE;

  -- Return formatted number
  IF v_year_part = '' THEN
    RETURN v_prefix || '-' || LPAD(v_new_number::text, v_digits, '0');
  ELSE
    RETURN v_prefix || '-' || v_year_part || '-' || LPAD(v_new_number::text, v_digits, '0');
  END IF;
END;
$$;

-- Function to generate next quotation number atomically
CREATE OR REPLACE FUNCTION public.generate_next_quotation_number(p_quotation_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_year_format text;
  v_digits int;
  v_auto_reset boolean;
  v_stored_fy text;
  v_last_number int;
  v_settings_id uuid;
  v_new_number int;
  v_current_fy text;
  v_fy_start_year int;
  v_fy_end_year int;
  v_year_part text;
  v_month int;
  v_year int;
BEGIN
  SELECT id,
         COALESCE(quotation_prefix, 'QT'),
         COALESCE(quotation_year_format, 'FY-YY'),
         COALESCE(quotation_number_digits, 4),
         COALESCE(auto_reset_quotation_sequence, true),
         quotation_fy_year,
         COALESCE(last_quotation_number, 0)
  INTO v_settings_id, v_prefix, v_year_format, v_digits, v_auto_reset, v_stored_fy, v_last_number
  FROM shop_settings
  LIMIT 1
  FOR UPDATE;

  v_month := EXTRACT(MONTH FROM p_quotation_date)::int;
  v_year := EXTRACT(YEAR FROM p_quotation_date)::int;
  
  IF v_month < 4 THEN
    v_fy_start_year := v_year - 1;
  ELSE
    v_fy_start_year := v_year;
  END IF;
  v_fy_end_year := v_fy_start_year + 1;
  v_current_fy := v_fy_start_year || '-' || v_fy_end_year;

  IF v_auto_reset AND (v_stored_fy IS NULL OR v_stored_fy <> v_current_fy) THEN
    v_new_number := 1;
  ELSE
    v_new_number := v_last_number + 1;
  END IF;

  UPDATE shop_settings
  SET last_quotation_number = v_new_number,
      quotation_fy_year = v_current_fy,
      quotation_fy_last_number = v_new_number
  WHERE id = v_settings_id;

  CASE v_year_format
    WHEN 'FY-YY' THEN
      v_year_part := RIGHT(v_fy_start_year::text, 2) || '-' || RIGHT(v_fy_end_year::text, 2);
    WHEN 'FY-YYYY' THEN
      v_year_part := v_fy_start_year::text || '-' || RIGHT(v_fy_end_year::text, 2);
    WHEN 'YYYY' THEN
      v_year_part := v_year::text;
    WHEN 'YY' THEN
      v_year_part := RIGHT(v_year::text, 2);
    ELSE
      v_year_part := '';
  END CASE;

  IF v_year_part = '' THEN
    RETURN v_prefix || '-' || LPAD(v_new_number::text, v_digits, '0');
  ELSE
    RETURN v_prefix || '-' || v_year_part || '-' || LPAD(v_new_number::text, v_digits, '0');
  END IF;
END;
$$;
