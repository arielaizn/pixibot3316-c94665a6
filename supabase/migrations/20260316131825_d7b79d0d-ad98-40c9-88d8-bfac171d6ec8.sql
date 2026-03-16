
-- User credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  plan_credits INTEGER NOT NULL DEFAULT 1,
  extra_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages credits" ON public.user_credits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free',
  monthly_credits INTEGER NOT NULL DEFAULT 1,
  billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  billing_cycle_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages transactions" ON public.credit_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-create user_credits on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, plan_type, plan_credits, extra_credits, used_credits)
  VALUES (NEW.id, 'free', 1, 0, 0);
  
  INSERT INTO public.subscriptions (user_id, plan_type, monthly_credits, status)
  VALUES (NEW.id, 'free', 1, 'active');
  
  INSERT INTO public.credit_transactions (user_id, type, amount, source)
  VALUES (NEW.id, 'plan_credit', 1, 'monthly_reset');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Function to consume a credit (called from edge function)
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  v_remaining := (v_credits.plan_credits + v_credits.extra_credits) - v_credits.used_credits;
  
  IF v_remaining <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No credits remaining');
  END IF;
  
  UPDATE user_credits SET used_credits = used_credits + 1, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, type, amount, source)
  VALUES (p_user_id, 'video_usage', -1, 'video_generation');
  
  RETURN json_build_object(
    'success', true,
    'remaining', v_remaining - 1,
    'used', v_credits.used_credits + 1,
    'total', v_credits.plan_credits + v_credits.extra_credits
  );
END;
$$;

-- Function to add extra credits
CREATE OR REPLACE FUNCTION public.add_extra_credits(p_user_id UUID, p_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF v_credits.plan_type = 'free' THEN
    RETURN json_build_object('success', false, 'error', 'Active subscription required');
  END IF;
  
  UPDATE user_credits SET extra_credits = extra_credits + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, type, amount, source)
  VALUES (p_user_id, 'extra_purchase', p_amount, 'credit_pack');
  
  RETURN json_build_object('success', true, 'extra_credits', v_credits.extra_credits + p_amount);
END;
$$;
