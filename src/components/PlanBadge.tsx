import { Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  plan?: string | null;
  className?: string;
  size?: number;
}

/**
 * Diamond-shaped subscription badge.
 * - Premium: gold
 * - Standard: gray
 * - Free / unknown: not rendered
 */
const PlanBadge = ({ plan, className, size = 18 }: PlanBadgeProps) => {
  if (plan !== "Premium" && plan !== "Standard") return null;

  const isPremium = plan === "Premium";
  const colorClass = isPremium ? "text-amber-400" : "text-zinc-300";
  const shadowStyle = isPremium
    ? { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }
    : { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))" };

  return (
    <div
      className={cn(
        "absolute top-1.5 right-1.5 z-10 pointer-events-none",
        className
      )}
      aria-label={isPremium ? "Premium artist" : "Standard artist"}
    >
      <Diamond
        size={size}
        className={cn(colorClass, "fill-current")}
        style={shadowStyle}
        strokeWidth={1.5}
      />
    </div>
  );
};

export default PlanBadge;
