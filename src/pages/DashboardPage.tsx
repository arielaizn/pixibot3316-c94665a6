import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits, getPlanLabel } from "@/hooks/useCredits";
import { useDirection } from "@/contexts/DirectionContext";
import { useProjects } from "@/hooks/useProjects";
import PageTransition from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreditBar from "@/components/CreditBar";
import ReferralCard from "@/components/ReferralCard";
import Navbar from "@/components/Navbar";
import { Loader2, FolderOpen, Plus, Film, Play, ExternalLink } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" });

const statusColor = (s: string) => {
  if (s === "completed") return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (s === "processing") return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (s === "failed") return "bg-red-500/10 text-red-600 dark:text-red-400";
  return "bg-muted text-muted-foreground";
};

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { isRTL } = useDirection();
  const { projects, isLoading: projectsLoading } = useProjects();

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

  // Gather recent videos from all projects
  const recentVideos = (projects || [])
    .flatMap((p) => p.videos.map((v) => ({ ...v, projectName: p.name })))
    .filter((v) => v.status !== "deleted")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const recentProjects = (projects || [])
    .filter((p) => p.id !== "__orphan__" && p.status !== "deleted")
    .slice(0, 5);

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
    recentVideos: isRTL ? "סרטונים אחרונים" : "Recent Videos",
    noVideos: isRTL ? "עדיין לא יצרת סרטונים" : "You haven't created any videos yet",
    noProjects: isRTL ? "עדיין אין פרויקטים. צור את הסרטון הראשון שלך!" : "No projects yet. Create your first video!",
    startCreating: isRTL ? "התחל ליצור את הסרטון הראשון שלך" : "Start creating your first video",
    firstVideo: isRTL ? "צור סרטון ראשון" : "Create First Video",
    viewAll: isRTL ? "הצג הכל" : "View All",
    videos: isRTL ? "סרטונים" : "videos",
    files: isRTL ? "קבצים" : "files",
  };

  const isUnlimited = credits?.isUnlimited;
  const plan = isUnlimited
    ? (isRTL ? "מנהל" : "Admin")
    : credits ? getPlanLabel(credits.plan_type, isRTL) : "...";

  const hasContent = recentProjects.length > 0 || recentVideos.length > 0;

  return (
    <PageTransition className="min-h-screen bg-background">
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
                <p className="text-xs text-muted-foreground">
                  {isUnlimited ? (isRTL ? "סרטונים" : "Videos") : t.creditsLeft}
                </p>
                <p className="font-bold text-primary">
                  {creditsLoading ? "..." : credits ? (isUnlimited ? "🎬 ∞" : `${credits.used_credits} / ${credits.totalCredits}`) : "—"}
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

        {/* Referral section */}
        <div className="mb-8">
          <ReferralCard />
        </div>

        {/* Recent Projects */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{t.recentTitle}</h2>
            {recentProjects.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                <Link to="/projects">
                  {t.viewAll} <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {projectsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to="/projects"
                  className="group flex flex-col rounded-xl border border-border bg-muted/30 p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(project.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${statusColor(project.status)}`}>
                      {project.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {project.videos.length} {t.videos} · {project.files.length} {t.files}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mb-6 text-sm text-muted-foreground">{t.noProjects}</p>
              <Button asChild className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
                <Link to="/welcome">{t.firstVideo}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Recent Videos */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{t.recentVideos}</h2>
            {recentVideos.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
                <Link to="/projects">
                  {t.viewAll} <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {projectsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentVideos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-muted/30 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  {/* Thumbnail / placeholder */}
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Film className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    {video.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                        <Play className="h-10 w-10 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate font-semibold text-foreground text-sm">{video.title || (isRTL ? "סרטון" : "Video")}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${statusColor(video.status)}`}>
                        {video.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{video.projectName}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default DashboardPage;
