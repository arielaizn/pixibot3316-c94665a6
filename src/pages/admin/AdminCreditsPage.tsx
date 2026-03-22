import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AdminCreditsPage = () => {
  const { isRTL } = useDirection();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: () => adminAction("list_transactions"),
  });

  const txns = data || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {isRTL ? "היסטוריית קרדיטים" : "Credit Transactions"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : txns.length === 0 ? (
        <Card variant="glass" className="p-12 text-center shadow-luxury-md">
          <p className="text-lg text-muted-foreground">{isRTL ? "אין עסקאות" : "No transactions"}</p>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">User ID</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סוג" : "Type"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "כמות" : "Amount"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "מקור" : "Source"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תאריך" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t: any) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{t.user_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-foreground">{t.type}</td>
                  <td className={`px-4 py-3 font-bold ${t.amount < 0 ? "text-destructive" : "text-primary"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.source || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
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

export default AdminCreditsPage;
