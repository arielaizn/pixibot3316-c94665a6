import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits, getPlanLabel } from "@/hooks/useCredits";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import CreditBar from "@/components/CreditBar";
import Navbar from "@/components/Navbar";
import { Loader2, FolderOpen, Plus, Film } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { isRTL } = useDirection();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "משתמש";

  const t = {
    hello: isRTL ? `שלום, ${userName} 👋` : `Hello, ${userName} 👋`,
    welcome: isRTL ? "ברוכים הבאים לאזור האישי שלכם" : "Welcome to your personal area",
    currentPlan: isRTL ? "תוכנית נוכחית" : "Current Plan",
    creditsLeft: isRTL ? "סרטונים שנשארו החודש" : "Credits remaining",
    myProjects: isRTL ? "הפרויקטים שלי" : "My Projects",
    myProjectsDesc: isRTL ? "צפו בכל הסרטונים שיצרנו עבורכם" : "View all videos we created for you",
    openProjects: isRTL ? "פתח פרויקטים" : "Open Projects",
    newVideo: isRTL ? "צור סרטון חדש" : "Create New Video",
    newVideoDesc: isRTL ? "מעבר לעמוד יצירת הסרטון" : "Go to the video creation page",
    continueToVideo: isRTL ? "המשך ליצירת סרטון" : "Continue to Create Video",
    recentTitle: isRTL ? "פרויקטים אחרונים" : "Recent Projects",
    noVideos: isRTL ? "עדיין לא יצרת סרטונים" : "You haven't created any videos yet",
    startCreating: isRTL ? "התחל ליצור את הסרטון הראשון שלך" : "Start creating your first video",
    firstVideo: isRTL ? "צור סרטון ראשון" : "Create First Video",
  };

  const plan = credits ? getPlanLabel(credits.plan_type, isRTL) : "...";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <img
        src={mascot}
        alt=""
        className="fixed bottom-6 left-6 z-10 hidden h-16 w-16 animate-float opacity-40 md:block"
      />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">{t.hello}</h1>
              <p className="mt-1 text-muted-foreground">{t.welcome}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-5 py-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t.currentPlan}</p>
                <p className="font-bold text-foreground">{plan}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t.creditsLeft}</p>
                <p className="font-bold text-primary">
                  {creditsLoading ? "..." : credits ? `${credits.used_credits} / ${credits.totalCredits}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Credit bar */}
          {credits && (
            <div className="mt-6">
              <CreditBar credits={credits} />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">{t.myProjects}</h2>
            <p className="mb-6 flex-1 text-sm text-muted-foreground">{t.myProjectsDesc}</p>
            <Button asChild variant="outline" className="w-full rounded-xl border-accent py-5 text-accent hover:bg-accent hover:text-accent-foreground">
              <Link to="/projects">{t.openProjects}</Link>
            </Button>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">{t.newVideo}</h2>
            <p className="mb-6 flex-1 text-sm text-muted-foreground">{t.newVideoDesc}</p>
            <Button asChild className="w-full rounded-xl bg-primary py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
              <Link to="/welcome">{t.continueToVideo}</Link>
            </Button>
          </div>
        </div>

        {/* Recent projects — empty state */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t.recentTitle}</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mb-1 text-lg font-semibold text-foreground">{t.noVideos}</p>
            <p className="mb-6 text-sm text-muted-foreground">{t.startCreating}</p>
            <Button asChild className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
              <Link to="/welcome">{t.firstVideo}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
