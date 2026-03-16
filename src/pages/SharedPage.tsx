import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import { Loader2, Download, Eye, ExternalLink } from "lucide-react";
import { downloadFile } from "@/lib/downloadFile";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface VideoData {
  id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  view_count?: number;
}

const SharedPage = () => {
  const { token } = useParams<{ token: string }>();
  const { direction, isRTL } = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [video, setVideo] = useState<VideoData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [viewCount, setViewCount] = useState(0);

  const loadShare = async () => {
    if (!token) {
      setError(isRTL ? "קישור לא תקין" : "Invalid link");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl("");

    // 1. Fetch share record
    const { data: share, error: sErr } = await supabase
      .from("project_shares")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (sErr || !share) {
      setError(isRTL ? "הקישור לא נמצא" : "Link not found");
      setLoading(false);
      return;
    }

    if (share.visibility === "private") {
      setError(isRTL ? "הקישור לא נמצא" : "Link not found");
      setLoading(false);
      return;
    }

    // 2. Fetch project name
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", share.project_id)
      .maybeSingle();
    setProjectName(project?.name || "");

    // 3. Fetch creator name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", share.shared_by)
      .maybeSingle();
    setCreatorName(profile?.full_name || "Pixi User");

    // 4. Fetch video
    let videoData: VideoData | null = null;

    if (share.video_id) {
      const { data: vid } = await supabase
        .from("videos")
        .select("*")
        .eq("id", share.video_id)
        .maybeSingle();
      videoData = vid;
    } else {
      const { data: vids } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", share.project_id)
        .order("created_at", { ascending: false })
        .limit(1);
      videoData = vids?.[0] || null;
    }

    if (videoData) {
      setVideo(videoData);
      setViewCount((videoData.view_count || 0) + 1);
      if (videoData.video_url) {
        setVideoUrl(getVideoPublicUrl(videoData.video_url));
      }

      // 5. Increment view count (fire and forget)
      supabase.rpc("increment_view_count" as never, { p_video_id: videoData.id } as never).then(() => {});
    }

    setLoading(false);
  };

  useEffect(() => {
    loadShare();
  }, [token]);

  const handleDownload = () => {
    if (!videoUrl || !video) return;
    downloadFile(videoUrl, (video.title || "video") + ".mp4");
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            {isRTL ? "טוען סרטון..." : "Loading video..."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ExternalLink className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold text-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRTL ? "הקישור שחיפשת לא זמין" : "The link you're looking for isn't available"}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold text-primary transition-transform group-hover:scale-105">
              Pixi
            </span>
          </a>
          {videoUrl && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              {isRTL ? "הורדה" : "Download"}
            </Button>
          )}
        </div>
      </motion.header>

      {/* Main content */}
      <main className="container mx-auto max-w-[900px] px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Player container */}
            <div className="overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] ring-1 ring-border/10">
              {videoUrl ? (
                <PixiVideoPlayer
                  src={videoUrl}
                  title={video?.title}
                  thumbnail={video?.thumbnail_url}
                  autoPlay
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  <p className="text-muted-foreground">
                    {isRTL ? "הסרטון לא זמין" : "Video not available"}
                  </p>
                </div>
              )}
            </div>

            {/* Video info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-6 space-y-4"
            >
              {/* Title + meta */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground md:text-2xl">
                    {video?.title || projectName}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{creatorName}</span>
                    {video?.created_at && (
                      <>
                        <span className="text-border">·</span>
                        <span>{formatDate(video.created_at)}</span>
                      </>
                    )}
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {viewCount} {isRTL ? "צפיות" : "views"}
                    </span>
                  </div>
                </div>

                {/* Download button (desktop) */}
                {videoUrl && (
                  <Button
                    onClick={handleDownload}
                    className="hidden sm:flex rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                  >
                    <Download className="h-4 w-4" />
                    {isRTL ? "הורד סרטון" : "Download Video"}
                  </Button>
                )}
              </div>

              {/* Mobile download */}
              {videoUrl && (
                <Button
                  onClick={handleDownload}
                  className="sm:hidden w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <Download className="h-4 w-4" />
                  {isRTL ? "הורד סרטון" : "Download Video"}
                </Button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer branding */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="border-t border-border/30 py-6 text-center"
      >
        <a href="/" className="inline-flex flex-col items-center gap-1 group">
          <span className="text-lg font-extrabold text-primary">Pixi</span>
          <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            {isRTL ? "נוצר עם Pixi AI Video Studio" : "Created with Pixi AI Video Studio"}
          </span>
        </a>
      </motion.footer>
    </div>
  );
};

export default SharedPage;
