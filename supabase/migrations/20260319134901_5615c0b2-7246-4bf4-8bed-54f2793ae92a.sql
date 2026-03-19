
-- Updates table for popup campaigns
CREATE TABLE public.updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Admins can manage updates
CREATE POLICY "Admins can manage updates" ON public.updates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can read active updates (for homepage popup)
CREATE POLICY "Anyone can read active updates" ON public.updates
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND now() BETWEEN start_date AND end_date);
