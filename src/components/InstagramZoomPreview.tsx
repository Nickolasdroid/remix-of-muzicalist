import { X } from "lucide-react";
import { useState } from "react";
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

const InstagramZoomPreview = ({ media, onClose }: InstagramZoomPreviewProps) => {
  const [isLandscape, setIsLandscape] = useState(false);

  if (!media) return null;

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
              <img
                src={media.url}
                alt="Full size preview"
                className={`object-contain ${isLandscape ? 'w-[95vw] max-h-[90vh]' : 'max-w-[95vw] max-h-[90vh]'}`}
                draggable={false}
                onLoad={handleImageLoad}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default InstagramZoomPreview;
