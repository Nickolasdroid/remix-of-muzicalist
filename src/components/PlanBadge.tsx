import { cn } from "@/lib/utils";
import crownBadge from "@/assets/crown-badge.png";

interface PlanBadgeProps {
  plan?: string | null;
  className?: string;
  size?: number;
}

/**
 * Crown-shaped subscription badge.
 * - Premium: gold
 * - Standard: silver/gray
 * - Free / unknown: not rendered
 */
const PlanBadge = ({ plan, className, size = 20 }: PlanBadgeProps) => {
  if (plan !== "Premium" && plan !== "Standard") return null;

  const isPremium = plan === "Premium";
  const color = isPremium ? "hsl(43 96% 56%)" : "hsl(0 0% 80%)";
  const dropShadow = isPremium
    ? "drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
    : "drop-shadow(0 1px 2px rgba(0,0,0,0.45))";

  return (
    <div
      className={cn(
        "absolute top-1.5 right-1.5 z-10 pointer-events-none",
        className
      )}
      aria-label={isPremium ? "Premium artist" : "Standard artist"}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${crownBadge})`,
        maskImage: `url(${crownBadge})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        filter: dropShadow,
      }}
    />
  );
};

export default PlanBadge;
