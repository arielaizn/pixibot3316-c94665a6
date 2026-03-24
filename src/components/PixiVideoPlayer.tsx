import { useState, useRef, useEffect, useCallback } from "react";
import { useDirection } from "@/contexts/DirectionContext";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Download, Share2, PictureInPicture2, SkipBack, SkipForward, AlertCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PixiVideoPlayerProps {
  src: string;
  title?: string;
  thumbnail?: string | null;
  onShare?: () => void;
  onDownload?: () => void;
  autoPlay?: boolean;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const PixiVideoPlayer = ({ src, title, thumbnail, onShare, onDownload, autoPlay = false }: PixiVideoPlayerProps) => {
  const { isRTL } = useDirection();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retriedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [started, setStarted] = useState(autoPlay);
  const [error, setError] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  const video = videoRef.current;

  const togglePlay = useCallback(() => {
    if (!video || !src) return;
    if (!started) setStarted(true);

    if (video.paused) {
      // Mobile browsers (especially iOS) require user interaction for unmuted playback
      // Try to play, and if it fails due to autoplay policy, mute and try again
      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlaying(true);
            })
            .catch((err) => {
              // NotAllowedError means autoplay policy blocked it
              if (err.name === 'NotAllowedError' && !video.muted) {
                video.muted = true;
                setMuted(true);
                video.play()
                  .then(() => setPlaying(true))
                  .catch(() => setError(true));
              } else {
                setError(true);
              }
            });
        } else {
          setPlaying(true);
        }
      };

      // Always load the video first on mobile to ensure it's ready
      // Check if we need to load
      if (video.readyState < 2) {
        // Not enough data loaded, wait for it
        const onReady = () => {
          video.removeEventListener("loadeddata", onReady);
          video.removeEventListener("canplay", onReady);
          attemptPlay();
        };
        video.addEventListener("loadeddata", onReady);
        video.addEventListener("canplay", onReady);
        video.load();
      } else {
        // Ready to play
        attemptPlay();
      }
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [video, started, src]);

  const seek = useCallback((val: number[]) => {
    if (!video) return;
    video.currentTime = val[0];
    setCurrentTime(val[0]);
  }, [video]);

  const changeVolume = useCallback((val: number[]) => {
    if (!video) return;
    video.volume = val[0];
    setVolume(val[0]);
    setMuted(val[0] === 0);
  }, [video]);

  const toggleMute = useCallback(() => {
    if (!video) return;
    video.muted = !video.muted;
    setMuted(!muted);
  }, [video, muted]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {}
  }, [video]);

  const changeSpeed = useCallback((s: number) => {
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
  }, [video]);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!src) return;
    const fileName = `${(title || "pixi-video").replace(/[^a-zA-Z0-9\u0590-\u05FF\s_-]/g, "")}.mp4`;
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        const a = document.createElement("a");
        a.href = src;
        a.download = fileName;
        a.target = "_blank";
        a.click();
      });
  }, [src, title, onDownload]);

  // Event listeners + mobile attributes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Add mobile-specific attributes for older iOS devices
    v.setAttribute('webkit-playsinline', 'true');
    v.setAttribute('x-webkit-airplay', 'allow');

    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onEnd = () => setPlaying(false);
    const onError = () => {
      // Auto-retry once on error
      if (!retriedRef.current) {
        retriedRef.current = true;
        setTimeout(() => {
          v.load();
        }, 1000);
      } else {
        setError(true);
      }
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onError);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "m": toggleMute(); break;
        case "f": toggleFullscreen(); break;
        case "ArrowLeft": if (video) { video.currentTime -= 5; } break;
        case "ArrowRight": if (video) { video.currentTime += 5; } break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleMute, toggleFullscreen, video]);

  // Auto-hide controls
  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimeout.current);
    if (playing) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => { resetHide(); }, [playing, resetHide]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted/80 shadow-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{isRTL ? "אין סרטון זמין" : "No video available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-2xl bg-muted/80 shadow-lg"
      onMouseMove={resetHide}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-muted/90">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive/70" />
            <p className="text-sm font-medium text-foreground">{isRTL ? "שגיאה בטעינת הסרטון" : "Video failed to load"}</p>
            <button
              onClick={() => {
                setError(false);
                retriedRef.current = false;
                const v = videoRef.current;
                if (v) {
                  v.load();
                }
              }}
              className="mt-3 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              {isRTL ? "נסה שוב" : "Try Again"}
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail / play gate */}
      {!started && !error && (
        <div
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-muted/90"
          onClick={togglePlay}
        >
          {thumbnail && (
            <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" loading="lazy" />
          )}
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 shadow-xl shadow-primary/30 transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-primary-foreground ms-1" />
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        className="aspect-video w-full bg-muted"
        onClick={togglePlay}
        playsInline
        autoPlay={autoPlay}
        muted={autoPlay}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "linear-gradient(transparent, hsl(var(--background) / 0.85))" }}
      >
        {/* Progress bar */}
        <div className="px-4 pt-6">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={seek}
            className="h-1.5 cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-[0_0_8px_hsl(var(--primary)/0.5)] [&_[data-orientation=horizontal]>.relative]:bg-gradient-to-r [&_[data-orientation=horizontal]>.relative]:from-primary [&_[data-orientation=horizontal]>.relative]:to-accent"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={togglePlay} className="rounded-full p-1.5 text-foreground transition-colors hover:bg-primary/20 hover:text-primary">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button onClick={() => video && (video.currentTime -= 10)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={() => video && (video.currentTime += 10)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <SkipForward className="h-4 w-4" />
          </button>

          <span className="min-w-[80px] text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button onClick={toggleMute} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <Slider
              value={[muted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={changeVolume}
              className="w-20 cursor-pointer"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-primary/10 hover:text-foreground">
                {speed}x
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SPEEDS.map((s) => (
                <DropdownMenuItem key={s} onClick={() => changeSpeed(s)} className={s === speed ? "text-primary font-bold" : ""}>
                  {s}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button onClick={togglePiP} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground" title="Picture in Picture">
            <PictureInPicture2 className="h-4 w-4" />
          </button>

          <button onClick={handleDownload} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground" title={isRTL ? "הורדה" : "Download"}>
            <Download className="h-4 w-4" />
          </button>

          {onShare && (
            <button onClick={onShare} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground" title={isRTL ? "שיתוף" : "Share"}>
              <Share2 className="h-4 w-4" />
            </button>
          )}

          <button onClick={toggleFullscreen} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground">
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixiVideoPlayer;
