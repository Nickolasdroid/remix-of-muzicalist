import { describe, it, expect } from "vitest";
import { validateTemplateContent, suggestVariables } from "../emailVariables";

describe("validateTemplateContent", () => {
  it("returns ok=true for empty content", () => {
    const r = validateTemplateContent("");
    expect(r.ok).toBe(true);
    expect(r.used).toEqual([]);
  });

  it("accepts known tokens", () => {
    const r = validateTemplateContent("Hi {{user.first_name}}");
    expect(r.ok).toBe(true);
    expect(r.used).toContain("user.first_name");
  });

  it("flags unknown tokens", () => {
    const r = validateTemplateContent("{{nope.thing}}");
    expect(r.ok).toBe(false);
    expect(r.unknown).toContain("nope.thing");
    expect(r.errors.some((e) => e.type === "unknown")).toBe(true);
  });

  it("flags malformed tokens (bad case, no dot, empty)", () => {
    const r = validateTemplateContent("{{}} {{User.X}} {{no_dot}}");
    expect(r.errors.filter((e) => e.type === "malformed").length).toBeGreaterThanOrEqual(3);
  });

  it("detects duplicates", () => {
    const r = validateTemplateContent(
      "{{user.first_name}} then {{user.first_name}}",
    );
    expect(r.duplicates).toContain("user.first_name");
    expect(r.errors.some((e) => e.type === "duplicate")).toBe(true);
  });

  it("detects stray unclosed braces", () => {
    const r = validateTemplateContent("Hi {{user.first_name");
    expect(r.errors.some((e) => e.type === "malformed")).toBe(true);
  });
});

describe("suggestVariables", () => {
  it("returns prefix matches first", () => {
    const s = suggestVariables("user.f");
    expect(s[0].key).toBe("user.first_name");
  });

  it("falls back to contains matches", () => {
    const s = suggestVariables("stage");
    expect(s.some((d) => d.key === "artist.stage_name")).toBe(true);
  });

  it("returns full registry slice when partial is empty", () => {
    const s = suggestVariables("", undefined, 3);
    expect(s.length).toBe(3);
  });
});
