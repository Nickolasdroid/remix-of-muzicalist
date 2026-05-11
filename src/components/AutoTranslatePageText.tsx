import { useEffect, useRef } from "react";
import i18n, { getCurrentLanguage, translateTexts } from "@/i18n";

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

const AutoTranslatePageText = () => {
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attrOriginals = useRef(new WeakMap<Element, Partial<Record<(typeof TRANSLATABLE_ATTRIBUTES)[number], string>>>());
  const timeoutRef = useRef<number | null>(null);
  const translatingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restoreEnglish = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
      textNodes.forEach((node) => {
        const original = textOriginals.current.get(node);
        if (original) node.nodeValue = original;
      });

      document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
        const originals = attrOriginals.current.get(element);
        if (!originals) return;
        TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
          if (originals[attr]) element.setAttribute(attr, originals[attr]!);
        });
      });
    };

    const translatePage = async () => {
      const lang = getCurrentLanguage();
      if (lang === "en") {
        restoreEnglish();
        return;
      }

      if (translatingRef.current) return;
      translatingRef.current = true;

      try {
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

        const attrTargets: Array<{ element: Element; attr: (typeof TRANSLATABLE_ATTRIBUTES)[number]; original: string }> = [];
        document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
          if (element.closest(SKIP_SELECTOR)) return;
          TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
            const current = element.getAttribute(attr) || "";
            const stored = attrOriginals.current.get(element)?.[attr] || current;
            if (!shouldTranslateText(stored)) return;
            attrOriginals.current.set(element, { ...attrOriginals.current.get(element), [attr]: stored });
            attrTargets.push({ element, attr, original: stored });
            originals.push(stored);
          });
        });

        const translated = await translateTexts(lang, originals);
        textNodes.forEach((node) => {
          const original = textOriginals.current.get(node);
          if (original && translated[original.replace(/\s+/g, " ").trim()]) {
            node.nodeValue = original.replace(original.trim(), translated[original.replace(/\s+/g, " ").trim()]);
          }
        });
        attrTargets.forEach(({ element, attr, original }) => {
          element.setAttribute(attr, translated[original] || original);
        });
      } finally {
        translatingRef.current = false;
      }
    };

    const scheduleTranslate = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(translatePage, 350);
    };

    const observer = new MutationObserver(scheduleTranslate);
    observer.observe(document.body, { childList: true, subtree: true });
    const onLanguageChanged = () => scheduleTranslate();
    i18n.on("languageChanged", onLanguageChanged);
    scheduleTranslate();

    return () => {
      observer.disconnect();
      i18n.off("languageChanged", onLanguageChanged);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
};

export default AutoTranslatePageText;