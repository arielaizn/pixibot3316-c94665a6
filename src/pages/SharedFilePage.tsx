import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDirection } from "@/contexts/DirectionContext";
import { downloadFile } from "@/lib/downloadFile";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink, Music, FileText, File as FileIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileData {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  user_id: string;
}

const SharedFilePage = () => {
  const { token } = useParams<{ token: string }>();
  const { direction, isRTL } = useDirection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState<FileData | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(isRTL ? "קישור לא תקין" : "Invalid link");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      // 1. Fetch file_share record
      const { data: share, error: sErr } = await supabase
        .from("file_shares")
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

      // 2. Fetch file
      const { data: fileData } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", share.file_id)
        .maybeSingle();

      if (!fileData) {
        setError(isRTL ? "הקובץ לא נמצא" : "File not found");
        setLoading(false);
        return;
      }

      setFile(fileData as FileData);

      // 3. Creator name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", fileData.user_id)
        .maybeSingle();
      setCreatorName(profile?.full_name || "Pixi User");

      // 4. Load text content if applicable
      const isText = fileData.file_type.startsWith("text") || fileData.file_name.endsWith(".md") || fileData.file_name.endsWith(".txt");
      if (isText) {
        try {
          const resp = await fetch(fileData.file_url);
          setTextContent(await resp.text());
        } catch {}
      }

      setLoading(false);
    })();
  }, [token]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(isRTL ? "he-IL" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{isRTL ? "טוען קובץ..." : "Loading file..."}</p>
        </motion.div>
      </div>
    );
  }

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

  if (!file) return null;

  const isVideo = file.file_type.startsWith("video");
  const isImage = file.file_type.startsWith("image");
  const isAudio = file.file_type.startsWith("audio");
  const isPdf = file.file_type === "application/pdf";
  const isText = file.file_type.startsWith("text") || file.file_name.endsWith(".md") || file.file_name.endsWith(".txt");
  const isMd = file.file_name.endsWith(".md");

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-extrabold text-primary transition-transform group-hover:scale-105">Pixi</span>
          </a>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => downloadFile(file.file_url, file.file_name)}>
            <Download className="h-4 w-4" />
            {isRTL ? "הורדה" : "Download"}
          </Button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="container mx-auto max-w-[900px] px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div key="file-preview" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            {/* Preview container */}
            <div className="overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] ring-1 ring-border/10">
              {isVideo && <PixiVideoPlayer src={file.file_url} title={file.file_name} autoPlay />}

              {isImage && (
                <div className="flex items-center justify-center bg-muted/30 p-4" style={{ minHeight: "40vh" }}>
                  <img src={file.file_url} alt={file.file_name} className="max-h-[70vh] w-full rounded-xl object-contain" />
                </div>
              )}

              {isAudio && (
                <div className="flex flex-col items-center justify-center gap-6 py-16 px-6">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
                    <Music className="h-14 w-14 text-primary" />
                  </div>
                  <audio controls className="w-full max-w-lg">
                    <source src={file.file_url} type={file.file_type} />
                  </audio>
                </div>
              )}

              {isPdf && <iframe src={file.file_url} className="h-[70vh] w-full" title={file.file_name} />}

              {isText && textContent !== null && (
                <div className="max-h-[70vh] overflow-auto p-6">
                  {isMd ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{
                      __html: textContent
                        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                        .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/`(.*?)`/g, "<code>$1</code>")
                        .replace(/\n/g, "<br/>"),
                    }} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">{textContent}</pre>
                  )}
                </div>
              )}

              {!isVideo && !isImage && !isAudio && !isPdf && !isText && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FileIcon className="mb-4 h-16 w-16 text-muted-foreground/40" />
                  <p className="text-muted-foreground">{isRTL ? "תצוגה מקדימה לא זמינה" : "Preview not available"}</p>
                </div>
              )}
            </div>

            {/* File info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground md:text-2xl">{file.file_name}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{creatorName}</span>
                    <span className="text-border">·</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>
                <Button onClick={() => downloadFile(file.file_url, file.file_name)} className="hidden sm:flex rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Download className="h-4 w-4" />
                  {isRTL ? "הורד קובץ" : "Download File"}
                </Button>
              </div>
              <Button onClick={() => downloadFile(file.file_url, file.file_name)} className="sm:hidden w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Download className="h-4 w-4" />
                {isRTL ? "הורד קובץ" : "Download File"}
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="border-t border-border/30 py-6 text-center">
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

export default SharedFilePage;
