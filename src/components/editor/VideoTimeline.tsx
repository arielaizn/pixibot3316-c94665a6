import { useState, useRef } from 'react';
import { Trash2, Clock, Film, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Clip {
  id: string;
  start: number;
  duration: number;
  videoUrl: string;
  transform?: {
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
  };
}

interface Props {
  clips: Clip[];
  currentTime: number;
  onSeek: (time: number) => void;
  onClipUpdate: (id: string, updates: Partial<Clip>) => void;
  onClipDelete: (id: string) => void;
  selectedClipId?: string | null;
  onClipSelect?: (id: string) => void;
}

export const VideoTimeline = ({
  clips,
  currentTime,
  onSeek,
  onClipUpdate,
  onClipDelete,
  selectedClipId,
  onClipSelect,
}: Props) => {
  const totalDuration = 300; // 10 seconds @ 30fps
  const [zoom, setZoom] = useState(3); // pixels per frame
  const pixelsPerFrame = zoom;
  const timelineWidth = totalDuration * pixelsPerFrame;

  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartFrame, setDragStartFrame] = useState(0);
  const [trimming, setTrimming] = useState<'left' | 'right' | null>(null);
  const [trimStartDuration, setTrimStartDuration] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleClipDragStart = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();
    setDraggingClip(clip.id);
    setDragStartX(e.clientX);
    setDragStartFrame(clip.start);
    onClipSelect?.(clip.id);
  };

  const handleClipDrag = (e: React.MouseEvent) => {
    if (!draggingClip || !timelineRef.current) return;

    if (trimming) {
      handleTrim(e);
      return;
    }

    e.preventDefault();

    const deltaX = e.clientX - dragStartX;
    const deltaFrames = Math.round(deltaX / pixelsPerFrame);
    const clip = clips.find(c => c.id === draggingClip);
    if (!clip) return;

    const newStart = Math.max(0, Math.min(dragStartFrame + deltaFrames, totalDuration - clip.duration));

    // Throttle updates for smoothness
    requestAnimationFrame(() => {
      onClipUpdate?.(draggingClip, { start: newStart });
    });
  };

  const handleClipDragEnd = () => {
    setDraggingClip(null);
    setTrimming(null);
  };

  const handleTrimStart = (e: React.MouseEvent, clip: Clip, side: 'left' | 'right') => {
    e.stopPropagation();
    setDraggingClip(clip.id);
    setTrimming(side);
    setDragStartX(e.clientX);
    setDragStartFrame(clip.start);
    setTrimStartDuration(clip.duration);
    onClipSelect?.(clip.id);
  };

  const handleTrim = (e: React.MouseEvent) => {
    if (!draggingClip || !trimming || !timelineRef.current) return;

    e.preventDefault();

    const deltaX = e.clientX - dragStartX;
    const deltaFrames = Math.round(deltaX / pixelsPerFrame);
    const clip = clips.find(c => c.id === draggingClip);
    if (!clip) return;

    requestAnimationFrame(() => {
      if (trimming === 'left') {
        // Trim from start
        const newStart = Math.max(0, Math.min(dragStartFrame + deltaFrames, dragStartFrame + trimStartDuration - 30));
        const newDuration = trimStartDuration - (newStart - dragStartFrame);
        onClipUpdate?.(draggingClip, { start: newStart, duration: Math.max(30, newDuration) });
      } else {
        // Trim from end
        const newDuration = Math.max(30, trimStartDuration + deltaFrames);
        onClipUpdate?.(draggingClip, { duration: Math.min(newDuration, totalDuration - clip.start) });
      }
    });
  };

  return (
    <div className="p-5 bg-gradient-to-r from-card via-card to-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">ציר הזמן</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(1, zoom - 1))}
              disabled={zoom <= 1}
              className="h-6 w-6 p-0"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs font-mono w-8 text-center">{Math.round(zoom * 33)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(10, zoom + 1))}
              disabled={zoom >= 10}
              className="h-6 w-6 p-0"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Film className="w-3 h-3" />
            <span>{clips.length} קליפים</span>
            <span className="text-border">•</span>
            <span>{(totalDuration / 30).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="relative h-36 bg-gradient-to-br from-muted/40 via-muted/20 to-transparent rounded-luxury-lg overflow-x-auto border-2 border-border/50 shadow-luxury-md"
        onMouseMove={handleClipDrag}
        onMouseUp={handleClipDragEnd}
        onMouseLeave={handleClipDragEnd}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary to-primary/50 z-20 transition-all duration-100"
          style={{ left: currentTime * pixelsPerFrame }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-lg ring-4 ring-primary/20 animate-pulse" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-mono rounded-b whitespace-nowrap">
            {(currentTime / 30).toFixed(2)}s
          </div>
        </div>

        {/* Timeline ruler */}
        <div className="h-8 border-b-2 border-border/50 flex items-center px-2 text-xs font-semibold text-muted-foreground bg-muted/30 backdrop-blur-sm sticky top-0 z-10">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex-1 text-center relative">
              <span className="relative z-10">{i}s</span>
              <div className="absolute left-0 top-1/2 w-px h-3 bg-border/50 -translate-y-1/2" />
            </div>
          ))}
        </div>

        {/* Clips track */}
        <div className="relative h-28 p-3" style={{ minWidth: `${timelineWidth}px` }}>
          {clips.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Film className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">אין קליפים - ייבא וידאו להתחלה</p>
              </div>
            </div>
          ) : (
            clips.map((clip) => {
              const isSelected = selectedClipId === clip.id;
              return (
              <div
                key={clip.id}
                onMouseDown={(e) => handleClipDragStart(e, clip)}
                onClick={(e) => {
                  e.stopPropagation();
                  onClipSelect?.(clip.id);
                }}
                className={`absolute h-20 rounded-lg border-2 transition-all duration-200 cursor-move group backdrop-blur-sm select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-accent via-accent/90 to-accent/80 border-accent shadow-luxury-xl ring-4 ring-accent/30 z-10'
                    : 'bg-gradient-to-br from-primary via-primary/90 to-primary/80 border-primary/50 hover:border-primary hover:shadow-luxury-lg'
                } ${draggingClip === clip.id ? 'opacity-80 scale-105' : ''}`}
                style={{
                  left: clip.start * pixelsPerFrame,
                  width: clip.duration * pixelsPerFrame,
                }}
              >
                <div className="p-2 text-xs text-primary-foreground font-semibold truncate">
                  🎬 קליפ {clip.id.slice(0, 6)}
                </div>
                <div className="px-2 text-xs text-primary-foreground/70 font-mono">
                  {(clip.duration / 30).toFixed(1)}s
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClipDelete(clip.id);
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-destructive hover:bg-destructive/80 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                >
                  <Trash2 className="w-3 h-3 text-destructive-foreground" />
                </button>
                {/* Trim handles */}
                <div
                  onMouseDown={(e) => handleTrimStart(e, clip, 'left')}
                  className="absolute left-0 top-0 bottom-0 w-2 bg-primary-foreground/50 hover:bg-primary-foreground cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all z-20"
                />
                <div
                  onMouseDown={(e) => handleTrimStart(e, clip, 'right')}
                  className="absolute right-0 top-0 bottom-0 w-2 bg-primary-foreground/50 hover:bg-primary-foreground cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all z-20"
                />
              </div>
            );
            })
          )}
        </div>

        {/* Click to seek */}
        <div
          className="absolute inset-0 cursor-pointer z-5"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const frame = Math.floor(x / pixelsPerFrame);
            onSeek(Math.max(0, Math.min(frame, totalDuration)));
          }}
        />
      </div>
    </div>
  );
};
