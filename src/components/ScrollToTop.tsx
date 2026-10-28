import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORE_KEY = "muz-scroll-positions";
const MAX_ENTRIES = 60;

const readPositions = (): Record<string, number> => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writePosition = (key: string, y: number) => {
  try {
    const all = readPositions();
    delete all[key];
    all[key] = Math.round(y);
    const keys = Object.keys(all);
    for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete all[k];
    sessionStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: back still works, just without the saved position */
  }
};

/**
 * New page → top. Back/forward → the exact position the user left, even when
 * the page loads its content after a moment (feed, profiles, lists): we keep
 * trying until the page is tall enough, and stop as soon as the user scrolls.
 */
const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const keyRef = useRef(location.key);
  const pathRef = useRef(location.pathname);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Remember the position of the page being shown.
  useEffect(() => {
    keyRef.current = location.key;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        writePosition(keyRef.current, window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [location.key]);

  useLayoutEffect(() => {
    const pathChanged = pathRef.current !== location.pathname;
    pathRef.current = location.pathname;
    if (navType !== "POP") {
      // Tabs and filters (?tab=…) keep the position; a new page starts at the top.
      if (pathChanged) window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      return;
    }

    const target = readPositions()[location.key] ?? 0;
    if (target <= 0) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      return;
    }

    let cancelled = false;
    let frame = 0;
    const started = performance.now();
    const stop = () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("keydown", stop);
    };
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("keydown", stop);

    const attempt = () => {
      if (cancelled) return;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.min(target, Math.max(0, maxY)), left: 0, behavior: "instant" as ScrollBehavior });
      const reached = maxY >= target && Math.abs(window.scrollY - target) < 2;
      if (reached || performance.now() - started > 2500) return stop();
      frame = requestAnimationFrame(attempt);
    };
    attempt();
    return stop;
  }, [location.key, navType]);

  return null;
};

export default ScrollToTop;
