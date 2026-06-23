import { getEmbedInfo, type EmbedInfo } from "@/lib/mediaEmbed";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";

interface EmbeddedMediaPlayerProps {
  url: string;
  className?: string;
  title?: string;
  autoPlay?: boolean;
}

/**
 * Renders a media URL using the right player:
 * - YouTube / Vimeo / SoundCloud / Spotify → iframe embed
 * - Anything else (mp4/webm, legacy storage uploads) → native <video>
 */
export default function EmbeddedMediaPlayer({
  url,
  className = "",
  title = "Embedded media",
  autoPlay = false,
}: EmbeddedMediaPlayerProps) {
  const info: EmbedInfo | null = getEmbedInfo(url);

  if (!info || info.provider === "direct") {
    return (
      <SmoothVideoPlayer
        src={url}
        autoPlay={autoPlay}
        className={className}
      />
    );
  }

  const isAudio = info.aspect === "audio";

  return (
    <iframe
      src={info.embedUrl + (autoPlay && info.provider === "youtube" ? "&autoplay=1" : "")}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      className={`w-full rounded-lg border-0 ${isAudio ? "" : "aspect-video"} ${className}`}
      style={isAudio ? { height: info.provider === "spotify" ? 352 : 166 } : undefined}
    />
  );
}
