-- Add media columns to challenges table for video and details URL
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS details_url text;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS video_url text;
