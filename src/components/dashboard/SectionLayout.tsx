import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Shared layout primitives used by the artist dashboard sections
 * (Posts, Announcements, Gallery) so every tab follows the exact
 * same visual hierarchy, spacing and sizing.
 */

export function SectionShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function SectionHeader({
  icon,
  title,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 min-h-[40px]",
        className,
      )}
    >
      <h2 className="text-xl font-display font-bold flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{title}</span>
      </h2>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

export function SectionStats({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>{children}</div>
  );
}

export function SectionStatCard({
  label,
  value,
  info,
  isOver,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  info?: ReactNode;
  isOver?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card/50 p-4 min-h-[88px] flex flex-col justify-center",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
        <span className="text-sm text-muted-foreground truncate">{label}</span>
        {info}
      </div>
      <div className="mt-1.5 text-2xl font-display font-bold">
        <span className={isOver ? "text-destructive" : "text-foreground"}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function SectionFilters({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {children}
    </div>
  );
}

export function SectionEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-border/60 bg-card/30 px-6 py-12",
        className,
      )}
    >
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/80 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
