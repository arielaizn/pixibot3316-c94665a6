import { useState, useRef, useEffect, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { VideoComposition } from '@/remotion/VideoComposition';
import { VideoTimeline } from './VideoTimeline';
import { EditorToolbar } from './EditorToolbar';
import { ImportVideoDialog } from './ImportVideoDialog';
import { ChatSidebar } from './ChatSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { EffectsPanel } from './EffectsPanel';
import { TextOverlay } from './TextOverlay';
import { ShapesPanel } from './ShapesPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Settings, Sparkles, Type, Layers } from 'lucide-react';
import { useVideoEditor } from '@/hooks/useVideoEditor';

export const VideoEditor = () => {
  const {
    composition,
    currentTime,
    isPlaying,
    selectedClipId,
    totalDuration,
    play,
    pause,
    seek,
    addClip,
    removeClip,
    updateClip,
    selectClip,
    exportVideo,
    setCurrentTime,
  } = useVideoEditor();

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const isPlayingRef = useRef(isPlaying);

  // Keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      }

      // Delete - Remove selected clip
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipId) {
        e.preventDefault();
        removeClip(selectedClipId);
        selectClip(null);
      }

      // Arrow keys - Navigate frames
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - (e.shiftKey ? 30 : 1)));
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(currentTime + (e.shiftKey ? 30 : 1));
      }

      // Home/End - Jump to start/end
      if (e.code === 'Home') {
        e.preventDefault();
        seek(0);
      }
      if (e.code === 'End') {
        e.preventDefault();
        seek(totalDuration - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, selectedClipId, currentTime, play, pause, seek, removeClip, selectClip]);

  // Toggle play/pause on the Remotion player
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying]);

  // Sync player frame when seeking (only when NOT playing)
  useEffect(() => {
    if (!playerRef.current || isPlaying) return;
    playerRef.current.seekTo(currentTime);
  }, [currentTime, isPlaying]);

  // During playback: read frames from player and update store
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;

    const player = playerRef.current;

    const updateFrame = () => {
      if (!isPlayingRef.current) return;

      const frame = player.getCurrentFrame();

      if (frame !== undefined) {
        // Use setCurrentTime to avoid pausing (seek pauses)
        setCurrentTime(frame);

        // Auto-pause at end
        if (frame >= totalDuration - 1) {
          pause();
          return;
        }
      }

      requestAnimationFrame(updateFrame);
    };

    const id = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, setCurrentTime, pause, totalDuration]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <EditorToolbar
        onPlay={play}
        onPause={pause}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onImport={() => setImportDialogOpen(true)}
        onExport={exportVideo}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/30 via-muted/10 to-transparent p-8 relative">
          <div className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center">
            <div className="relative aspect-video w-full h-auto max-h-full rounded-luxury-lg overflow-hidden shadow-luxury-xl border-2 border-border/50 bg-black">
              <Player
                ref={playerRef}
                component={VideoComposition}
                inputProps={composition}
                durationInFrames={Math.max(totalDuration, 30)}
                fps={30}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                controls={false}
                loop={false}
              />
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl -z-10 opacity-50" />
            </div>
          </div>
        </div>

        {/* Right Sidebar with Tabs */}
        <Tabs defaultValue="chat" className="w-96 border-l-2 border-border/50 bg-card/95 backdrop-blur-sm flex flex-col h-full">
          <TabsList className="w-full grid grid-cols-5 rounded-none border-b-2 border-border/50 bg-gradient-to-r from-muted/30 to-transparent h-16 p-1 gap-1">
            <TabsTrigger
              value="chat"
              className="flex-col gap-1.5 h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/10 data-[state=active]:to-accent/5 rounded-lg border-2 border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg transition-all duration-200 hover:bg-muted/50"
            >
              <Bot className="w-5 h-5 data-[state=active]:text-primary" />
              <span className="text-xs font-semibold">AI Agent</span>
            </TabsTrigger>
            <TabsTrigger
              value="properties"
              className="flex-col gap-1.5 h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/10 data-[state=active]:to-accent/5 rounded-lg border-2 border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg transition-all duration-200 hover:bg-muted/50"
            >
              <Settings className="w-5 h-5 data-[state=active]:text-primary" />
              <span className="text-xs font-semibold">מאפיינים</span>
            </TabsTrigger>
            <TabsTrigger
              value="effects"
              className="flex-col gap-1.5 h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/10 data-[state=active]:to-accent/5 rounded-lg border-2 border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg transition-all duration-200 hover:bg-muted/50"
            >
              <Sparkles className="w-5 h-5 data-[state=active]:text-primary" />
              <span className="text-xs font-semibold">אפקטים</span>
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="flex-col gap-1.5 h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/10 data-[state=active]:to-accent/5 rounded-lg border-2 border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg transition-all duration-200 hover:bg-muted/50"
            >
              <Type className="w-5 h-5 data-[state=active]:text-primary" />
              <span className="text-xs font-semibold">טקסט</span>
            </TabsTrigger>
            <TabsTrigger
              value="shapes"
              className="flex-col gap-1.5 h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/10 data-[state=active]:to-accent/5 rounded-lg border-2 border-transparent data-[state=active]:border-primary/30 data-[state=active]:shadow-lg transition-all duration-200 hover:bg-muted/50"
            >
              <Layers className="w-5 h-5 data-[state=active]:text-primary" />
              <span className="text-xs font-semibold">צורות</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="chat" className="h-full m-0 p-0">
              <ChatSidebar />
            </TabsContent>

            <TabsContent value="properties" className="h-full m-0 p-0">
              <PropertiesPanel />
            </TabsContent>

            <TabsContent value="effects" className="h-full m-0 p-0">
              <EffectsPanel />
            </TabsContent>

            <TabsContent value="text" className="h-full m-0 p-0">
              <TextOverlay />
            </TabsContent>

            <TabsContent value="shapes" className="h-full m-0 p-0">
              <ShapesPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Timeline */}
      <div className="border-t border-border bg-card">
        <VideoTimeline
          clips={composition.clips}
          currentTime={currentTime}
          totalDuration={totalDuration}
          selectedClipId={selectedClipId}
          onSeek={seek}
          onClipUpdate={updateClip}
          onClipDelete={removeClip}
          onClipSelect={selectClip}
        />
      </div>

      {/* Import Dialog */}
      <ImportVideoDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={(url, duration) => addClip(url, 0, duration)}
      />
    </div>
  );
};
