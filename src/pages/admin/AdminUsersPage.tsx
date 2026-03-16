import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const PLANS = ["free", "starter", "creator", "pro", "business", "enterprise"];
const PLAN_CREDITS: Record<string, number> = { free: 1, starter: 3, creator: 7, pro: 15, business: 35, enterprise: 80 };

const AdminUsersPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminAction("list_users"),
  });

  const updateCredits = useMutation({
    mutationFn: (params: any) => adminAction("update_credits", params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: isRTL ? "עודכן בהצלחה" : "Updated" });
    },
  });

  const resetCredits = useMutation({
    mutationFn: (user_id: string) => adminAction("reset_credits", { user_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: isRTL ? "אופס" : "Credits reset" });
    },
  });

  const addCredits = useMutation({
    mutationFn: ({ user_id, amount }: { user_id: string; amount: number }) =>
      adminAction("add_credits", { user_id, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: isRTL ? "קרדיטים נוספו" : "Credits added" });
    },
  });

  const users = data?.users || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        {isRTL ? "ניהול משתמשים" : "User Management"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "אימייל" : "Email"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "שם" : "Name"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תוכנית" : "Plan"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "קרדיטים" : "Credits"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תפקיד" : "Role"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "הצטרפות" : "Joined"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const c = u.credits;
                const total = c ? c.plan_credits + c.extra_credits : 0;
                const used = c?.used_credits || 0;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-foreground">{u.name || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={c?.plan_type || "free"}
                        onChange={(e) => {
                          const plan = e.target.value;
                          updateCredits.mutate({
                            user_id: u.id,
                            plan_type: plan,
                            plan_credits: PLAN_CREDITS[plan] || 1,
                          });
                        }}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {used} / {total}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {u.roles?.includes("admin") ? "🛡️ Admin" : "User"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => addCredits.mutate({ user_id: u.id, amount: 3 })}
                        >
                          +3
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => resetCredits.mutate(u.id)}
                        >
                          {isRTL ? "איפוס" : "Reset"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsersPage;
