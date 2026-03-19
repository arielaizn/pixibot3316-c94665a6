import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminAdminsPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminAction("list_users"),
  });

  const promoteMutation = useMutation({
    mutationFn: (user_id: string) => adminAction("promote_admin", { user_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: isRTL ? "המשתמש הפך למנהל" : "User promoted to admin" });
    },
    onError: (e: any) => {
      toast({ title: isRTL ? "שגיאה" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const demoteMutation = useMutation({
    mutationFn: (user_id: string) => adminAction("demote_admin", { user_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: isRTL ? "הרשאת מנהל הוסרה" : "Admin role removed" });
    },
    onError: (e: any) => {
      toast({ title: isRTL ? "שגיאה" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const users = data?.users || [];
  const admins = users.filter((u: any) => u.roles?.includes("admin"));
  const nonAdmins = users.filter((u: any) => !u.roles?.includes("admin"));

  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        {isRTL ? "ניהול מנהלים" : "Admin Management"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Admins */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {isRTL ? "מנהלים נוכחיים" : "Current Admins"} ({admins.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "אימייל" : "Email"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "שם" : "Name"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((u: any) => {
                    const isSelf = u.id === user?.id;
                    const isOnlyAdmin = admins.length <= 1;
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-foreground">{u.name || "—"}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 text-destructive"
                            disabled={isSelf && isOnlyAdmin}
                            onClick={() => demoteMutation.mutate(u.id)}
                          >
                            <ShieldOff className="h-4 w-4" />
                            {isRTL ? "הסר מנהל" : "Remove Admin"}
                          </Button>
                          {isSelf && isOnlyAdmin && (
                            <span className="ms-2 text-xs text-muted-foreground">
                              {isRTL ? "לא ניתן להסיר מנהל יחיד" : "Can't remove the only admin"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Users */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              {isRTL ? "משתמשים" : "Users"} ({nonAdmins.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "אימייל" : "Email"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "שם" : "Name"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "הצטרפות" : "Joined"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {nonAdmins.map((u: any) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-foreground">{u.name || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => promoteMutation.mutate(u.id)}
                        >
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          {isRTL ? "הפוך למנהל" : "Make Admin"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAdminsPage;
