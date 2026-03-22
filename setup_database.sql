-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.pixi_handoff_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  quota integer NOT NULL DEFAULT 1,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pixi_handoff_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own handoff tokens"
  ON public.pixi_handoff_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tokens"
  ON public.pixi_handoff_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  plan_credits INTEGER NOT NULL DEFAULT 1,
  extra_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages credits" ON public.user_credits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free',
  monthly_credits INTEGER NOT NULL DEFAULT 1,
  billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  billing_cycle_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages transactions" ON public.credit_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-create user_credits on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, plan_type, plan_credits, extra_credits, used_credits)
  VALUES (NEW.id, 'free', 1, 0, 0);
  
  INSERT INTO public.subscriptions (user_id, plan_type, monthly_credits, status)
  VALUES (NEW.id, 'free', 1, 'active');
  
  INSERT INTO public.credit_transactions (user_id, type, amount, source)
  VALUES (NEW.id, 'plan_credit', 1, 'monthly_reset');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Function to consume a credit (called from edge function)
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  v_remaining := (v_credits.plan_credits + v_credits.extra_credits) - v_credits.used_credits;
  
  IF v_remaining <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No credits remaining');
  END IF;
  
  UPDATE user_credits SET used_credits = used_credits + 1, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, type, amount, source)
  VALUES (p_user_id, 'video_usage', -1, 'video_generation');
  
  RETURN json_build_object(
    'success', true,
    'remaining', v_remaining - 1,
    'used', v_credits.used_credits + 1,
    'total', v_credits.plan_credits + v_credits.extra_credits
  );
END;
$$;

-- Function to add extra credits
CREATE OR REPLACE FUNCTION public.add_extra_credits(p_user_id UUID, p_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits user_credits%ROWTYPE;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF v_credits.plan_type = 'free' THEN
    RETURN json_build_object('success', false, 'error', 'Active subscription required');
  END IF;
  
  UPDATE user_credits SET extra_credits = extra_credits + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, type, amount, source)
  VALUES (p_user_id, 'extra_purchase', p_amount, 'credit_pack');
  
  RETURN json_build_object('success', true, 'extra_credits', v_credits.extra_credits + p_amount);
END;
$$;

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages projects" ON public.projects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos" ON public.videos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON public.videos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages videos" ON public.videos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes for scalability
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_project_id ON public.videos(project_id);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_pixi_handoff_tokens_user_id ON public.pixi_handoff_tokens(user_id);
CREATE INDEX idx_pixi_handoff_tokens_token ON public.pixi_handoff_tokens(token);

-- Role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- User roles table (separate from profiles per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: admins can manage all roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role manages roles" ON public.user_roles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Admin check function for edge functions
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(p_user_id, 'admin')
$$;

-- Index
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

ALTER TABLE public.profiles
ADD COLUMN whatsapp_number TEXT,
ADD COLUMN whatsapp_verified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_profiles_whatsapp ON public.profiles(whatsapp_number);

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

ALTER TABLE public.user_credits ADD COLUMN IF NOT EXISTS is_unlimited boolean NOT NULL DEFAULT false;

-- Update consume_credit to skip deduction for unlimited users
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits user_credits%ROWTYPE;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Unlimited users always succeed without consuming credits
  IF v_credits.is_unlimited = true THEN
    RETURN json_build_object(
      'success', true,
      'remaining', -1,
      'used', v_credits.used_credits,
      'total', -1,
      'unlimited', true
    );
  END IF;
  
  v_remaining := (v_credits.plan_credits + v_credits.extra_credits) - v_credits.used_credits;
  
  IF v_remaining <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No credits remaining');
  END IF;
  
  UPDATE user_credits SET used_credits = used_credits + 1, updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, type, amount, source)
  VALUES (p_user_id, 'video_usage', -1, 'video_generation');
  
  RETURN json_build_object(
    'success', true,
    'remaining', v_remaining - 1,
    'used', v_credits.used_credits + 1,
    'total', v_credits.plan_credits + v_credits.extra_credits
  );
