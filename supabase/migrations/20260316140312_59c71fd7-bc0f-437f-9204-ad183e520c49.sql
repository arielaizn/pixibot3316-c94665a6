
-- Customers table for Sumit integration
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  whatsapp_number text,
  sumit_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer record" ON public.customers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages customers" ON public.customers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sumit_transaction_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ILS',
  status text NOT NULL DEFAULT 'pending',
  payment_type text NOT NULL DEFAULT 'subscription',
  plan_key text,
  billing_cycle text,
  credits integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages payments" ON public.payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Credit purchases table
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits integer NOT NULL,
  payment_id uuid REFERENCES public.payments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages purchases" ON public.credit_purchases
  FOR ALL TO service_role USING (true) WITH CHECK (true);
