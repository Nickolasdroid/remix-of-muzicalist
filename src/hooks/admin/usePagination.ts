import { useCallback, useMemo, useState } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  total?: number;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  from: number;
  to: number;
  canPrev: boolean;
  canNext: boolean;
  setPage: (page: number) => void;
  next: () => void;
  prev: () => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

/** Client-side pagination state. Also exposes PostgREST-friendly `from`/`to` bounds. */
export function usePagination({
  initialPage = 1,
  pageSize: initialSize = 25,
  total = 0,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const from = (clampedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    from,
    to,
    canPrev: clampedPage > 1,
    canNext: clampedPage < totalPages,
    setPage,
    next: useCallback(() => setPage((p) => p + 1), []),
    prev: useCallback(() => setPage((p) => Math.max(1, p - 1)), []),
    setPageSize: useCallback((s: number) => {
      setPageSize(s);
      setPage(1);
    }, []),
    reset: useCallback(() => setPage(initialPage), [initialPage]),
  };
}
