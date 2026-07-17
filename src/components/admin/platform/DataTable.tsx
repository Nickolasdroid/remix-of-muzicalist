import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: Row) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  sortKey?: string | null;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;
}

/**
 * Reusable admin data table. Handles loading, empty, error, selection and
 * click-through in one place so every module gets the same UX.
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  onRetry,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  onRowClick,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortKey,
  sortDirection,
  onSortChange,
}: DataTableProps<Row>) {
  const selectable = Boolean(selectedIds && onToggleSelect);
  const allSelected =
    selectable && rows.length > 0 && rows.every((r) => selectedIds!.has(getRowId(r)));

  if (loading) return <LoadingState label="Loading…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0)
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => onToggleSelectAll?.()}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((col) => {
              const isSorted = sortKey === col.id;
              return (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.className,
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable && "cursor-pointer select-none",
                  )}
                  onClick={col.sortable ? () => onSortChange?.(col.id) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {isSorted && (
                      <span aria-hidden className="text-xs">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const id = getRowId(row);
            const isSelected = selectable && selectedIds!.has(id);
            return (
              <TableRow
                key={id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect?.(id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      col.className,
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
