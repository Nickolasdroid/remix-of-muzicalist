import { useEffect, useRef } from "react";
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

const AutoTranslatePageText = () => {
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attrOriginals = useRef(new WeakMap<Element, Partial<Record<(typeof TRANSLATABLE_ATTRIBUTES)[number], string>>>());
  const rafRef = useRef<number | null>(null);
  const asyncTimeoutRef = useRef<number | null>(null);
  const pendingMissing = useRef<Set<string>>(new Set());

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

    const flushAsync = async () => {
      const lang = getCurrentLanguage();
      if (lang === "en") return;
      const missing = [...pendingMissing.current];
      pendingMissing.current.clear();
      if (!missing.length) return;
      await translateTexts(lang, missing);
      // After fetching, re-run sync pass to apply.
      runSync();
    };

    const scheduleAsync = () => {
      if (asyncTimeoutRef.current) window.clearTimeout(asyncTimeoutRef.current);
      asyncTimeoutRef.current = window.setTimeout(flushAsync, 200);
    };

    const runSync = () => {
      const lang = getCurrentLanguage();
      if (lang === "en") {
        restoreEnglish();
        return;
      }
      const { textNodes, attrTargets, originals } = collect();
      const map = translateTextsSync(lang, originals);
      apply(lang, textNodes, attrTargets, map);

      // Queue any still-missing strings for async fetch.
      let hasMissing = false;
      originals.forEach((o) => {
        if (!map[o]) {
          pendingMissing.current.add(o);
          hasMissing = true;
        }
      });
      if (hasMissing) scheduleAsync();
    };

    const scheduleSync = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        runSync();
      });
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onLanguageChanged = () => {
      pendingMissing.current.clear();
      runSync();
    };
    i18n.on("languageChanged", onLanguageChanged);
    runSync();

    return () => {
      observer.disconnect();
      i18n.off("languageChanged", onLanguageChanged);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (asyncTimeoutRef.current) window.clearTimeout(asyncTimeoutRef.current);
    };
  }, []);

  return null;
};

export default AutoTranslatePageText;
