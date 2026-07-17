import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
  /** Optional right-aligned slot for reset / secondary actions. */
  actions?: ReactNode;
}

/**
 * Horizontal filter bar. Compose with SearchBar, Select, MultiSelect, etc.
 * Wraps on small screens.
 */
export function FilterBar({ children, className, actions }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
