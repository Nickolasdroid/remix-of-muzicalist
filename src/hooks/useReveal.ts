import { useEffect, useRef, useState } from "react";

/*
 * Lets an element fade and rise in the first time it scrolls into view. One shared
 * observer for the whole page; tiles that come into view together appear one after
 * another (a short stagger), so a new row reads as a wave rather than a jump.
 */

type Show = (delay: number) => void;
const callbacks = new WeakMap<Element, Show>();
let shared: IntersectionObserver | null = null;

const getObserver = () => {
  if (shared) return shared;
  shared = new IntersectionObserver(
    (entries) => {
      let n = 0;
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e) => {
          callbacks.get(e.target)?.(Math.min(n++, 8) * 55);
          callbacks.delete(e.target);
          shared?.unobserve(e.target);
        });
    },
    { rootMargin: "0px 0px -40px 0px", threshold: 0.05 },
  );
  return shared;
};

const reducedMotion = () =>
  typeof window === "undefined" ||
  typeof IntersectionObserver === "undefined" ||
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  // null = not revealed yet; number = stagger delay in ms
  const [delay, setDelay] = useState<number | null>(() => (reducedMotion() ? 0 : null));

  useEffect(() => {
    const el = ref.current;
    if (!el || delay !== null) return;
    callbacks.set(el, setDelay);
    getObserver().observe(el);
    return () => {
      callbacks.delete(el);
      shared?.unobserve(el);
    };
  }, [delay]);

  const shown = delay !== null;
  return {
    ref,
    className: shown
      ? "translate-y-0 opacity-100 transition-[opacity,transform] duration-500 ease-out"
      : "translate-y-4 opacity-0",
    style: shown && delay ? { transitionDelay: `${delay}ms` } : undefined,
  };
}
