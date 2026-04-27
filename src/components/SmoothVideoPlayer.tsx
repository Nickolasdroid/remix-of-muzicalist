import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmoothVideoPlayerProps {
  src: string;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SmoothVideoPlayer = ({
  src,
  className,
  poster,
  autoPlay = false,
  loop = false,
  muted: initialMuted = false,
  onClick,
}: SmoothVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 2200);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    },
    []
  );

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    v.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  }, [duration]);

  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group overflow-hidden bg-black select-none",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) togglePlay(e);
      }}
      onMouseMove={revealControls}
      onMouseLeave={() => {
        if (videoRef.current && !videoRef.current.paused) setShowControls(false);
      }}
      onTouchStart={revealControls}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={initialMuted}
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-contain bg-black"
        onPlay={() => { setIsPlaying(true); scheduleHideControls(); }}
        onPause={() => { setIsPlaying(false); setShowControls(true); }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setCurrentTime(v.currentTime);
          if (v.duration) setProgress((v.currentTime / v.duration) * 100);
        }}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
      />

      {/* Buffering spinner */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      )}

      {/* Center play overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-3 pt-8 pb-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 rounded-full appearance-none cursor-pointer bg-white/30 accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
          style={{
            background: `linear-gradient(to right, hsl(var(--accent)) 0%, hsl(var(--accent)) ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`,
          }}
        />

        <div className="flex items-center justify-between mt-1.5 text-white text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1 rounded hover:bg-white/15 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1 rounded hover:bg-white/15 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="tabular-nums opacity-90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-white/15 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmoothVideoPlayer;
