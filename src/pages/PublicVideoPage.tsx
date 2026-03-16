import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import { Loader2 } from "lucide-react";

const PublicVideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { direction } = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!videoId) {
      setError("לא נמצא סרטון");
      setLoading(false);
      return;
    }

    (async () => {
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

      const resolved = getVideoPublicUrl(data.video_url);
      setVideoUrl(resolved);
      setTitle(data.title || "");
      setLoading(false);
    })();
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-xl font-bold text-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <header className="border-b border-border px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <span className="text-2xl font-extrabold text-primary">Pixi</span>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {videoUrl ? (
          <PixiVideoPlayer src={videoUrl} title={title} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">לא ניתן לטעון את הסרטון</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicVideoPage;
