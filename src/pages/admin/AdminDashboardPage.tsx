import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Users, Film, FolderOpen, MessageCircle, Loader2 } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-extrabold text-foreground">{value}</p>
  </div>
);

const AdminDashboardPage = () => {
  const { isRTL } = useDirection();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminAction("dashboard_stats"),
  });

  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        {isRTL ? "סקירה כללית" : "Overview"}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label={isRTL ? "משתמשים" : "Users"} value={stats?.totalUsers || 0} color="bg-primary/10 text-primary" />
          <StatCard icon={Film} label={isRTL ? "סרטונים" : "Videos"} value={stats?.totalVideos || 0} color="bg-accent/10 text-accent" />
          <StatCard icon={FolderOpen} label={isRTL ? "פרויקטים" : "Projects"} value={stats?.totalProjects || 0} color="bg-secondary/50 text-foreground" />
          <StatCard icon={MessageCircle} label={isRTL ? "טוקנים פעילים" : "Active Tokens"} value={stats?.activeTokens || 0} color="bg-primary/10 text-primary" />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboardPage;
