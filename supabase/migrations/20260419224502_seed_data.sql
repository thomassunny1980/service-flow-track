-- Seed data for Companies, Locations, and Assets

-- 1. Insert Companies
INSERT INTO public.companies (name, address, logo_url)
VALUES 
  ('Global Tech Solutions', '123 Tech Park, Silicon Valley, CA', 'https://spjtucmiovvidpjmlacm.supabase.co/storage/v1/object/public/company-logos/default-corp.png'),
  ('Innovate Corp', '456 Innovation Way, Austin, TX', NULL),
  ('Secure Systems', '789 Safety Blvd, Seattle, WA', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Asset Locations (using subqueries to get company IDs)
INSERT INTO public.asset_locations (company_id, name)
SELECT id, 'Main Office' FROM public.companies WHERE name = 'Global Tech Solutions'
UNION ALL
SELECT id, 'Server Room' FROM public.companies WHERE name = 'Global Tech Solutions'
UNION ALL
SELECT id, 'Warehouse A' FROM public.companies WHERE name = 'Innovate Corp'
UNION ALL
SELECT id, 'HQ' FROM public.companies WHERE name = 'Secure Systems';

-- 3. Insert Assets
INSERT INTO public.assets (asset_code, company_id, location_id, product_type, serial_number, mac_address)
SELECT 
  'GTS-OFF-LPT-001', 
  c.id, 
  l.id, 
  'Laptop', 
  'SN12345678', 
  '00:1A:2B:3C:4D:5E'
FROM public.companies c
JOIN public.asset_locations l ON l.company_id = c.id
WHERE c.name = 'Global Tech Solutions' AND l.name = 'Main Office'
LIMIT 1;

INSERT INTO public.assets (asset_code, company_id, location_id, product_type, serial_number, mac_address)
SELECT 
  'GTS-SRV-SRV-001', 
  c.id, 
  l.id, 
  'Server', 
  'SRV-998877', 
  'AA:BB:CC:DD:EE:FF'
FROM public.companies c
JOIN public.asset_locations l ON l.company_id = c.id
WHERE c.name = 'Global Tech Solutions' AND l.name = 'Server Room'
LIMIT 1;

INSERT INTO public.assets (asset_code, company_id, location_id, product_type, serial_number, mac_address)
SELECT 
  'INC-WH-PRN-001', 
  c.id, 
  l.id, 
  'Printer', 
  'PRT-112233', 
  NULL
FROM public.companies c
JOIN public.asset_locations l ON l.company_id = c.id
WHERE c.name = 'Innovate Corp' AND l.name = 'Warehouse A'
LIMIT 1;
