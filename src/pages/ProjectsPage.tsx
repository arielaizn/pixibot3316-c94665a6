import { useState, useRef, useCallback, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { useFileManager, UserFile, UserFolder } from "@/hooks/useFileManager";
import { useProjects, ProjectWithContent, VideoRecord, ProjectFile } from "@/hooks/useProjects";
import Navbar from "@/components/Navbar";
import PixiVideoPlayer from "@/components/PixiVideoPlayer";
import ShareModal from "@/components/ShareModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, FolderOpen, FolderPlus, Upload, Search, Grid3X3, List, Star, StarOff,
  Trash2, Pencil, MoreVertical, FileText, FileVideo, FileImage, FileAudio, File as FileIcon,
  ChevronRight, X, Eye, Download, ArrowLeft, Video, Share2, Play, Plus, History, FolderInput,
  Sparkles, Tag, Wand2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── helpers ── */
const getFileIcon = (type: string) => {
  if (type.startsWith("video")) return FileVideo;
  if (type.startsWith("image")) return FileImage;
  if (type.startsWith("audio")) return FileAudio;
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
  return FileIcon;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" });

/* ── component ── */
const ProjectsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRTL, t: tr } = useDirection();
  const {
    projects, isLoading: projectsLoading,
    createProject, renameProject, deleteProject,
    renameVideo, deleteVideo, uploadToProject, moveFileToProject,
    classifyVideo, updateVideoTags, updateVideoCategory,
  } = useProjects();

  // File manager for standalone files tab
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: isRTL ? "הקבצים שלי" : "My Files" },
  ]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "file" | "folder" | "project" | "video" } | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ fileId: string; fileName: string } | null>(null);

  // Navigation state
  const [selectedProject, setSelectedProject] = useState<ProjectWithContent | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoRecord | null>(null);
  const [shareTarget, setShareTarget] = useState<{ projectId: string; videoId?: string; name?: string } | null>(null);
  const [showVersions, setShowVersions] = useState<VideoRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    folders, files, allFiles, loading,
    createFolder, renameFolder, deleteFolder,
    uploadFiles, renameFile, deleteFile, toggleStar,
  } = useFileManager(currentFolderId);

  const t = {
    title: tr("projects.title"),
    subtitle: tr("projects.subtitle"),
    newFolder: tr("projects.newFolder"),
    newProject: tr("projects.newProject"),
    upload: tr("projects.upload"),
    search: tr("projects.search"),
    empty: tr("projects.empty"),
    emptyDesc: tr("projects.emptyDesc"),
    dragDrop: tr("projects.dragDrop"),
    rename: tr("projects.rename"),
    delete: tr("projects.delete"),
    star: tr("projects.star"),
    unstar: tr("projects.unstar"),
    preview: tr("projects.preview"),
    download: tr("projects.download"),
    create: tr("projects.create"),
    cancel: tr("projects.cancel"),
    save: tr("projects.save"),
    back: tr("projects.back"),
    createFirst: tr("projects.createFirst"),
    videos: tr("projects.videosLabel"),
    filesLabel: tr("projects.filesLabel"),
    noProjects: tr("projects.noProjects"),
    noVideos: tr("projects.noVideos"),
    share: tr("projects.share"),
    moveTo: tr("projects.moveTo"),
    versions: tr("projects.versions"),
    version: tr("projects.version"),
    allProjects: tr("projects.allProjects"),
    projectName: tr("projects.projectName"),
    noFiles: tr("projects.noFiles"),
    uploading: tr("projects.uploading"),
  };

  /* ── Global search across projects, videos, files — includes tags & categories ── */
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matchedProjects = (projects || []).filter((p) =>
      p.name.toLowerCase().includes(q)
    );

    const matchedVideos: (VideoRecord & { projectName: string })[] = [];
    const matchedFiles: (ProjectFile & { projectName: string })[] = [];

    (projects || []).forEach((p) => {
      p.videos.forEach((v) => {
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchCategory = v.category?.toLowerCase().includes(q);
        const matchTags = v.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (matchTitle || matchCategory || matchTags) {
          matchedVideos.push({ ...v, projectName: p.name });
        }
      });
      p.files.forEach((f) => {
        if (f.file_name.toLowerCase().includes(q)) {
          matchedFiles.push({ ...f, projectName: p.name });
        }
      });
    });

    const standaloneMatches = allFiles.filter((f) => f.file_name.toLowerCase().includes(q));

    return { projects: matchedProjects, videos: matchedVideos, files: matchedFiles, standalone: standaloneMatches };
  }, [search, projects, allFiles]);

  /* ── Suggested folders based on uncategorized videos ── */
  const suggestedFolders = useMemo(() => {
    if (!projects) return [];
    const categoryMap: Record<string, VideoRecord[]> = {};
    const existingProjectNames = new Set((projects || []).map((p) => p.name.toLowerCase()));

    (projects || []).forEach((p) => {
      p.videos.forEach((v) => {
        if (v.category && v.category !== "Other") {
          const folderName = `${v.category} Videos`;
          if (!existingProjectNames.has(folderName.toLowerCase())) {
            if (!categoryMap[folderName]) categoryMap[folderName] = [];
            categoryMap[folderName].push(v);
          }
        }
      });
    });

    return Object.entries(categoryMap)
      .filter(([, vids]) => vids.length >= 1)
      .map(([name, vids]) => ({ name, videoCount: vids.length, category: vids[0].category! }))
      .slice(0, 5);
  }, [projects]);

  /* ── Folder navigation ── */
  const navigateToFolder = useCallback((folder: UserFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  }, [folderPath]);

  /* ── drag & drop ── */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;
      if (selectedProject && selectedProject.id !== "__orphan__") {
        setUploadProgress(0);
        uploadToProject.mutate(
          { projectId: selectedProject.id, files: droppedFiles },
          { onSettled: () => setUploadProgress(null) }
        );
      } else {
        uploadFiles.mutate(droppedFiles);
      }
    },
    [uploadFiles, uploadToProject, selectedProject]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;
      if (selectedProject && selectedProject.id !== "__orphan__") {
        setUploadProgress(0);
        uploadToProject.mutate(
          { projectId: selectedProject.id, files: selected },
          { onSettled: () => setUploadProgress(null) }
        );
      } else {
        uploadFiles.mutate(selected);
      }
      e.target.value = "";
    },
    [uploadFiles, uploadToProject, selectedProject]
  );

  /* auth guards */
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const filteredFiles = search.trim() ? [] : files;
  const filteredFolders = search.trim() ? [] : folders;
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  /* ═══════════════════════════════════════════
     VIEW: Video playing
     ═══════════════════════════════════════════ */
  if (playingVideo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-5xl px-4 py-8">
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center gap-1 text-sm">
            <button onClick={() => { setPlayingVideo(null); setSelectedProject(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
              {t.allProjects}
            </button>
            {selectedProject && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
                <button onClick={() => setPlayingVideo(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {selectedProject.name}
                </button>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
            <span className="font-semibold text-foreground">{playingVideo.title || t.videos}</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">{playingVideo.title || t.videos}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => setShowVersions(playingVideo)}
              >
                <History className="h-4 w-4" />
                {t.versions}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() =>
                  setShareTarget({
                    projectId: playingVideo.project_id || "",
                    videoId: playingVideo.id,
                    name: playingVideo.title,
                  })
                }
              >
                <Share2 className="h-4 w-4" />
                {t.share}
              </Button>
            </div>
          </div>

          <PixiVideoPlayer
            src={playingVideo.video_url || ""}
            title={playingVideo.title}
            thumbnail={playingVideo.thumbnail_url}
            onShare={() =>
              setShareTarget({
                projectId: playingVideo.project_id || "",
                videoId: playingVideo.id,
                name: playingVideo.title,
              })
            }
          />
          <p className="mt-4 text-sm text-muted-foreground">
            {formatDate(playingVideo.created_at)}
            {playingVideo.version_number > 1 && ` · ${t.version} ${playingVideo.version_number}`}
          </p>
        </main>

        {shareTarget && (
          <ShareModal open onOpenChange={() => setShareTarget(null)} projectId={shareTarget.projectId} videoId={shareTarget.videoId} projectName={shareTarget.name} />
        )}

        {/* Version history dialog */}
        <VersionHistoryDialog
          video={showVersions}
          onClose={() => setShowVersions(null)}
          onSelect={(v) => { setPlayingVideo(v); setShowVersions(null); }}
          t={t}
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Inside a project
     ═══════════════════════════════════════════ */
  if (selectedProject) {
    const projectVideos = selectedProject.videos.filter((v) => v.status !== "deleted");
    const projectFilesList = selectedProject.files;

    return (
      <div
        className="min-h-screen bg-background"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Navbar />
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

        {/* Drag overlay */}
        {dragOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
            <div className="rounded-2xl border-2 border-dashed border-primary bg-card p-12 text-center shadow-2xl">
              <Upload className="mx-auto mb-4 h-12 w-12 text-primary" />
              <p className="text-lg font-bold text-foreground">{t.dragDrop}</p>
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="mb-4 flex items-center gap-1 text-sm">
            <button onClick={() => setSelectedProject(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              {t.allProjects}
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
            <span className="font-semibold text-foreground">{selectedProject.name}</span>
          </div>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-foreground">{selectedProject.name}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadToProject.isPending}
              >
                {uploadToProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t.upload}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={() => setShareTarget({ projectId: selectedProject.id, name: selectedProject.name })}
              >
                <Share2 className="h-4 w-4" />
                {t.share}
              </Button>
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgress !== null && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-medium text-foreground">{t.uploading}</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* View toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {projectVideos.length} {t.videos}
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                {projectFilesList.length} {t.filesLabel}
              </span>
            </div>
            <div className="flex gap-1 rounded-lg border border-border p-1">
              <button onClick={() => setViewMode("grid")} className={`rounded-md p-2 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`rounded-md p-2 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Videos section */}
          {projectVideos.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-foreground">{t.videos}</h3>
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                {projectVideos.map((vid) => (
                  <VideoCard
                    key={vid.id}
                    vid={vid}
                    viewMode={viewMode}
                    isRTL={isRTL}
                    t={t}
                    onPlay={() => vid.video_url && setPlayingVideo(vid)}
                    onShare={() => setShareTarget({ projectId: selectedProject.id, videoId: vid.id, name: vid.title })}
                    onRename={() => setRenameTarget({ id: vid.id, name: vid.title, type: "video" })}
                    onDelete={() => deleteVideo.mutate(vid.id)}
                    onVersions={() => setShowVersions(vid)}
                    onClassify={() => classifyVideo.mutate(vid.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files section */}
          {projectFilesList.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">{t.filesLabel}</h3>
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "space-y-2"}>
                {projectFilesList.map((file) => {
                  const Icon = getFileIcon(file.file_type);
                  return (
                    <FileCard
                      key={file.id}
                      file={file}
                      Icon={Icon}
                      viewMode={viewMode}
                      t={t}
                      onPreview={() => setPreviewFile(file as any)}
                      onRename={() => setRenameTarget({ id: file.id, name: file.file_name, type: "file" })}
                      onDelete={() => deleteFile.mutate(file.id)}
                      onStar={() => toggleStar.mutate({ id: file.id, starred: !file.is_starred })}
                      onMove={() => setMoveTarget({ fileId: file.id, fileName: file.file_name })}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty project */}
          {projectVideos.length === 0 && projectFilesList.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="mb-1 text-lg font-semibold text-foreground">{t.noVideos}</p>
              <p className="mb-6 text-sm text-muted-foreground">{t.noFiles}</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" className="rounded-xl gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {t.upload}
                </Button>
                <Button asChild className="rounded-xl bg-primary text-primary-foreground">
                  <Link to="/welcome">{t.createFirst}</Link>
                </Button>
              </div>
            </div>
          )}
        </main>

        {shareTarget && (
          <ShareModal open onOpenChange={() => setShareTarget(null)} projectId={shareTarget.projectId} videoId={shareTarget.videoId} projectName={shareTarget.name} />
        )}
        <VersionHistoryDialog video={showVersions} onClose={() => setShowVersions(null)} onSelect={(v) => { setPlayingVideo(v); setShowVersions(null); }} t={t} />
        <MoveToProjectDialog
          moveTarget={moveTarget}
          projects={projects || []}
          onClose={() => setMoveTarget(null)}
          onMove={(projectId) => {
            if (moveTarget) {
              moveFileToProject.mutate({ fileId: moveTarget.fileId, projectId });
              setMoveTarget(null);
            }
          }}
          t={t}
        />
        <RenameDialog renameTarget={renameTarget} onClose={() => setRenameTarget(null)} onSave={(id, name, type) => {
          if (type === "video") renameVideo.mutate({ id, title: name });
          else if (type === "project") renameProject.mutate({ id, name });
          else if (type === "folder") renameFolder.mutate({ id, name });
          else renameFile.mutate({ id, name });
          setRenameTarget(null);
        }} isRTL={isRTL} t={t} />
        <FilePreviewDialog previewFile={previewFile} onClose={() => setPreviewFile(null)} isRTL={isRTL} t={t} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW: Main projects list
     ═══════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen bg-background"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Navbar />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-card p-12 text-center shadow-2xl">
            <Upload className="mx-auto mb-4 h-12 w-12 text-primary" />
            <p className="text-lg font-bold text-foreground">{t.dragDrop}</p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">{t.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowNewProject(true)}>
              <Plus className="h-4 w-4" />
              {t.newProject}
            </Button>
            <Button
              className="rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadFiles.isPending}
            >
              {uploadFiles.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t.upload}
            </Button>
          </div>
        </div>

        {/* Search + View toggle */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="rounded-xl ps-10"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <button onClick={() => setViewMode("grid")} className={`rounded-md p-2 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`rounded-md p-2 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search results */}
        {searchResults && (
          <div className="space-y-6">
            {searchResults.projects.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.allProjects}</h3>
                <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                  {searchResults.projects.map((p) => (
                    <ProjectCard key={p.id} project={p} viewMode={viewMode} t={t} isRTL={isRTL}
                      onClick={() => { setSelectedProject(p); setSearch(""); }}
                      onShare={() => setShareTarget({ projectId: p.id, name: p.name })}
                      onRename={() => setRenameTarget({ id: p.id, name: p.name, type: "project" })}
                      onDelete={() => deleteProject.mutate(p.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {searchResults.videos.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.videos}</h3>
                <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                  {searchResults.videos.map((v) => (
                    <VideoCard key={v.id} vid={v} viewMode={viewMode} isRTL={isRTL} t={t}
                      onPlay={() => { setPlayingVideo(v); setSearch(""); }}
                      onShare={() => setShareTarget({ projectId: v.project_id || "", videoId: v.id, name: v.title })}
                      onRename={() => setRenameTarget({ id: v.id, name: v.title, type: "video" })}
                      onDelete={() => deleteVideo.mutate(v.id)}
                      onVersions={() => setShowVersions(v)}
                      onClassify={() => classifyVideo.mutate(v.id)}
                      subtitle={v.projectName}
                    />
                  ))}
                </div>
              </div>
            )}
            {searchResults.projects.length === 0 && searchResults.videos.length === 0 && searchResults.files.length === 0 && searchResults.standalone.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-foreground font-semibold">{tr("projects.noResults")}</p>
              </div>
            )}
          </div>
        )}

        {/* Main content (no search) */}
        {!searchResults && (
          <>
            {/* AI Suggested Folders */}
            {suggestedFolders.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {tr("projects.suggestedFolders")}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {suggestedFolders.map((sf) => (
                    <button
                      key={sf.name}
                      onClick={() => { createProject.mutate(sf.name); }}
                      className="group flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 transition-all hover:border-primary hover:bg-primary/10"
                    >
                      <Wand2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{sf.name}</span>
                      <Badge variant="secondary" className="rounded-full text-[10px]">
                        {sf.videoCount} {tr("common.videos")}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {projectsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !projects || projects.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Video className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="mb-1 text-xl font-bold text-foreground">{t.noProjects}</p>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowNewProject(true)}>
                      <Plus className="h-4 w-4" /> {t.newProject}
                    </Button>
                    <Button asChild className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link to="/welcome">{t.createFirst}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                {projects.filter(p => p.status !== "deleted").map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode={viewMode}
                    t={t}
                    isRTL={isRTL}
                    onClick={() => setSelectedProject(project)}
                    onShare={() => setShareTarget({ projectId: project.id, name: project.name })}
                    onRename={() => setRenameTarget({ id: project.id, name: project.name, type: "project" })}
                    onDelete={() => deleteProject.mutate(project.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── New Project Dialog ── */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{t.newProject}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) { createProject.mutate(newName.trim()); setNewName(""); setShowNewProject(false); } }} className="space-y-4">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.projectName} className="rounded-xl" autoFocus />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowNewProject(false)}>{t.cancel}</Button>
              <Button type="submit" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">{t.create}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── New Folder Dialog ── */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{t.newFolder}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) { createFolder.mutate(newName.trim()); setNewName(""); setShowNewFolder(false); } }} className="space-y-4">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={isRTL ? "שם התיקיה" : "Folder name"} className="rounded-xl" autoFocus />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowNewFolder(false)}>{t.cancel}</Button>
              <Button type="submit" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">{t.create}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <RenameDialog renameTarget={renameTarget} onClose={() => setRenameTarget(null)} onSave={(id, name, type) => {
        if (type === "video") renameVideo.mutate({ id, title: name });
        else if (type === "project") renameProject.mutate({ id, name });
        else if (type === "folder") renameFolder.mutate({ id, name });
        else renameFile.mutate({ id, name });
        setRenameTarget(null);
      }} isRTL={isRTL} t={t} />

      <FilePreviewDialog previewFile={previewFile} onClose={() => setPreviewFile(null)} isRTL={isRTL} t={t} />

      {shareTarget && (
        <ShareModal open onOpenChange={() => setShareTarget(null)} projectId={shareTarget.projectId} videoId={shareTarget.videoId} projectName={shareTarget.name} />
      )}

      <VersionHistoryDialog video={showVersions} onClose={() => setShowVersions(null)} onSelect={(v) => { setPlayingVideo(v); setShowVersions(null); }} t={t} />
      <MoveToProjectDialog
        moveTarget={moveTarget}
        projects={projects || []}
        onClose={() => setMoveTarget(null)}
        onMove={(projectId) => { if (moveTarget) { moveFileToProject.mutate({ fileId: moveTarget.fileId, projectId }); setMoveTarget(null); } }}
        t={t}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function ProjectCard({ project, viewMode, t, isRTL, onClick, onShare, onRename, onDelete }: {
  project: ProjectWithContent; viewMode: string; t: any; isRTL: boolean;
  onClick: () => void; onShare: () => void; onRename: () => void; onDelete: () => void;
}) {
  const thumb = project.videos[0]?.thumbnail_url;
  const totalItems = project.videos.length + project.files.length;

  if (viewMode === "list") {
    return (
      <div className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md" onClick={onClick}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FolderOpen className="h-5 w-5" />
        </div>
        <span className="flex-1 truncate font-medium text-foreground">{project.name}</span>
        <span className="text-xs text-muted-foreground">{totalItems} {isRTL ? "פריטים" : "items"}</span>
        <span className="hidden text-xs text-muted-foreground md:block">{formatDate(project.created_at)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}><Share2 className="me-2 h-3.5 w-3.5" /> {t.share}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}><Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" onClick={onClick}>
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted/50">
        {thumb ? (
          <img src={thumb} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
            <FolderOpen className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute bottom-2 end-2 flex gap-1.5">
          {project.videos.length > 0 && (
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold text-foreground backdrop-blur">
              {project.videos.length} {t.videos}
            </span>
          )}
          {project.files.length > 0 && (
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold text-foreground backdrop-blur">
              {project.files.length} {t.filesLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{project.name}</p>
          <p className="text-xs text-muted-foreground">{formatDate(project.created_at)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}><Share2 className="me-2 h-3.5 w-3.5" /> {t.share}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}><Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function VideoCard({ vid, viewMode, isRTL, t, onPlay, onShare, onRename, onDelete, onVersions, onClassify, subtitle }: {
  vid: VideoRecord & { projectName?: string }; viewMode: string; isRTL: boolean; t: any;
  onPlay: () => void; onShare: () => void; onRename: () => void; onDelete: () => void;
  onVersions: () => void; onClassify?: () => void; subtitle?: string;
}) {
  if (viewMode === "list") {
    return (
      <div className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md" onClick={onPlay}>
        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {vid.thumbnail_url ? (
            <img src={vid.thumbnail_url} className="h-full w-full object-cover" loading="lazy" alt="" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Video className="h-4 w-4 text-muted-foreground/40" /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{vid.title || "סרטון"}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">{subtitle || formatDate(vid.created_at)}</p>
            {vid.category && (
              <Badge variant="outline" className="rounded-full text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                {vid.category}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}><Share2 className="me-2 h-3.5 w-3.5" /> {t.share}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(); }}><History className="me-2 h-3.5 w-3.5" /> {t.versions}</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}><Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}</DropdownMenuItem>
            {onClassify && !vid.category && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClassify(); }}><Wand2 className="me-2 h-3.5 w-3.5" /> {isRTL ? "סווג אוטומטית" : "Auto-classify"}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="group cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" onClick={onPlay}>
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted/50">
        {vid.thumbnail_url ? (
          <img src={vid.thumbnail_url} alt={vid.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center"><Video className="h-10 w-10 text-muted-foreground/30" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-background/0 transition-colors group-hover:bg-background/30">
          <div className="rounded-full bg-primary/80 p-3 opacity-0 shadow-lg transition-all group-hover:opacity-100 group-hover:scale-110">
            <Play className="h-5 w-5 text-primary-foreground ms-0.5" />
          </div>
        </div>
        <span className={`absolute top-2 ${isRTL ? "start-2" : "end-2"} rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
          vid.status === "completed" ? "bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {vid.status}
        </span>
        {vid.version_number > 1 && (
          <span className="absolute top-2 start-2 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
            v{vid.version_number}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{vid.title || "סרטון"}</p>
            <p className="text-xs text-muted-foreground">{subtitle || formatDate(vid.created_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}><Share2 className="me-2 h-3.5 w-3.5" /> {t.share}</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersions(); }}><History className="me-2 h-3.5 w-3.5" /> {t.versions}</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}><Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); vid.video_url && window.open(vid.video_url); }}>
                <Download className="me-2 h-3.5 w-3.5" /> {t.download}
              </DropdownMenuItem>
              {onClassify && !vid.category && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClassify(); }}><Wand2 className="me-2 h-3.5 w-3.5" /> {isRTL ? "סווג אוטומטית" : "Auto-classify"}</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Category & Tags */}
        {(vid.category || (vid.tags && vid.tags.length > 0)) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {vid.category && (
              <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 border-primary/30 text-primary">
                {vid.category}
              </Badge>
            )}
            {vid.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full text-[10px] px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileCard({ file, Icon, viewMode, t, onPreview, onRename, onDelete, onStar, onMove }: {
  file: ProjectFile; Icon: any; viewMode: string; t: any;
  onPreview: () => void; onRename: () => void; onDelete: () => void; onStar: () => void; onMove: () => void;
}) {
  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium text-foreground cursor-pointer" onClick={onPreview}>{file.file_name}</span>
        <span className="hidden text-xs text-muted-foreground sm:block">{formatSize(file.file_size)}</span>
        <span className="hidden text-xs text-muted-foreground md:block">{formatDate(file.created_at)}</span>
        <button onClick={onStar} className="text-muted-foreground hover:text-primary">
          {file.is_starred ? <Star className="h-4 w-4 fill-primary text-primary" /> : <StarOff className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}><Eye className="me-2 h-3.5 w-3.5" /> {t.preview}</DropdownMenuItem>
            <DropdownMenuItem asChild><a href={file.file_url} download={file.file_name}><Download className="me-2 h-3.5 w-3.5" /> {t.download}</a></DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}><Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}</DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}><FolderInput className="me-2 h-3.5 w-3.5" /> {t.moveTo}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex aspect-[4/3] cursor-pointer items-center justify-center rounded-t-xl bg-muted/50" onClick={onPreview}>
        {file.file_type.startsWith("image") ? (
          <img src={file.file_url} alt={file.file_name} className="h-full w-full rounded-t-xl object-cover" loading="lazy" />
        ) : (
          <Icon className="h-12 w-12 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex items-center gap-2 p-3">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm font-medium text-foreground">{file.file_name}</span>
        <button onClick={onStar} className="text-muted-foreground hover:text-primary">
          {file.is_starred ? <Star className="h-4 w-4 fill-primary text-primary" /> : <StarOff className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-0.5 text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}><Eye className="me-2 h-3.5 w-3.5" /> {t.preview}</DropdownMenuItem>
            <DropdownMenuItem asChild><a href={file.file_url} download={file.file_name}><Download className="me-2 h-3.5 w-3.5" /> {t.download}</a></DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}><Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}</DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}><FolderInput className="me-2 h-3.5 w-3.5" /> {t.moveTo}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="px-3 pb-3 text-xs text-muted-foreground">{formatSize(file.file_size)} · {formatDate(file.created_at)}</p>
    </div>
  );
}

/* ── Dialogs ── */

function RenameDialog({ renameTarget, onClose, onSave, isRTL, t }: {
  renameTarget: { id: string; name: string; type: string } | null;
  onClose: () => void; onSave: (id: string, name: string, type: string) => void; isRTL: boolean; t: any;
}) {
  const [localName, setLocalName] = useState(renameTarget?.name || "");

  // Reset when target changes
  useMemo(() => {
    if (renameTarget) setLocalName(renameTarget.name);
  }, [renameTarget?.id]);

  return (
    <Dialog open={!!renameTarget} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{t.rename}</DialogTitle></DialogHeader>
        {renameTarget && (
          <form onSubmit={(e) => { e.preventDefault(); onSave(renameTarget.id, localName, renameTarget.type); }} className="space-y-4">
            <Input value={localName} onChange={(e) => setLocalName(e.target.value)} className="rounded-xl" autoFocus />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>{t.cancel}</Button>
              <Button type="submit" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">{t.save}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilePreviewDialog({ previewFile, onClose, isRTL, t }: {
  previewFile: UserFile | null; onClose: () => void; isRTL: boolean; t: any;
}) {
  return (
    <Dialog open={!!previewFile} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-foreground">{previewFile?.file_name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{previewFile && `${formatSize(previewFile.file_size)} · ${formatDate(previewFile.created_at)}`}</p>
        </DialogHeader>
        <div className="p-6 pt-4">
          {previewFile?.file_type.startsWith("video") && (
            <PixiVideoPlayer src={previewFile.file_url} title={previewFile.file_name} />
          )}
          {previewFile?.file_type.startsWith("image") && (
            <img src={previewFile.file_url} alt={previewFile.file_name} className="max-h-[60vh] w-full rounded-xl object-contain" />
          )}
          {previewFile?.file_type.startsWith("audio") && (
            <audio src={previewFile.file_url} controls className="w-full" />
          )}
          {previewFile?.file_type === "application/pdf" && (
            <iframe src={previewFile.file_url} className="h-[60vh] w-full rounded-xl" />
          )}
          {previewFile && !previewFile.file_type.startsWith("video") && !previewFile.file_type.startsWith("image") && !previewFile.file_type.startsWith("audio") && previewFile.file_type !== "application/pdf" && (
            <div className="flex flex-col items-center py-12 text-center">
              <FileIcon className="mb-4 h-16 w-16 text-muted-foreground/40" />
              <p className="text-muted-foreground">{isRTL ? "תצוגה מקדימה לא זמינה" : "Preview not available"}</p>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button asChild className="rounded-xl bg-primary px-6 py-5 font-bold text-primary-foreground hover:bg-primary/90">
              <a href={previewFile?.file_url} download={previewFile?.file_name}><Download className="me-2 h-4 w-4" />{t.download}</a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VersionHistoryDialog({ video, onClose, onSelect, t }: {
  video: VideoRecord | null; onClose: () => void; onSelect: (v: VideoRecord) => void; t: any;
}) {
  // Simple version display — in a real app we'd fetch versions from the hook
  return (
    <Dialog open={!!video} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader><DialogTitle>{t.versions}</DialogTitle></DialogHeader>
        {video && (
          <div className="space-y-2">
            <div
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary bg-primary/5 p-3"
              onClick={() => onSelect(video)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                v{video.version_number}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{video.title || "סרטון"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
              </div>
              <span className="text-xs font-semibold text-primary">{t.version} {isRTL ? "נוכחית" : "current"}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MoveToProjectDialog({ moveTarget, projects, onClose, onMove, t }: {
  moveTarget: { fileId: string; fileName: string } | null;
  projects: ProjectWithContent[];
  onClose: () => void;
  onMove: (projectId: string) => void;
  t: any;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  return (
    <Dialog open={!!moveTarget} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader><DialogTitle>{t.moveTo}</DialogTitle></DialogHeader>
        {moveTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{moveTarget.fileName}</p>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={t.allProjects} />
              </SelectTrigger>
              <SelectContent>
                {projects.filter(p => p.id !== "__orphan__").map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>{t.cancel}</Button>
              <Button
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selectedProjectId}
                onClick={() => onMove(selectedProjectId)}
              >
                {t.moveTo}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Need isRTL in VersionHistoryDialog
const isRTL = typeof document !== "undefined" ? document.documentElement.dir === "rtl" : true;

export default ProjectsPage;
