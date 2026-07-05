// Deterministic safeguard: the Muzicalist brand name must NEVER be
// translated, transliterated, or "corrected" to "Musicalist" by any
// translation pipeline.
//
// Scope is intentionally narrow: this helper ONLY rewrites the single
// translation-induced mutation we have observed in production — the token
// "Musicalist" / "MUSICALIST" — back to the canonical brand spelling.
// It never touches unrelated words, other fuzzy variants (e.g. Muzikalist,
// Musikalist), or suffixed grammatical forms. Already-correct occurrences
// of "Muzicalist" / "MUZICALIST" pass through unchanged.

const BRAND_REGEX = /\bMusicalist\b/g;
const BRAND_REGEX_UPPER = /\bMUSICALIST\b/g;

/** Restore canonical brand spelling in a single string. */
export function restoreBrandName(input: string): string {
  if (!input || typeof input !== "string") return input;
  return input.replace(BRAND_REGEX_UPPER, "MUZICALIST").replace(BRAND_REGEX, "Muzicalist");
}

/** Recursively apply `restoreBrandName` to strings inside objects/arrays. */
export function restoreBrandNameDeep<T>(value: T): T {
  if (typeof value === "string") return restoreBrandName(value) as unknown as T;
  if (Array.isArray(value)) return value.map(restoreBrandNameDeep) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = restoreBrandNameDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}
