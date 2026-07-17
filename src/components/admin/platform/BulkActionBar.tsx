import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: ReactNode;
  className?: string;
}

/** Sticky bar shown above tables when items are selected. */
export function BulkActionBar({
  selectedCount,
  onClear,
  actions,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className={cn(
        "sticky top-2 z-10 flex items-center gap-3 rounded-lg border border-border bg-background/95 p-2 shadow-sm backdrop-blur",
        className,
      )}
      role="region"
      aria-label="Bulk actions"
    >
      <span className="pl-2 text-sm font-medium">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear selection">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
