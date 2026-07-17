// Email Template Variable Engine — central registry + validation service.
// Variables are namespaced (e.g. {{artist.stage_name}}); UI components must
// consume them from this registry, never hardcoded inline.

export type VariableNamespace =
  | "user"
  | "artist"
  | "subscription"
  | "booking"
  | "system"
  | "campaign";

export interface VariableDefinition {
  /** Full token WITHOUT braces, e.g. "artist.stage_name". */
  key: string;
  namespace: VariableNamespace;
  /** Short label shown in the panel (usually the part after the dot). */
  name: string;
  description: string;
  required: boolean;
  /** Example value used for future previews. */
  example?: string;
}

export const NAMESPACE_LABEL: Record<VariableNamespace, string> = {
  user: "User",
  artist: "Artist",
  subscription: "Subscription",
  booking: "Booking",
  system: "System",
  campaign: "Campaign",
};

// Built-in seed registry. Keep names authoritative — validators use this list.
const BUILTIN: VariableDefinition[] = [
  // User
  { key: "user.first_name", namespace: "user", name: "first_name", description: "Recipient's first name.", required: false, example: "Alex" },
  { key: "user.last_name", namespace: "user", name: "last_name", description: "Recipient's last name.", required: false, example: "Popescu" },
  { key: "user.email", namespace: "user", name: "email", description: "Recipient's email address.", required: true, example: "alex@example.com" },

  // Artist
  { key: "artist.stage_name", namespace: "artist", name: "stage_name", description: "Public stage or brand name.", required: false, example: "DJ Nova" },
  { key: "artist.genre", namespace: "artist", name: "genre", description: "Primary music genre.", required: false, example: "House" },
  { key: "artist.city", namespace: "artist", name: "city", description: "Artist home city.", required: false, example: "Bucharest" },

  // Subscription
  { key: "subscription.plan_name", namespace: "subscription", name: "plan_name", description: "Active subscription plan.", required: false, example: "Premium" },
  { key: "subscription.expiration_date", namespace: "subscription", name: "expiration_date", description: "When the current period ends.", required: false, example: "2026-12-31" },

  // Booking
  { key: "booking.event_date", namespace: "booking", name: "event_date", description: "Requested event date.", required: false, example: "2026-08-14" },
  { key: "booking.client_name", namespace: "booking", name: "client_name", description: "Name of the booking client.", required: false, example: "Maria I." },

  // System
  { key: "system.dashboard_url", namespace: "system", name: "dashboard_url", description: "Deep link to the recipient's dashboard.", required: false, example: "https://muzicalist.com/dashboard" },
  { key: "system.support_email", namespace: "system", name: "support_email", description: "Support contact email.", required: true, example: "contact@muzicalist.com" },

  // Campaign
  { key: "campaign.name", namespace: "campaign", name: "name", description: "Campaign display name.", required: false, example: "Summer Reactivation" },
];

let cache: VariableDefinition[] | null = null;

/**
 * Returns the full registry. Async-shaped so it can be backed by DB later
 * without changing any callers.
 */
export async function loadVariableRegistry(): Promise<VariableDefinition[]> {
  if (!cache) cache = [...BUILTIN];
  return cache;
}

export function getVariableRegistrySync(): VariableDefinition[] {
  return cache ?? BUILTIN;
}

export function groupByNamespace(
  defs: VariableDefinition[],
): Record<VariableNamespace, VariableDefinition[]> {
  const out = {
    user: [], artist: [], subscription: [], booking: [], system: [], campaign: [],
  } as Record<VariableNamespace, VariableDefinition[]>;
  for (const d of defs) out[d.namespace].push(d);
  return out;
}

export function formatToken(key: string): string {
  return `{{${key}}}`;
}

// ---- Validation service --------------------------------------------------

export type ValidationErrorType = "unknown" | "duplicate" | "malformed";

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  /** Substring that triggered the error. */
  match: string;
  /** Character index in the source content. */
  index: number;
}

export interface ValidationResult {
  ok: boolean;
  used: string[];
  unknown: string[];
  duplicates: string[];
  errors: ValidationError[];
}

// Matches {{ anything }} — captures the inner token loosely so we can flag
// malformed variants (spaces, invalid chars) separately from clean tokens.
const TOKEN_RE = /\{\{\s*([^{}]*?)\s*\}\}/g;
// A well-formed token uses lowercase namespaces + snake_case identifiers.
const CLEAN_TOKEN_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Extracts and validates every {{variable}} token in the given content.
 * Runs entirely client-side; safe to call from editors and validators alike.
 */
export function validateTemplateContent(
  content: string,
  registry?: VariableDefinition[],
): ValidationResult {
  const defs = registry ?? getVariableRegistrySync();
  const known = new Set(defs.map((d) => d.key));

  const errors: ValidationError[] = [];
  const used: string[] = [];
  const seen = new Map<string, number>();

  if (!content) {
    return { ok: true, used, unknown: [], duplicates: [], errors };
  }

  // Detect stray/unclosed braces up front (e.g. "{{artist.name" or "artist}}")
  const strayOpen = content.match(/\{\{(?![^{}]*\}\})/g);
  if (strayOpen) {
    for (const s of strayOpen) {
      errors.push({
        type: "malformed",
        message: "Unclosed variable braces — expected matching }}",
        match: s,
        index: content.indexOf(s),
      });
    }
  }

  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(content)) !== null) {
    const raw = m[0];
    const inner = (m[1] ?? "").trim();
    const index = m.index;

    if (!inner) {
      errors.push({ type: "malformed", message: "Empty variable token.", match: raw, index });
      continue;
    }
    if (!CLEAN_TOKEN_RE.test(inner)) {
      errors.push({
        type: "malformed",
        message: `Malformed variable "${inner}" — use lowercase namespace.identifier.`,
        match: raw,
        index,
      });
      continue;
    }

    used.push(inner);
    seen.set(inner, (seen.get(inner) ?? 0) + 1);

    if (!known.has(inner)) {
      errors.push({
        type: "unknown",
        message: `Unknown variable "${inner}". It is not in the registry.`,
        match: raw,
        index,
      });
    }
  }

  const duplicates = Array.from(seen.entries())
    .filter(([, n]) => n > 1)
    .map(([k]) => k);
  for (const dup of duplicates) {
    errors.push({
      type: "duplicate",
      message: `Variable "${dup}" appears more than once.`,
      match: formatToken(dup),
      index: content.indexOf(formatToken(dup)),
    });
  }

  const unknown = used.filter((k) => !known.has(k));
  return {
    ok: errors.length === 0,
    used: Array.from(new Set(used)),
    unknown: Array.from(new Set(unknown)),
    duplicates,
    errors,
  };
}

/**
 * Autocomplete-ready helper. Given a partial token (e.g. "artist.st"),
 * returns matching registry entries ranked by prefix match.
 */
export function suggestVariables(
  partial: string,
  registry?: VariableDefinition[],
  limit = 10,
): VariableDefinition[] {
  const defs = registry ?? getVariableRegistrySync();
  const q = partial.trim().toLowerCase();
  if (!q) return defs.slice(0, limit);
  const starts = defs.filter((d) => d.key.startsWith(q));
  const contains = defs.filter((d) => !d.key.startsWith(q) && d.key.includes(q));
  return [...starts, ...contains].slice(0, limit);
}
