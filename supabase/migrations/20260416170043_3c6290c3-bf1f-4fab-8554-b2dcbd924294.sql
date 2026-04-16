
-- Companies table for asset tagging
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do all on companies" ON public.companies FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view companies" ON public.companies FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can create companies" ON public.companies FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can update companies" ON public.companies FOR UPDATE USING (has_role(auth.uid(), 'staff'::app_role));

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assets table
CREATE TABLE public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code text NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  location text,
  product_type text,
  serial_number text,
  mac_address text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do all on assets" ON public.assets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view assets" ON public.assets FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can create assets" ON public.assets FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can update assets" ON public.assets FOR UPDATE USING (has_role(auth.uid(), 'staff'::app_role));

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast asset code search
CREATE INDEX idx_assets_asset_code ON public.assets(asset_code);

-- Sequence-based asset code generator
CREATE SEQUENCE public.asset_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_asset_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' THEN
    NEW.asset_code := 'AST-' || LPAD(nextval('public.asset_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_asset_code BEFORE INSERT ON public.assets FOR EACH ROW EXECUTE FUNCTION public.generate_asset_code();
