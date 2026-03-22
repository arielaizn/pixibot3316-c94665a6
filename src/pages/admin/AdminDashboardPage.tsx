import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAction } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { Card } from "@/components/ui/card";
import { Users, Film, FolderOpen, MessageCircle, Loader2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <Card variant="glow" className="p-6 shadow-luxury-md hover:shadow-luxury-lg transition-all duration-300">
    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color} animate-float`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-extrabold text-foreground">{value}</p>
  </Card>
);

const AdminDashboardPage = () => {
  const { t } = useDirection();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminAction("dashboard_stats"),
  });

  const categoryStats: Record<string, number> = stats?.categoryStats || {};
  const sortedCategories = Object.entries(categoryStats).sort(([, a], [, b]) => b - a);

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">
        {t("admin.overview")}
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label={t("admin.users")} value={stats?.totalUsers || 0} color="bg-primary/10 text-primary" />
            <StatCard icon={Film} label={t("admin.videos")} value={stats?.totalVideos || 0} color="bg-accent/10 text-accent" />
            <StatCard icon={FolderOpen} label={t("admin.projects")} value={stats?.totalProjects || 0} color="bg-secondary/50 text-foreground" />
            <StatCard icon={MessageCircle} label={t("admin.activeTokens")} value={stats?.activeTokens || 0} color="bg-primary/10 text-primary" />
          </div>

          {sortedCategories.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                <Tag className="h-5 w-5 text-primary animate-float" />
                {t("admin.commonCategories")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCategories.map(([category, count]) => (
                  <Card key={category} variant="glass" className="flex items-center justify-between p-4 shadow-luxury-sm hover:shadow-luxury-md transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                        {category}
                      </Badge>
                    </div>
                    <span className="text-2xl font-extrabold text-foreground">{count}</span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboardPage;
