import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

interface InstagramZoomPreviewProps {
  media: MediaPreview | null;
  onClose: () => void;
}

const InstagramZoomPreview = ({ media, onClose }: InstagramZoomPreviewProps) => {
  if (!media) return null;

  return (
    <Dialog open={!!media} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none shadow-none [&>button]:hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-50 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media container */}
        <div className="flex items-center justify-center">
          {media.type === "video" ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={media.url}
              alt="Full size preview"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
              draggable={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramZoomPreview;
