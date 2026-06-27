import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

const VerifiedBadge = ({ className, size = "md", label = "Verified artist" }: VerifiedBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center text-sky-400 drop-shadow",
              className,
            )}
            aria-label={label}
          >
            <BadgeCheck className={cn(sizeMap[size], "fill-sky-500/20")} strokeWidth={2.25} />
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
