import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const TONE_STYLES: Record<StatusTone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  info: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  success: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-transparent",
};

export interface StatusBadgeProps {
  tone?: StatusTone;
  label: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Consistent status pill used across admin lists. */
export function StatusBadge({ tone = "neutral", label, icon, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {icon}
      {label}
    </Badge>
  );
}
