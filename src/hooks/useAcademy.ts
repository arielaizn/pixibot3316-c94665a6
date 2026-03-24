import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDirection } from "@/contexts/DirectionContext";

// ── Types ──────────────────────────────────────

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  level: string;
  category: string;
  instructor_name: string;
  learning_goals: string;
  duration_minutes: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  course_modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  course_lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string;
  video_url: string | null;
  duration_minutes: number;
  lesson_type: string;
  sort_order: number;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

// ── User Hooks ─────────────────────────────────

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses" as any)
        .select("*, course_modules(id, course_lessons(id))")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[]) as (Course & {
        course_modules: { id: string; course_lessons: { id: string }[] }[];
      })[];
    },
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses" as any)
        .select(
          "*, course_modules(id, title, sort_order, created_at, course_id, course_lessons(id, module_id, slug, title, description, video_url, duration_minutes, lesson_type, sort_order, created_at))"
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // Sort modules and lessons by sort_order
      const course = data as any as Course;
      if (course.course_modules) {
        course.course_modules.sort((a, b) => a.sort_order - b.sort_order);
        course.course_modules.forEach((m) => {
          if (m.course_lessons) {
            m.course_lessons.sort((a, b) => a.sort_order - b.sort_order);
          }
        });
      }
      return course;
    },
  });
}

export function useCourseProgress(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["course-progress", courseId, user?.id],
    enabled: !!courseId && !!user,
    queryFn: async () => {
      // Get all lesson IDs for this course
      const { data: modules, error: mErr } = await supabase
        .from("course_modules" as any)
        .select("id")
        .eq("course_id", courseId!);
      if (mErr) throw mErr;
      const moduleIds = ((modules as any[]) || []).map((m) => m.id);
      if (moduleIds.length === 0) return [] as LessonProgress[];

      const { data: lessons, error: lErr } = await supabase
        .from("course_lessons" as any)
        .select("id")
        .in("module_id", moduleIds);
      if (lErr) throw lErr;
      const lessonIds = ((lessons as any[]) || []).map((l) => l.id);
      if (lessonIds.length === 0) return [] as LessonProgress[];

      const { data, error } = await supabase
        .from("user_lesson_progress" as any)
        .select("*")
        .eq("user_id", user!.id)
        .in("lesson_id", lessonIds);
      if (error) throw error;
      return (data as any[]) as LessonProgress[];
    },
  });
}

export function useMarkLessonComplete() {
  const { user } = useAuth();
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      completed,
    }: {
      lessonId: string;
      completed: boolean;
    }) => {
      if (completed) {
        const { error } = await supabase.from("user_lesson_progress" as any).upsert(
          {
            user_id: user!.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_lesson_progress" as any)
          .delete()
          .eq("user_id", user!.id)
          .eq("lesson_id", lessonId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { completed }) => {
      qc.invalidateQueries({ queryKey: ["course-progress"] });
      if (completed) {
        toast({ title: isRTL ? "השיעור הושלם!" : "Lesson completed!" });
      }
    },
    onError: (e: any) => {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}

// ── Admin Hooks ────────────────────────────────

export function useAdminCourses() {
  return useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[]) as Course[];
    },
  });
}

export function useAdminCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: ["admin-course-detail", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses" as any)
        .select(
          "*, course_modules(id, title, sort_order, created_at, course_id, course_lessons(id, module_id, slug, title, description, video_url, duration_minutes, lesson_type, sort_order, created_at))"
        )
        .eq("id", courseId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const course = data as any as Course;
      if (course.course_modules) {
        course.course_modules.sort((a, b) => a.sort_order - b.sort_order);
        course.course_modules.forEach((m) => {
          if (m.course_lessons) {
            m.course_lessons.sort((a, b) => a.sort_order - b.sort_order);
          }
        });
      }
      return course;
    },
  });
}

export function useSaveCourse() {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Course> & { id?: string }) => {
      if (id) {
        const { error } = await supabase
          .from("courses" as any)
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("courses" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: isRTL ? "נשמר בהצלחה" : "Saved successfully" });
    },
    onError: (e: any) => {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCourse() {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("courses" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: isRTL ? "נמחק" : "Deleted" });
    },
  });
}

export function useSaveModule() {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id?: string;
      course_id: string;
      title: string;
      sort_order: number;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("course_modules" as any)
          .update({ title: payload.title, sort_order: payload.sort_order })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("course_modules" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-course-detail"] });
      toast({ title: isRTL ? "נשמר" : "Saved" });
    },
    onError: (e: any) => {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteModule() {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("course_modules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-course-detail"] });
      toast({ title: isRTL ? "נמחק" : "Deleted" });
    },
  });
}

export function useSaveLesson() {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id?: string;
      module_id: string;
      slug: string;
      title: string;
      description?: string;
      video_url?: string | null;
      duration_minutes?: number;
      lesson_type?: string;
      sort_order?: number;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("course_lessons" as any)
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("course_lessons" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-course-detail"] });
      toast({ title: isRTL ? "נשמר" : "Saved" });
    },
    onError: (e: any) => {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLesson() {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("course_lessons" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-course-detail"] });
      toast({ title: isRTL ? "נמחק" : "Deleted" });
    },
  });
}
