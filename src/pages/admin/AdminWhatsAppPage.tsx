import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, XCircle } from "lucide-react";

const AdminWhatsAppPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-handoff-tokens"],
    queryFn: () => adminAction("list_handoff_tokens"),
  });

  const invalidate = useMutation({
    mutationFn: (id: string) => adminAction("invalidate_token", { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-handoff-tokens"] });
      toast({ title: isRTL ? "טוקן בוטל" : "Token invalidated" });
    },
  });

  const tokens = data || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {isRTL ? "WhatsApp Sessions" : "WhatsApp Sessions"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : tokens.length === 0 ? (
        <Card variant="glass" className="p-12 text-center shadow-luxury-md">
          <p className="text-lg text-muted-foreground">{isRTL ? "אין טוקנים" : "No tokens"}</p>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "טוקן" : "Token"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">User ID</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "סטטוס" : "Status"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "תפוגה" : "Expires"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "נוצר" : "Created"}</th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">{isRTL ? "פעולות" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t: any) => {
                const expired = new Date(t.expires_at) < new Date();
                return (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-foreground">{t.token}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{t.user_id?.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.used ? "bg-muted text-muted-foreground"
                          : expired ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {t.used ? (isRTL ? "נוצל" : "Used") : expired ? (isRTL ? "פג" : "Expired") : (isRTL ? "פעיל" : "Active")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.expires_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {!t.used && (
                        <Button size="sm" variant="luxury-outline" className="h-7 text-destructive hover:text-destructive" onClick={() => invalidate.mutate(t.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminWhatsAppPage;
