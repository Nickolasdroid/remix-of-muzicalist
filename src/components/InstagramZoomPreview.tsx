import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import SmoothVideoPlayer from "./SmoothVideoPlayer";
import { getEmbedInfo } from "@/lib/mediaEmbed";

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

interface InstagramZoomPreviewProps {
  media: MediaPreview | null;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const InstagramZoomPreview = ({ media, onClose }: InstagramZoomPreviewProps) => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ startDist: number; startScale: number } | null>(null);

  useEffect(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, [media?.url]);

  const resetZoom = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  if (!media) return null;

  const handleWheel = (e: React.WheelEvent) => {
    const next = clamp(scale * (1 + (-e.deltaY * 0.003)), MIN_SCALE, MAX_SCALE);
    if (next === 1) {
      setTx(0);
      setTy(0);
    }
    setScale(next);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setTx((v) => v + (e.clientX - lastPoint.current.x));
    setTy((v) => v + (e.clientY - lastPoint.current.y));
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = { startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), startScale: scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = clamp(pinch.current.startScale * (dist / pinch.current.startDist), MIN_SCALE, MAX_SCALE);
      if (next === 1) {
        setTx(0);
        setTy(0);
      }
      setScale(next);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch.current = null;
  };

  const handleDoubleClick = () => {
    if (scale > 1) resetZoom();
    else setScale(2);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setIsLandscape(img.naturalWidth > img.naturalHeight);
  };

  return (
    <DialogPrimitive.Root open={!!media} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-2"
          onClick={onClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Media */}
          <div onClick={(e) => e.stopPropagation()}>
            {media.type === "video" ? (
              (() => {
                const info = getEmbedInfo(media.url);
                if (info && info.provider !== "direct") {
                  const isAudio = info.aspect === "audio";
                  return (
                    <div
                      className={
                        isAudio
                          ? "w-[95vw] max-w-2xl"
                          : "w-[95vw] max-w-5xl aspect-video"
                      }
                    >
                      <iframe
                        src={info.embedUrl + (info.provider === "youtube" ? "&autoplay=1" : "")}
                        title="Embedded media"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="w-full rounded-lg border-0"
                        style={isAudio ? { height: info.provider === "spotify" ? 352 : 166 } : { height: "100%" }}
                      />
                    </div>
                  );
                }
                return (
                  <SmoothVideoPlayer
                    src={media.url}
                    autoPlay
                    className="w-[95vw] h-[90vh] max-w-[95vw] max-h-[90vh]"
                  />
                );
              })()
            ) : (
              <div
                className="flex items-center justify-center overflow-hidden select-none"
                style={{ touchAction: "none", cursor: scale > 1 ? "grab" : "zoom-in" }}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
              >
                <img
                  src={media.url}
                  alt="Full size preview"
                  className={`object-contain will-change-transform ${isLandscape ? 'w-[95vw] max-h-[90vh]' : 'max-w-[95vw] max-h-[90vh]'}`}
                  draggable={false}
                  onLoad={handleImageLoad}
                  style={{
                    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                    transition: dragging.current || pinch.current ? "none" : "transform 0.15s ease-out",
                  }}
                />
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default InstagramZoomPreview;
