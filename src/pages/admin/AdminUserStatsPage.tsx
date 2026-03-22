import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AdminUserStatsPage = () => {
  const { isRTL } = useDirection();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: () => adminAction("list_user_stats"),
  });

  const stats = data || [];

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {isRTL ? "סטטיסטיקות סרטונים למשתמש" : "Per-User Video Stats"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : stats.length === 0 ? (
        <Card variant="glass" className="p-12 text-center shadow-luxury-md">
          <p className="text-lg text-muted-foreground">
            {isRTL ? "אין נתונים" : "No data"}
          </p>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden shadow-luxury-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  {isRTL ? "אימייל" : "Email"}
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  {isRTL ? "סרטונים" : "Videos"}
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  {isRTL ? "זמן עיבוד (שנ')" : "Gen Time (s)"}
                </th>
                <th className="px-4 py-3 text-start font-semibold text-foreground">
                  {isRTL ? "סרטון אחרון" : "Last Video"}
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s: any) => (
                <tr key={s.user_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{s.email}</td>
                  <td className="px-4 py-3 font-bold text-primary">{s.total_videos_created}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.total_generation_time}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.last_video_created_at
                      ? new Date(s.last_video_created_at).toLocaleString()
                      : "—"}
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

export default AdminUserStatsPage;
