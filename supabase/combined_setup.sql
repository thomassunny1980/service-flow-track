-- COMPREHENSIVE DATABASE SETUP (Schema + Migrations + Seed Data)
-- This file contains everything needed to initialize the database for the Asset Management project.

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE public.quotation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.service_status AS ENUM ('received', 'in_progress', 'awaiting_parts', 'completed', 'external_service', 'ready_for_pickup', 'delivered');

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text,
  logo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.asset_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.asset_locations(id) ON DELETE CASCADE,
  location text,
  product_type text,
  serial_number text,
  mac_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  contact text,
  address text,
  state text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name text NOT NULL,
  item_code text,
  description text,
  quantity integer DEFAULT 0,
  unit text,
  purchase_rate numeric DEFAULT 0,
  sale_rate numeric DEFAULT 0,
  min_stock_level integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to authenticated users" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated users" ON public.asset_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated users" ON public.assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated users" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all to authenticated users" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. SEED DATA
-- Insert Companies
INSERT INTO public.companies (name, address, logo_url)
VALUES 
  ('Global Tech Solutions', '123 Tech Park, Silicon Valley, CA', NULL),
  ('Innovate Corp', '456 Innovation Way, Austin, TX', NULL),
  ('Secure Systems', '789 Safety Blvd, Seattle, WA', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Asset Locations
INSERT INTO public.asset_locations (company_id, name)
SELECT id, 'Main Office' FROM public.companies WHERE name = 'Global Tech Solutions'
UNION ALL
SELECT id, 'Server Room' FROM public.companies WHERE name = 'Global Tech Solutions'
UNION ALL
SELECT id, 'Warehouse A' FROM public.companies WHERE name = 'Innovate Corp'
UNION ALL
SELECT id, 'HQ' FROM public.companies WHERE name = 'Secure Systems';

-- Insert Assets
INSERT INTO public.assets (asset_code, company_id, location_id, product_type, serial_number, mac_address)
SELECT 'GTS-OFF-LPT-001', c.id, l.id, 'Laptop', 'SN12345678', '00:1A:2B:3C:4D:5E'
FROM public.companies c JOIN public.asset_locations l ON l.company_id = c.id
WHERE c.name = 'Global Tech Solutions' AND l.name = 'Main Office' LIMIT 1;

INSERT INTO public.assets (asset_code, company_id, location_id, product_type, serial_number, mac_address)
SELECT 'GTS-SRV-SRV-001', c.id, l.id, 'Server', 'SRV-998877', 'AA:BB:CC:DD:EE:FF'
FROM public.companies c JOIN public.asset_locations l ON l.company_id = c.id
WHERE c.name = 'Global Tech Solutions' AND l.name = 'Server Room' LIMIT 1;
