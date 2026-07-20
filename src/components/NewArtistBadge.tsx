import { cn } from "@/lib/utils";

const NEW_ARTIST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface NewArtistBadgeProps {
  createdAt?: string | null;
  className?: string;
  variant?: "overlay" | "inline";
}

/**
 * Shows a "New artist" label for profiles created within the last 30 days.
 * The literal "New artist" is picked up by the auto-translator (roText.ts).
 */
const NewArtistBadge = ({ createdAt, className, variant = "overlay" }: NewArtistBadgeProps) => {
  if (!createdAt) return null;
  const isNew = Date.now() - new Date(createdAt).getTime() < NEW_ARTIST_WINDOW_MS;
  if (!isNew) return null;

  if (variant === "inline") {
    return (
      <span className={cn("text-xs font-medium text-accent/80", className)}>
        New artist
      </span>
    );
  }

  return (
    <div
      className={cn(
        "absolute top-1.5 left-1.5 z-10 pointer-events-none bg-accent text-accent-foreground text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-md",
        className
      )}
    >
      New artist
    </div>
  );
};

export default NewArtistBadge;
export { NEW_ARTIST_WINDOW_MS };
