
-- Fix: Replace the policy that references auth.users (causes "permission denied for table users")
DROP POLICY IF EXISTS "Authenticated can read shares by token" ON public.project_shares;

CREATE POLICY "Authenticated can read shares by token"
ON public.project_shares
FOR SELECT
TO authenticated
USING (
  (visibility = ANY (ARRAY['link'::text, 'public'::text]))
  OR (shared_by = auth.uid())
  OR (shared_with_email = auth.email())
);
