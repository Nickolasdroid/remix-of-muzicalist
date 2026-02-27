import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

interface InstagramZoomPreviewProps {
  media: MediaPreview | null;
  onClose: () => void;
}

const InstagramZoomPreview = ({ media, onClose }: InstagramZoomPreviewProps) => {
  const [isLandscape, setIsLandscape] = useState(false);

  if (!media) return null;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setIsLandscape(img.naturalWidth > img.naturalHeight);
  };

  return (
    <Dialog open={!!media} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none shadow-none [&>button]:hidden"
      >
        {/* Media container */}
        <div className="relative flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-50 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {media.type === "video" ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-w-[95vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={media.url}
              alt="Full size preview"
              className={`object-contain ${isLandscape ? 'w-[95vw] max-h-[90vh]' : 'max-w-[95vw] max-h-[90vh]'}`}
              draggable={false}
              onLoad={handleImageLoad}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramZoomPreview;
