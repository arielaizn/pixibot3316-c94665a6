import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCourseDetail, useSaveModule, useDeleteModule, useSaveLesson, useDeleteLesson, type CourseModule, type CourseLesson } from "@/hooks/useAcademy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil, ArrowLeft, ArrowRight, Upload, FileVideo, X, Play, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\u0590-\u05FF]+/g, "-").replace(/^-|-$/g, "");

export default function AdminCourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isRTL } = useDirection();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading } = useAdminCourseDetail(courseId || "");
  const saveModuleMutation = useSaveModule();
  const deleteModuleMutation = useDeleteModule();
  const saveLessonMutation = useSaveLesson();
  const deleteLessonMutation = useDeleteLesson();

  // Module dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSortOrder, setModuleSortOrder] = useState(1);

  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string>("");
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSlug, setLessonSlug] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonType, setLessonType] = useState<"video" | "text">("video");
  const [lessonDuration, setLessonDuration] = useState(10);
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonSortOrder, setLessonSortOrder] = useState(1);
  const [videoUploading, setVideoUploading] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);

  // Open module dialog
  const handleAddModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    const maxSortOrder = Math.max(0, ...(course?.course_modules?.map((m) => m.sort_order) || []));
    setModuleSortOrder(maxSortOrder + 1);
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setModuleTitle(module.title);
    setModuleSortOrder(module.sort_order);
    setModuleDialogOpen(true);
  };

  // Save module
  const handleSaveModule = async () => {
    if (!moduleTitle.trim() || !courseId) return;

    try {
      await saveModuleMutation.mutateAsync({
        id: editingModule?.id,
        course_id: courseId,
        title: moduleTitle,
        sort_order: moduleSortOrder,
      });

      toast({
        title: isRTL ? "מודול נשמר" : "Module saved",
        description: isRTL ? "המודול נשמר בהצלחה" : "Module has been saved successfully",
      });

      setModuleDialogOpen(false);
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "שגיאה בשמירת מודול" : "Error saving module",
        variant: "destructive",
      });
    }
  };

  // Delete module
  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm(isRTL ? "האם למחוק מודול זה?" : "Delete this module?")) return;

    try {
      await deleteModuleMutation.mutateAsync(moduleId);
      toast({
        title: isRTL ? "מודול נמחק" : "Module deleted",
        description: isRTL ? "המודול נמחק בהצלחה" : "Module has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "שגיאה במחיקת מודול" : "Error deleting module",
        variant: "destructive",
      });
    }
  };

  // Open lesson dialog
  const handleAddLesson = (moduleId: string) => {
    setEditingModuleId(moduleId);
    setEditingLesson(null);
    setLessonTitle("");
    setLessonSlug("");
    setLessonDescription("");
    setLessonType("video");
    setLessonDuration(10);
    setLessonVideoUrl("");

    const module = course?.course_modules?.find((m) => m.id === moduleId);
    const maxSortOrder = Math.max(0, ...(module?.course_lessons?.map((l) => l.sort_order) || []));
    setLessonSortOrder(maxSortOrder + 1);

    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: CourseLesson, moduleId: string) => {
    setEditingModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonSlug(lesson.slug);
    setLessonDescription(lesson.description || "");
    setLessonType(lesson.lesson_type);
    setLessonDuration(lesson.duration_minutes);
    setLessonVideoUrl(lesson.video_url || "");
    setLessonSortOrder(lesson.sort_order);
    setLessonDialogOpen(true);
  };

  // Auto-generate slug from title
  const handleLessonTitleChange = (value: string) => {
    setLessonTitle(value);
    if (!editingLesson) {
      setLessonSlug(generateSlug(value));
    }
  };

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setVideoUploading(true);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${user.id}/academy/lessons/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("user-files")
        .getPublicUrl(filePath);

      setLessonVideoUrl(urlData.publicUrl);

      toast({
        title: isRTL ? "הועלה בהצלחה" : "Uploaded successfully",
        description: isRTL ? "הסרטון הועלה בהצלחה" : "Video uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "שגיאה בהעלאת הסרטון" : "Error uploading video",
        variant: "destructive",
      });
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  // Save lesson
  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !lessonSlug.trim() || !editingModuleId) return;

    try {
      await saveLessonMutation.mutateAsync({
        id: editingLesson?.id,
        module_id: editingModuleId,
        title: lessonTitle,
        slug: lessonSlug,
        description: lessonDescription,
        lesson_type: lessonType,
        duration_minutes: lessonDuration,
        video_url: lessonVideoUrl || null,
        sort_order: lessonSortOrder,
      });

      toast({
        title: isRTL ? "שיעור נשמר" : "Lesson saved",
        description: isRTL ? "השיעור נשמר בהצלחה" : "Lesson has been saved successfully",
      });

      setLessonDialogOpen(false);
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "שגיאה בשמירת שיעור" : "Error saving lesson",
        variant: "destructive",
      });
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(isRTL ? "האם למחוק שיעור זה?" : "Delete this lesson?")) return;

    try {
      await deleteLessonMutation.mutateAsync(lessonId);
      toast({
        title: isRTL ? "שיעור נמחק" : "Lesson deleted",
        description: isRTL ? "השיעור נמחק בהצלחה" : "Lesson has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "שגיאה במחיקת שיעור" : "Error deleting lesson",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-luxury-gold" />
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-luxury-text">
            {isRTL ? "קורס לא נמצא" : "Course not found"}
          </h2>
        </div>
      </AdminLayout>
    );
  }

  const sortedModules = [...(course.course_modules || [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/academy")}
              className="mb-2"
            >
              {isRTL ? (
                <>
                  חזרה לאקדמיה <ArrowRight className="h-4 w-4 mr-2" />
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Academy
                </>
              )}
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-cal-sans text-luxury-text">{course.title}</h2>
              <Badge variant="secondary">{course.level}</Badge>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-6">
          {sortedModules.map((module) => {
            const sortedLessons = [...(module.course_lessons || [])].sort((a, b) => a.sort_order - b.sort_order);

            return (
              <Card key={module.id} variant="glass" className="shadow-luxury-md">
                <div className="p-6">
                  {/* Module header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-luxury-text">{module.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {isRTL ? `סדר ${module.sort_order}` : `Order ${module.sort_order}`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditModule(module)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteModule(module.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Lessons table */}
                  {sortedLessons.length > 0 ? (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-luxury-gold/20">
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              #
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              {isRTL ? "כותרת" : "Title"}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              {isRTL ? "סלאג" : "Slug"}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              {isRTL ? "סוג" : "Type"}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              {isRTL ? "משך" : "Duration"}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              {isRTL ? "סרטון" : "Video"}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-luxury-text/70">
                              {isRTL ? "פעולות" : "Actions"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedLessons.map((lesson) => (
                            <tr key={lesson.id} className="border-b border-luxury-gold/10">
                              <td className="py-3 px-3 text-sm text-luxury-text/70">
                                {lesson.sort_order}
                              </td>
                              <td className="py-3 px-3 text-sm text-luxury-text">
                                {lesson.title}
                              </td>
                              <td className="py-3 px-3 text-xs text-muted-foreground" dir="ltr">
                                {lesson.slug}
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant={lesson.lesson_type === "video" ? "default" : "secondary"} className="text-xs">
                                  {lesson.lesson_type === "video" ? (
                                    <>
                                      <FileVideo className="h-3 w-3 mr-1" />
                                      {isRTL ? "סרטון" : "Video"}
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3 mr-1" />
                                      {isRTL ? "טקסט" : "Text"}
                                    </>
                                  )}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-sm text-luxury-text/70">
                                {lesson.duration_minutes} {isRTL ? "דק'" : "min"}
                              </td>
                              <td className="py-3 px-3">
                                {lesson.video_url ? (
                                  <FileVideo className="h-4 w-4 text-luxury-gold" />
                                ) : (
                                  <span className="text-luxury-text/30">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditLesson(lesson, module.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-luxury-text/50 text-sm">
                      {isRTL ? "אין שיעורים במודול זה" : "No lessons in this module"}
                    </div>
                  )}

                  {/* Add lesson button */}
                  <Button
                    variant="luxury-outline"
                    size="sm"
                    onClick={() => handleAddLesson(module.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isRTL ? "הוסף שיעור" : "Add Lesson"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add module button */}
        <div className="flex justify-center pt-6">
          <Button variant="luxury" onClick={handleAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? "הוסף מודול" : "Add Module"}
          </Button>
        </div>
      </div>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModule
                ? isRTL
                  ? "עריכת מודול"
                  : "Edit Module"
                : isRTL
                ? "מודול חדש"
                : "New Module"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="module-title">
                {isRTL ? "כותרת המודול" : "Module Title"}
              </Label>
              <Input
                id="module-title"
                variant="luxury"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder={isRTL ? "הכנס כותרת" : "Enter title"}
              />
            </div>

            <div>
              <Label htmlFor="module-sort">
                {isRTL ? "סדר מיון" : "Sort Order"}
              </Label>
              <Input
                id="module-sort"
                type="number"
                variant="luxury"
                value={moduleSortOrder}
                onChange={(e) => setModuleSortOrder(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>

            <Button
              variant="luxury"
              className="w-full"
              onClick={handleSaveModule}
              disabled={!moduleTitle.trim() || saveModuleMutation.isPending}
            >
              {saveModuleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRTL ? (
                "שמור"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson
                ? isRTL
                  ? "עריכת שיעור"
                  : "Edit Lesson"
                : isRTL
                ? "שיעור חדש"
                : "New Lesson"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">
                {isRTL ? "כותרת השיעור" : "Lesson Title"}
              </Label>
              <Input
                id="lesson-title"
                variant="luxury"
                value={lessonTitle}
                onChange={(e) => handleLessonTitleChange(e.target.value)}
                placeholder={isRTL ? "הכנס כותרת" : "Enter title"}
              />
            </div>

            <div>
              <Label htmlFor="lesson-slug">{isRTL ? "סלאג" : "Slug"}</Label>
              <Input
                id="lesson-slug"
                variant="luxury"
                dir="ltr"
                value={lessonSlug}
                onChange={(e) => setLessonSlug(e.target.value)}
                placeholder="lesson-slug"
              />
            </div>

            <div>
              <Label htmlFor="lesson-description">
                {isRTL ? "תיאור" : "Description"}
              </Label>
              <Textarea
                id="lesson-description"
                rows={2}
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder={isRTL ? "תיאור השיעור" : "Lesson description"}
              />
            </div>

            <div>
              <Label htmlFor="lesson-type">
                {isRTL ? "סוג השיעור" : "Lesson Type"}
              </Label>
              <Select value={lessonType} onValueChange={(value: "video" | "text") => setLessonType(value)}>
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    {isRTL ? "סרטון" : "Video"}
                  </SelectItem>
                  <SelectItem value="text">
                    {isRTL ? "טקסט" : "Text"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lesson-duration">
                {isRTL ? "משך בדקות" : "Duration in minutes"}
              </Label>
              <Input
                id="lesson-duration"
                type="number"
                variant="luxury"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>

            {/* Video upload section */}
            <div>
              <Label>{isRTL ? "סרטון" : "Video"}</Label>
              <div className="space-y-2">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="luxury-outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                  className="w-full"
                >
                  {videoUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isRTL ? "מעלה..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {isRTL ? "העלה סרטון" : "Upload Video"}
                    </>
                  )}
                </Button>

                {lessonVideoUrl && (
                  <div className="relative">
                    <div className="flex items-center gap-2 p-3 bg-luxury-gold/10 rounded-lg border border-luxury-gold/20">
                      <Play className="h-4 w-4 text-luxury-gold flex-shrink-0" />
                      <span className="text-sm text-luxury-text truncate flex-1">
                        {lessonVideoUrl}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setLessonVideoUrl("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center text-xs text-luxury-text/50">
                  {isRTL ? "או הכנס URL" : "or enter URL"}
                </div>

                <Input
                  variant="luxury"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder={isRTL ? "https://..." : "https://..."}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lesson-sort">
                {isRTL ? "סדר מיון" : "Sort Order"}
              </Label>
              <Input
                id="lesson-sort"
                type="number"
                variant="luxury"
                value={lessonSortOrder}
                onChange={(e) => setLessonSortOrder(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>

            <Button
              variant="luxury"
              className="w-full"
              onClick={handleSaveLesson}
              disabled={!lessonTitle.trim() || !lessonSlug.trim() || saveLessonMutation.isPending}
            >
              {saveLessonMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRTL ? (
                "שמור"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
