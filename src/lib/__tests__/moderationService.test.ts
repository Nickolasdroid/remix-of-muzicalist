import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => {
  const rpc = vi.fn();
  return { supabase: { rpc } };
});

import { supabase } from "@/integrations/supabase/client";
import { ModerationService } from "../moderation/service";
import { ModerationTimelineService, EMITTED_EVENT_TYPES } from "../moderation/timelineService";
import {
  ModerationError,
  mapPostgresError,
  MODERATION_ERROR_MESSAGES,
} from "../moderation/errors";
import {
  canTransition,
  assertTransition,
  STATUS_TRANSITIONS,
  validateCreateCase,
  validateEvidence,
  validateNote,
  validateAssignment,
  isValidStatus,
  isValidPriority,
} from "../moderation/validation";
import { makeSample, timed } from "../moderation/metrics";

const rpcMock = (supabase as any).rpc as ReturnType<typeof vi.fn>;

beforeEach(() => {
  rpcMock.mockReset();
});

// ---------- Validation ----------------------------------------------------
describe("validation: status transitions", () => {
  it("mirrors the DB transition matrix", () => {
    expect(canTransition("open", "triaged")).toBe(true);
    expect(canTransition("open", "resolved")).toBe(false);
    expect(canTransition("resolved", "reopened")).toBe(true);
    expect(canTransition("closed", "reopened")).toBe(true);
    expect(canTransition("closed", "open")).toBe(false);
  });

  it("assertTransition throws with MOD_INVALID_TRANSITION on illegal move", () => {
    expect(() => assertTransition("open", "resolved")).toThrowError(ModerationError);
    try {
      assertTransition("open", "resolved");
    } catch (e) {
      expect((e as ModerationError).code).toBe("MOD_INVALID_TRANSITION");
    }
  });

  it("every status has an entry in STATUS_TRANSITIONS", () => {
    for (const s of ["open", "triaged", "in_review", "waiting_for_response", "resolved", "closed", "reopened"] as const) {
      expect(STATUS_TRANSITIONS[s]).toBeDefined();
    }
  });
});

describe("validation: create case", () => {
  const base = {
    category_key: "spam",
    target_type_key: "post",
    target_id: "00000000-0000-0000-0000-000000000001",
    title: "Reported post",
  };
  it("accepts valid input", () => {
    expect(() => validateCreateCase(base)).not.toThrow();
  });
  it("rejects empty title", () => {
    expect(() => validateCreateCase({ ...base, title: "  " })).toThrowError(/validation/i);
  });
  it("rejects missing target_id", () => {
    expect(() => validateCreateCase({ ...base, target_id: "" })).toThrowError(ModerationError);
  });
  it("rejects invalid priority", () => {
    expect(() => validateCreateCase({ ...base, priority: "urgent" as any })).toThrowError(/priority/i);
  });
});

describe("validation: evidence & notes & assignment", () => {
  it("evidence requires url/content/snapshot", () => {
    expect(() => validateEvidence({ case_id: "c", kind: "url" })).toThrowError(/evidence/i);
    expect(() => validateEvidence({ case_id: "c", kind: "url", url: "https://x" })).not.toThrow();
  });
  it("note requires body", () => {
    expect(() => validateNote("")).toThrow();
    expect(() => validateNote(" ok ")).not.toThrow();
  });
  it("assignment rejects duplicate assignee", () => {
    expect(() => validateAssignment("u1", "u1")).toThrowError(/already/i);
  });
  it("isValidStatus / isValidPriority guard bad input", () => {
    expect(isValidStatus("open")).toBe(true);
    expect(isValidStatus("nope")).toBe(false);
    expect(isValidPriority("critical")).toBe(true);
    expect(isValidPriority("meh")).toBe(false);
  });
});

// ---------- Error mapping -------------------------------------------------
describe("mapPostgresError", () => {
  it("maps known error tokens", () => {
    const e = mapPostgresError({ message: "MOD_CASE_NOT_FOUND", hint: "nope" });
    expect(e.code).toBe("MOD_CASE_NOT_FOUND");
    expect(e.hint).toBe("nope");
  });
  it("falls back to MOD_UNKNOWN", () => {
    const e = mapPostgresError({ message: "boom" });
    expect(e.code).toBe("MOD_UNKNOWN");
  });
  it("passes through ModerationError", () => {
    const src = new ModerationError("MOD_PERMISSION_DENIED");
    expect(mapPostgresError(src)).toBe(src);
  });
  it("has a message for every code", () => {
    for (const code of Object.keys(MODERATION_ERROR_MESSAGES)) {
      expect(MODERATION_ERROR_MESSAGES[code as keyof typeof MODERATION_ERROR_MESSAGES]).toBeTruthy();
    }
  });
});

