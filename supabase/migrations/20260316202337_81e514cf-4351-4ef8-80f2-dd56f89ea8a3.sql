
-- Add version tracking columns to user_files
ALTER TABLE public.user_files ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.user_files ADD COLUMN IF NOT EXISTS parent_file_id uuid REFERENCES public.user_files(id);

-- Add visibility column to file_shares
ALTER TABLE public.file_shares ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private';

-- Allow anon to read file_shares with public/link visibility
CREATE POLICY "Anon can read public file shares"
ON public.file_shares FOR SELECT TO anon
USING (visibility IN ('link', 'public'));

-- Allow anon to read user_files that have public file shares
CREATE POLICY "Anon can read files via file share"
ON public.user_files FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.file_shares fs
    WHERE fs.file_id = user_files.id
    AND fs.visibility IN ('link', 'public')
  )
);
