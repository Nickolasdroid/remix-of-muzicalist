import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PostMediaFrame from "@/components/PostMediaFrame";
import LinkEmbed from "@/components/post/LinkEmbed";
import { findEmbed } from "@/lib/mediaEmbeds";
import type { PostMediaItem } from "@/lib/postMedia";
import { cn } from "@/lib/utils";

/**
 * Everything visual under a post's text:
 * - several photos -> swipeable carousel with dots and a counter
 * - one photo/video -> the shared PostMediaFrame
 * - no media but a YouTube/Spotify/SoundCloud link in the text -> a player
 */
const PostMedia = ({
  items,
  text,
  onMediaClick,
}: {
  items: PostMediaItem[];
  text?: string | null;
  onMediaClick?: (item: PostMediaItem) => void;
}) => {
  if (items.length === 0) {
    const embed = findEmbed(text);
    return embed ? <LinkEmbed embed={embed} /> : null;
  }
  if (items.length === 1) {
    const it = items[0];
    return <PostMediaFrame url={it.url} type={it.type} alt="Post content" onClick={onMediaClick ? () => onMediaClick(it) : undefined} />;
  }
  return <Carousel items={items} onMediaClick={onMediaClick} />;
};

const Carousel = ({ items, onMediaClick }: { items: PostMediaItem[]; onMediaClick?: (item: PostMediaItem) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Frame follows the first photo's shape (between 4:5 portrait and 1.91:1 landscape), like Instagram
  const [ratio, setRatio] = useState(1);

  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="group relative mt-2 w-full" onClick={(e) => e.stopPropagation()}>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => (
          <div key={`${it.url}-${i}`} style={{ aspectRatio: String(ratio) }} className="flex w-full shrink-0 snap-center items-center justify-center bg-black">
            {it.type === "video" ? (
              <video src={it.url} controls playsInline preload="metadata" className="max-h-full max-w-full" />
            ) : (
              <img
                src={it.url}
                alt={`Photo ${i + 1} of ${items.length}`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                onClick={onMediaClick ? () => onMediaClick(it) : undefined}
                onLoad={i === 0 ? (e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) setRatio(Math.min(1.91, Math.max(0.8, img.naturalWidth / img.naturalHeight)));
                } : undefined}
                className={cn("h-full w-full object-cover", onMediaClick && "cursor-pointer")}
              />
            )}
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
        {index + 1}/{items.length}
      </span>

      {index > 0 && (
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {index < items.length - 1 && (
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div className="flex justify-center gap-1.5 py-2" aria-hidden="true">
        {items.map((_, i) => (
          <span key={i} className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === index ? "bg-accent" : "bg-muted-foreground/40")} />
        ))}
      </div>
    </div>
  );
};

export default PostMedia;
