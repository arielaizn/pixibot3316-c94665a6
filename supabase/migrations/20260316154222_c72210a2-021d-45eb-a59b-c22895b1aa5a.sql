-- Allow anon and authenticated users to read shared videos (for public share pages)
CREATE POLICY "Anon can read videos via share"
  ON public.videos FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.visibility IN ('link', 'public')
      AND (
        (ps.video_id = videos.id)
        OR (ps.project_id = videos.project_id AND ps.video_id IS NULL)
      )
    )
  );

-- Allow authenticated users to read project_shares by token (for viewing shared content)
CREATE POLICY "Authenticated can read shares by token"
  ON public.project_shares FOR SELECT
  TO authenticated
  USING (
    visibility IN ('link', 'public')
    OR shared_by = auth.uid()
    OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow anon to read project names for shared pages
CREATE POLICY "Anon can read projects via share"
  ON public.projects FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.project_id = projects.id
      AND ps.visibility IN ('link', 'public')
    )
  );

-- Allow anon to read profiles for shared pages (creator name)
CREATE POLICY "Anon can read profiles via share"
  ON public.profiles FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.project_shares ps
      WHERE ps.shared_by = profiles.user_id
      AND ps.visibility IN ('link', 'public')
    )
  );