// ---------- Timeline service ---------------------------------------------
describe("ModerationTimelineService", () => {
  it("assertNoDirectTimelineWrites always throws MOD_PERMISSION_DENIED", () => {
    expect(() => ModerationTimelineService.assertNoDirectTimelineWrites()).toThrowError(
      /moderation_case_events/,
    );
  });
  it("emitted event types cover the core lifecycle", () => {
    for (const t of ["case_created", "status_changed", "action_applied", "note_added"] as const) {
      expect(EMITTED_EVENT_TYPES).toContain(t);
    }
  });
  it("formatEventTitle returns human labels", () => {
    expect(ModerationTimelineService.formatEventTitle({ event_type: "case_created" })).toMatch(/created/i);
  });
  it("getTimeline forwards to the RPC and returns rows", async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ id: "e1", event_type: "case_created" }], error: null });
    const rows = await ModerationTimelineService.getTimeline("case-1");
    expect(rpcMock).toHaveBeenCalledWith("get_moderation_case_timeline", { _case_id: "case-1" });
    expect(rows).toHaveLength(1);
  });
});

// ---------- Service layer -------------------------------------------------
describe("ModerationService", () => {
  it("createCase validates then calls create_moderation_case", async () => {
    rpcMock.mockResolvedValueOnce({ data: { id: "c1" }, error: null });
    await ModerationService.createCase({
      category_key: "spam",
      target_type_key: "post",
      target_id: "t1",
      title: "  Hello  ",
    });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [fn, args] = rpcMock.mock.calls[0];
    expect(fn).toBe("create_moderation_case");
    expect(args._title).toBe("Hello");
  });

  it("createCase throws before hitting the RPC on invalid input", async () => {
    await expect(
      ModerationService.createCase({
        category_key: "spam",
        target_type_key: "post",
        target_id: "",
        title: "",
      }),
    ).rejects.toBeInstanceOf(ModerationError);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("changeStatus blocks illegal transition client-side", async () => {
    await expect(ModerationService.changeStatus("c1", "open", "resolved")).rejects.toMatchObject({
      code: "MOD_INVALID_TRANSITION",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("changeStatus forwards a legal transition", async () => {
    rpcMock.mockResolvedValueOnce({ data: { id: "c1", status: "triaged" }, error: null });
    await ModerationService.changeStatus("c1", "open", "triaged", "queued");
    expect(rpcMock).toHaveBeenCalledWith("change_case_status", {
      _case_id: "c1",
      _next_status: "triaged",
      _note: "queued",
    });
  });

  it("assignModerator prevents assigning the same moderator", async () => {
    await expect(ModerationService.assignModerator("c1", "u1", "u1")).rejects.toMatchObject({
      code: "MOD_ALREADY_ASSIGNED",
    });
  });

  it("addEvidence rejects empty payload before RPC", async () => {
    await expect(
      ModerationService.addEvidence({ case_id: "c1", kind: "screenshot" }),
    ).rejects.toMatchObject({ code: "MOD_EVIDENCE_REQUIRED" });
  });

  it("addAction requires action_key", async () => {
    await expect(
      ModerationService.addAction({ case_id: "c1", action_key: "" as any }),
    ).rejects.toMatchObject({ code: "MOD_INVALID_ACTION" });
  });

  it("closeCase / reopenCase forward correct RPC names", async () => {
    rpcMock.mockResolvedValue({ data: { id: "c1" }, error: null });
    await ModerationService.closeCase("c1", { resolution_notes: "done" });
    await ModerationService.reopenCase("c1", "customer complaint");
    expect(rpcMock.mock.calls.map((c) => c[0])).toEqual(["close_case", "reopen_case"]);
  });

  it("maps RPC errors into ModerationError", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "MOD_CASE_NOT_FOUND", hint: "x" } });
    await expect(ModerationService.getCase("missing")).rejects.toMatchObject({
      code: "MOD_CASE_NOT_FOUND",
    });
  });

  it("listCases passes filters through", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await ModerationService.listCases({ statuses: ["open"], priorities: ["high"], limit: 25 });
    expect(rpcMock).toHaveBeenCalledWith(
      "list_moderation_cases",
      expect.objectContaining({ _statuses: ["open"], _priorities: ["high"], _limit: 25 }),
    );
  });
});

// ---------- Metrics -------------------------------------------------------
describe("metrics helpers", () => {
  it("makeSample builds a well-formed record", () => {
    const s = makeSample("processing_time_ms", 42, { case_id: "c1" });
    expect(s.name).toBe("processing_time_ms");
    expect(s.value).toBe(42);
    expect(s.case_id).toBe("c1");
    expect(Date.parse(s.at)).not.toBeNaN();
  });
  it("timed returns result and non-negative elapsed", async () => {
    const { result, elapsed_ms } = await timed(async () => 7);
    expect(result).toBe(7);
    expect(elapsed_ms).toBeGreaterThanOrEqual(0);
  });
});
