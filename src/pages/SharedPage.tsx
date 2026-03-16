import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { Loader2 } from "lucide-react";

const SharedPage = () => {
  const { token } = useParams<{ type: string; token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      // Fetch share record
      const { data: share, error: sErr } = await supabase
        .from("project_shares")
        .select("*")
        .eq("share_token", token)
        .single();

      if (sErr || !share) {
        setError("הקישור לא נמצא או שפג תוקפו");
        setLoading(false);
        return;
      }

      // Get project name
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", share.project_id)
        .single();
      setProjectName(project?.name || "");

      // Get creator
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", share.shared_by)
        .single();
      setCreatorName(profile?.full_name || "Pixi User");

      // If specific video shared
      if (share.video_id) {
        const { data: vid } = await supabase
          .from("videos")
          .select("*")
          .eq("id", share.video_id)
          .single();
        if (vid) {
          setVideoUrl(vid.video_url || "");
          setTitle(vid.title || "");
        }
      } else {
        // Get first video of project
        const { data: vids } = await supabase
          .from("videos")
          .select("*")
          .eq("project_id", share.project_id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (vids?.[0]) {
          setVideoUrl(vids[0].video_url || "");
          setTitle(vids[0].title || "");
        }
      }
      setLoading(false);
    })();
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
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
          <PixiVideoPlayer src={videoUrl} title={title} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">אין סרטון זמין</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedPage;
