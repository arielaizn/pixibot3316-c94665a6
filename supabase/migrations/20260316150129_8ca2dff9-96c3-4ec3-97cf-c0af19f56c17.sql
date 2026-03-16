
-- Add project_id to user_files so files can belong to projects
ALTER TABLE public.user_files ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add version tracking to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS parent_video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL;
