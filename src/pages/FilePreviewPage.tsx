import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { downloadFile } from "@/lib/downloadFile";
import Navbar from "@/components/Navbar";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import FileShareModal from "@/components/FileShareModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronRight, Download, ArrowLeft, Music, FileText, File as FileIcon,
  Loader2, Share2, History, Copy, Check, Pencil,
} from "lucide-react";
import { toast } from "sonner";

interface FileData {
  id: string;
  user_id: string;
  project_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  version_number: number;
  parent_file_id: string | null;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" });

const FilePreviewPage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isRTL, t: tr } = useDirection();
  const navigate = useNavigate();

  const [file, setFile] = useState<FileData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<FileData[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!fileId || !user) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setFile(data as FileData);

      if (data.project_id) {
        const { data: proj } = await supabase.from("projects").select("name").eq("id", data.project_id).maybeSingle();
        if (proj) setProjectName(proj.name);
      }

      const isText = data.file_type.startsWith("text") || data.file_name.endsWith(".md") || data.file_name.endsWith(".txt");
      if (isText) {
        try {
          const resp = await fetch(data.file_url);
          const txt = await resp.text();
          setTextContent(txt);
        } catch {}
      }

      setLoading(false);
      setTimeout(() => setContentLoading(false), 200);
    })();
  }, [fileId, user]);

  const loadVersions = async () => {
    if (!file || !user) return;
    const rootId = file.parent_file_id || file.id;
    const { data } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .or(`id.eq.${rootId},parent_file_id.eq.${rootId}`)
      .order("version_number", { ascending: false });
    setVersions((data || []) as FileData[]);
    setShowVersions(true);
  };

  const handleCopyContent = async () => {
    if (textContent === null) return;
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success(isRTL ? "הועתק ללוח" : "Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center py-20 text-center">
            <FileIcon className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <p className="text-lg font-semibold text-foreground">{isRTL ? "הקובץ לא נמצא" : "File not found"}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate(-1)}>
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
              {isRTL ? "חזרה" : "Back"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isVideo = file.file_type.startsWith("video");
  const isImage = file.file_type.startsWith("image");
  const isAudio = file.file_type.startsWith("audio");
  const isPdf = file.file_type === "application/pdf";
  const isText = file.file_type.startsWith("text") || file.file_name.endsWith(".md") || file.file_name.endsWith(".txt");
  const isMd = file.file_name.endsWith(".md");
  const isEditable = isText;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-1 text-sm">
          <button onClick={() => navigate("/projects")} className="text-muted-foreground hover:text-foreground transition-colors">
            {isRTL ? "כל הפרויקטים" : "All Projects"}
          </button>
          {file.project_id && projectName && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
              <button onClick={() => navigate(`/projects/${file.project_id}`)} className="text-muted-foreground hover:text-foreground transition-colors">
                {projectName}
              </button>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
          <span className="font-semibold text-foreground">{file.file_name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{file.file_name}</h2>
            {file.version_number > 1 && (
              <p className="text-xs text-muted-foreground">{isRTL ? "גרסה" : "Version"} {file.version_number}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={loadVersions}>
              <History className="h-4 w-4" />
              {isRTL ? "גרסאות" : "Versions"}
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setShowShare(true)}>
              <Share2 className="h-4 w-4" />
              {isRTL ? "שתף" : "Share"}
            </Button>
            {isText && textContent !== null && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={handleCopyContent}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isRTL ? "העתק" : "Copy"}
              </Button>
            )}
            {isEditable && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => navigate(`/projects/document/${file.id}`)}>
                <Pencil className="h-4 w-4" />
                {isRTL ? "ערוך" : "Edit"}
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-xl gap-1.5 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => downloadFile(file.file_url, file.file_name)}
            >
              <Download className="h-4 w-4" />
              {isRTL ? "הורדה" : "Download"}
            </Button>
          </div>
        </div>

        {/* Preview container */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {contentLoading ? (
            <div className="p-6">
              <Skeleton className="aspect-video w-full rounded-xl" />
            </div>
          ) : (
            <>
              {isVideo && <PixiVideoPlayer src={file.file_url} title={file.file_name} />}

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
            </>
          )}
        </div>

        {/* File info */}
        <p className="mt-4 text-sm text-muted-foreground">
          {formatSize(file.file_size)} · {formatDate(file.created_at)}
        </p>
      </main>

      {/* Share Modal */}
      {showShare && (
        <FileShareModal open={showShare} onOpenChange={setShowShare} fileId={file.id} fileName={file.file_name} />
      )}

      {/* Version History Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRTL ? "היסטוריית גרסאות" : "Version History"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  v.id === file.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => {
                  navigate(`/projects/file/${v.id}`);
                  setShowVersions(false);
                  window.location.reload();
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  v{v.version_number}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{v.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(v.created_at)}</p>
                </div>
                {v.id === file.id && (
                  <span className="text-xs font-semibold text-primary">{isRTL ? "נוכחי" : "current"}</span>
                )}
              </div>
            ))}
            {versions.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {isRTL ? "אין גרסאות נוספות" : "No other versions"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilePreviewPage;
