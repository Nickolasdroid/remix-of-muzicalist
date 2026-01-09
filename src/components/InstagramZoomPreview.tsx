import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

interface InstagramZoomPreviewProps {
  media: MediaPreview | null;
  onClose: () => void;
}

const InstagramZoomPreview = ({ media, onClose }: InstagramZoomPreviewProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when media changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [media?.url]);

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setInitialDistance(getDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const newScale = Math.min(Math.max(initialScale * (currentDistance / initialDistance), 1), 4);
      setScale(newScale);
      
      // Reset position if zoomed out
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      // Constrain movement based on zoom level
      const maxOffset = (scale - 1) * 150;
      setPosition({
        x: Math.min(Math.max(newX, -maxOffset), maxOffset),
        y: Math.min(Math.max(newY, -maxOffset), maxOffset),
      });
    }
  }, [initialDistance, initialScale, isDragging, dragStart, scale]);

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, 1), 4);
    setScale(newScale);
    
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      const maxOffset = (scale - 1) * 150;
      setPosition({
        x: Math.min(Math.max(newX, -maxOffset), maxOffset),
        y: Math.min(Math.max(newY, -maxOffset), maxOffset),
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double tap/click to zoom
  const lastTap = useRef<number>(0);
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      e.preventDefault();
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
    lastTap.current = now;
  }, [scale]);

  if (!media) return null;

  return (
    <Dialog open={!!media} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black border-none rounded-none [&>button]:hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Media container */}
        <div
          ref={containerRef}
          className="flex items-center justify-center w-full h-full overflow-hidden touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleDoubleTap}
        >
          {media.type === "video" ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              ref={imageRef}
              src={media.url}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain transition-transform duration-100"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Zoom indicator */}
        {scale > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-medium">
            {Math.round(scale * 100)}%
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstagramZoomPreview;
