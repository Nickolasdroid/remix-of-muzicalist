/**
 * Moderation Live Collaboration — pure helpers.
 *
 * This module contains ONLY pure functions. Realtime plumbing lives in
 * `src/hooks/moderation/useCasePresence.ts`; UI wiring lives in the panel.
 * Keeping the logic here makes presence math, soft-lock resolution and
 * conflict detection trivially testable without a Supabase mock.
 */

export interface PresenceMeta {
  /** Auth user id — also the presence key. */
  user_id: string;
  /** Display name (stage_name / email fallback). */
  name: string;
  /** Optional avatar url. */
  avatar_url: string | null;
  /** ISO timestamp when this presence *first* joined the case channel. */
  joined_at: string;
  /** ISO timestamp of the last heartbeat. Used to prune stale presences. */
  last_active: string;
}

/** Default inactivity budget before a presence is considered stale (60s). */
export const PRESENCE_STALE_MS = 60_000;

/** Heartbeat cadence used by the client hook (25s). */
export const PRESENCE_HEARTBEAT_MS = 25_000;

// -------------------------------------------------------------------------

/**
 * Flatten Supabase's `presenceState()` output (a map of arrays keyed by
 * presence key) into a single de-duplicated list, keeping the newest
 * `last_active` per user.
 */
export function flattenPresence(
  state: Record<string, PresenceMeta[]> | null | undefined,
): PresenceMeta[] {
  if (!state) return [];
  const by: Record<string, PresenceMeta> = {};
  for (const list of Object.values(state)) {
    for (const p of list ?? []) {
      if (!p || !p.user_id) continue;
      const prev = by[p.user_id];
      if (!prev || new Date(p.last_active).getTime() > new Date(prev.last_active).getTime()) {
        by[p.user_id] = p;
      }
    }
  }
  return Object.values(by);
}

/**
 * Filter out presences whose last heartbeat is older than `staleMs`.
 * Even though Supabase auto-prunes on disconnect, network hiccups can leave
 * stragglers; the client-side filter guarantees the UI never lies.
 */
export function activePresences(
  list: PresenceMeta[],
  now: number = Date.now(),
  staleMs: number = PRESENCE_STALE_MS,
): PresenceMeta[] {
  return list.filter((p) => {
    const last = new Date(p.last_active).getTime();
    return Number.isFinite(last) && now - last <= staleMs;
  });
}

/**
 * Determine the soft-lock holder: the earliest-joined active moderator OTHER
 * than the current user. Returns `null` when nobody else is present.
 *
 * A moderator can "take over" by rewriting their own `joined_at` to a very
 * old timestamp — that moves the holder to them and the previous holder
 * automatically drops to read-only on their next presence sync.
 */
export function softLockHolder(
  list: PresenceMeta[],
  selfId: string,
  now: number = Date.now(),
  staleMs: number = PRESENCE_STALE_MS,
): PresenceMeta | null {
  const others = activePresences(list, now, staleMs).filter((p) => p.user_id !== selfId);
  if (others.length === 0) return null;
  const self = list.find((p) => p.user_id === selfId);
  const selfJoined = self ? new Date(self.joined_at).getTime() : Number.POSITIVE_INFINITY;
  // Earliest joiner wins; ties fall back to user_id for determinism.
  const earliest = [...others].sort((a, b) => {
    const d = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    return d !== 0 ? d : a.user_id.localeCompare(b.user_id);
  })[0];
  const earliestJoined = new Date(earliest.joined_at).getTime();
  return earliestJoined <= selfJoined ? earliest : null;
}

/**
 * Two-character initials for the avatar fallback.
 */
export function initialsFor(name: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * True when the remote `updated_at` is strictly newer than the version the
 * client last observed. Used to gate the "This case has changed" banner and
 * to detect concurrent-edit conflicts.
 */
export function hasConflict(
  lastSeenUpdatedAt: string | null | undefined,
  remoteUpdatedAt: string | null | undefined,
): boolean {
  if (!remoteUpdatedAt) return false;
  if (!lastSeenUpdatedAt) return false;
  return new Date(remoteUpdatedAt).getTime() > new Date(lastSeenUpdatedAt).getTime();
}

/**
 * Heuristic: does an error thrown by a moderation write look like a
 * concurrent-edit conflict? We treat invalid transitions, "not found" (row
 * moved), and explicit conflict codes as conflict-class errors so the UI can
 * refresh instead of surfacing a raw error toast.
 */
export function isConflictError(err: unknown): boolean {
  if (!err) return false;
  const code = (err as { code?: string })?.code ?? "";
  const message = (err as { message?: string })?.message ?? "";
  const s = `${code} ${message}`.toUpperCase();
  return (
    s.includes("MOD_INVALID_TRANSITION") ||
    s.includes("MOD_CASE_NOT_FOUND") ||
    s.includes("MOD_ALREADY_ASSIGNED") ||
    s.includes("MOD_NOT_ASSIGNED") ||
    s.includes("MOD_ACTION_ALREADY_REVERSED") ||
    s.includes("CONFLICT")
  );
}
