import { useState } from "react";
import { Play } from "lucide-react";
import { embedHeight, embedSrc, type MediaEmbed } from "@/lib/mediaEmbeds";

/**
 * Player for a YouTube / Spotify / SoundCloud link in a post.
 * YouTube shows its thumbnail first and only loads the player on tap (keeps the feed fast);
 * Spotify and SoundCloud load lazily as they scroll into view.
 */
const LinkEmbed = ({ embed }: { embed: MediaEmbed }) => {
  const [playing, setPlaying] = useState(false);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (embed.provider === "youtube") {
    return (
      <div className="mt-2 w-full bg-black" onClick={stop}>
        <div className="relative w-full aspect-video">
          {playing ? (
            <iframe
              src={embedSrc(embed, true)}
              title="YouTube video"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full"
              aria-label="Play video"
            >
              <img
                src={`https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-transform group-hover:scale-105">
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 px-3.5" onClick={stop}>
      <iframe
        src={embedSrc(embed)}
        title={embed.provider === "spotify" ? "Spotify player" : "SoundCloud player"}
        height={embedHeight(embed)}
        loading="lazy"
        className="w-full rounded-xl border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  );
};

export default LinkEmbed;
