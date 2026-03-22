import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CreditBar from "@/components/CreditBar";
import { useWhatsAppHandoff } from "@/hooks/useWhatsAppHandoff";
import { LayoutDashboard, MessageCircle, Loader2 } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

const WelcomePage = () => {
  const { user, loading } = useAuth();
  const { initiateHandoff, loading: handoffLoading } = useWhatsAppHandoff();
  const { t } = useDirection();
  const { credits, loading: creditsLoading } = useCredits();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  const noCredits = credits?.isEmpty ?? false;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-12">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <div className="mb-10 flex justify-center relative z-10">
        <Link to="/" className="flex items-center gap-2">
          <img src={mascot} alt="Pixi" className="h-10 w-10" />
          <span className="text-2xl font-bold text-foreground">Pixi</span>
        </Link>
      </div>

      <div className="mb-10 text-center relative z-10 animate-luxury-fade-up">
        <img src={mascot} alt="Pixi" className="mx-auto mb-4 h-20 w-20 animate-float" />
        <h1 className="text-4xl md:text-5xl font-cal-sans bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent mb-3">{t("welcome.youreIn")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("welcome.howContinue")}</p>
      </div>

      {credits && (
        <Card variant="glass" className="mb-8 w-full max-w-3xl p-5 shadow-luxury-md relative z-10">
          <CreditBar credits={credits} showPlan showWarning />
        </Card>
      )}

      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2 relative z-10">
        <Card variant="glass" className="flex flex-col p-8 shadow-luxury-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <LayoutDashboard className="h-6 w-6 animate-float" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">{t("welcome.dashboard")}</h2>
          <p className="mb-6 flex-1 text-sm text-muted-foreground">{t("welcome.dashboardDesc")}</p>
          <Button asChild variant="luxury-outline" size="lg">
            <Link to="/dashboard">{t("welcome.enterDashboard")}</Link>
          </Button>
        </Card>

        <Card variant="glass" className="flex flex-col p-8 shadow-luxury-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="h-6 w-6 animate-float" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">{t("welcome.whatsapp")}</h2>
          <p className="mb-2 text-sm text-muted-foreground">{t("welcome.whatsappDesc")}</p>
          <p className="mb-6 text-sm font-semibold text-foreground" dir="ltr">+972 52-551-5776</p>

          {noCredits ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-destructive">{t("welcome.noCredits")}</p>
              <p className="text-xs text-muted-foreground">{t("welcome.noCreditsDesc")}</p>
              <Button asChild variant="luxury" size="lg">
                <Link to="/pricing">{t("welcome.upgrade")}</Link>
              </Button>
            </div>
          ) : (
            <Button
              variant="luxury"
              size="lg"
              onClick={initiateHandoff}
              disabled={handoffLoading || creditsLoading}
              className="shadow-luxury-md"
            >
              {handoffLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("welcome.preparing")}
                </span>
              ) : (
                t("welcome.continueWA")
              )}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;
