import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { translateTextsSync } from "@/i18n";

/**
 * Tab / app-switcher title for private pages that have no SEO block.
 * Without it the title of the previous page stays ("Marian Filip — Singer"
 * while reading messages). Pass the English text; Romanian comes from the dictionary.
 */
export function usePageTitle(title: string | null | undefined) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "ro";
  useEffect(() => {
    if (!title) return;
    const local = lang.startsWith("en") ? title : translateTextsSync(lang, [title])[title.trim()] || title;
    document.title = `${local} | Muzicalist`;
  }, [title, lang]);
}
