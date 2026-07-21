import { X, ImageOff } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const ImageLightbox = ({ src, alt = "Full size preview", onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ startDist: number; startScale: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
    setLoaded(false);
    setErrored(false);
  }, []);

  useEffect(() => {
    if (src) reset();
  }, [src, reset]);

  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const next = clamp(scale * (1 + delta * 2), MIN_SCALE, MAX_SCALE);
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
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinch.current = { startDist: dist, startScale: scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = clamp(
        pinch.current.startScale * (dist / pinch.current.startDist),
        MIN_SCALE,
        MAX_SCALE
      );
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
    if (scale > 1) {
      setScale(1);
      setTx(0);
      setTy(0);
    } else {
      setScale(2);
    }
  };

  return (
    <DialogPrimitive.Root open={!!src} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0"
          onClick={onClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{alt}</DialogPrimitive.Title>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="relative flex items-center justify-center w-full h-full overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            style={{ touchAction: "none", cursor: scale > 1 ? "grab" : "zoom-in" }}
          >
            {errored ? (
              <div className="flex flex-col items-center gap-3 text-white/80">
                <ImageOff className="w-10 h-10" />
                <p className="text-sm">Image failed to load.</p>
              </div>
            ) : (
              <>
                {!loaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </div>
                )}
                <img
                  src={src}
                  alt={alt}
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                  onError={() => setErrored(true)}
                  className="max-w-[95vw] max-h-[92vh] object-contain will-change-transform transition-opacity duration-200"
                  style={{
                    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                    transition: dragging.current || pinch.current ? "none" : "transform 0.15s ease-out",
                    opacity: loaded ? 1 : 0,
                  }}
                />
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default ImageLightbox;
