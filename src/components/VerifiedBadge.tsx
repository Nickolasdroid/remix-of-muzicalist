import { Check } from "lucide-react";
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

const iconSizeMap = {
  sm: "h-3 w-3 md:h-3.5 md:w-3.5",
  md: "h-3 w-3 md:h-3.5 md:w-3.5",
  lg: "h-4 w-4 md:h-[18px] md:w-[18px]",
};

const VerifiedBadge = ({ className, size = "md", label = "Verified" }: VerifiedBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full shrink-0 align-middle",
              "md:transition-all md:duration-200 md:ease-out md:hover:scale-[1.08] md:hover:brightness-110",
              sizeMap[size],
              className,
            )}
            style={{
              background: "radial-gradient(circle at 30% 25%, #38BDF8 0%, #0EA5E9 55%, #0284C7 100%)",
              boxShadow: "0 1px 4px rgba(14, 165, 233, 0.35)",
            }}
            aria-label={label}
          >
            <Check className={cn("text-white", iconSizeMap[size])} strokeWidth={3.5} />
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
