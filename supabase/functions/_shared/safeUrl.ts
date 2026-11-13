// Redirect URLs handed to Stripe (checkout success/cancel, billing portal return) must point to
// Muzicalist itself, otherwise a caller could send a customer to any site after paying.

const ALLOWED_HOSTS = new Set(["www.muzicalist.com", "muzicalist.com"]);
export const DEFAULT_ORIGIN = "https://www.muzicalist.com";

function isAllowed(url: URL): boolean {
  return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
}

/** The candidate URL when it is on an allowed host, otherwise the fallback. */
export function safeReturnUrl(candidate: unknown, fallback: string): string {
  if (typeof candidate !== "string") return fallback;
  try {
    const url = new URL(candidate);
    return isAllowed(url) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

/** The request Origin when it is an allowed host, otherwise the production origin. */
export function safeOrigin(origin: string | null | undefined): string {
  if (!origin) return DEFAULT_ORIGIN;
  try {
    const url = new URL(origin);
    return isAllowed(url) ? url.origin : DEFAULT_ORIGIN;
  } catch {
    return DEFAULT_ORIGIN;
  }
}
