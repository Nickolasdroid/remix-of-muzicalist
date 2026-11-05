import { cn } from "@/lib/utils";

export type ContentKind = "posts" | "gig" | "collab";

/** Same names as the feed filters and the card tags. */
export const CONTENT_KIND_LABEL: Record<ContentKind, string> = {
  posts: "Posts",
  gig: "Events",
  collab: "Collaborations",
};

/** Event / collaboration list of an announcement row (legacy rows without a kind count as the owner's usual kind). */
export const announcementKind = (a: { kind?: string | null }, fallback: "gig" | "collab"): "gig" | "collab" =>
  a.kind === "gig" || a.kind === "collab" ? a.kind : fallback;

/**
 * Chips at the top of a profile's Posts tab: Posts · Events · Collaborations.
 * Renders nothing when there is only one choice.
 */
const ContentKindChips = ({
  value,
  onChange,
  options,
  className,
}: {
  value: ContentKind;
  onChange: (k: ContentKind) => void;
  options: { k: ContentKind; count?: number }[];
  className?: string;
}) => {
  if (options.length < 2) return null;
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)} role="tablist">
      {options.map(({ k, count }) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
            value === k
              ? "border-foreground/15 bg-foreground/[0.1] font-semibold text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <span>{CONTENT_KIND_LABEL[k]}</span>
          {count != null && <span className="tabular-nums"> · {count}</span>}
        </button>
      ))}
    </div>
  );
};

export default ContentKindChips;
