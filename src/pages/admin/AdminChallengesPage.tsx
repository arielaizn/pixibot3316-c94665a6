import { useState } from "react";
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
import { Loader2, Plus, Trash2, Pencil, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
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
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChallengeItem | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_active: isActive,
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
    setDialogOpen(true);
  };

  const openEdit = (c: ChallengeItem) => {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description);
    setStartDate(new Date(c.start_date).toISOString().slice(0, 16));
    setEndDate(new Date(c.end_date).toISOString().slice(0, 16));
    setIsActive(c.is_active);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
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
                    <td colSpan={6} className="px-4 py-12 text-center">
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
        <DialogContent className="max-w-lg rounded-luxury-lg">
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
