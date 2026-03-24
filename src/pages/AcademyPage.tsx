import { useState } from "react";
import { Link } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, useCourseProgress } from "@/hooks/useAcademy";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, GraduationCap, Clock, BookOpen, User, ArrowRight } from "lucide-react";

type CourseLevel = "beginner" | "intermediate" | "advanced";
type LevelFilter = "all" | CourseLevel;

const levelColors: Record<CourseLevel, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/30",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  advanced: "bg-red-500/10 text-red-500 border-red-500/30",
};

const levelLabels = (isRTL: boolean): Record<CourseLevel, string> => ({
  beginner: isRTL ? "מתחיל" : "Beginner",
  intermediate: isRTL ? "בינוני" : "Intermediate",
  advanced: isRTL ? "מתקדם" : "Advanced",
});

const filterLabels = (isRTL: boolean): Record<LevelFilter, string> => ({
  all: isRTL ? "הכל" : "All",
  beginner: isRTL ? "מתחיל" : "Beginner",
  intermediate: isRTL ? "בינוני" : "Intermediate",
  advanced: isRTL ? "מתקדם" : "Advanced",
});

export default function AcademyPage() {
  const { direction, isRTL } = useDirection();
  const { user } = useAuth();
  const { data: courses, isLoading } = useCourses();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  // Translation helper
  const t = (key: string): string => {
    const translations: Record<string, { en: string; he: string }> = {
      "academy.title": { en: "Pixi Academy", he: "אקדמיית פיקסי" },
      "academy.subtitle": {
        en: "Master AI video creation with expert-led courses",
        he: "שלוט ביצירת סרטוני AI עם קורסים מקצועיים",
      },
      "academy.minutes": { en: "min", he: "דקות" },
      "academy.lessons": { en: "lessons", he: "שיעורים" },
      "academy.viewCourse": { en: "View Course", he: "צפה בקורס" },
      "academy.noCourses": { en: "No courses available", he: "אין קורסים זמינים" },
      "academy.noCoursesDesc": {
        en: "Check back soon for new courses",
        he: "חזור בקרוב לקורסים חדשים",
      },
    };
    return translations[key]?.[isRTL ? "he" : "en"] || key;
  };

  // Filter courses by level
  const filteredCourses = courses?.filter((course) => {
    if (levelFilter === "all") return true;
    return course.level === levelFilter;
  }) || [];

  // Calculate total lessons for a course
  const getTotalLessons = (course: any): number => {
    return course.course_modules?.reduce(
      (sum: number, module: any) => sum + (module.course_lessons?.length || 0),
      0
    ) || 0;
  };

  const filters: LevelFilter[] = ["all", "beginner", "intermediate", "advanced"];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir={direction}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {t("academy.title")}
            </span>
          </div>
          <h1 className="text-4xl font-cal-sans text-foreground mb-3">
            {t("academy.title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("academy.subtitle")}
          </p>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {filters.map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                levelFilter === level
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filterLabels(isRTL)[level]}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Course grid */}
        {!isLoading && courses && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const totalLessons = getTotalLessons(course);

              return (
                <Card
                  key={course.id}
                  variant="glass"
                  className="overflow-hidden shadow-luxury-md animate-luxury-fade-up group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Cover image */}
                  {course.cover_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={course.cover_image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted/50 flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={levelColors[course.level as CourseLevel]}
                      >
                        {levelLabels(isRTL)[course.level as CourseLevel]}
                      </Badge>
                      {course.category && (
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-cal-sans text-foreground">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.duration_minutes} {t("academy.minutes")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {totalLessons} {t("academy.lessons")}
                      </span>
                      {course.instructor_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {course.instructor_name}
                        </span>
                      )}
                    </div>

                    {/* View Course button */}
                    <Link to={`/academy/${course.slug}`}>
                      <Button
                        variant="luxury-outline"
                        className="w-full gap-2 mt-2"
                      >
                        {t("academy.viewCourse")}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!courses || filteredCourses.length === 0) && (
          <Card variant="glass" className="p-16 text-center shadow-luxury-md">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40 animate-float" />
            <p className="text-lg text-muted-foreground">
              {t("academy.noCourses")}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {t("academy.noCoursesDesc")}
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
