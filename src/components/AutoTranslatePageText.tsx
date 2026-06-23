import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import i18n, { getCurrentLanguage, translateTexts, translateTextsSync } from "@/i18n";

const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "video",
  "audio",
  "input",
  "textarea",
  "select",
  "option",
  "[contenteditable='true']",
  "[data-no-translate]",
].join(",");

const ATTRIBUTE_SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "[data-no-translate]",
].join(",");

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"] as const;

const shouldTranslateText = (value: string) => {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 220) return false;
  if (!/[\p{L}]/u.test(text)) return false;
  if (/^[@#]?\d+$/.test(text)) return false;
  if (/^(https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.)/i.test(text)) return false;
  return true;
};

const nearestSkippedElement = (node: Node) => {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return element?.closest(SKIP_SELECTOR);
};

type AttrTarget = { element: Element; attr: (typeof TRANSLATABLE_ATTRIBUTES)[number]; original: string };

const ensurePendingStyle = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("i18n-pending-style")) return;
  const style = document.createElement("style");
  style.id = "i18n-pending-style";
  style.textContent = 'html[data-i18n-pending="true"] body{visibility:hidden!important}';
  document.head.appendChild(style);
};

const AutoTranslatePageText = () => {
  const location = useLocation();
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attrOriginals = useRef(new WeakMap<Element, Partial<Record<(typeof TRANSLATABLE_ATTRIBUTES)[number], string>>>());
  const rafRef = useRef<number | null>(null);
  const asyncTimeoutRef = useRef<number | null>(null);
  const pendingMissing = useRef<Set<string>>(new Set());
  const runSyncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const collect = (): { textNodes: Text[]; attrTargets: AttrTarget[]; originals: string[] } => {
      const textNodes: Text[] = [];
      const originals: string[] = [];

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (nearestSkippedElement(node)) return NodeFilter.FILTER_REJECT;
          const textNode = node as Text;
          const original = textOriginals.current.get(textNode) || textNode.nodeValue || "";
          return shouldTranslateText(original) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });

      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const original = textOriginals.current.get(node) || node.nodeValue || "";
        textOriginals.current.set(node, original);
        textNodes.push(node);
        originals.push(original.replace(/\s+/g, " ").trim());
      }

      const attrTargets: AttrTarget[] = [];
      document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
        if (element.closest(ATTRIBUTE_SKIP_SELECTOR)) return;
        TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
          const current = element.getAttribute(attr) || "";
          const stored = attrOriginals.current.get(element)?.[attr] || current;
          if (!shouldTranslateText(stored)) return;
          attrOriginals.current.set(element, { ...attrOriginals.current.get(element), [attr]: stored });
          attrTargets.push({ element, attr, original: stored });
          originals.push(stored);
        });
      });

      return { textNodes, attrTargets, originals };
    };

    const apply = (
      lang: string,
      textNodes: Text[],
      attrTargets: AttrTarget[],
      map: Record<string, string>,
    ) => {
      textNodes.forEach((node) => {
        const original = textOriginals.current.get(node);
        if (!original) return;
        const trimmed = original.replace(/\s+/g, " ").trim();
        const translated = map[trimmed];
        if (translated && translated !== trimmed) {
          const nextValue = original.replace(original.trim(), translated);
          if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
        }
      });
      attrTargets.forEach(({ element, attr, original }) => {
        const translated = map[original];
        if (translated && translated !== original && element.getAttribute(attr) !== translated) {
          element.setAttribute(attr, translated);
        }
      });
    };

    const restoreEnglish = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const original = textOriginals.current.get(node);
        if (original && node.nodeValue !== original) node.nodeValue = original;
      }
      document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
        const originals = attrOriginals.current.get(element);
        if (!originals) return;
        TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
          if (originals[attr] && element.getAttribute(attr) !== originals[attr]) {
            element.setAttribute(attr, originals[attr]!);
          }
        });
      });
    };

    const revealBody = () => {
      if (document.documentElement.getAttribute("data-i18n-pending") === "true") {
        document.documentElement.removeAttribute("data-i18n-pending");
      }
    };

    let observer: MutationObserver | null = null;
    const startObserver = () => {
      if (observer) return;
      observer = new MutationObserver(scheduleSync);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    };
    const stopObserver = () => {
      if (!observer) return;
      observer.disconnect();
      observer = null;
    };

    const flushAsync = async () => {
      const lang = getCurrentLanguage();
      if (lang === "en") {
        revealBody();
        return;
      }
      const missing = [...pendingMissing.current];
      pendingMissing.current.clear();
      if (!missing.length) {
        revealBody();
        return;
      }
      await translateTexts(lang, missing);
      runSync();
      revealBody();
    };

    const scheduleAsync = () => {
      if (asyncTimeoutRef.current) window.clearTimeout(asyncTimeoutRef.current);
      asyncTimeoutRef.current = window.setTimeout(flushAsync, 0);
    };

    const runSync = () => {
      const lang = getCurrentLanguage();
      if (lang === "en") {
        restoreEnglish();
        revealBody();
        return;
      }
      // Pause observer so our own DOM writes don't re-trigger us.
      stopObserver();
      try {
        const { textNodes, attrTargets, originals } = collect();
        const map = translateTextsSync(lang, originals);
        apply(lang, textNodes, attrTargets, map);

        let hasMissing = false;
        originals.forEach((o) => {
          if (!map[o]) {
            pendingMissing.current.add(o);
            hasMissing = true;
          }
        });
        if (hasMissing) {
          scheduleAsync();
        } else {
          revealBody();
        }
      } finally {
        startObserver();
      }
    };

    // Coalesce mutations to the next animation frame only — translating before
    // the next paint prevents the previously-visible "flash of English" on
    // async-loaded content (data fetches that resolve after navigation).
    const scheduleSync = () => {
      if (getCurrentLanguage() === "en") return; // no work needed on English
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        runSync();
      });
    };

    // Only attach the observer when translation is actually needed.
    if (getCurrentLanguage() !== "en") {
      startObserver();
    }
    const onLanguageChanged = () => {
      pendingMissing.current.clear();
      if (getCurrentLanguage() === "en") {
        stopObserver();
        restoreEnglish();
        revealBody();
      } else {
        startObserver();
        runSync();
      }
    };
    i18n.on("languageChanged", onLanguageChanged);
    runSyncRef.current = runSync;
    runSync();

    return () => {
      stopObserver();
      i18n.off("languageChanged", onLanguageChanged);
      runSyncRef.current = null;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (asyncTimeoutRef.current) window.clearTimeout(asyncTimeoutRef.current);
    };
  }, []);

  // On every route change, hide the body BEFORE paint when a non-English
  // language is active, then translate the freshly mounted DOM synchronously
  // (using the cached translations) so the user never sees the English flash.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (getCurrentLanguage() === "en") return;
    ensurePendingStyle();
    document.documentElement.setAttribute("data-i18n-pending", "true");
    // Safety: never leave the page hidden indefinitely.
    const safety = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-i18n-pending");
    }, 15000);
    // Translate the freshly-committed DOM synchronously, BEFORE the browser
    // paints — this is what eliminates the English flash on navigation.
    runSyncRef.current?.();
    return () => {
      window.clearTimeout(safety);
    };
  }, [location.pathname]);

  return null;
};

export default AutoTranslatePageText;
