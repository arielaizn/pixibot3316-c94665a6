import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

const AdminVideosPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => adminAction("list_videos"),
  });

  const deleteVideo = useMutation({
    mutationFn: (id: string) => adminAction("delete_video", { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      toast({ title: isRTL ? "סרטון נמחק" : "Video deleted" });
    },
  });

  const videos = data || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {isRTL ? "ניהול סרטונים" : "Video Management"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : videos.length === 0 ? (
        <Card variant="glass" className="p-12 text-center shadow-luxury-md">
          <p className="text-lg text-muted-foreground">{isRTL ? "אין סרטונים" : "No videos"}</p>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">User ID</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סטטוס" : "Status"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">URL</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תאריך" : "Date"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v: any) => (
                <tr key={v.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{v.user_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.status === "completed" ? "bg-primary/10 text-primary"
                        : v.status === "failed" ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}>{v.status}</span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground">{v.video_url || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="luxury-outline" className="h-7 text-destructive hover:text-destructive" onClick={() => deleteVideo.mutate(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminVideosPage;
