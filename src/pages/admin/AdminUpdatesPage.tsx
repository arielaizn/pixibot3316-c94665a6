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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Trash2, Pencil, Upload, FileVideo, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UpdateItem {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

const AdminUpdatesPage = () => {
  const { t, isRTL } = useDirection();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UpdateItem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: updates, isLoading } = useQuery({
    queryKey: ["admin-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as UpdateItem[];
    },
  });

  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    try {
      const filePath = `${user!.id}/updates/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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
        video_url: videoUrl || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_active: isActive,
      };
      if (editing) {
        const { error } = await supabase
          .from("updates" as any)
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("updates" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-updates"] });
      toast({ title: isRTL ? "נשמר בהצלחה" : "Saved successfully" });
      closeDialog();
    },
    onError: (e: any) => {
      toast({ title: isRTL ? "שגיאה" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("updates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-updates"] });
      toast({ title: isRTL ? "נמחק" : "Deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("updates" as any)
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-updates"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setUploadedFileName("");
    const now = new Date();
    setStartDate(now.toISOString().slice(0, 16));
    const week = new Date(now.getTime() + 7 * 86400000);
    setEndDate(week.toISOString().slice(0, 16));
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (u: UpdateItem) => {
    setEditing(u);
    setTitle(u.title);
    setDescription(u.description);
    setVideoUrl(u.video_url || "");
    setUploadedFileName("");
    setStartDate(new Date(u.start_date).toISOString().slice(0, 16));
    setEndDate(new Date(u.end_date).toISOString().slice(0, 16));
    setIsActive(u.is_active);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setUploadedFileName("");
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-cal-sans text-foreground">
          {isRTL ? "ניהול עדכונים" : "Updates Management"}
        </h2>
        <Button variant="luxury" onClick={openCreate} className="gap-2 shadow-luxury-md">
          <Plus className="h-4 w-4" />
          {isRTL ? "עדכון חדש" : "New Update"}
        </Button>
      </div>

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
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "כותרת" : "Title"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סרטון" : "Video"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "התחלה" : "Start"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סיום" : "End"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעיל" : "Active"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {(updates || []).map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground font-medium">{u.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {u.video_url ? (
                      <span className="flex items-center gap-1 text-primary">
                        <FileVideo className="h-3.5 w-3.5" />
                        {isRTL ? "יש סרטון" : "Has video"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={u.is_active}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: u.id, active: v })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="luxury-outline" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="luxury-outline" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!updates || updates.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {isRTL ? "אין עדכונים" : "No updates yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-luxury-lg">
          <DialogHeader>
            <DialogTitle className="font-cal-sans">
              {editing ? (isRTL ? "עריכת עדכון" : "Edit Update") : (isRTL ? "עדכון חדש" : "New Update")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRTL ? "כותרת" : "Title"}</Label>
              <Input variant="luxury" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "תיאור" : "Description"}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            {/* Video: Upload or URL */}
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
                <Input variant="luxury" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "תאריך סיום" : "End Date"}</Label>
                <Input variant="luxury" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} dir="ltr" />
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
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRTL ? "שמור" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUpdatesPage;
