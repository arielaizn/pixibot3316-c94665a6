import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

const AdminProjectsPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => adminAction("list_projects"),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => adminAction("delete_project", { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: isRTL ? "פרויקט נמחק" : "Project deleted" });
    },
  });

  const projects = data || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {isRTL ? "ניהול פרויקטים" : "Project Management"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : projects.length === 0 ? (
        <Card variant="glass" className="p-12 text-center shadow-luxury-md">
          <p className="text-lg text-muted-foreground">{isRTL ? "אין פרויקטים" : "No projects"}</p>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "שם" : "Name"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">User ID</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סטטוס" : "Status"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תאריך" : "Date"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{p.name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{p.user_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-foreground">{p.status}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="luxury-outline" className="h-7 text-destructive hover:text-destructive" onClick={() => deleteProject.mutate(p.id)}>
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

export default AdminProjectsPage;
