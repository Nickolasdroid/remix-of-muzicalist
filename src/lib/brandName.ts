// Deterministic safeguard: the Muzicalist brand name must NEVER be translated,
// transliterated, or "corrected" to "Musicalist" (or similar) by any translation
// pipeline. This helper restores the canonical brand spelling after translation.
//
// Narrow scope: only touches tokens that clearly spell out the brand
// (Muzicalist / Musicalist / Muzikalist / Musikalist, plus Romanian-style
// suffixed forms like "Muzicaliști"). Surrounding words are untouched.

// Matches "muzicalist" / "musicalist" / "muzikalist" / "musikalist" with an
// optional short Romanian-style suffix (ul, ului, ilor, ii, ești, iști, i).
const BRAND_REGEX = /\bmu[sz]i?k?icalist(?:ul|ului|ilor|ii|e[sș]ti|i[sș]ti|i)?\b/gi;

/**
 * Restore canonical "Muzicalist" / "MUZICALIST" spelling in a string.
 * Case rule: fully-uppercase source token → MUZICALIST, otherwise Muzicalist.
 */
export function restoreBrandName(input: string): string {
  if (!input || typeof input !== "string") return input;
  return input.replace(BRAND_REGEX, (match) =>
    match === match.toUpperCase() ? "MUZICALIST" : "Muzicalist"
  );
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
