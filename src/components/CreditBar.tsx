import { Link } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Film, Trophy } from "lucide-react";
import type { CreditSummary } from "@/hooks/useCredits";
import { getPlanLabel } from "@/hooks/useCredits";

interface CreditBarProps {
  credits: CreditSummary;
  showPlan?: boolean;
  showWarning?: boolean;
}

const CreditBar = ({ credits, showPlan = false, showWarning = true }: CreditBarProps) => {
  const { t, isRTL } = useDirection();

  if (credits.isUnlimited) {
    return (
      <div className="space-y-3">
        {credits.challengeActive && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
            <Trophy className="h-5 w-5 text-primary animate-float" />
            <span className="text-sm font-bold text-primary">
              {isRTL ? "אתגר פעיל - קרדיטים ללא הגבלה!" : "Challenge Active - Unlimited Credits!"}
            </span>
          </div>
        )}
        {showPlan && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("credits.currentPlan")}:</span>
            <span className="font-bold text-foreground">{t("credits.unlimitedPlan")}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Film className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-lg font-extrabold text-foreground">🎬 ∞</span>
          <span className="text-sm text-muted-foreground">{t("credits.unlimited")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showPlan && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("credits.currentPlan")}:</span>
          <span className="font-bold text-foreground">{getPlanLabel(credits.plan_type, isRTL)}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Film className="h-5 w-5 shrink-0 text-primary" />
        <span className="text-lg font-extrabold text-foreground">
          {credits.used_credits} / {credits.totalCredits}
        </span>
        <span className="text-sm text-muted-foreground">{t("credits.used")}</span>
      </div>

      <Progress
        value={Math.min(credits.usagePercent, 100)}
        className="h-2.5 bg-muted"
      />

      <p className="text-sm text-muted-foreground">
        {isRTL ? `נשארו לכם ${credits.remainingCredits} קרדיטים` : `${credits.remainingCredits} credits remaining`}
      </p>

      {showWarning && (credits.isLow || credits.isEmpty) && (
        <div className="flex flex-col gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            {credits.isEmpty ? t("credits.empty") : t("credits.low")}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/pricing">{t("credits.upgradePlan")}</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link to="/pricing#packs">{t("credits.buyMore")}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBar;
