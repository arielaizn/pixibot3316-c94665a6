import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Loader2, FolderOpen, Plus, Film, Clock } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

const DashboardPage = () => {
  const { user, loading } = useAuth();

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
  const plan = "מנוי חופשי";
  const videosUsed = 1;
  const videosTotal = 3;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      {/* Decorative mascot */}
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
              <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
                שלום, {userName} 👋
              </h1>
              <p className="mt-1 text-muted-foreground">
                ברוכים הבאים לאזור האישי שלכם
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-5 py-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">תוכנית נוכחית</p>
                <p className="font-bold text-foreground">{plan}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">סרטונים שנשארו החודש</p>
                <p className="font-bold text-primary">
                  {videosUsed} / {videosTotal}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* My projects */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">הפרויקטים שלי</h2>
            <p className="mb-6 flex-1 text-sm text-muted-foreground">
              צפו בכל הסרטונים שיצרנו עבורכם
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-xl border-accent py-5 text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Link to="/projects">פתח פרויקטים</Link>
            </Button>
          </div>

          {/* Create new video */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">צור סרטון חדש</h2>
            <p className="mb-6 flex-1 text-sm text-muted-foreground">
              מעבר לעמוד יצירת הסרטון
            </p>
            <Button
              asChild
              className="w-full rounded-xl bg-primary py-5 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/welcome">המשך ליצירת סרטון</Link>
            </Button>
          </div>
        </div>

        {/* Recent projects — empty state */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">פרויקטים אחרונים</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mb-1 text-lg font-semibold text-foreground">עדיין לא יצרת סרטונים</p>
            <p className="mb-6 text-sm text-muted-foreground">התחל ליצור את הסרטון הראשון שלך</p>
            <Button
              asChild
              className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/welcome">צור סרטון ראשון</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
