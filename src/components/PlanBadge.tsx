import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  plan?: string | null;
  className?: string;
  size?: number;
}

/**
 * Crown-shaped subscription badge.
 * - Premium: gold
 * - Standard: silver
 * - Free / unknown: not rendered
 */
const PlanBadge = (_props: PlanBadgeProps) => {
  // Subscription crown badge intentionally hidden on artist cards.
  return null;
};

export default PlanBadge;
