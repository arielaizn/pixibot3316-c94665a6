import { Button } from '@/components/ui/button';
import { Play, Pause, Upload, Download, Film } from 'lucide-react';

interface Props {
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  onImport?: () => void;
  onExport: () => void;
  currentTime?: number;
}

export const EditorToolbar = ({
  onPlay,
  onPause,
  isPlaying,
  onImport,
  onExport,
  currentTime = 0,
}: Props) => {
  return (
    <div className="h-16 border-b-2 border-border/50 bg-gradient-to-r from-card via-card to-muted/20 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
      {/* Left - Playback Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="luxury-outline"
          size="icon"
          onClick={isPlaying ? onPause : onPlay}
          className={`h-10 w-10 relative group transition-all ${
            isPlaying ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/20' : ''
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 transition-transform group-hover:scale-110 text-primary" />
          ) : (
            <Play className="w-5 h-5 transition-transform group-hover:scale-110" />
          )}
        </Button>
        <div className="h-6 w-px bg-border/50" />
        <div className={`text-sm font-mono transition-all ${
          isPlaying ? 'text-primary font-semibold scale-105' : 'text-muted-foreground'
        }`}>
          {Math.floor(currentTime / 30).toString().padStart(2, '0')}:{Math.floor(currentTime % 30 * (1000/30)).toString().padStart(3, '0')}
        </div>
      </div>

      {/* Center - Title with Icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Pixi Video Editor
          </h1>
          <p className="text-xs text-muted-foreground">עורך וידאו מתקדם</p>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport} className="h-9">
            <Upload className="w-4 h-4 mr-2" />
            ייבוא
          </Button>
        )}
        <Button variant="luxury" size="sm" onClick={onExport} className="h-9">
          <Download className="w-4 h-4 mr-2" />
          ייצוא
        </Button>
      </div>
    </div>
  );
};
