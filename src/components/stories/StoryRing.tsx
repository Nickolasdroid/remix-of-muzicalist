import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StoryRingProps {
  src: string | null;
  name: string;
  /** Unseen stories get the animated gradient ring; seen ones a quiet static ring. */
  state: "unseen" | "seen" | "none";
  size?: number;
  className?: string;
}

/**
 * Avatar wrapped in an Instagram-style story ring. The unseen ring is a
 * slowly rotating gold→amber gradient; once every story is viewed it turns
 * into a thin muted outline.
 */
const StoryRing = ({ src, name, state, size = 64, className }: StoryRingProps) => {
  const inner = size - 8;
  return (
    <span
      className={cn("relative inline-flex items-center justify-center rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {state === "unseen" && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full motion-safe:animate-[spin_3.5s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(45 95% 58%), hsl(30 95% 55%), hsl(12 85% 58%), hsl(330 75% 58%), hsl(45 95% 58%))",
          }}
        />
      )}
      {state === "seen" && (
        <span aria-hidden className="absolute inset-0 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span
        className="relative rounded-full bg-background flex items-center justify-center"
        style={{ width: size - 4, height: size - 4 }}
      >
        <Avatar style={{ width: inner, height: inner }}>
          <AvatarImage src={src || undefined} alt={name} className="object-cover" />
          <AvatarFallback className="text-sm font-semibold">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </span>
    </span>
  );
};

export default StoryRing;
