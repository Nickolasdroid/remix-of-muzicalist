import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shows a long list a batch at a time: the next batch appears when the visitor nears the
 * bottom, so the page grows while scrolling instead of being its full length from the start.
 * Starts over when `resetKey` changes (a new search or filter).
 */
export function useInfiniteList<T>(items: T[], step = 20, resetKey: unknown = null) {
  const [count, setCount] = useState(step);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => setCount(step), [resetKey, step]);

  const hasMore = count < items.length;

  // Callback ref: (re)attach whenever the marker at the bottom is rendered
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observer.current?.disconnect();
      if (!node || !hasMore) return;
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setCount((c) => c + step);
        },
        { rootMargin: "600px 0px" },
      );
      observer.current.observe(node);
    },
    [hasMore, step],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  return { visible: items.slice(0, count), hasMore, sentinelRef };
}
