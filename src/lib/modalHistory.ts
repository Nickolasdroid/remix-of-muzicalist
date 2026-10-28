import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Phone "back" (Android button, iOS swipe, browser arrow) closes the open
 * window/sheet first, instead of leaving the page behind it.
 *
 * While a modal is open we add one history entry with the same URL. Back
 * removes that entry and we close the top-most modal. Closing it any other way
 * (X, Cancel, tap outside) removes the entry ourselves, so the history stays
 * clean and the next back goes to the previous page as expected.
 */

type Entry = { close: () => void; depth: number };

const MARK = "__muzModal";
const stack: Entry[] = [];
let ignorePops = 0;
let installed = false;

const currentDepth = (): number => {
  const v = (window.history.state as Record<string, unknown> | null)?.[MARK];
  return typeof v === "number" ? v : 0;
};

const install = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("popstate", () => {
    if (ignorePops > 0) {
      ignorePops -= 1;
      return;
    }
    const depth = currentDepth();
    // Close every modal that lives above the entry we landed on.
    while (stack.length && stack[stack.length - 1].depth > depth) {
      stack.pop()!.close();
    }
    // Landed on the entry of a modal that is no longer open (the user left the
    // page from inside it): skip it, so one back press is enough.
    const topDepth = stack.length ? stack[stack.length - 1].depth : 0;
    if (depth > topDepth) {
      ignorePops += 1;
      window.history.back();
    }
  });
};

export function useCloseOnBack(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    install();
    const depth = currentDepth() + 1;
    const entry: Entry = { close: () => closeRef.current(), depth };
    stack.push(entry);
    window.history.pushState({ ...(window.history.state ?? {}), [MARK]: depth }, "");

    return () => {
      const i = stack.indexOf(entry);
      if (i === -1) return; // already closed by "back"
      stack.splice(i, 1);
      // Closed with X / Cancel / outside tap: drop our entry, unless the user
      // has already moved on to another page from inside the modal.
      if (currentDepth() === depth) {
        ignorePops += 1;
        window.history.back();
      }
    };
  }, [open]);
}

/** Controlled/uncontrolled open state for a modal root, wired to useCloseOnBack. */
export function useModalOpenState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [inner, setInner] = useState(!!defaultOpen);
  const isOpen = open ?? inner;
  const onChangeRef = useRef(onOpenChange);
  onChangeRef.current = onOpenChange;
  const controlled = open !== undefined;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!controlled) setInner(v);
      onChangeRef.current?.(v);
    },
    [controlled],
  );

  useCloseOnBack(isOpen, () => setOpen(false));
  return [isOpen, setOpen] as const;
}
