-- Create plugin_auth_sessions table for plugin OAuth flow
CREATE TABLE IF NOT EXISTS public.plugin_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  authenticated BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_plugin_auth_sessions_session_id ON public.plugin_auth_sessions(session_id);
CREATE INDEX idx_plugin_auth_sessions_authenticated ON public.plugin_auth_sessions(authenticated);
CREATE INDEX idx_plugin_auth_sessions_expires_at ON public.plugin_auth_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.plugin_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sessions by session_id (for plugin polling)
CREATE POLICY "Allow read by session_id"
  ON public.plugin_auth_sessions
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own sessions
CREATE POLICY "Allow insert own session"
  ON public.plugin_auth_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own sessions
CREATE POLICY "Allow update own session"
  ON public.plugin_auth_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own sessions
CREATE POLICY "Allow delete own session"
  ON public.plugin_auth_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_plugin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.plugin_auth_sessions
  WHERE expires_at < NOW();
END;
$$;

-- Schedule the cleanup function to run hourly (requires pg_cron extension)
-- This is optional - you can also run it via a cron job or Edge Function
-- SELECT cron.schedule('delete-expired-plugin-sessions', '0 * * * *', 'SELECT delete_expired_plugin_sessions()');
