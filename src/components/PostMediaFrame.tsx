import { useState } from "react";
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
 * - Photos fill the post's full width, like Instagram.
 * - Tall photos are trimmed to 4:5 and very wide ones to 1.91:1; in between they keep
 *   their own proportions. Tapping opens the whole photo.
 */
const PostMediaFrame = ({ url, type, alt = "Post media", onClick, className }: PostMediaFrameProps) => {
  const isVideo = type === "video";
  const [ratio, setRatio] = useState<number | null>(null);

  return (
    <div
      onClick={onClick}
      className={cn(
        "mt-2 w-full flex items-center justify-center overflow-hidden",
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
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w && h) setRatio(Math.min(1.91, Math.max(0.8, w / h)));
          }}
          style={ratio ? { aspectRatio: String(ratio) } : undefined}
          className="block h-auto w-full object-cover transition-opacity hover:opacity-95"
        />
      )}
    </div>
  );
};

export default PostMediaFrame;
