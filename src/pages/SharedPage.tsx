import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const SharedPage = () => {
  const { token } = useParams<{ token: string }>();
  const { direction } = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");

  const loadShare = async () => {
    if (!token) {
      setError("קישור לא תקין");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl("");

    // 1. Fetch share record by token
    const { data: share, error: sErr } = await supabase
      .from("project_shares")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (sErr || !share) {
      console.error("Share fetch error:", sErr);
      setError("הקישור לא נמצא");
      setLoading(false);
      return;
    }

    if (share.visibility === "private") {
      setError("הקישור לא נמצא");
      setLoading(false);
      return;
    }

    // 2. Fetch project name (optional, for display)
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", share.project_id)
      .maybeSingle();
    setProjectName(project?.name || "");

    // 3. Fetch creator name (optional, for display)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", share.shared_by)
      .maybeSingle();
    setCreatorName(profile?.full_name || "Pixi User");

    // 4. Fetch the video
    let videoData = null;

    if (share.video_id) {
      const { data: vid, error: vidErr } = await supabase
        .from("videos")
        .select("*")
        .eq("id", share.video_id)
        .maybeSingle();
      if (vidErr) console.error("Video fetch error:", vidErr);
      videoData = vid;
    } else {
      // Fallback: get latest video in the project
      const { data: vids, error: vidsErr } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", share.project_id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (vidsErr) console.error("Videos fetch error:", vidsErr);
      videoData = vids?.[0] || null;
    }

    if (videoData) {
      setTitle(videoData.title || "");
      if (videoData.video_url) {
        const resolved = getVideoPublicUrl(videoData.video_url);
        console.log("Share page - video_url from DB:", videoData.video_url);
        console.log("Share page - resolved public URL:", resolved);
        setVideoUrl(resolved);
      } else {
        console.warn("Share page - video record found but video_url is null/empty");
      }
    } else {
      console.warn("Share page - no video record found for video_id:", share.video_id);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadShare();
  }, [token]);

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
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          נסה שוב
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <header className="border-b border-border px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{title || projectName}</h1>
            <p className="text-sm text-muted-foreground">
              {creatorName} · Pixi
            </p>
          </div>
          <span className="text-2xl font-extrabold text-primary">Pixi</span>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {videoUrl ? (
          <PixiVideoPlayer src={videoUrl} title={title} autoPlay />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
            <p className="text-muted-foreground">הסרטון לא זמין</p>
            <Button variant="outline" onClick={loadShare} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              נסה שוב
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedPage;
