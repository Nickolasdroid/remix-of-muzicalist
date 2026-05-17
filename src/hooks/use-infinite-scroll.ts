import { useEffect, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  onLoadMore: () => Promise<void>,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 0.1, rootMargin = "100px" } = options;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(null);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    setLoadMoreElement(node);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    if (!loadMoreElement || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreElement, hasMore, isLoadingMore, handleLoadMore, threshold, rootMargin]);

  return { loadMoreRef, isLoadingMore };
}
