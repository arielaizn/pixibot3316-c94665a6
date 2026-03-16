import { useState, useRef, useCallback, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { useFileManager, UserFile, UserFolder } from "@/hooks/useFileManager";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, FolderOpen, FolderPlus, Upload, Search, Grid3X3, List, Star, StarOff,
  Trash2, Pencil, MoreVertical, FileText, FileVideo, FileImage, FileAudio, File as FileIcon,
  ChevronRight, X, Eye, Download, ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
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
  const { isRTL } = useDirection();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: isRTL ? "הקבצים שלי" : "My Files" },
  ]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "file" | "folder" } | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    folders, files, allFiles, loading,
    createFolder, renameFolder, deleteFolder,
    uploadFiles, renameFile, deleteFile, toggleStar,
  } = useFileManager(currentFolderId);

  const t = {
    title: isRTL ? "הקבצים שלי" : "My Files",
    subtitle: isRTL ? "נהלו את כל הקבצים והפרויקטים שלכם" : "Manage all your files and projects",
    newFolder: isRTL ? "תיקיה חדשה" : "New Folder",
    upload: isRTL ? "העלאת קבצים" : "Upload Files",
    search: isRTL ? "חיפוש קבצים..." : "Search files...",
    empty: isRTL ? "אין קבצים בתיקיה זו" : "No files in this folder",
    emptyDesc: isRTL ? "העלו קבצים או צרו תיקיה חדשה" : "Upload files or create a new folder",
    dragDrop: isRTL ? "גררו קבצים לכאן להעלאה" : "Drop files here to upload",
    rename: isRTL ? "שנה שם" : "Rename",
    delete: isRTL ? "מחק" : "Delete",
    star: isRTL ? "סמן כמועדף" : "Star",
    unstar: isRTL ? "הסר מועדף" : "Unstar",
    preview: isRTL ? "תצוגה מקדימה" : "Preview",
    download: isRTL ? "הורדה" : "Download",
    create: isRTL ? "צור" : "Create",
    cancel: isRTL ? "ביטול" : "Cancel",
    save: isRTL ? "שמור" : "Save",
    back: isRTL ? "חזרה" : "Back",
    createFirst: isRTL ? "צור סרטון ראשון" : "Create First Video",
  };

  /* navigation */
  const navigateToFolder = useCallback((folder: UserFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  }, [folderPath]);

  /* search */
  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return allFiles.filter((f) => f.file_name.toLowerCase().includes(q));
  }, [search, files, allFiles]);

  const filteredFolders = useMemo(() => {
    if (search.trim()) return [];
    return folders;
  }, [search, folders]);

  /* drag & drop */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) uploadFiles.mutate(droppedFiles);
    },
    [uploadFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) uploadFiles.mutate(selected);
      e.target.value = "";
    },
    [uploadFiles]
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

  const isSearching = !!search.trim();
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

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
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() => setShowNewFolder(true)}
            >
              <FolderPlus className="h-4 w-4" />
              {t.newFolder}
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

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
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
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {!isSearching && (
          <div className="mb-4 flex items-center gap-1 text-sm">
            {folderPath.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={`rounded px-1.5 py-0.5 transition-colors ${
                    i === folderPath.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!loading && isEmpty && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="mb-1 text-xl font-bold text-foreground">{t.empty}</p>
              <p className="mb-8 text-sm text-muted-foreground">{t.emptyDesc}</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {t.upload}
                </Button>
                <Button asChild className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/welcome">{t.createFirst}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !isEmpty && (
          <>
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div className={`mb-6 ${viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "space-y-2"}`}>
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      viewMode === "list" ? "flex-row" : "flex-col items-start"
                    }`}
                    onClick={() => navigateToFolder(folder)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <span className="flex-1 truncate font-medium text-foreground">{folder.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameTarget({ id: folder.id, name: folder.name, type: "folder" }); }}>
                          <Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteFolder.mutate(folder.id); }}>
                          <Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Files */}
            {filteredFiles.length > 0 && (
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "space-y-2"}>
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.file_type);
                  return viewMode === "grid" ? (
                    /* Grid card */
                    <div
                      key={file.id}
                      className="group flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* Preview area */}
                      <div
                        className="flex aspect-[4/3] cursor-pointer items-center justify-center rounded-t-xl bg-muted/50"
                        onClick={() => setPreviewFile(file)}
                      >
                        {file.file_type.startsWith("image") ? (
                          <img src={file.file_url} alt={file.file_name} className="h-full w-full rounded-t-xl object-cover" />
                        ) : (
                          <Icon className="h-12 w-12 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 p-3">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-sm font-medium text-foreground">{file.file_name}</span>
                        <button
                          onClick={() => toggleStar.mutate({ id: file.id, starred: !file.is_starred })}
                          className="text-muted-foreground hover:text-primary"
                        >
                          {file.is_starred ? <Star className="h-4 w-4 fill-primary text-primary" /> : <StarOff className="h-4 w-4" />}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                              <Eye className="me-2 h-3.5 w-3.5" /> {t.preview}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={file.file_url} download={file.file_name}>
                                <Download className="me-2 h-3.5 w-3.5" /> {t.download}
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRenameTarget({ id: file.id, name: file.file_name, type: "file" })}>
                              <Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteFile.mutate(file.id)}>
                              <Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="px-3 pb-3 text-xs text-muted-foreground">
                        {formatSize(file.file_size)} · {formatDate(file.created_at)}
                      </p>
                    </div>
                  ) : (
                    /* List row */
                    <div
                      key={file.id}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate font-medium text-foreground cursor-pointer" onClick={() => setPreviewFile(file)}>
                        {file.file_name}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:block">{formatSize(file.file_size)}</span>
                      <span className="hidden text-xs text-muted-foreground md:block">{formatDate(file.created_at)}</span>
                      <button onClick={() => toggleStar.mutate({ id: file.id, starred: !file.is_starred })} className="text-muted-foreground hover:text-primary">
                        {file.is_starred ? <Star className="h-4 w-4 fill-primary text-primary" /> : <StarOff className="h-4 w-4" />}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                            <Eye className="me-2 h-3.5 w-3.5" /> {t.preview}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={file.file_url} download={file.file_name}>
                              <Download className="me-2 h-3.5 w-3.5" /> {t.download}
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRenameTarget({ id: file.id, name: file.file_name, type: "file" })}>
                            <Pencil className="me-2 h-3.5 w-3.5" /> {t.rename}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteFile.mutate(file.id)}>
                            <Trash2 className="me-2 h-3.5 w-3.5" /> {t.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── New Folder Dialog ── */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.newFolder}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolderName.trim()) {
                createFolder.mutate(newFolderName.trim());
                setNewFolderName("");
                setShowNewFolder(false);
              }
            }}
            className="space-y-4"
          >
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={isRTL ? "שם התיקיה" : "Folder name"}
              className="rounded-xl"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowNewFolder(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {t.create}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Rename Dialog ── */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t.rename}</DialogTitle>
          </DialogHeader>
          {renameTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (renameTarget.type === "folder") {
                  renameFolder.mutate({ id: renameTarget.id, name: renameTarget.name });
                } else {
                  renameFile.mutate({ id: renameTarget.id, name: renameTarget.name });
                }
                setRenameTarget(null);
              }}
              className="space-y-4"
            >
              <Input
                value={renameTarget.name}
                onChange={(e) => setRenameTarget({ ...renameTarget, name: e.target.value })}
                className="rounded-xl"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRenameTarget(null)}>
                  {t.cancel}
                </Button>
                <Button type="submit" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                  {t.save}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── File Preview Dialog ── */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-foreground">{previewFile?.file_name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {previewFile && `${formatSize(previewFile.file_size)} · ${formatDate(previewFile.created_at)}`}
            </p>
          </DialogHeader>
          <div className="p-6 pt-4">
            {previewFile?.file_type.startsWith("video") && (
              <video src={previewFile.file_url} controls className="w-full rounded-xl bg-muted" />
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
                <p className="text-muted-foreground">{isRTL ? "תצוגה מקדימה לא זמינה לסוג קובץ זה" : "Preview not available for this file type"}</p>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button asChild className="rounded-xl bg-primary px-6 py-5 font-bold text-primary-foreground hover:bg-primary/90">
                <a href={previewFile?.file_url} download={previewFile?.file_name}>
                  <Download className="me-2 h-4 w-4" />
                  {t.download}
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
