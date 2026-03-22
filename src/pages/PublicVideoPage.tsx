import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const PublicVideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { direction } = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    const { data, error: fetchErr } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();

    if (fetchErr || !data) {
      setError("הסרטון לא נמצא או שאין הרשאה לצפייה");
      setLoading(false);
      return;
    }

    setStatus(data.status);
    setTitle(data.title || "");
    if (data.video_url) {
      setVideoUrl(getVideoPublicUrl(data.video_url));
    }
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    if (!videoId) {
      setError("לא נמצא סרטון");
      setLoading(false);
      return;
    }
    fetchVideo();
  }, [videoId, fetchVideo]);

  // Realtime subscription for video updates
  useEffect(() => {
    if (!videoId) return;

    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "videos",
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setStatus(updated.status);
          setTitle(updated.title || "");
          if (updated.video_url) {
            setVideoUrl(getVideoPublicUrl(updated.video_url));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background relative overflow-hidden p-4">
        <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <Card variant="glass" className="p-12 max-w-2xl relative z-10 shadow-luxury-lg">
          <p className="text-2xl font-bold text-foreground text-center">{error}</p>
        </Card>
      </div>
    );
  }

  const isProcessing = !videoUrl && status !== "failed";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir={direction}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pixi</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-8 relative z-10">
        {videoUrl ? (
          <Card variant="glass" className="overflow-hidden rounded-luxury-xl shadow-luxury-lg animate-luxury-fade-up">
            <PixiVideoPlayer src={videoUrl} title={title} />
          </Card>
        ) : isProcessing ? (
          <Card variant="glass" className="p-16 text-center shadow-luxury-lg animate-luxury-fade-up">
            <Loader2 className="mx-auto mb-6 h-16 w-16 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">הסרטון בעיבוד... העמוד יתעדכן אוטומטית</p>
          </Card>
        ) : (
          <Card variant="glass" className="p-16 text-center shadow-luxury-lg animate-luxury-fade-up">
            <p className="text-lg text-muted-foreground">לא ניתן לטעון את הסרטון</p>
          </Card>
        )}

        {/* Metadata Section */}
        {videoUrl && (
          <Card variant="glass" className="mt-6 p-6 shadow-luxury-md">
            <h2 className="text-2xl font-cal-sans mb-2">{title}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>סרטון ציבורי</span>
              <span>•</span>
              <span>נוצר ב-Pixi</span>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PublicVideoPage;
