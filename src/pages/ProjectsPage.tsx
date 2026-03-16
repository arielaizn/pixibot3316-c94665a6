import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNavbar from "@/components/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Film, Play, Download, Calendar } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

interface Project {
  project_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
}

const statusConfig = {
  processing: { label: "בעיבוד", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  completed: { label: "הושלם", className: "bg-primary/10 text-primary border-primary/20" },
  failed: { label: "נכשל", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ProjectsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Mock data — replace with API call to GET /api/projects?user_id={user_id}
  const projects: Project[] = [];
  const isLoading = false;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
            הפרויקטים שלי
          </h1>
          <p className="mt-2 text-muted-foreground">
            כאן תוכלו לצפות בכל הסרטונים שנוצרו עבורכם
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <Skeleton className="mb-4 aspect-video w-full rounded-xl" />
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Film className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="mb-1 text-xl font-bold text-foreground">עדיין אין לך סרטונים</p>
              <p className="mb-8 text-sm text-muted-foreground">
                צרו את הסרטון הראשון שלכם ותראו אותו כאן
              </p>
              <Button
                asChild
                className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/welcome">צור סרטון ראשון</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const status = statusConfig[project.status];
              return (
                <div
                  key={project.project_id}
                  className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-muted">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {project.status === "completed" && (
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="h-6 w-6" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="truncate font-bold text-foreground">{project.title}</h3>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.created_at)}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-accent py-4 text-accent hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setSelectedProject(project)}
                        disabled={project.status !== "completed"}
                      >
                        <Play className="ml-1.5 h-4 w-4" />
                        צפה
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl py-4"
                        disabled={project.status !== "completed"}
                        asChild={project.status === "completed"}
                      >
                        {project.status === "completed" ? (
                          <a href={project.video_url} download>
                            <Download className="ml-1.5 h-4 w-4" />
                            הורד
                          </a>
                        ) : (
                          <>
                            <Download className="ml-1.5 h-4 w-4" />
                            הורד
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Video preview modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-foreground">
              {selectedProject?.title}
            </DialogTitle>
            {selectedProject && (
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedProject.created_at)}
              </p>
            )}
          </DialogHeader>
          <div className="p-6 pt-4">
            {selectedProject?.video_url && (
              <video
                src={selectedProject.video_url}
                controls
                className="w-full rounded-xl bg-foreground/5"
              />
            )}
            <div className="mt-4 flex justify-end">
              <Button asChild className="rounded-xl bg-primary px-6 py-5 font-bold text-primary-foreground hover:bg-primary/90">
                <a href={selectedProject?.video_url} download>
                  <Download className="ml-2 h-4 w-4" />
                  הורד סרטון
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
