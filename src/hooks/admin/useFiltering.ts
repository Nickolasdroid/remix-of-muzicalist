import { useCallback, useMemo, useState } from "react";

export type FilterValues = Record<string, unknown>;

export interface UseFilteringResult<F extends FilterValues> {
  filters: F;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  setFilters: (values: Partial<F>) => void;
  reset: () => void;
  activeCount: number;
}

/** Object-shaped filter state with reset + active count. */
export function useFiltering<F extends FilterValues>(initial: F): UseFilteringResult<F> {
  const [filters, setFiltersState] = useState<F>(initial);

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((values: Partial<F>) => {
    setFiltersState((prev) => ({ ...prev, ...values }));
  }, []);

  const reset = useCallback(() => setFiltersState(initial), [initial]);

  const activeCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(filters)) {
      const v = filters[key];
      const iv = (initial as FilterValues)[key];
      const isEmpty =
        v == null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0) ||
        (v instanceof Set && v.size === 0);
      const changed = JSON.stringify(v) !== JSON.stringify(iv);
      if (!isEmpty && changed) count += 1;
    }
    return count;
  }, [filters, initial]);

  return { filters, setFilter, setFilters, reset, activeCount };
}
