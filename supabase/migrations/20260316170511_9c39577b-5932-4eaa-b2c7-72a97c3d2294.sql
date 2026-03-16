
CREATE OR REPLACE FUNCTION public.increment_view_count(p_video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.videos
  SET view_count = view_count + 1
  WHERE id = p_video_id;
$$;
