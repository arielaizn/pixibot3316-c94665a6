import { useDirection } from "@/contexts/DirectionContext";
import { useAdminReferralStats } from "@/hooks/useReferral";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, CreditCard, Gift, Trophy } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <Card variant="glow" className="p-6 shadow-luxury-md hover:shadow-luxury-lg transition-all duration-300">
    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color} animate-float`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-3xl font-extrabold text-foreground">{value}</p>
  </Card>
);

const AdminReferralsPage = () => {
  const { t } = useDirection();
  const { data, isLoading } = useAdminReferralStats();

  const statusLabels: Record<string, string> = {
    clicked: t("admin.referrals.clicked"),
    signed_up: t("admin.referrals.signedUp"),
    paid: t("admin.referrals.paidStatus"),
  };

  return (
    <AdminLayout>
      <h2 className="mb-6 text-3xl font-cal-sans text-foreground">{t("admin.referrals.title")}</h2>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-5 sm:grid-cols-3">
            <StatCard icon={Users} label={t("admin.referrals.totalSignups")} value={data?.totalSignups || 0} color="bg-primary/10 text-primary" />
            <StatCard icon={CreditCard} label={t("admin.referrals.totalPaid")} value={data?.totalPaid || 0} color="bg-accent/10 text-accent" />
            <StatCard icon={Gift} label={t("admin.referrals.totalRewards")} value={data?.totalRewardsGranted || 0} color="bg-primary/10 text-primary" />
          </div>

          {data?.topReferrers?.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Trophy className="h-5 w-5 text-primary animate-float" />
                {t("admin.referrals.topReferrers")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.topReferrers.map((ref: any, i: number) => (
                  <Card key={i} variant="glass" className="flex items-center justify-between p-4 shadow-luxury-sm hover:shadow-luxury-md transition-all duration-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground" dir="ltr">{ref.email}</span>
                    </div>
                    <Badge variant="secondary" className="rounded-full shrink-0">
                      {ref.count} {t("admin.referrals.count")}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data?.referrals?.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-foreground">{t("admin.referrals.recent")}</h3>
              <Card variant="glass" className="overflow-hidden shadow-luxury-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-start font-semibold text-foreground">{t("admin.referrals.referrer")}</th>
                      <th className="px-4 py-3 text-start font-semibold text-foreground">{t("admin.referrals.referred")}</th>
                      <th className="px-4 py-3 text-start font-semibold text-foreground">{t("admin.referrals.status")}</th>
                      <th className="px-4 py-3 text-start font-semibold text-foreground">{t("admin.referrals.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r: any) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground" dir="ltr">{r.referrer_email || "—"}</td>
                        <td className="px-4 py-3 text-foreground" dir="ltr">{r.referred_email || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={r.status === "paid" ? "default" : "secondary"}
                            className={`rounded-full text-xs ${
                              r.status === "paid" ? "bg-primary/10 text-primary" : ""
                            }`}
                          >
                            {statusLabels[r.status] || r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminReferralsPage;
