import { useParams, Link, useNavigate } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse, useCourseProgress } from "@/hooks/useAcademy";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, GraduationCap, Clock, BookOpen, User, ArrowRight, ArrowLeft, CheckCircle2, Play, FileText } from "lucide-react";

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/30",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  advanced: "bg-red-500/10 text-red-500 border-red-500/30",
};

export default function CourseDetailPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { isRTL, t } = useDirection();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: course, isLoading, error } = useCourse(courseSlug);
  const { data: progressData } = useCourseProgress(course?.id);

  // Calculate progress
  const allLessons = course?.course_modules?.flatMap(m => m.course_lessons || []) || [];
  const totalLessons = allLessons.length;
  const completedCount = progressData?.filter(p => p.completed).length || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Find first lesson or first uncompleted lesson
  const firstUncompletedLesson = allLessons.find(
    lesson => !progressData?.some(p => p.lesson_id === lesson.id && p.completed)
  );
  const firstLesson = progressPercent > 0 && firstUncompletedLesson ? firstUncompletedLesson : allLessons[0];
  const firstLessonUrl = firstLesson ? `/academy/${course?.slug}/lesson/${firstLesson.slug}` : "#";

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}${isRTL ? "ש" : "h"} ${mins}${isRTL ? "ד" : "m"}`;
    } else if (hours > 0) {
      return `${hours}${isRTL ? " שעות" : "h"}`;
    }
    return `${mins}${isRTL ? " דקות" : "m"}`;
  };

  const totalHours = course?.duration_minutes ? formatDuration(course.duration_minutes) : "0m";

  // Parse learning goals
  const goals = course?.learning_goals
    ? course.learning_goals.split("\n").filter(Boolean)
    : [];

  // Level label
  const levelLabel = course?.level
    ? isRTL
      ? course.level === "beginner"
        ? "מתחילים"
        : course.level === "intermediate"
        ? "בינוני"
        : "מתקדמים"
      : course.level.charAt(0).toUpperCase() + course.level.slice(1)
    : "";

  // Get first module ID for default accordion state
  const firstModuleId = course?.course_modules?.[0]?.id || "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-4 py-24">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-4 py-24">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-cal-sans text-foreground">
              {isRTL ? "הקורס לא נמצא" : "Course Not Found"}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? "הקורס שחיפשת לא קיים או הוסר." : "The course you're looking for doesn't exist or has been removed."}
            </p>
            <Link to="/academy">
              <Button variant="luxury" className="gap-2">
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isRTL ? "חזרה לאקדמיה" : "Back to Academy"}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        {/* Back link */}
        <Link
          to="/academy"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {isRTL ? "חזרה לאקדמיה" : "Back to Academy"}
        </Link>

        <div className="space-y-8">
          {/* Hero Card */}
          <Card variant="glass" className="overflow-hidden shadow-luxury-lg animate-luxury-fade-up">
            {/* Cover image */}
            {course.cover_image_url ? (
              <div className="w-full aspect-[21/9] overflow-hidden">
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-[21/9] bg-muted/50 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            <div className="p-8 space-y-5">
              {/* Level badge */}
              <Badge variant="outline" className={levelColors[course.level] || ""}>
                {levelLabel}
              </Badge>

              {/* Title and description */}
              <h1 className="text-3xl md:text-4xl font-cal-sans text-foreground">
                {course.title}
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                {course.description}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {course.duration_minutes} {isRTL ? "דקות" : "minutes"}
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {totalLessons} {isRTL ? "שיעורים" : "lessons"}
                </span>
                {course.instructor_name && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {course.instructor_name}
                  </span>
                )}
              </div>

              {/* Progress bar (if user has started) */}
              {user && progressPercent > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isRTL ? "התקדמות" : "Progress"}
                    </span>
                    <span className="font-semibold text-primary">
                      {progressPercent}%
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}

              {/* Start/Continue button */}
              <Link to={firstLessonUrl}>
                <Button variant="luxury" size="luxury-lg" className="gap-2">
                  <Play className="h-5 w-5" />
                  {progressPercent > 0
                    ? isRTL
                      ? "המשך ללמוד"
                      : "Continue Learning"
                    : isRTL
                    ? "התחל ללמוד"
                    : "Start Learning"}
                </Button>
              </Link>
            </div>
          </Card>

          {/* What you'll learn section */}
          {course.learning_goals && goals.length > 0 && (
            <Card
              variant="glass"
              className="p-8 shadow-luxury-md animate-luxury-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <h2 className="text-2xl font-cal-sans text-foreground mb-6">
                {isRTL ? "מה תלמדו" : "What You'll Learn"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.map((goal, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{goal}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Course Curriculum section */}
          <Card
            variant="glass"
            className="p-8 shadow-luxury-md animate-luxury-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-cal-sans text-foreground">
                {isRTL ? "תכנית הלימודים" : "Course Curriculum"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {totalLessons} {isRTL ? "שיעורים" : "lessons"} • {totalHours}
              </span>
            </div>

            <Accordion type="multiple" defaultValue={firstModuleId ? [firstModuleId] : []}>
              {course.course_modules?.map((module) => {
                const moduleLessons = module.course_lessons || [];
                return (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                      <span className="flex items-center gap-2">
                        {module.title}
                        <span className="text-sm text-muted-foreground font-normal">
                          ({moduleLessons.length} {isRTL ? "שיעורים" : "lessons"})
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {moduleLessons.map((lesson) => {
                          const isCompleted = progressData?.some(
                            (p) => p.lesson_id === lesson.id && p.completed
                          );
                          return (
                            <Link
                              key={lesson.id}
                              to={`/academy/${course.slug}/lesson/${lesson.slug}`}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 group"
                            >
                              {/* Completion circle */}
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                              )}

                              {/* Type icon */}
                              {lesson.lesson_type === "video" ? (
                                <Play className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}

                              {/* Title */}
                              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">
                                {lesson.title}
                              </span>

                              {/* Duration */}
                              <span className="text-xs text-muted-foreground">
                                {lesson.duration_minutes} {isRTL ? "דק׳" : "min"}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Card>
        </div>
      </main>
    </div>
  );
}
