import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import SmoothVideoPlayer from "./SmoothVideoPlayer";
import ImageLightbox from "./ImageLightbox";
import { getEmbedInfo } from "@/lib/mediaEmbed";

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

  // Images use the single standardized viewer (same as the profile picture viewer)
  if (media.type !== "video") {
    return <ImageLightbox src={media.url} onClose={onClose} />;
  }


  const info = getEmbedInfo(media.url);

  return (
    <DialogPrimitive.Root open={!!media} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-2"
          onClick={onClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Media preview</DialogPrimitive.Title>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
            className="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div onClick={(e) => e.stopPropagation()}>
            {info && info.provider !== "direct" ? (
              <div className={info.aspect === "audio" ? "w-[95vw] max-w-2xl" : "w-[95vw] max-w-5xl aspect-video"}>
                <iframe
                  src={info.embedUrl + (info.provider === "youtube" ? "&autoplay=1" : "")}
                  title="Embedded media"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="w-full rounded-lg border-0"
                  style={info.aspect === "audio" ? { height: info.provider === "spotify" ? 352 : 166 } : { height: "100%" }}
                />
              </div>
            ) : (
              <SmoothVideoPlayer
                src={media.url}
                autoPlay
                className="w-[95vw] h-[90vh] max-w-[95vw] max-h-[90vh]"
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};


export default InstagramZoomPreview;
