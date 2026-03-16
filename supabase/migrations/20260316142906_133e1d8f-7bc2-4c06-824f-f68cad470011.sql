
-- Create a security-definer function to check admin by email
-- This queries user_roles via auth.users email, avoiding hardcoded emails in code
CREATE OR REPLACE FUNCTION public.is_admin_by_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.email = p_email
      AND ur.role = 'admin'
  )
$$;

-- Create a function that ensures admin users have unlimited credits
-- Called by edge functions after identifying an admin
CREATE OR REPLACE FUNCTION public.ensure_admin_credits(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update user_credits to unlimited enterprise
  UPDATE public.user_credits
  SET is_unlimited = true,
      plan_type = 'enterprise',
      plan_credits = 80,
      updated_at = now()
  WHERE user_id = p_user_id
    AND (is_unlimited = false OR plan_type != 'enterprise');

  -- Ensure active subscription reflects enterprise
  UPDATE public.subscriptions
  SET plan_type = 'enterprise',
      monthly_credits = 80,
      status = 'active'
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type != 'enterprise';
END;
$$;
