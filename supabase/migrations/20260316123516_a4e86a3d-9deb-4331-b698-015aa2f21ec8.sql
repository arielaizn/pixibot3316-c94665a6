
CREATE TABLE public.pixi_handoff_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  quota integer NOT NULL DEFAULT 1,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pixi_handoff_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own handoff tokens"
  ON public.pixi_handoff_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tokens"
  ON public.pixi_handoff_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
