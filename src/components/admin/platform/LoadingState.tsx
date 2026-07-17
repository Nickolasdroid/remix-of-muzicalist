import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function LoadingState({ label = "Loading…", className, compact }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        compact ? "py-6" : "py-16",
        "rounded-lg border border-dashed border-border bg-card/40",
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
