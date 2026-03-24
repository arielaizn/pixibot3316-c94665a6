-- =============================================
-- Academy: Courses, Modules, Lessons, Progress
-- =============================================

-- ─── COURSES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  level text NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  category text NOT NULL DEFAULT 'general',
  instructor_name text NOT NULL DEFAULT '',
  learning_goals text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Admins can manage courses') THEN
    CREATE POLICY "Admins can manage courses"
      ON public.courses FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Users can read published courses') THEN
    CREATE POLICY "Users can read published courses"
      ON public.courses FOR SELECT TO authenticated
      USING (is_published = true);
  END IF;
END $$;

-- ─── COURSE MODULES ──────────────────────────
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_modules' AND policyname = 'Admins can manage course_modules') THEN
    CREATE POLICY "Admins can manage course_modules"
      ON public.course_modules FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_modules' AND policyname = 'Users can read modules of published courses') THEN
    CREATE POLICY "Users can read modules of published courses"
      ON public.course_modules FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.courses
          WHERE courses.id = course_modules.course_id
            AND courses.is_published = true
        )
      );
  END IF;
END $$;

-- ─── COURSE LESSONS ──────────────────────────
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text,
  duration_minutes integer NOT NULL DEFAULT 0,
  lesson_type text NOT NULL DEFAULT 'video'
    CHECK (lesson_type IN ('video', 'text', 'exercise')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, slug)
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_lessons' AND policyname = 'Admins can manage course_lessons') THEN
    CREATE POLICY "Admins can manage course_lessons"
      ON public.course_lessons FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_lessons' AND policyname = 'Users can read lessons of published courses') THEN
    CREATE POLICY "Users can read lessons of published courses"
      ON public.course_lessons FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.course_modules m
          JOIN public.courses c ON c.id = m.course_id
          WHERE m.id = course_lessons.module_id
            AND c.is_published = true
        )
      );
  END IF;
END $$;

-- ─── USER LESSON PROGRESS ───────────────────
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can manage own lesson progress') THEN
    CREATE POLICY "Users can manage own lesson progress"
      ON public.user_lesson_progress FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Admins can read all progress') THEN
    CREATE POLICY "Admins can read all progress"
      ON public.user_lesson_progress FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ─── INDEXES ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON public.course_modules(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON public.course_lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON public.user_lesson_progress(lesson_id);
