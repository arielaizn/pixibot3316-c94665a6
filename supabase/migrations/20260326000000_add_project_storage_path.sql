-- Add storage_path column to projects table
-- This stores the relative path within user-files bucket, e.g. "{user_id}/projects/{slug}/"
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS storage_path TEXT;
