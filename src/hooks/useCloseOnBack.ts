import { useCallback } from "react";
import { useCloseOnBack as useModalCloseOnBack } from "@/lib/modalHistory";

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
  useModalCloseOnBack(open, onBack);
  // The shared manager releases entries when `open` becomes false, including
  // nested discard confirmations. Never start a second asynchronous traversal.
  return useCallback(() => {}, []);
}
