import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { downloadFile } from "@/lib/downloadFile";
import { sanitizeFileName } from "@/lib/sanitizeFileName";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight, Download, Save, Copy, Check, History, ArrowLeft,
  FileText, Loader2,
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

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" });

const DocumentEditorPage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isRTL } = useDirection();
  const navigate = useNavigate();

  const [file, setFile] = useState<FileData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<FileData[]>([]);

  const isDirty = content !== originalContent;

  useEffect(() => {
    if (!fileId || !user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) { setLoading(false); return; }
      setFile(data as FileData);

      if (data.project_id) {
        const { data: proj } = await supabase.from("projects").select("name").eq("id", data.project_id).maybeSingle();
        if (proj) setProjectName(proj.name);
      }

      try {
        const resp = await fetch(data.file_url);
        const txt = await resp.text();
        setContent(txt);
        setOriginalContent(txt);
      } catch {}

      setLoading(false);
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

  const handleSave = async () => {
    if (!file || !user || !isDirty) return;
    setSaving(true);

    try {
      const blob = new Blob([content], { type: file.file_type || "text/plain" });
      const newVersion = file.version_number + 1;
      const path = `${user.id}/${Date.now()}_v${newVersion}_${sanitizeFileName(file.file_name)}`;

      const { error: upErr } = await supabase.storage.from("user-files").upload(path, blob);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("user-files").getPublicUrl(path);
      const rootId = file.parent_file_id || file.id;

      const { data: newFile, error: dbErr } = await supabase
        .from("user_files")
        .insert({
          user_id: user.id,
          project_id: file.project_id,
          folder_id: (file as any).folder_id || null,
          file_name: file.file_name,
          file_url: urlData.publicUrl,
          file_type: file.file_type,
          file_size: blob.size,
          version_number: newVersion,
          parent_file_id: rootId,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      setFile(newFile as FileData);
      setOriginalContent(content);
      toast.success(isRTL ? `נשמר כגרסה ${newVersion}` : `Saved as version ${newVersion}`);
      navigate(`/projects/document/${newFile.id}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
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
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/40" />
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

  const isMd = file.file_name.endsWith(".md");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8 relative z-10">
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

        {/* Header with glassmorphism toolbar */}
        <Card variant="glass" className="flex items-center justify-between mb-6 p-4 shadow-luxury-md">
          <div>
            <h2 className="text-2xl font-cal-sans text-foreground">{file.file_name}</h2>
            {file.version_number > 1 && (
              <p className="text-xs text-muted-foreground">{isRTL ? "גרסה" : "Version"} {file.version_number}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="luxury-outline" size="sm" onClick={loadVersions}>
              <History className="h-4 w-4" />
              {isRTL ? "גרסאות" : "Versions"}
            </Button>
            <Button variant="luxury-outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isRTL ? "העתק" : "Copy"}
            </Button>
            <Button
              variant="luxury"
              size="sm"
              disabled={!isDirty || saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isRTL ? "שמור" : "Save"}
            </Button>
            <Button
              variant="luxury"
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => downloadFile(file.file_url, file.file_name)}
            >
              <Download className="h-4 w-4" />
              {isRTL ? "הורדה" : "Download"}
            </Button>
          </div>
        </Card>

        {/* Editor */}
        <Card variant="glass" className="overflow-hidden shadow-luxury-lg rounded-luxury-lg">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60vh] w-full resize-none rounded-none border-0 bg-transparent p-8 font-mono text-sm text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            dir="auto"
          />
        </Card>

        {/* Preview for markdown */}
        {isMd && content && (
          <Card variant="glass" className="mt-6 p-8 shadow-luxury-md">
            <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{isRTL ? "תצוגה מקדימה" : "Preview"}</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{
              __html: content
                .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/`(.*?)`/g, "<code>$1</code>")
                .replace(/\n/g, "<br/>"),
            }} />
          </Card>
        )}
      </main>

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
                  navigate(`/projects/document/${v.id}`, { replace: true });
                  setShowVersions(false);
                  // Reload
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

export default DocumentEditorPage;
