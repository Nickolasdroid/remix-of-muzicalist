import { useCallback, useEffect, useRef } from "react";

/**
 * Makes the phone/browser Back button close a full-screen composer instead of leaving
 * the page underneath. While `open`, one extra history entry is kept on top.
 *
 * `onBack` runs when Back is pressed; return true if the composer closed, false if it
 * stays open (e.g. the "discard draft?" question is shown) — the entry is then re-added.
 * Call the returned `releaseHistory()` before closing from the UI (Cancel, X, publish)
 * so the extra entry is removed.
 */
export function useCloseOnBack(open: boolean, onBack: () => boolean) {
  const pushed = useRef(false);
  const ignoreNextPop = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const push = () => {
    window.history.pushState({ ...(window.history.state ?? {}), mzComposer: true }, "");
    pushed.current = true;
  };

  useEffect(() => {
    if (!open) return;
    if (!pushed.current) push();
    const onPop = () => {
      if (ignoreNextPop.current) {
        ignoreNextPop.current = false;
        return;
      }
      pushed.current = false;
      if (!onBackRef.current()) push();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  return useCallback(() => {
    if (!pushed.current) return;
    pushed.current = false;
    ignoreNextPop.current = true;
    window.history.back();
  }, []);
}
