import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AdminSubscriptionsPage = () => {
  const { isRTL } = useDirection();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: () => adminAction("list_subscriptions"),
  });

  const subs = data || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {isRTL ? "ניהול מנויים" : "Subscriptions"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : subs.length === 0 ? (
        <Card variant="glass" className="p-12 text-center shadow-luxury-md">
          <p className="text-lg text-muted-foreground">{isRTL ? "אין מנויים" : "No subscriptions"}</p>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">User ID</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תוכנית" : "Plan"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "קרדיטים" : "Credits"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סטטוס" : "Status"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סיום" : "Cycle End"}</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{s.user_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-foreground">{s.plan_type}</td>
                  <td className="px-4 py-3 text-foreground">{s.monthly_credits}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.billing_cycle_end).toLocaleDateString()}
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

export default AdminSubscriptionsPage;
