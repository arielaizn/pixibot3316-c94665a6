import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCourses, useSaveCourse, useDeleteCourse, type Course } from "@/hooks/useAcademy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Pencil, GraduationCap, Upload, Image, X, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/30",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  advanced: "bg-red-500/10 text-red-500 border-red-500/30",
};

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\u0590-\u05FF]+/g, "-").replace(/^-|-$/g, "");

const AdminAcademyPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [level, setLevel] = useState("beginner");
  const [category, setCategory] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: courses, isLoading } = useAdminCourses();
  const saveMutation = useSaveCourse();
  const deleteMutation = useDeleteCourse();

  const togglePublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("courses" as any).update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user!.id}/academy/covers/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(filePath);
      setCoverImageUrl(urlData.publicUrl);
      setUploadedFileName(file.name);
      toast({ title: isRTL ? "התמונה הועלתה בהצלחה" : "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: isRTL ? "שגיאה בהעלאה" : "Upload error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const payload: any = {
      title,
      slug,
      description,
      learning_goals: learningGoals,
      level,
      category,
      instructor_name: instructorName,
      duration_minutes: parseInt(durationMinutes) || 0,
      cover_image_url: coverImageUrl || null,
      sort_order: parseInt(sortOrder) || 0,
      is_published: isPublished,
    };

    if (editing) {
      payload.id = editing.id;
    }

    await saveMutation.mutateAsync(payload);
    closeDialog();
  };

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setSlug("");
    setSlugManuallyEdited(false);
    setDescription("");
    setLearningGoals("");
    setLevel("beginner");
    setCategory("");
    setInstructorName("");
    setDurationMinutes("");
    setCoverImageUrl("");
    setSortOrder("");
    setIsPublished(false);
    setUploadedFileName("");
    setDialogOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setTitle(c.title);
    setSlug(c.slug);
    setSlugManuallyEdited(true);
    setDescription(c.description);
    setLearningGoals(c.learning_goals);
    setLevel(c.level);
    setCategory(c.category);
    setInstructorName(c.instructor_name);
    setDurationMinutes(c.duration_minutes.toString());
    setCoverImageUrl(c.cover_image_url || "");
    setSortOrder(c.sort_order.toString());
    setIsPublished(c.is_published);
    setUploadedFileName("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setUploadedFileName("");
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    setSlugManuallyEdited(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-primary animate-float" />
          <h2 className="text-3xl font-cal-sans text-foreground">
            {isRTL ? "ניהול קורסים" : "Courses Management"}
          </h2>
        </div>
        <Button variant="luxury" onClick={openCreate} className="gap-2 shadow-luxury-md">
          <Plus className="h-4 w-4" />
          {isRTL ? "קורס חדש" : "New Course"}
        </Button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {isRTL
          ? "נהל את כל הקורסים באקדמיה של Pixi. ערוך תכנים, מודולים ושיעורים."
          : "Manage all courses in the Pixi Academy. Edit content, modules, and lessons."}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "תמונה" : "Cover"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "כותרת" : "Title"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "רמה" : "Level"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "קטגוריה" : "Category"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "שיעורים" : "Lessons"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "פורסם" : "Published"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "פעולות" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(courses || []).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {c.cover_image_url ? (
                        <img
                          src={c.cover_image_url}
                          alt={c.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{c.title}</p>
                        {c.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${levelColors[c.level] || levelColors.beginner}`}>
                        {c.level === "beginner" && (isRTL ? "מתחיל" : "Beginner")}
                        {c.level === "intermediate" && (isRTL ? "בינוני" : "Intermediate")}
                        {c.level === "advanced" && (isRTL ? "מתקדם" : "Advanced")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={c.is_published}
                        onCheckedChange={(v) => togglePublished.mutate({ id: c.id, published: v })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="luxury-outline" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="luxury-outline"
                          onClick={() => navigate(`/admin/academy/${c.id}`)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="luxury-outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!courses || courses.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40 animate-float" />
                      <p className="text-muted-foreground">
                        {isRTL ? "אין קורסים עדיין" : "No courses yet"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRTL
                          ? "צור קורס חדש כדי להתחיל לבנות את האקדמיה"
                          : "Create a new course to start building the academy"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-luxury-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cal-sans flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {editing
                ? isRTL ? "עריכת קורס" : "Edit Course"
                : isRTL ? "קורס חדש" : "New Course"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRTL ? "שם הקורס" : "Course Title"}</Label>
              <Input
                variant="luxury"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={isRTL ? "למשל: מבוא לאנימציה דיגיטלית" : "e.g. Introduction to Digital Animation"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "Slug (קישור)" : "Slug"}</Label>
              <Input
                variant="luxury"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                dir="ltr"
                placeholder="intro-to-digital-animation"
              />
              <p className="text-xs text-muted-foreground">
                {isRTL ? "נוצר אוטומטית מהכותרת, ניתן לערוך ידנית" : "Auto-generated from title, can be edited manually"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "תיאור" : "Description"}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={isRTL ? "תיאור קצר של הקורס..." : "Short description of the course..."}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "מטרות למידה" : "Learning Goals"}</Label>
              <Textarea
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                rows={4}
                placeholder={isRTL ? "מטרה אחת בכל שורה" : "One goal per line"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "רמה" : "Level"}</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger variant="luxury">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{isRTL ? "מתחיל" : "Beginner"}</SelectItem>
                  <SelectItem value="intermediate">{isRTL ? "בינוני" : "Intermediate"}</SelectItem>
                  <SelectItem value="advanced">{isRTL ? "מתקדם" : "Advanced"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "קטגוריה" : "Category"}</Label>
              <Input
                variant="luxury"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={isRTL ? "למשל: אנימציה" : "e.g. Animation"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "שם המרצה" : "Instructor Name"}</Label>
              <Input
                variant="luxury"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder={isRTL ? "שם המרצה" : "Instructor name"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "משך בדקות" : "Duration (minutes)"}</Label>
              <Input
                variant="luxury"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="60"
              />
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>{isRTL ? "תמונת כיסוי" : "Cover Image"}</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  e.target.value = "";
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="luxury-outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isRTL ? "העלאת תמונה" : "Upload Image"}
                </Button>
                {uploadedFileName && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Image className="h-3.5 w-3.5" />
                    {uploadedFileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{isRTL ? "או הדבק קישור:" : "or paste URL:"}</span>
              </div>
              <Input
                variant="luxury"
                value={coverImageUrl}
                onChange={(e) => { setCoverImageUrl(e.target.value); setUploadedFileName(""); }}
                dir="ltr"
                placeholder="https://..."
              />
              {coverImageUrl && (
                <div className="space-y-2">
                  <img src={coverImageUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                  <button
                    onClick={() => { setCoverImageUrl(""); setUploadedFileName(""); }}
                    className="flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <X className="h-3 w-3" />
                    {isRTL ? "הסר תמונה" : "Remove image"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "מיון (sort order)" : "Sort Order"}</Label>
              <Input
                variant="luxury"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label>{isRTL ? "פורסם" : "Published"}</Label>
            </div>

            <Button
              variant="luxury"
              className="w-full shadow-luxury-md"
              onClick={handleSave}
              disabled={!title.trim() || !slug.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isRTL ? "שמור" : "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAcademyPage;
