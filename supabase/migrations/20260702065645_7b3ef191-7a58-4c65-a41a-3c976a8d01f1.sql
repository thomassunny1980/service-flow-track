
-- Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  status text NOT NULL DEFAULT 'trial',
  plan text NOT NULL DEFAULT 'starter',
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX ON public.tenant_members(user_id);
CREATE INDEX ON public.tenant_members(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  stripe_price_id text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO authenticated, anon;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.plans FOR SELECT USING (true);

INSERT INTO public.plans(id, name, price_monthly, currency, sort_order, features) VALUES
  ('starter','Starter', 499, 'INR', 1, '["Up to 3 users","Invoicing & Quotations","Basic Support"]'::jsonb),
  ('pro','Pro', 1499, 'INR', 2, '["Up to 15 users","Purchases & Ledger","Priority Support"]'::jsonb),
  ('business','Business', 3999, 'INR', 3, '["Unlimited users","Asset Tagging","Dedicated Support"]'::jsonb);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() ORDER BY created_at ASC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = _tenant_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = _tenant_id AND user_id = _user_id AND role = 'admin')
$$;

-- Policies on tenant tables
CREATE POLICY "Members can view own tenant" ON public.tenants
  FOR SELECT TO authenticated USING (public.is_tenant_member(id) OR public.is_super_admin());
CREATE POLICY "Super admin manages tenants" ON public.tenants
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Tenant admin updates own tenant" ON public.tenants
  FOR UPDATE TO authenticated USING (public.is_tenant_admin(id)) WITH CHECK (public.is_tenant_admin(id));

CREATE POLICY "View own memberships" ON public.tenant_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_tenant_admin(tenant_id) OR public.is_super_admin());
CREATE POLICY "Manage members" ON public.tenant_members
  FOR ALL TO authenticated USING (public.is_tenant_admin(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.is_tenant_admin(tenant_id) OR public.is_super_admin());

CREATE POLICY "Members see subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id) OR public.is_super_admin());
CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Add tenant_id columns
ALTER TABLE public.customers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.quotations ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.assets ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.ledger_transactions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.remarks ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.shop_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.companies ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Backfill
DO $$
DECLARE v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants(name, slug, status, plan, trial_ends_at)
  VALUES ('Super Biller', 'super-biller', 'active', 'business', now() + interval '10 years')
  RETURNING id INTO v_tenant_id;

  UPDATE public.customers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.invoices SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.quotations SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.purchases SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.products SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.inventory SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.assets SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.ledger_transactions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.remarks SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.shop_settings SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.companies SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;

  INSERT INTO public.tenant_members(tenant_id, user_id, role)
  SELECT v_tenant_id, id, 'admin' FROM auth.users
  ON CONFLICT DO NOTHING;

  INSERT INTO public.subscriptions(tenant_id, plan, status, current_period_end)
  VALUES (v_tenant_id, 'business', 'active', now() + interval '10 years');
END $$;

ALTER TABLE public.customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.purchases ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.inventory ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.assets ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ledger_transactions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.remarks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.shop_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.companies ALTER COLUMN tenant_id SET NOT NULL;

CREATE UNIQUE INDEX shop_settings_tenant_unique ON public.shop_settings(tenant_id);

-- Auto-set tenant_id trigger
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN NEW.tenant_id := public.current_tenant_id(); END IF;
  IF NEW.tenant_id IS NULL THEN RAISE EXCEPTION 'No tenant context for current user'; END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['customers','invoices','quotations','purchases','products','inventory','assets','ledger_transactions','remarks','shop_settings','companies']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_tenant_id ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id()', t);
  END LOOP;
END $$;

-- Drop existing policies and recreate tenant-scoped
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('customers','invoices','quotations','purchases','products','inventory','assets','ledger_transactions','remarks','shop_settings','companies','profiles')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['customers','invoices','quotations','purchases','products','inventory','assets','ledger_transactions','remarks','companies']) LOOP
    EXECUTE format('CREATE POLICY "tenant_select" ON public.%I FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id() OR public.is_super_admin())', t);
    EXECUTE format('CREATE POLICY "tenant_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_super_admin())', t);
    EXECUTE format('CREATE POLICY "tenant_update" ON public.%I FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id() OR public.is_super_admin()) WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_super_admin())', t);
    EXECUTE format('CREATE POLICY "tenant_delete" ON public.%I FOR DELETE TO authenticated USING (tenant_id = public.current_tenant_id() OR public.is_super_admin())', t);
  END LOOP;
END $$;

