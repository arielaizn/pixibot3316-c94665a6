import { useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse, useCourseProgress, useMarkLessonComplete, type CourseLesson } from "@/hooks/useAcademy";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import Navbar from "@/components/Navbar";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Play, FileText, ArrowLeft, ArrowRight, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function LessonViewerPage() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();
  const navigate = useNavigate();
  const { t, isRTL, direction } = useDirection();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch course and progress data
  const { data: course, isLoading: courseLoading } = useCourse(courseSlug || "");
  const { data: progressData } = useCourseProgress(course?.id);
  const markMutation = useMarkLessonComplete();

  // Flatten all lessons across modules into a single sorted array
  const allLessons = useMemo(() => {
    if (!course?.course_modules) return [];
    return course.course_modules
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap(m => (m.course_lessons || []).sort((a, b) => a.sort_order - b.sort_order));
  }, [course]);

  // Find current lesson and navigation
  const currentIndex = allLessons.findIndex(l => l.slug === lessonSlug);
  const currentLesson = allLessons[currentIndex] || null;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Find which module the current lesson belongs to
  const currentModule = course?.course_modules?.find(m =>
    m.course_lessons?.some(l => l.slug === lessonSlug)
  );

  // Progress calculation
  const completedCount = progressData?.filter(p => p.completed).length || 0;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const isCurrentCompleted = progressData?.some(p => p.lesson_id === currentLesson?.id && p.completed) || false;

  // Mark complete handler with confetti
  const handleMarkComplete = useCallback(() => {
    if (!currentLesson) return;
    const newCompleted = !isCurrentCompleted;
    markMutation.mutate(
      { lessonId: currentLesson.id, completed: newCompleted },
      {
        onSuccess: () => {
          if (newCompleted) {
            // Fire confetti!
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#22c55e", "#FFD700", "#FF6B6B", "#3B82F6", "#A855F7"],
            });
          }
        },
      }
    );
  }, [currentLesson, isCurrentCompleted, markMutation]);

  // Loading state
  if (courseLoading) {
    return (
      <div className="flex min-h-screen bg-background" dir={direction}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="flex min-h-screen bg-background" dir={direction}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-cal-sans text-foreground">{t("academy.courseNotFound")}</h1>
            <Link to="/academy">
              <Button variant="luxury">
                {isRTL ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
                {t("academy.backToAcademy")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Lesson not found
  if (!currentLesson) {
    return (
      <div className="flex min-h-screen bg-background" dir={direction}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-cal-sans text-foreground">{t("academy.lessonNotFound")}</h1>
            <Link to={`/academy/${courseSlug}`}>
              <Button variant="luxury">
                {isRTL ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
                {t("academy.backToCourse")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Navbar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <aside
          className={`fixed top-0 bottom-0 ${isRTL ? "right-0" : "left-0"} z-30 w-80 flex flex-col border-e border-border bg-card transition-transform duration-200 lg:relative lg:translate-x-0 lg:flex-shrink-0 ${
            sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
          }`}
        >
          {/* Course header */}
          <div className="p-4 border-b border-border">
            <Link
              to={`/academy/${courseSlug}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              {isRTL ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
              {t("academy.backToCourse")}
            </Link>
            <h3 className="font-cal-sans text-foreground text-sm line-clamp-1">{course.title}</h3>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("academy.progress")}</span>
                <span className="font-semibold text-primary">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </div>

          {/* Course outline (scrollable) */}
          <div className="flex-1 overflow-y-auto p-2">
            {course.course_modules
              ?.sort((a, b) => a.sort_order - b.sort_order)
              .map(module => (
                <div key={module.id} className="mb-3">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {module.title}
                  </div>
                  {module.course_lessons
                    ?.sort((a, b) => a.sort_order - b.sort_order)
                    .map(lesson => {
                      const isCurrent = lesson.slug === lessonSlug;
                      const isCompleted = progressData?.some(p => p.lesson_id === lesson.id && p.completed);
                      return (
                        <Link
                          key={lesson.id}
                          to={`/academy/${courseSlug}/lesson/${lesson.slug}`}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isCurrent
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <div
                              className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                                isCurrent ? "border-primary" : "border-muted-foreground/30"
                              }`}
                            />
                          )}
                          <span className="flex-1 line-clamp-1">{lesson.title}</span>
                          <span className="text-xs opacity-60">{lesson.duration_minutes}m</span>
                        </Link>
                      );
                    })}
                </div>
              ))}
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar with menu button (mobile) */}
          <div className="flex items-center gap-3 p-4 border-b border-border lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-foreground line-clamp-1">{currentLesson?.title}</span>
          </div>

          {/* Video area */}
          <div className="w-full bg-black">
            {currentLesson?.video_url ? (
              <div className="max-w-5xl mx-auto">
                <PixiVideoPlayer
                  src={getVideoPublicUrl(currentLesson.video_url)}
                  title={currentLesson.title}
                />
              </div>
            ) : (
              <div className="max-w-5xl mx-auto aspect-video flex items-center justify-center bg-muted/20">
                <FileText className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Content below video */}
          <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
            {/* Module name + lesson title */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">{currentModule?.title}</p>
              <h1 className="text-2xl md:text-3xl font-cal-sans text-foreground">{currentLesson?.title}</h1>
              {currentLesson?.description && (
                <p className="text-muted-foreground mt-3 leading-relaxed">{currentLesson.description}</p>
              )}
            </div>

            {/* Navigation bar */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
              {/* Previous button */}
              <Button
                variant="luxury-outline"
                disabled={!prevLesson}
                onClick={() => prevLesson && navigate(`/academy/${courseSlug}/lesson/${prevLesson.slug}`)}
              >
                {isRTL ? <ChevronRight className="h-4 w-4 me-1" /> : <ChevronLeft className="h-4 w-4 me-1" />}
                {t("academy.previous")}
              </Button>

              {/* Mark as completed / Completed button */}
              <Button
                variant={isCurrentCompleted ? "luxury-outline" : "luxury"}
                className="gap-2"
                onClick={handleMarkComplete}
                disabled={markMutation.isPending}
              >
                {markMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrentCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : null}
                {isCurrentCompleted ? t("academy.markedComplete") : t("academy.markComplete")}
              </Button>

              {/* Next button */}
              <Button
                variant="luxury-outline"
                disabled={!nextLesson}
                onClick={() => nextLesson && navigate(`/academy/${courseSlug}/lesson/${nextLesson.slug}`)}
              >
                {t("academy.next")}
                {isRTL ? <ChevronLeft className="h-4 w-4 ms-1" /> : <ChevronRight className="h-4 w-4 ms-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
