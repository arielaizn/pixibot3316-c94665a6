
-- Add AI metadata columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS content_type text DEFAULT NULL;
