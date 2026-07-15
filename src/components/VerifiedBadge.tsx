import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "h-[18px] w-[18px] md:h-5 md:w-5",
  md: "h-[18px] w-[18px] md:h-5 md:w-5",
  lg: "h-6 w-6 md:h-7 md:w-7",
};

// 12-point scalloped/starburst badge shape (like Twitter/X verified)
const BADGE_PATH =
  "M50 2 L60 10 L72 6 L78 17 L91 18 L92 31 L102 38 L96 49 L102 60 L92 67 L91 80 L78 81 L72 92 L60 88 L50 96 L40 88 L28 92 L22 81 L9 80 L8 67 L-2 60 L4 49 L-2 38 L8 31 L9 18 L22 17 L28 6 L40 10 Z";

const VerifiedBadge = ({ className, size = "md", label = "Verified" }: VerifiedBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center shrink-0 align-middle relative",
              "md:transition-transform md:duration-200 md:ease-out md:hover:scale-[1.08] md:hover:brightness-110",
              sizeMap[size],
              className,
            )}
            style={{
              filter: "drop-shadow(0 1px 2px rgba(14, 165, 233, 0.4))",
            }}
            aria-label={label}
          >
            <svg
              viewBox="-4 -2 108 100"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="vbg" cx="30%" cy="25%" r="90%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="55%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#0284C7" />
                </radialGradient>
              </defs>
              <path d={BADGE_PATH} fill="url(#vbg)" />
              <path
                d="M32 50 L45 62 L68 38"
                fill="none"
                stroke="#ffffff"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="rounded-lg">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