CREATE POLICY "shop_settings_select" ON public.shop_settings FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_super_admin());
CREATE POLICY "shop_settings_write" ON public.shop_settings FOR ALL TO authenticated
  USING ((tenant_id = public.current_tenant_id() AND public.is_tenant_admin(tenant_id)) OR public.is_super_admin())
  WITH CHECK ((tenant_id = public.current_tenant_id() AND public.is_tenant_admin(tenant_id)) OR public.is_super_admin());

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.tenant_members tm1
    JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
  ));
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Rewrite numbering functions to per-tenant
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(p_invoice_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefix text; v_year_format text; v_digits int; v_auto_reset boolean;
  v_stored_fy text; v_last_number int; v_settings_id uuid; v_new_number int;
  v_current_fy text; v_fy_start_year int; v_fy_end_year int; v_year_part text;
  v_month int; v_year int; v_tenant uuid;
BEGIN
  v_tenant := public.current_tenant_id();
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'No tenant context'; END IF;

  SELECT id, COALESCE(invoice_prefix,'INV'), COALESCE(invoice_year_format,'FY-YY'),
         COALESCE(invoice_number_digits,4), COALESCE(auto_reset_invoice_sequence,true),
         invoice_fy_year, COALESCE(last_invoice_number,0)
    INTO v_settings_id, v_prefix, v_year_format, v_digits, v_auto_reset, v_stored_fy, v_last_number
  FROM shop_settings WHERE tenant_id = v_tenant FOR UPDATE;

  v_month := EXTRACT(MONTH FROM p_invoice_date)::int;
  v_year := EXTRACT(YEAR FROM p_invoice_date)::int;
  IF v_month < 4 THEN v_fy_start_year := v_year - 1; ELSE v_fy_start_year := v_year; END IF;
  v_fy_end_year := v_fy_start_year + 1;
  v_current_fy := v_fy_start_year || '-' || v_fy_end_year;

  IF v_auto_reset AND (v_stored_fy IS NULL OR v_stored_fy <> v_current_fy) THEN v_new_number := 1;
  ELSE v_new_number := v_last_number + 1; END IF;

  UPDATE shop_settings SET last_invoice_number = v_new_number, invoice_fy_year = v_current_fy, invoice_fy_last_number = v_new_number
  WHERE id = v_settings_id;

  CASE v_year_format
    WHEN 'FY-YY' THEN v_year_part := RIGHT(v_fy_start_year::text,2) || '-' || RIGHT(v_fy_end_year::text,2);
    WHEN 'FY-YYYY' THEN v_year_part := v_fy_start_year::text || '-' || RIGHT(v_fy_end_year::text,2);
    WHEN 'YYYY' THEN v_year_part := v_year::text;
    WHEN 'YY' THEN v_year_part := RIGHT(v_year::text,2);
    ELSE v_year_part := '';
  END CASE;

  IF v_year_part = '' THEN RETURN v_prefix || '-' || LPAD(v_new_number::text, v_digits, '0');
  ELSE RETURN v_prefix || '-' || v_year_part || '-' || LPAD(v_new_number::text, v_digits, '0'); END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_next_quotation_number(p_quotation_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefix text; v_year_format text; v_digits int; v_auto_reset boolean;
  v_stored_fy text; v_last_number int; v_settings_id uuid; v_new_number int;
  v_current_fy text; v_fy_start_year int; v_fy_end_year int; v_year_part text;
  v_month int; v_year int; v_tenant uuid;
BEGIN
  v_tenant := public.current_tenant_id();
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'No tenant context'; END IF;

  SELECT id, COALESCE(quotation_prefix,'QT'), COALESCE(quotation_year_format,'FY-YY'),
         COALESCE(quotation_number_digits,4), COALESCE(auto_reset_quotation_sequence,true),
         quotation_fy_year, COALESCE(last_quotation_number,0)
    INTO v_settings_id, v_prefix, v_year_format, v_digits, v_auto_reset, v_stored_fy, v_last_number
  FROM shop_settings WHERE tenant_id = v_tenant FOR UPDATE;

  v_month := EXTRACT(MONTH FROM p_quotation_date)::int;
  v_year := EXTRACT(YEAR FROM p_quotation_date)::int;
  IF v_month < 4 THEN v_fy_start_year := v_year - 1; ELSE v_fy_start_year := v_year; END IF;
  v_fy_end_year := v_fy_start_year + 1;
  v_current_fy := v_fy_start_year || '-' || v_fy_end_year;

  IF v_auto_reset AND (v_stored_fy IS NULL OR v_stored_fy <> v_current_fy) THEN v_new_number := 1;
  ELSE v_new_number := v_last_number + 1; END IF;

  UPDATE shop_settings SET last_quotation_number = v_new_number, quotation_fy_year = v_current_fy, quotation_fy_last_number = v_new_number
  WHERE id = v_settings_id;

  CASE v_year_format
    WHEN 'FY-YY' THEN v_year_part := RIGHT(v_fy_start_year::text,2) || '-' || RIGHT(v_fy_end_year::text,2);
    WHEN 'FY-YYYY' THEN v_year_part := v_fy_start_year::text || '-' || RIGHT(v_fy_end_year::text,2);
    WHEN 'YYYY' THEN v_year_part := v_year::text;
    WHEN 'YY' THEN v_year_part := RIGHT(v_year::text,2);
    ELSE v_year_part := '';
  END CASE;

  IF v_year_part = '' THEN RETURN v_prefix || '-' || LPAD(v_new_number::text, v_digits, '0');
  ELSE RETURN v_prefix || '-' || v_year_part || '-' || LPAD(v_new_number::text, v_digits, '0'); END IF;
END $$;

-- Promote super admin
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower('thomaspsunny@gmail.com') LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
