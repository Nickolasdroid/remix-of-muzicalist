import { useCallback, useMemo, useState } from "react";

export interface UseSelectionResult {
  selected: Set<string>;
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  select: (ids: string[]) => void;
  clear: () => void;
  count: number;
}

/** Reusable multi-row selection state (used with DataTable). */
export function useSelection(initial: string[] = []): UseSelectionResult {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const all = ids.every((id) => prev.has(id));
      if (all) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const select = useCallback((ids: string[]) => setSelected(new Set(ids)), []);
  const clear = useCallback(() => setSelected(new Set()), []);
  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    selectedIds,
    isSelected,
    toggle,
    toggleAll,
    select,
    clear,
    count: selected.size,
  };
}
