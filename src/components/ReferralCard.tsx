import { useState } from "react";
import { useDirection } from "@/contexts/DirectionContext";
import { useReferral } from "@/hooks/useReferral";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users, CreditCard, Check, Loader2 } from "lucide-react";

const ReferralCard = () => {
  const { t } = useDirection();
  const { data, isLoading } = useReferral();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const referralLink = `${window.location.origin}/signup?ref=${data.referral_code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: t("referral.linkCopied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const statusMap: Record<string, string> = {
    clicked: t("referral.statusClicked"),
    signed_up: t("referral.statusSignedUp"),
    paid: t("referral.statusPaid"),
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("referral.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("referral.subtitle")}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          readOnly
          value={referralLink}
          dir="ltr"
          className="rounded-xl bg-muted/50 text-sm text-foreground"
          onClick={handleCopy}
        />
        <Button
          onClick={handleCopy}
          className="shrink-0 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ms-2 hidden sm:inline">{copied ? t("referral.copied") : t("referral.copyLink")}</span>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <Users className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
          <p className="text-2xl font-extrabold text-foreground">{data.stats.total_invited}</p>
          <p className="text-xs text-muted-foreground">{t("referral.invited")}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <CreditCard className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
          <p className="text-2xl font-extrabold text-foreground">{data.stats.total_paid}</p>
          <p className="text-xs text-muted-foreground">{t("referral.paid")}</p>
        </div>
        <div className="rounded-xl border border-border bg-primary/5 p-4 text-center">
          <Gift className="mx-auto mb-1 h-5 w-5 text-primary" />
          <p className="text-2xl font-extrabold text-primary">{data.stats.total_rewards}</p>
          <p className="text-xs text-muted-foreground">{t("referral.earned")}</p>
        </div>
      </div>

      {data.referrals.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("referral.history")}</h3>
          <div className="space-y-2">
            {data.referrals.slice(0, 10).map((ref) => (
              <div key={ref.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground" dir="ltr">
                    {ref.referred_email || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ref.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={ref.status === "paid" ? "default" : "secondary"}
                  className={`rounded-full text-xs ${
                    ref.status === "paid"
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusMap[ref.status] || ref.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.referrals.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">{t("referral.noReferrals")}</p>
      )}
    </div>
  );
};

export default ReferralCard;
