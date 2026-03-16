
-- Storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true);

-- Folders table
CREATE TABLE public.user_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.user_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders" ON public.user_folders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_folders_user ON public.user_folders(user_id);
CREATE INDEX idx_user_folders_parent ON public.user_folders(parent_id);

-- Files table
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.user_folders(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'unknown',
  file_size BIGINT NOT NULL DEFAULT 0,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own files" ON public.user_files
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public files viewable" ON public.user_files
  FOR SELECT TO anon
  USING (visibility = 'public');

CREATE INDEX idx_user_files_user ON public.user_files(user_id);
CREATE INDEX idx_user_files_folder ON public.user_files(folder_id);
CREATE INDEX idx_user_files_starred ON public.user_files(user_id, is_starred) WHERE is_starred = true;

-- File shares table
CREATE TABLE public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.user_files(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID NOT NULL,
  shared_with_email TEXT,
  share_token TEXT UNIQUE,
  permission TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage shares" ON public.file_shares
  FOR ALL TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

CREATE INDEX idx_file_shares_file ON public.file_shares(file_id);
CREATE INDEX idx_file_shares_token ON public.file_shares(share_token);

-- Storage RLS for user-files bucket
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view public bucket files" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'user-files');
