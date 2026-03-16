import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { getVideoPublicUrl } from "@/lib/videoUrl";
import { downloadFile } from "@/lib/downloadFile";
import { Button } from "@/components/ui/button";
import {
  Loader2, Download, Eye, ExternalLink, FolderOpen, Play,
  Music, FileText, FileImage, File as FileIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoData {
  id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  view_count?: number;
  status?: string;
}

interface SharedFileData {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const formatDate = (d: string, isRTL: boolean) =>
  new Date(d).toLocaleDateString(isRTL ? "he-IL" : "en-US", { year: "numeric", month: "short", day: "numeric" });

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SharedPage = () => {
  const { token } = useParams<{ token: string }>();
  const { direction, isRTL } = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Video share state
  const [videoUrl, setVideoUrl] = useState("");
  const [video, setVideo] = useState<VideoData | null>(null);
  const [viewCount, setViewCount] = useState(0);

  // Folder share state
  const [isFolder, setIsFolder] = useState(false);
  const [folderVideos, setFolderVideos] = useState<VideoData[]>([]);
  const [folderFiles, setFolderFiles] = useState<SharedFileData[]>([]);
  const [playingVideo, setPlayingVideo] = useState<VideoData | null>(null);
  const [previewFile, setPreviewFile] = useState<SharedFileData | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Common state
  const [projectName, setProjectName] = useState("");
  const [creatorName, setCreatorName] = useState("");

  const loadShare = async () => {
    if (!token) {
      setError(isRTL ? "קישור לא תקין" : "Invalid link");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setVideoUrl("");

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

    // Project name
    const { data: project } = await supabase.from("projects").select("name").eq("id", share.project_id).maybeSingle();
    setProjectName(project?.name || "");

    // Creator name
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", share.shared_by).maybeSingle();
    setCreatorName(profile?.full_name || "Pixi User");

    if (share.video_id) {
      // === Single video share ===
      setIsFolder(false);
      const { data: vid } = await supabase.from("videos").select("*").eq("id", share.video_id).maybeSingle();
      if (vid) {
        setVideo(vid);
        setViewCount((vid.view_count || 0) + 1);
        if (vid.video_url) setVideoUrl(getVideoPublicUrl(vid.video_url));
        supabase.rpc("increment_view_count" as never, { p_video_id: vid.id } as never).then(() => {});
      }
    } else {
      // === Folder/project share — load all contents ===
      setIsFolder(true);

      const { data: vids } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", share.project_id)
        .order("created_at", { ascending: false });
      setFolderVideos((vids || []) as VideoData[]);

      const { data: files } = await supabase
        .from("user_files")
        .select("*")
        .eq("project_id", share.project_id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      setFolderFiles((files || []) as SharedFileData[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadShare();
  }, [token]);

  // Realtime: auto-update when a single shared video gets its video_url
  useEffect(() => {
    if (!video || videoUrl) return; // only subscribe while waiting
    const channel = supabase
      .channel(`shared-video-${video.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "videos",
          filter: `id=eq.${video.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.video_url) {
            setVideoUrl(getVideoPublicUrl(updated.video_url));
            setVideo((prev) => prev ? { ...prev, ...updated } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [video?.id, videoUrl]);

  const handleDownload = () => {
    if (!videoUrl || !video) return;
    downloadFile(videoUrl, (video.title || "video") + ".mp4");
  };

  const handlePlayFolderVideo = (vid: VideoData) => {
    setPlayingVideo(vid);
    setPreviewFile(null);
  };

  const handlePreviewFile = async (file: SharedFileData) => {
    setPlayingVideo(null);
    setPreviewFile(file);
    setTextContent(null);
    const isText = file.file_type.startsWith("text") || file.file_name.endsWith(".md") || file.file_name.endsWith(".txt");
    if (isText) {
      try {
        const resp = await fetch(file.file_url);
        setTextContent(await resp.text());
      } catch {}
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{isRTL ? "טוען..." : "Loading..."}</p>
        </motion.div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ExternalLink className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold text-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">{isRTL ? "הקישור שחיפשת לא זמין" : "The link you're looking for isn't available"}</p>
        </motion.div>
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("audio")) return Music;
    if (type.startsWith("image")) return FileImage;
    if (type.includes("pdf") || type.startsWith("text")) return FileText;
    return FileIcon;
  };

  // === Folder share view ===
  if (isFolder) {
    const nonVideoFiles = folderFiles.filter(f => !f.file_type.startsWith("video"));
    const totalItems = folderVideos.length + nonVideoFiles.length;

    return (
      <div className="min-h-screen bg-background" dir={direction}>
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between px-6 py-3">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-extrabold text-primary transition-transform group-hover:scale-105">Pixi</span>
            </a>
          </div>
        </motion.header>

        <main className="container mx-auto max-w-[900px] px-4 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Folder info */}
            <div className="mb-8 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{projectName || (isRTL ? "תיקייה משותפת" : "Shared Folder")}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{creatorName}</span>
                    <span className="text-border">·</span>
                    <span>{totalItems} {isRTL ? "פריטים" : "items"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active preview */}
            {playingVideo && (
              <div className="mb-8">
                <div className="overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] ring-1 ring-border/10">
                  <PixiVideoPlayer
                    src={getVideoPublicUrl(playingVideo.video_url)}
                    title={playingVideo.title}
                    thumbnail={playingVideo.thumbnail_url}
                    autoPlay
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{playingVideo.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(playingVideo.created_at, isRTL)}</p>
                  </div>
                  {playingVideo.video_url && (
                    <Button size="sm" className="rounded-xl gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => downloadFile(getVideoPublicUrl(playingVideo.video_url!), (playingVideo.title || "video") + ".mp4")}>
                      <Download className="h-4 w-4" />
                      {isRTL ? "הורדה" : "Download"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* File preview */}
            {previewFile && (
              <div className="mb-8">
                <div className="overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] ring-1 ring-border/10">
                  {previewFile.file_type.startsWith("image") && (
                    <div className="flex items-center justify-center bg-muted/30 p-4" style={{ minHeight: "40vh" }}>
                      <img src={previewFile.file_url} alt={previewFile.file_name} className="max-h-[70vh] w-full rounded-xl object-contain" />
                    </div>
                  )}
                  {previewFile.file_type.startsWith("audio") && (
                    <div className="flex flex-col items-center justify-center gap-6 py-16 px-6">
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
                        <Music className="h-14 w-14 text-primary" />
                      </div>
                      <audio controls className="w-full max-w-lg">
                        <source src={previewFile.file_url} type={previewFile.file_type} />
                      </audio>
                    </div>
                  )}
                  {previewFile.file_type === "application/pdf" && (
                    <iframe src={previewFile.file_url} className="h-[70vh] w-full" title={previewFile.file_name} />
                  )}
                  {(previewFile.file_type.startsWith("text") || previewFile.file_name.endsWith(".md") || previewFile.file_name.endsWith(".txt")) && textContent !== null && (
                    <div className="max-h-[70vh] overflow-auto p-6">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">{textContent}</pre>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{previewFile.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(previewFile.file_size)} · {formatDate(previewFile.created_at, isRTL)}</p>
                  </div>
                  <Button size="sm" className="rounded-xl gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => downloadFile(previewFile.file_url, previewFile.file_name)}>
                    <Download className="h-4 w-4" />
                    {isRTL ? "הורדה" : "Download"}
                  </Button>
                </div>
              </div>
            )}

            {/* Videos list */}
            {folderVideos.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">{isRTL ? "סרטונים" : "Videos"}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {folderVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className={`group cursor-pointer rounded-xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${playingVideo?.id === vid.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                      onClick={() => handlePlayFolderVideo(vid)}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted/50">
                        {vid.thumbnail_url ? (
                          <img src={vid.thumbnail_url} alt={vid.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Play className="h-8 w-8 text-muted-foreground/30" /></div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-background/0 transition-colors group-hover:bg-background/30">
                          <div className="rounded-full bg-primary/80 p-2.5 opacity-0 shadow-lg transition-all group-hover:opacity-100">
                            <Play className="h-4 w-4 text-primary-foreground ms-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="truncate font-medium text-foreground text-sm">{vid.title || (isRTL ? "סרטון" : "Video")}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(vid.created_at, isRTL)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files list */}
            {nonVideoFiles.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-foreground">{isRTL ? "קבצים" : "Files"}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {nonVideoFiles.map((file) => {
                    const Icon = getFileIcon(file.file_type);
                    const isImage = file.file_type.startsWith("image");
                    return (
                      <div
                        key={file.id}
                        className={`group cursor-pointer rounded-xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${previewFile?.id === file.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                        onClick={() => handlePreviewFile(file)}
                      >
                        <div className="flex aspect-[4/3] items-center justify-center rounded-t-xl bg-muted/50 overflow-hidden">
                          {isImage ? (
                            <img src={file.file_url} alt={file.file_name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <Icon className="h-10 w-10 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate font-medium text-foreground text-sm">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">{formatSize(file.file_size)} · {formatDate(file.created_at, isRTL)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty folder */}
            {totalItems === 0 && (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-foreground font-semibold">{isRTL ? "התיקייה ריקה" : "This folder is empty"}</p>
              </div>
            )}
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="border-t border-border/30 py-6 text-center">
          <a href="/" className="inline-flex flex-col items-center gap-1 group">
            <span className="text-lg font-extrabold text-primary">Pixi</span>
            <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">{isRTL ? "נוצר עם Pixi AI Video Studio" : "Created with Pixi AI Video Studio"}</span>
          </a>
        </motion.footer>
      </div>
    );
  }

  // === Single video share view ===
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold text-primary transition-transform group-hover:scale-105">Pixi</span>
          </a>
          {videoUrl && (
            <Button variant="outline" size="sm" className="rounded-xl gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              {isRTL ? "הורדה" : "Download"}
            </Button>
          )}
        </div>
      </motion.header>

      <main className="container mx-auto max-w-[900px] px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div key="player" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] ring-1 ring-border/10">
              {videoUrl ? (
                <PixiVideoPlayer src={videoUrl} title={video?.title} thumbnail={video?.thumbnail_url} autoPlay />
              ) : video?.status && video.status !== "completed" && video.status !== "failed" ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">{isRTL ? "הסרטון בעיבוד... העמוד יתעדכן אוטומטית" : "Video is processing... will update automatically"}</p>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  <p className="text-muted-foreground">{isRTL ? "הסרטון לא זמין" : "Video not available"}</p>
                </div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground md:text-2xl">{video?.title || projectName}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{creatorName}</span>
                    {video?.created_at && (
                      <>
                        <span className="text-border">·</span>
                        <span>{formatDate(video.created_at, isRTL)}</span>
                      </>
                    )}
                    <span className="text-border">·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {viewCount} {isRTL ? "צפיות" : "views"}
                    </span>
                  </div>
                </div>
                {videoUrl && (
                  <Button onClick={handleDownload} className="hidden sm:flex rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
                    <Download className="h-4 w-4" />
                    {isRTL ? "הורד סרטון" : "Download Video"}
                  </Button>
                )}
              </div>
              {videoUrl && (
                <Button onClick={handleDownload} className="sm:hidden w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Download className="h-4 w-4" />
                  {isRTL ? "הורד סרטון" : "Download Video"}
                </Button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="border-t border-border/30 py-6 text-center">
        <a href="/" className="inline-flex flex-col items-center gap-1 group">
          <span className="text-lg font-extrabold text-primary">Pixi</span>
          <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">{isRTL ? "נוצר עם Pixi AI Video Studio" : "Created with Pixi AI Video Studio"}</span>
        </a>
      </motion.footer>
    </div>
  );
};

export default SharedPage;
