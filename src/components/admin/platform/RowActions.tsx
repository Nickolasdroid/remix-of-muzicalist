import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AdminAction } from "@/lib/adminActions";
import { getAvailableActions } from "@/lib/adminActions";

export interface RowActionsProps<Row> {
  row: Row;
  actions: AdminAction<Row>[];
  onRequestConfirm?: (action: AdminAction<Row>, row: Row) => void;
}

/**
 * Standardized "…" row actions menu. Destructive actions render in the
 * destructive color and, when they have a `confirm` config, delegate to the
 * host page via `onRequestConfirm` (usually wired to `useConfirmAction`).
 */
export function RowActions<Row>({ row, actions, onRequestConfirm }: RowActionsProps<Row>) {
  const available = getAvailableActions(actions, row);
  if (available.length === 0) return null;

  const primary = available.filter((a) => !a.destructive);
  const destructive = available.filter((a) => a.destructive);

  const run = (action: AdminAction<Row>) => {
    if (action.confirm && onRequestConfirm) {
      onRequestConfirm(action, row);
      return;
    }
    void action.onSelect(row);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg">
        {primary.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.isDisabled?.(row)}
            onClick={(e) => {
              e.stopPropagation();
              run(action);
            }}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </DropdownMenuItem>
        ))}
        {primary.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.isDisabled?.(row)}
            onClick={(e) => {
              e.stopPropagation();
              run(action);
            }}
            className={cn("text-destructive focus:text-destructive")}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
