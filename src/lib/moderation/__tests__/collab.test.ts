import { describe, expect, it } from "vitest";
import {
  activePresences,
  flattenPresence,
  hasConflict,
  initialsFor,
  isConflictError,
  PRESENCE_STALE_MS,
  softLockHolder,
  type PresenceMeta,
} from "@/lib/moderation/collab";

const NOW = new Date("2026-07-17T12:00:00Z").getTime();

function mk(over: Partial<PresenceMeta>): PresenceMeta {
  return {
    user_id: over.user_id ?? "u",
    name: over.name ?? "User",
    avatar_url: over.avatar_url ?? null,
    joined_at: over.joined_at ?? new Date(NOW - 10_000).toISOString(),
    last_active: over.last_active ?? new Date(NOW - 1_000).toISOString(),
  };
}

describe("flattenPresence", () => {
  it("returns [] for null/empty", () => {
    expect(flattenPresence(null)).toEqual([]);
    expect(flattenPresence({})).toEqual([]);
  });

  it("dedupes by user_id keeping the newest last_active", () => {
    const state = {
      a: [
        mk({ user_id: "a", last_active: new Date(NOW - 5_000).toISOString() }),
        mk({ user_id: "a", last_active: new Date(NOW - 1_000).toISOString() }),
      ],
      b: [mk({ user_id: "b" })],
    };
    const out = flattenPresence(state);
    expect(out).toHaveLength(2);
    const a = out.find((p) => p.user_id === "a")!;
    expect(a.last_active).toBe(new Date(NOW - 1_000).toISOString());
  });

  it("skips entries missing user_id", () => {
    const state = { x: [{ user_id: "", name: "", avatar_url: null, joined_at: "", last_active: "" } as PresenceMeta] };
    expect(flattenPresence(state)).toEqual([]);
  });
});

describe("activePresences", () => {
  it("prunes presences older than stale window", () => {
    const list = [
      mk({ user_id: "fresh", last_active: new Date(NOW - 5_000).toISOString() }),
      mk({ user_id: "stale", last_active: new Date(NOW - PRESENCE_STALE_MS - 10_000).toISOString() }),
    ];
    const active = activePresences(list, NOW);
    expect(active.map((p) => p.user_id)).toEqual(["fresh"]);
  });

  it("keeps entries exactly at the stale boundary", () => {
    const list = [mk({ user_id: "edge", last_active: new Date(NOW - PRESENCE_STALE_MS).toISOString() })];
    expect(activePresences(list, NOW)).toHaveLength(1);
  });
});

describe("softLockHolder", () => {
  it("returns null when no others are present", () => {
    const list = [mk({ user_id: "self" })];
    expect(softLockHolder(list, "self", NOW)).toBeNull();
  });

  it("returns earliest-joined other moderator", () => {
    const list = [
      mk({ user_id: "self", joined_at: new Date(NOW - 30_000).toISOString() }),
      mk({ user_id: "late",  joined_at: new Date(NOW - 5_000).toISOString() }),
      mk({ user_id: "early", joined_at: new Date(NOW - 60_000).toISOString() }),
    ];
    expect(softLockHolder(list, "self", NOW)?.user_id).toBe("early");
  });

  it("returns null when self is earlier than everyone else", () => {
    const list = [
      mk({ user_id: "self",  joined_at: new Date(NOW - 90_000).toISOString() }),
      mk({ user_id: "other", joined_at: new Date(NOW - 10_000).toISOString() }),
    ];
    expect(softLockHolder(list, "self", NOW)).toBeNull();
  });

  it("supports take-over via epoch joined_at", () => {
    const holder = mk({ user_id: "holder", joined_at: new Date(NOW - 60_000).toISOString() });
    const self = mk({ user_id: "self", joined_at: new Date(NOW - 5_000).toISOString() });
    // Before take-over
    expect(softLockHolder([holder, self], "self", NOW)?.user_id).toBe("holder");
    // After take-over (self rewrites joined_at to epoch)
    const selfAfter = { ...self, joined_at: new Date(0).toISOString() };
    expect(softLockHolder([holder, selfAfter], "self", NOW)).toBeNull();
  });

  it("ignores stale peers when picking the holder", () => {
    const list = [
      mk({ user_id: "self", joined_at: new Date(NOW - 5_000).toISOString() }),
      mk({
        user_id: "ghost",
        joined_at: new Date(NOW - 90_000).toISOString(),
        last_active: new Date(NOW - PRESENCE_STALE_MS - 60_000).toISOString(),
      }),
    ];
    expect(softLockHolder(list, "self", NOW)).toBeNull();
  });
});

describe("initialsFor", () => {
  it("handles empty, single, multi-word names", () => {
    expect(initialsFor("")).toBe("?");
    expect(initialsFor("madonna")).toBe("MA");
    expect(initialsFor("John Doe")).toBe("JD");
    expect(initialsFor("  maria  ana  pop ")).toBe("MP");
  });
});

describe("hasConflict", () => {
  it("returns false when either timestamp is missing", () => {
    expect(hasConflict(null, "2026-01-01T00:00:00Z")).toBe(false);
    expect(hasConflict("2026-01-01T00:00:00Z", null)).toBe(false);
  });
  it("returns true only when remote is strictly newer", () => {
    const a = "2026-07-17T12:00:00Z";
    const b = "2026-07-17T12:00:05Z";
    expect(hasConflict(a, b)).toBe(true);
    expect(hasConflict(b, a)).toBe(false);
    expect(hasConflict(a, a)).toBe(false);
  });
});

describe("isConflictError", () => {
  it("recognises moderation conflict codes", () => {
    expect(isConflictError({ message: "MOD_INVALID_TRANSITION: bad" })).toBe(true);
    expect(isConflictError({ code: "MOD_ALREADY_ASSIGNED" })).toBe(true);
    expect(isConflictError({ message: "409 conflict on update" })).toBe(true);
  });
  it("returns false for unrelated errors", () => {
    expect(isConflictError(null)).toBe(false);
    expect(isConflictError({ message: "network offline" })).toBe(false);
  });
});
