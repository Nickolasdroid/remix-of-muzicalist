import { describe, expect, it } from "vitest";
import { COMMON_EVENT_TYPES, EVENT_TYPES, EVENT_TYPE_RO, eventTypeRo, isKnownEventType } from "../eventTypes";

describe("eventTypes", () => {
  it("has a Romanian label for every type and lists 18th Birthday", () => {
    for (const t of EVENT_TYPES) expect(EVENT_TYPE_RO[t]).toBeTruthy();
    expect(EVENT_TYPES).toContain("18th Birthday");
    for (const t of COMMON_EVENT_TYPES) expect(EVENT_TYPES).toContain(t);
  });

  it("translates known types for documents and keeps free text", () => {
    expect(eventTypeRo("Wedding")).toBe("Nuntă");
    expect(eventTypeRo("18th Birthday")).toBe("Majorat");
    expect(eventTypeRo("Aniversarea firmei")).toBe("Aniversarea firmei");
    expect(eventTypeRo(null)).toBe("");
    expect(isKnownEventType("Majorat")).toBe(false);
  });
});
