-- =============================================
-- Challenges: Platform-wide unlimited credits
-- for time-limited events / competitions
-- (combined: create table + media columns)
-- =============================================

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  is_active boolean NOT NULL DEFAULT true,
  details_url text,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Admins can manage challenges') THEN
    CREATE POLICY "Admins can manage challenges"
      ON public.challenges FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- All users: can read active-and-in-range challenges (needed by useCredits)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can read active challenges') THEN
    CREATE POLICY "Users can read active challenges"
      ON public.challenges FOR SELECT TO authenticated
      USING (is_active = true AND now() BETWEEN start_date AND end_date);
  END IF;
END $$;

-- =============================================
-- Update consume_credit to check challenges
-- =============================================
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_remaining INTEGER;
  v_challenge_active BOOLEAN;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Unlimited users always succeed without consuming credits
  IF v_credits.is_unlimited = true THEN
    RETURN json_build_object(
      'success', true,
      'remaining', -1,
      'used', v_credits.used_credits,
      'total', -1,
      'unlimited', true
    );
  END IF;

  -- Check for active challenge (platform-wide unlimited period)
  SELECT EXISTS (
    SELECT 1 FROM challenges
    WHERE is_active = true
      AND now() BETWEEN start_date AND end_date
  ) INTO v_challenge_active;

  IF v_challenge_active THEN
    RETURN json_build_object(
      'success', true,
      'remaining', -1,
      'used', v_credits.used_credits,
      'total', -1,
      'unlimited', true,
      'challenge_active', true
    );
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
$function$;
