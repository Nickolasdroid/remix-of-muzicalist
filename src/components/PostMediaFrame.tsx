import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import { cn } from "@/lib/utils";

interface PostMediaFrameProps {
  /** Media source URL */
  url: string;
  /** "video" renders a player, anything else renders an image */
  type?: string | null;
  alt?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Single, shared media frame for every post/announcement in the product.
 *
 * Principles:
 * - The FEED controls the available media space (width + max height).
 * - The MEDIA controls its own proportions (never cropped, never distorted).
 */
const PostMediaFrame = ({ url, type, alt = "Post media", onClick, className }: PostMediaFrameProps) => {
  const isVideo = type === "video";

  return (
    <div
      onClick={onClick}
      className={cn(
        "mt-3 w-full flex items-center justify-center overflow-hidden bg-muted/30",
        onClick && "cursor-pointer",
        className
      )}
    >
      {isVideo ? (
        <div className="relative w-full aspect-video max-h-[60vh] sm:max-h-[520px]">
          <SmoothVideoPlayer
            src={url}
            className="absolute inset-0 w-full h-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-auto max-w-full h-auto max-h-[65vh] sm:max-h-[520px] object-contain hover:opacity-95 transition-opacity"
        />
      )}
    </div>
  );
};

export default PostMediaFrame;
