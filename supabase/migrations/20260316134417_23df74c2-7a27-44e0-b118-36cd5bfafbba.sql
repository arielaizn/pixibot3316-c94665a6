
ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS is_unlimited boolean NOT NULL DEFAULT false;

-- Update consume_credit to skip deduction for unlimited users
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_remaining INTEGER;
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
