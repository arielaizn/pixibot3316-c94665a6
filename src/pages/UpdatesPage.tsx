import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import Navbar from "@/components/Navbar";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Newspaper, Calendar } from "lucide-react";

interface UpdateEntry {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  created_at: string;
}

const UpdatesPage = () => {
  const { isRTL, direction } = useDirection();

  const { data: updates, isLoading } = useQuery({
    queryKey: ["public-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates" as any)
        .select("id, title, description, video_url, created_at")
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as UpdateEntry[];
    },
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir={direction}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
            <Newspaper className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {isRTL ? "יומן עדכונים" : "Changelog"}
            </span>
          </div>
          <h1 className="text-4xl font-cal-sans text-foreground mb-3">
            {isRTL ? "מה חדש ב-Pixi" : "What's New in Pixi"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isRTL
              ? "כל העדכונים, השיפורים והפיצ׳רים החדשים במקום אחד"
              : "All updates, improvements, and new features in one place"}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {/* Updates list */}
        {!isLoading && updates && updates.length > 0 && (
          <div className="space-y-8">
            {updates.map((update, index) => {
              const videoSrc = update.video_url ? getVideoPublicUrl(update.video_url) : "";
              return (
                <Card
                  key={update.id}
                  id={`update-${update.id}`}
                  variant="glass"
                  className="overflow-hidden shadow-luxury-md animate-luxury-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Video */}
                  {videoSrc && (
                    <div className="w-full">
                      <PixiVideoPlayer src={videoSrc} title={update.title} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                        <Calendar className="h-3 w-3 me-1" />
                        {formatDate(update.created_at)}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-cal-sans text-foreground">{update.title}</h2>
                    {update.description && (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {update.description}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!updates || updates.length === 0) && (
          <Card variant="glass" className="p-16 text-center shadow-luxury-md">
            <Newspaper className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40 animate-float" />
            <p className="text-lg text-muted-foreground">
              {isRTL ? "אין עדכונים כרגע" : "No updates at the moment"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {isRTL ? "חזור בקרוב לעדכונים חדשים!" : "Check back soon for new updates!"}
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UpdatesPage;
