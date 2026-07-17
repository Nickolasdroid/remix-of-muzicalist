import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface UseSortingOptions<K extends string> {
  initialKey?: K | null;
  initialDirection?: SortDirection;
}

export interface UseSortingResult<K extends string> {
  sortKey: K | null;
  sortDirection: SortDirection;
  toggle: (key: K) => void;
  set: (key: K | null, direction?: SortDirection) => void;
  compare: <Row>(rows: Row[], getter: (row: Row, key: K) => unknown) => Row[];
}

/** Generic sort key + direction state with a stable toggle behavior. */
export function useSorting<K extends string>({
  initialKey = null,
  initialDirection = "desc",
}: UseSortingOptions<K> = {}): UseSortingResult<K> {
  const [sortKey, setSortKey] = useState<K | null>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const toggle = useCallback((key: K) => {
    setSortKey((current) => {
      if (current !== key) {
        setSortDirection("desc");
        return key;
      }
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return key;
    });
  }, []);

  const set = useCallback((key: K | null, direction: SortDirection = "desc") => {
    setSortKey(key);
    setSortDirection(direction);
  }, []);

  const compare = useCallback(
    <Row,>(rows: Row[], getter: (row: Row, key: K) => unknown): Row[] => {
      if (!sortKey) return rows;
      const dir = sortDirection === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => {
        const av = getter(a, sortKey) as never;
        const bv = getter(b, sortKey) as never;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    },
    [sortKey, sortDirection],
  );

  return useMemo(
    () => ({ sortKey, sortDirection, toggle, set, compare }),
    [sortKey, sortDirection, toggle, set, compare],
  );
}
