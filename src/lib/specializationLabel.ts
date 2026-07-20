import { getCurrentLanguage } from "@/i18n";
import { getOverride } from "@/i18n/overrides";

/**
 * Localizes an artist specialization label using manual translation overrides.
 * Card contexts (e.g. artist profile links) are skipped by the DOM auto-translator,
 * so specializations like "Instrumentalist" must be translated explicitly here.
 */
export const translateSpecialization = (spec: string | null | undefined): string => {
  if (!spec) return "";
  const lang = getCurrentLanguage?.() || "en";
  return getOverride(lang, spec) || spec;
};
