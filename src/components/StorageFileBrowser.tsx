import { useState } from "react";
import { useDirection } from "@/contexts/DirectionContext";
import { useStorageFiles, StorageCategory, StorageFileItem } from "@/hooks/useStorageFiles";
import { downloadFile } from "@/lib/downloadFile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  ChevronRight, Download, FileVideo, Image as ImageIcon,
  Film, Music, Mic, Play, Pause,
} from "lucide-react";

/* ── Section config ── */
const SECTIONS: { key: StorageCategory; icon: typeof FileVideo; defaultOpen: boolean }[] = [
  { key: "final", icon: FileVideo, defaultOpen: true },
  { key: "images", icon: ImageIcon, defaultOpen: true },
  { key: "animations", icon: Film, defaultOpen: true },
  { key: "music", icon: Music, defaultOpen: true },
  { key: "narration", icon: Mic, defaultOpen: true },
];

const SECTION_TITLE_KEYS: Record<StorageCategory, string> = {
  final: "storage.final",
  images: "storage.images",
  animations: "storage.animations",
  music: "storage.music",
  narration: "storage.narration",
};

/* ── Image tile ── */
function ImageTile({ file, onLightbox, onDownload }: {
  file: StorageFileItem;
  onLightbox: () => void;
  onDownload: () => void;
}) {
  return (
    <Card variant="glass" className="group relative overflow-hidden rounded-luxury shadow-luxury-sm">
      <button onClick={onLightbox} className="block w-full">
        <div className="aspect-square">
          <img
            src={file.publicUrl}
            alt={file.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </button>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="truncate text-xs text-white">{file.name}</span>
        <button onClick={onDownload} className="rounded-full bg-white/20 p-1.5 backdrop-blur-sm hover:bg-white/30">
          <Download className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </Card>
  );
}

/* ── Video tile ── */
function VideoTile({ file, onDownload }: {
  file: StorageFileItem;
  onDownload: () => void;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <Card variant="glass" className="overflow-hidden rounded-luxury shadow-luxury-sm">
      <div className="relative aspect-video bg-black">
        {playing ? (
          <video
            src={file.publicUrl}
            controls
            autoPlay
            className="h-full w-full"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="group relative block h-full w-full">
            <video src={file.publicUrl} className="h-full w-full object-cover" preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
              <div className="rounded-full bg-white/90 p-3 shadow-lg">
                <Play className="h-6 w-6 text-black fill-black" />
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between p-3">
        <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
        <button onClick={onDownload} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
          <Download className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

/* ── Audio tile ── */
function AudioTile({ file, category, onDownload }: {
  file: StorageFileItem;
  category: StorageCategory;
  onDownload: () => void;
}) {
  const Icon = category === "narration" ? Mic : Music;

  return (
    <Card variant="glass" className="overflow-hidden rounded-luxury shadow-luxury-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
        <button onClick={onDownload} className="ms-auto rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
          <Download className="h-4 w-4" />
        </button>
      </div>
      <audio controls className="w-full h-8" preload="metadata">
        <source src={file.publicUrl} type={file.mimeType} />
      </audio>
    </Card>
  );
}

/* ── Section (collapsible) ── */
function StorageSection({ category, files, icon: Icon, defaultOpen, tr, onLightbox }: {
  category: StorageCategory;
  files: StorageFileItem[];
  icon: typeof FileVideo;
  defaultOpen: boolean;
  tr: (key: string) => string;
  onLightbox: (url: string, name: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Group files by MIME type for proper grid layout
  const imageFiles = files.filter(f => f.mimeType.startsWith("image/"));
  const videoFiles = files.filter(f => f.mimeType.startsWith("video/"));
  const audioFiles = files.filter(f => f.mimeType.startsWith("audio/"));
  const hasMultipleTypes = [imageFiles.length > 0, videoFiles.length > 0, audioFiles.length > 0].filter(Boolean).length > 1;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""} rtl:rotate-180 ${open ? "rtl:rotate-90" : ""}`} />
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {tr(SECTION_TITLE_KEYS[category] as any)}
        </span>
        <Badge variant="secondary" className="ms-auto text-xs">
          {files.length}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3 ps-3">
        {/* Images */}
        {imageFiles.length > 0 && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mb-4">
            {imageFiles.map((file) => (
              <ImageTile
                key={file.fullPath}
                file={file}
                onLightbox={() => onLightbox(file.publicUrl, file.name)}
                onDownload={() => downloadFile(file.publicUrl, file.name)}
              />
            ))}
          </div>
        )}

        {/* Videos */}
        {videoFiles.length > 0 && (
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${hasMultipleTypes ? 'mb-4' : ''}`}>
            {videoFiles.map((file) => (
              <VideoTile
                key={file.fullPath}
                file={file}
                onDownload={() => downloadFile(file.publicUrl, file.name)}
              />
            ))}
          </div>
        )}

        {/* Audio */}
        {audioFiles.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {audioFiles.map((file) => (
              <AudioTile
                key={file.fullPath}
                file={file}
                category={category}
                onDownload={() => downloadFile(file.publicUrl, file.name)}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Main component ── */
interface StorageFileBrowserProps {
  storagePath: string;
  className?: string;
}

export default function StorageFileBrowser({ storagePath, className }: StorageFileBrowserProps) {
  const { t: tr } = useDirection();
  const storageFiles = useStorageFiles(storagePath);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState("");

  // Loading
  if (storageFiles.isLoading) {
    return (
      <div className={className}>
        <h3 className="mb-4 text-lg font-cal-sans text-foreground">{tr("storage.title" as any)}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-luxury" />
          ))}
        </div>
      </div>
    );
  }

  // Nothing to show
  if (storageFiles.totalCount === 0) return null;

  return (
    <div className={className}>
      <h3 className="mb-4 text-lg font-cal-sans text-foreground">{tr("storage.title" as any)}</h3>

      {SECTIONS.map(({ key, icon, defaultOpen }) => {
        const files = storageFiles[key];
        if (files.length === 0) return null;

        return (
          <StorageSection
            key={key}
            category={key}
            files={files}
            icon={icon}
            defaultOpen={defaultOpen}
            tr={tr}
            onLightbox={(url, name) => {
              setLightboxUrl(url);
              setLightboxName(name);
            }}
          />
        );
      })}

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxUrl && (
            <div className="relative">
              <img src={lightboxUrl} alt={lightboxName} className="w-full rounded-lg" />
              <Button
                variant="luxury-outline"
                size="sm"
                className="absolute bottom-4 end-4 gap-1.5"
                onClick={() => downloadFile(lightboxUrl, lightboxName)}
              >
                <Download className="h-4 w-4" /> {tr("storage.download" as any)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
