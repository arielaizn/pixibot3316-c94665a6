
-- Referral codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages referral_codes" ON public.referral_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'clicked',
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals as referrer" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id);

CREATE POLICY "Service role manages referrals" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Referral rewards table
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_type text NOT NULL DEFAULT 'extra_credits',
  reward_value integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON public.referral_rewards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rewards" ON public.referral_rewards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, referral_code)
  VALUES (NEW.id, 'PIXI' || upper(substr(md5(NEW.id::text || now()::text), 1, 8)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral_code();
