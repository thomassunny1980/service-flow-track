
-- Extend customers as party master
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS opening_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_type text NOT NULL DEFAULT 'customer';

-- Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  vendor_name text NOT NULL,
  invoice_no text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  balance_amount numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'credit',
  payment_mode text DEFAULT 'cash',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins all on purchases" ON public.purchases FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Staff view purchases" ON public.purchases FOR SELECT USING (has_role(auth.uid(),'staff'));
CREATE POLICY "Staff create purchases" ON public.purchases FOR INSERT WITH CHECK (has_role(auth.uid(),'staff'));
CREATE POLICY "Staff update purchases" ON public.purchases FOR UPDATE USING (has_role(auth.uid(),'staff'));

CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ledger transactions
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  transaction_type text NOT NULL,
  reference_no text,
  reference_id uuid,
  reference_table text,
  credit numeric NOT NULL DEFAULT 0,
  debit numeric NOT NULL DEFAULT 0,
  running_balance numeric NOT NULL DEFAULT 0,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_date ON public.ledger_transactions(customer_id, transaction_date, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON public.ledger_transactions(reference_table, reference_id);

ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins all on ledger" ON public.ledger_transactions FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Staff view ledger" ON public.ledger_transactions FOR SELECT USING (has_role(auth.uid(),'staff'));
CREATE POLICY "Staff insert ledger" ON public.ledger_transactions FOR INSERT WITH CHECK (has_role(auth.uid(),'staff'));
CREATE POLICY "Staff update ledger" ON public.ledger_transactions FOR UPDATE USING (has_role(auth.uid(),'staff'));

-- Recalculate running balance for a party
CREATE OR REPLACE FUNCTION public.recalculate_party_balance(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_balance numeric := 0;
  v_opening numeric := 0;
BEGIN
  SELECT COALESCE(opening_balance,0) INTO v_opening FROM public.customers WHERE id = p_customer_id;
  v_balance := v_opening;

  -- Ensure opening row exists/updated
  IF EXISTS (SELECT 1 FROM public.ledger_transactions WHERE customer_id = p_customer_id AND transaction_type = 'opening') THEN
    UPDATE public.ledger_transactions
       SET debit = CASE WHEN v_opening >= 0 THEN v_opening ELSE 0 END,
           credit = CASE WHEN v_opening < 0 THEN -v_opening ELSE 0 END,
           running_balance = v_opening,
           transaction_date = CURRENT_DATE
     WHERE customer_id = p_customer_id AND transaction_type = 'opening';
  ELSE
    IF v_opening <> 0 THEN
      INSERT INTO public.ledger_transactions(customer_id, transaction_type, reference_no, debit, credit, running_balance, transaction_date, notes)
      VALUES (p_customer_id, 'opening', 'OPENING',
        CASE WHEN v_opening >= 0 THEN v_opening ELSE 0 END,
        CASE WHEN v_opening < 0 THEN -v_opening ELSE 0 END,
        v_opening, CURRENT_DATE, 'Opening balance');
    END IF;
  END IF;

  FOR r IN
    SELECT id, debit, credit FROM public.ledger_transactions
    WHERE customer_id = p_customer_id AND transaction_type <> 'opening'
    ORDER BY transaction_date ASC, created_at ASC
  LOOP
    v_balance := v_balance + COALESCE(r.debit,0) - COALESCE(r.credit,0);
    UPDATE public.ledger_transactions SET running_balance = v_balance WHERE id = r.id;
  END LOOP;
END;
$$;

-- Trigger function: purchases -> ledger
CREATE OR REPLACE FUNCTION public.purchases_ledger_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_vendor uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.ledger_transactions WHERE reference_table='purchases' AND reference_id = OLD.id;
    PERFORM public.recalculate_party_balance(OLD.vendor_id);
    RETURN OLD;
  END IF;

  -- upsert two rows: purchase (credit = total) and payment_out (debit = paid) if any
  DELETE FROM public.ledger_transactions WHERE reference_table='purchases' AND reference_id = NEW.id;

  INSERT INTO public.ledger_transactions(customer_id, transaction_type, reference_no, reference_id, reference_table, credit, debit, transaction_date, notes)
  VALUES (NEW.vendor_id, 'purchase', COALESCE(NEW.invoice_no, NEW.id::text), NEW.id, 'purchases', NEW.total_amount, 0, NEW.purchase_date, 'Purchase entry');

  IF COALESCE(NEW.paid_amount,0) > 0 THEN
    INSERT INTO public.ledger_transactions(customer_id, transaction_type, reference_no, reference_id, reference_table, credit, debit, transaction_date, notes)
    VALUES (NEW.vendor_id, 'payment_out', COALESCE(NEW.invoice_no, NEW.id::text), NEW.id, 'purchases', 0, NEW.paid_amount, NEW.purchase_date, 'Payment against purchase');
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.vendor_id <> NEW.vendor_id THEN
    PERFORM public.recalculate_party_balance(OLD.vendor_id);
  END IF;
  PERFORM public.recalculate_party_balance(NEW.vendor_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchases_ledger
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.purchases_ledger_sync();

-- Trigger: customers opening balance
CREATE OR REPLACE FUNCTION public.customers_opening_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP='UPDATE' AND COALESCE(OLD.opening_balance,0) <> COALESCE(NEW.opening_balance,0)) THEN
    PERFORM public.recalculate_party_balance(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customers_opening
AFTER INSERT OR UPDATE OF opening_balance ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.customers_opening_sync();

-- Party balances view
CREATE OR REPLACE VIEW public.party_balances AS
SELECT
  c.id AS customer_id,
  c.name,
  c.contact,
  c.gstin,
  c.party_type,
  c.opening_balance,
  COALESCE((SELECT SUM(total_amount) FROM public.purchases WHERE vendor_id = c.id),0) AS total_purchases,
  COALESCE((SELECT SUM(paid_amount) FROM public.purchases WHERE vendor_id = c.id),0) AS total_paid_to_vendor,
  COALESCE((SELECT SUM(running_balance) FROM public.ledger_transactions lt
            WHERE lt.customer_id = c.id
            AND lt.id = (SELECT id FROM public.ledger_transactions WHERE customer_id = c.id ORDER BY transaction_date DESC, created_at DESC LIMIT 1)
           ), c.opening_balance) AS balance
FROM public.customers c;
