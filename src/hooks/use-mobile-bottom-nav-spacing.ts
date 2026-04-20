import { RefObject, useEffect, useState } from "react";

const MOBILE_BOTTOM_CLEARANCE = 152;

export const useMobileBottomNavSpacing = <T extends HTMLElement>(containerRef: RefObject<T>, trigger?: unknown) => {
  const [needsBottomSpacing, setNeedsBottomSpacing] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateSpacing = () => {
      if (window.innerWidth >= 768) {
        setNeedsBottomSpacing(false);
        return;
      }

      const contentBottom = element.getBoundingClientRect().bottom;
      const visibleBottom = window.innerHeight - MOBILE_BOTTOM_CLEARANCE;
      setNeedsBottomSpacing(contentBottom > visibleBottom);
    };

    updateSpacing();

    const resizeObserver = new ResizeObserver(updateSpacing);
    resizeObserver.observe(element);

    window.addEventListener("resize", updateSpacing);
    const animationFrame = requestAnimationFrame(updateSpacing);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSpacing);
      cancelAnimationFrame(animationFrame);
    };
  }, [containerRef, trigger]);

  return needsBottomSpacing;
};
