import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { useDirection } from "@/contexts/DirectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Trash2, Pencil, Trophy, Upload, FileVideo, X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  details_url: string | null;
  video_url: string | null;
}

function getChallengeStatus(c: ChallengeItem, isRTL: boolean) {
  const now = new Date();
  const start = new Date(c.start_date);
  const end = new Date(c.end_date);

  if (!c.is_active) {
    return {
      label: isRTL ? "מושבת" : "Disabled",
      className: "bg-destructive/10 text-destructive border-destructive/30",
    };
  }
  if (now < start) {
    return {
      label: isRTL ? "עתידי" : "Upcoming",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    };
  }
  if (now >= start && now <= end) {
    return {
      label: isRTL ? "פעיל" : "Active",
      className: "bg-green-500/10 text-green-500 border-green-500/30",
    };
  }
  return {
    label: isRTL ? "הסתיים" : "Ended",
    className: "bg-muted text-muted-foreground border-border",
  };
}

const AdminChallengesPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChallengeItem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [detailsUrl, setDetailsUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ChallengeItem[];
    },
  });

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    try {
      const filePath = `${user!.id}/challenges/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(filePath);
      setVideoUrl(urlData.publicUrl);
      setUploadedFileName(file.name);
      toast({ title: isRTL ? "הסרטון הועלה בהצלחה" : "Video uploaded successfully" });
    } catch (err: any) {
      toast({ title: isRTL ? "שגיאה בהעלאה" : "Upload error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_active: isActive,
        details_url: detailsUrl || null,
        video_url: videoUrl || null,
      };
      if (editing) {
        const { error } = await supabase
          .from("challenges" as any)
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("challenges" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast({ title: isRTL ? "נשמר בהצלחה" : "Saved successfully" });
      closeDialog();
    },
    onError: (e: any) => {
      toast({ title: isRTL ? "שגיאה" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenges" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-challenges"] });
      toast({ title: isRTL ? "נמחק" : "Deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("challenges" as any)
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-challenges"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    const now = new Date();
    setStartDate(now.toISOString().slice(0, 16));
    const week = new Date(now.getTime() + 7 * 86400000);
    setEndDate(week.toISOString().slice(0, 16));
    setIsActive(true);
    setDetailsUrl("");
    setVideoUrl("");
    setUploadedFileName("");
    setDialogOpen(true);
  };

  const openEdit = (c: ChallengeItem) => {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description);
    setStartDate(new Date(c.start_date).toISOString().slice(0, 16));
    setEndDate(new Date(c.end_date).toISOString().slice(0, 16));
    setIsActive(c.is_active);
    setDetailsUrl(c.details_url || "");
    setVideoUrl(c.video_url || "");
    setUploadedFileName("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setUploadedFileName("");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary animate-float" />
          <h2 className="text-3xl font-cal-sans text-foreground">
            {isRTL ? "ניהול אתגרים" : "Challenges Management"}
          </h2>
        </div>
        <Button variant="luxury" onClick={openCreate} className="gap-2 shadow-luxury-md">
          <Plus className="h-4 w-4" />
          {isRTL ? "אתגר חדש" : "New Challenge"}
        </Button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {isRTL
          ? "אתגרים מעניקים קרדיטים בלתי מוגבלים לכל המשתמשים בפלטפורמה לפרק זמן מוגדר."
          : "Challenges grant unlimited credits to all platform users for a defined time period."}
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
                    {isRTL ? "כותרת" : "Title"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "סטטוס" : "Status"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "מדיה" : "Media"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "התחלה" : "Start"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "סיום" : "End"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "פעיל" : "Active"}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-foreground">
                    {isRTL ? "פעולות" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(challenges || []).map((c) => {
                  const status = getChallengeStatus(c, isRTL);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0">
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
                        <Badge variant="outline" className={`text-xs ${status.className}`}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.video_url && (
                            <span className="text-primary" title={isRTL ? "סרטון" : "Video"}>
                              <FileVideo className="h-4 w-4" />
                            </span>
                          )}
                          {c.details_url && (
                            <span className="text-blue-500" title={isRTL ? "קישור" : "Link"}>
                              <ExternalLink className="h-4 w-4" />
                            </span>
                          )}
                          {!c.video_url && !c.details_url && (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(c.start_date)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(c.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={c.is_active}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, active: v })}
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
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!challenges || challenges.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40 animate-float" />
                      <p className="text-muted-foreground">
                        {isRTL ? "אין אתגרים עדיין" : "No challenges yet"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRTL
                          ? "צור אתגר חדש כדי להעניק קרדיטים בלתי מוגבלים לכל המשתמשים"
                          : "Create a new challenge to grant unlimited credits to all users"}
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
              <Trophy className="h-5 w-5 text-primary" />
              {editing
                ? isRTL ? "עריכת אתגר" : "Edit Challenge"
                : isRTL ? "אתגר חדש" : "New Challenge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRTL ? "שם האתגר" : "Challenge Name"}</Label>
              <Input
                variant="luxury"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isRTL ? "למשל: שבוע יצירה חופשית" : "e.g. Free Creation Week"}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "תיאור" : "Description"}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={isRTL ? "תיאור קצר של האתגר..." : "Short description of the challenge..."}
              />
            </div>

            {/* Details URL */}
            <div className="space-y-2">
              <Label>{isRTL ? "קישור לעמוד פרטים" : "Details Page URL"}</Label>
              <Input
                variant="luxury"
                value={detailsUrl}
                onChange={(e) => setDetailsUrl(e.target.value)}
                dir="ltr"
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                {isRTL ? "קישור לעמוד חיצוני עם כל הפרטים על האתגר" : "Link to an external page with full challenge details"}
              </p>
            </div>

            {/* Video Upload */}
            <div className="space-y-2">
              <Label>{isRTL ? "סרטון" : "Video"}</Label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file);
                  e.target.value = "";
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="luxury-outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isRTL ? "העלאת סרטון" : "Upload Video"}
                </Button>
                {uploadedFileName && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <FileVideo className="h-3.5 w-3.5" />
                    {uploadedFileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{isRTL ? "או הדבק קישור:" : "or paste URL:"}</span>
              </div>
              <Input
                variant="luxury"
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setUploadedFileName(""); }}
                dir="ltr"
                placeholder="https://..."
              />
              {videoUrl && (
                <button
                  onClick={() => { setVideoUrl(""); setUploadedFileName(""); }}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <X className="h-3 w-3" />
                  {isRTL ? "הסר סרטון" : "Remove video"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "תאריך התחלה" : "Start Date"}</Label>
                <Input
                  variant="luxury"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "תאריך סיום" : "End Date"}</Label>
                <Input
                  variant="luxury"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{isRTL ? "פעיל" : "Active"}</Label>
            </div>
            <Button
              variant="luxury"
              className="w-full shadow-luxury-md"
              onClick={() => saveMutation.mutate()}
              disabled={!title.trim() || !startDate || !endDate || saveMutation.isPending}
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

export default AdminChallengesPage;
