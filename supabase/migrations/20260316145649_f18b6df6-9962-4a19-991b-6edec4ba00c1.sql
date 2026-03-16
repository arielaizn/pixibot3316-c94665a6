
-- Add title and thumbnail_url to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create project_shares table
CREATE TABLE IF NOT EXISTS public.project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_with_email text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  permission text NOT NULL DEFAULT 'viewer',
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Owners manage project shares"
  ON public.project_shares FOR ALL TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

-- Service role full access
CREATE POLICY "Service role manages project shares"
  ON public.project_shares FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anyone can read shares by token (for public/link access)
CREATE POLICY "Public can read by token"
  ON public.project_shares FOR SELECT TO anon
  USING (visibility IN ('link', 'public'));
