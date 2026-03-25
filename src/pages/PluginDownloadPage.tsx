import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Apple, Monitor, Download, CheckCircle } from "lucide-react";

export default function PluginDownloadPage() {
  const { user, loading } = useAuth();
  const { t, isRTL } = useDirection();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const steps = [
    { num: "1", title: t("plugin.step1title"), desc: t("plugin.step1") },
    { num: "2", title: t("plugin.step2title"), desc: t("plugin.step2") },
    { num: "3", title: t("plugin.step3title"), desc: t("plugin.step3") },
  ];

  const requirements = [
    t("plugin.premiere"),
    t("plugin.aftereffects"),
    t("plugin.account"),
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <main className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("plugin.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("plugin.subtitle")}
          </p>
        </div>

        {/* Platform cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Mac */}
          <Card variant="glass" className="p-8 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Apple className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-1">{t("plugin.mac")}</h2>
            <p className="text-sm text-muted-foreground mb-1">{t("plugin.macReq")}</p>
            <p className="text-xs text-muted-foreground mb-6">{t("plugin.version")}</p>
            <Button variant="luxury" size="lg" className="w-full gap-2" asChild>
              <a href="/downloads/Pixibot-Adobe-Plugin-Mac.pkg" download>
                <Download className="h-4 w-4" />
                {t("plugin.download")}
              </a>
            </Button>
          </Card>

          {/* Windows */}
          <Card variant="glass" className="p-8 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Monitor className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-1">{t("plugin.windows")}</h2>
            <p className="text-sm text-muted-foreground mb-1">{t("plugin.winReq")}</p>
            <p className="text-xs text-muted-foreground mb-6">{t("plugin.version")}</p>
            <Button variant="luxury" size="lg" className="w-full gap-2" asChild>
              <a href="/downloads/Pixibot-Adobe-Plugin-Windows.zip" download>
                <Download className="h-4 w-4" />
                {t("plugin.download")}
              </a>
            </Button>
          </Card>
        </div>

        {/* Installation steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            {t("plugin.howToInstall")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {t("plugin.requires")}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {requirements.map((req) => (
              <div
                key={req}
                className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="h-4 w-4 text-primary" />
                {req}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
