
-- Table: user_videos — tracks each video creation per user
CREATE TABLE public.user_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'queued',
  generation_time integer DEFAULT 0,
  file_url text
);

-- Table: users_stats — aggregated stats per user
CREATE TABLE public.users_stats (
  user_id uuid PRIMARY KEY NOT NULL,
  total_videos_created integer NOT NULL DEFAULT 0,
  last_video_created_at timestamptz,
  total_generation_time integer NOT NULL DEFAULT 0
);

-- RLS for user_videos
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video records" ON public.user_videos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages user_videos" ON public.user_videos
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- RLS for users_stats
ALTER TABLE public.users_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON public.users_stats
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages users_stats" ON public.users_stats
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Trigger function: auto-update users_stats when a user_videos row is inserted
CREATE OR REPLACE FUNCTION public.update_user_stats_on_video()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users_stats (user_id, total_videos_created, last_video_created_at, total_generation_time)
  VALUES (NEW.user_id, 1, NEW.created_at, COALESCE(NEW.generation_time, 0))
  ON CONFLICT (user_id) DO UPDATE SET
    total_videos_created = users_stats.total_videos_created + 1,
    last_video_created_at = GREATEST(users_stats.last_video_created_at, NEW.created_at),
    total_generation_time = users_stats.total_generation_time + COALESCE(NEW.generation_time, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_user_stats
  AFTER INSERT ON public.user_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_on_video();

-- Also trigger on status update (when video completes, update generation_time)
CREATE OR REPLACE FUNCTION public.update_user_stats_on_video_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.users_stats
    SET total_generation_time = total_generation_time + COALESCE(NEW.generation_time, 0) - COALESCE(OLD.generation_time, 0)
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_user_stats_on_update
  AFTER UPDATE ON public.user_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_on_video_update();

-- Enable realtime for users_stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.users_stats;

-- Backfill: populate user_videos and users_stats from existing videos table
INSERT INTO public.user_videos (user_id, video_id, created_at, status, file_url)
SELECT user_id, id, created_at, status, video_url FROM public.videos
ON CONFLICT DO NOTHING;

-- Backfill stats (manual since trigger only fires on new inserts via SQL)
INSERT INTO public.users_stats (user_id, total_videos_created, last_video_created_at, total_generation_time)
SELECT user_id, COUNT(*), MAX(created_at), 0
FROM public.videos
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_videos_created = EXCLUDED.total_videos_created,
  last_video_created_at = EXCLUDED.last_video_created_at;
