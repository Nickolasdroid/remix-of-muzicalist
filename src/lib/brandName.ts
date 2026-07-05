// Deterministic safeguard: the Muzicalist brand name must NEVER be translated,
// transliterated, or corrected to "Musicalist" (or similar) by any translation
// pipeline. This helper restores the exact brand spelling after translation.
//
// Narrow scope: only touches tokens that spell out the brand (muzicalist /
// musicalist / musikalist), preserving surrounding words.

const BRAND_REGEX = /\bm[uü]s?[ií]k?[ií]?calist\b/gi;

// Broader regex that catches typical AI/transliteration variants:
//   Muzicalist, Musicalist, Muzikalist, Musikalist, Muzicaliști (RO plural)
const BRAND_REGEX_WIDE = /\bm[uü]z?s?i?k?icalist[iîí]?(ș|s)?[tț]?[iîí]?\b/gi;

/**
 * Restore canonical "Muzicalist" / "MUZICALIST" spelling in any string.
 * Case rule:
 *   - Original token fully uppercase → "MUZICALIST"
 *   - Otherwise → "Muzicalist"
 */
export function restoreBrandName(input: string): string {
  if (!input || typeof input !== "string") return input;
  const replace = (match: string) =>
    match === match.toUpperCase() ? "MUZICALIST" : "Muzicalist";
  return input.replace(BRAND_REGEX, replace).replace(/\bMuzicalist\b|\bMUZICALIST\b/g, (m) => m);
}

/** Same as restoreBrandName, but recursively for nested objects/arrays. */
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
