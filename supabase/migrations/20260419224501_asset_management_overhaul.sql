-- 1. Add address to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address text;

-- 2. Create asset_locations table
CREATE TABLE IF NOT EXISTS public.asset_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- 3. Link assets to the new location table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.asset_locations(id) ON DELETE CASCADE;

-- 4. Enable RLS on asset_locations
ALTER TABLE public.asset_locations ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for asset_locations
CREATE POLICY "Users can view locations for their companies" ON public.asset_locations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert locations" ON public.asset_locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update locations" ON public.asset_locations
  FOR UPDATE USING (auth.uid() IS NOT NULL);