END;
$function$;

-- Customers table for Sumit integration
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  whatsapp_number text,
  sumit_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer record" ON public.customers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages customers" ON public.customers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sumit_transaction_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ILS',
  status text NOT NULL DEFAULT 'pending',
  payment_type text NOT NULL DEFAULT 'subscription',
  plan_key text,
  billing_cycle text,
  credits integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages payments" ON public.payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Credit purchases table
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits integer NOT NULL,
  payment_id uuid REFERENCES public.payments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages purchases" ON public.credit_purchases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create a security-definer function to check admin by email
-- This queries user_roles via auth.users email, avoiding hardcoded emails in code
CREATE OR REPLACE FUNCTION public.is_admin_by_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.email = p_email
      AND ur.role = 'admin'
  )
$$;

-- Create a function that ensures admin users have unlimited credits
-- Called by edge functions after identifying an admin
CREATE OR REPLACE FUNCTION public.ensure_admin_credits(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update user_credits to unlimited enterprise
  UPDATE public.user_credits
  SET is_unlimited = true,
      plan_type = 'enterprise',
      plan_credits = 80,
      updated_at = now()
  WHERE user_id = p_user_id
    AND (is_unlimited = false OR plan_type != 'enterprise');

  -- Ensure active subscription reflects enterprise
  UPDATE public.subscriptions
  SET plan_type = 'enterprise',
      monthly_credits = 80,
      status = 'active'
  WHERE user_id = p_user_id
    AND status = 'active'
    AND plan_type != 'enterprise';
END;
$$;

-- Add title and thumbnail_url to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create project_shares table
CREATE TABLE IF NOT EXISTS public.project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_with_email text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  permission text NOT NULL DEFAULT 'viewer',
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Owners manage project shares"
  ON public.project_shares FOR ALL TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

-- Service role full access
CREATE POLICY "Service role manages project shares"
  ON public.project_shares FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anyone can read shares by token (for public/link access)
CREATE POLICY "Public can read by token"
  ON public.project_shares FOR SELECT TO anon
  USING (visibility IN ('link', 'public'));

-- Add project_id to user_files so files can belong to projects
ALTER TABLE public.user_files ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add version tracking to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS parent_video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL;

-- Add AI metadata columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS content_type text DEFAULT NULL;

-- Referral codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages referral_codes" ON public.referral_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'clicked',
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals as referrer" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id);

CREATE POLICY "Service role manages referrals" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Referral rewards table
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_type text NOT NULL DEFAULT 'extra_credits',
  reward_value integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON public.referral_rewards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rewards" ON public.referral_rewards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, referral_code)
  VALUES (NEW.id, 'PIXI' || upper(substr(md5(NEW.id::text || now()::text), 1, 8)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Add UPDATE policy for videos so users can rename/update their own videos
CREATE POLICY "Users can update own videos"
ON public.videos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for videos (soft delete via status update already works via UPDATE policy, but adding for completeness)
CREATE POLICY "Users can delete own videos"
ON public.videos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add UPDATE policy for projects so users can rename/update their own projects  
CREATE POLICY "Users can delete own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
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
-- Fix: Replace the policy that references auth.users (causes "permission denied for table users")
DROP POLICY IF EXISTS "Authenticated can read shares by token" ON public.project_shares;

CREATE POLICY "Authenticated can read shares by token"
ON public.project_shares
FOR SELECT
TO authenticated
USING (
  (visibility = ANY (ARRAY['link'::text, 'public'::text]))
  OR (shared_by = auth.uid())
  OR (shared_with_email = auth.email())
);
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
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
ALTER TABLE public.file_shares ALTER COLUMN share_token SET DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text);ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
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
ALTER TABLE public.user_videos ADD CONSTRAINT user_videos_video_id_key UNIQUE (video_id);-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

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
