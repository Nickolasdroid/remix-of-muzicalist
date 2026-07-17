import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ToolbarProps {
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Horizontal toolbar for filters + primary actions. */
export function Toolbar({ leading, trailing, children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {leading}
        {children}
      </div>
      {trailing && <div className="flex flex-wrap items-center gap-2">{trailing}</div>}
    </div>
  );
}
