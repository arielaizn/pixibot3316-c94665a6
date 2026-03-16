import { Link } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Film } from "lucide-react";
import type { CreditSummary } from "@/hooks/useCredits";
import { getPlanLabel } from "@/hooks/useCredits";

interface CreditBarProps {
  credits: CreditSummary;
  showPlan?: boolean;
  showWarning?: boolean;
}

const CreditBar = ({ credits, showPlan = false, showWarning = true }: CreditBarProps) => {
  const { isRTL } = useDirection();

  const t = {
    used: isRTL ? "קרדיטים נוצלו החודש" : "credits used this month",
    remaining: (n: number) => (isRTL ? `נשארו לכם ${n} קרדיטים` : `${n} credits remaining`),
    low: isRTL ? "⚠ נשארו לכם מעט קרדיטים" : "⚠ Running low on credits",
    empty: isRTL ? "⚠ נגמרו הקרדיטים" : "⚠ Out of credits",
    upgrade: isRTL ? "שדרגו תוכנית" : "Upgrade Plan",
    buy: isRTL ? "רכשו קרדיטים נוספים" : "Buy More Credits",
    currentPlan: isRTL ? "התוכנית הנוכחית" : "Current Plan",
  };

  const progressColor = credits.isEmpty
    ? "bg-destructive"
    : credits.isLow
    ? "bg-yellow-500"
    : "bg-primary";

  return (
    <div className="space-y-3">
      {showPlan && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t.currentPlan}:</span>
          <span className="font-bold text-foreground">{getPlanLabel(credits.plan_type, isRTL)}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Film className="h-5 w-5 shrink-0 text-primary" />
        <span className="text-lg font-extrabold text-foreground">
          {credits.used_credits} / {credits.totalCredits}
        </span>
        <span className="text-sm text-muted-foreground">{t.used}</span>
      </div>

      <Progress
        value={Math.min(credits.usagePercent, 100)}
        className="h-2.5 bg-muted"
        // Override indicator color via style
      />

      <p className="text-sm text-muted-foreground">{t.remaining(credits.remainingCredits)}</p>

      {showWarning && (credits.isLow || credits.isEmpty) && (
        <div className="flex flex-col gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            {credits.isEmpty ? t.empty : t.low}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/pricing">{t.upgrade}</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link to="/pricing#packs">{t.buy}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBar;
