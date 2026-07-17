import { describe, it, expect } from "vitest";
import { isValidTestEmail, buildTestEmailPayload } from "@/lib/testEmail";

describe("isValidTestEmail", () => {
  it("accepts standard addresses", () => {
    expect(isValidTestEmail("user@example.com")).toBe(true);
    expect(isValidTestEmail("  User@Example.CO  ")).toBe(true);
    expect(isValidTestEmail("first.last+tag@sub.domain.io")).toBe(true);
  });

  it("rejects empty, malformed, or oversized values", () => {
    expect(isValidTestEmail("")).toBe(false);
    expect(isValidTestEmail(null)).toBe(false);
    expect(isValidTestEmail(undefined)).toBe(false);
    expect(isValidTestEmail("plainstring")).toBe(false);
    expect(isValidTestEmail("missing@dot")).toBe(false);
    expect(isValidTestEmail("a b@c.com")).toBe(false);
    expect(isValidTestEmail("@nohost.com")).toBe(false);
    expect(isValidTestEmail("a".repeat(321) + "@x.co")).toBe(false);
  });
});

describe("buildTestEmailPayload", () => {
  it("normalizes and trims fields", () => {
    const p = buildTestEmailPayload({
      templateId: "  legacy-artist-reactivation ",
      templateLabel: " Legacy Artist Reactivation ",
      email: "  USER@Example.COM ",
      name: "  Test Artist  ",
      campaignName: "  Wave 1  ",
    });
    expect(p).toEqual({
      template_id: "legacy-artist-reactivation",
      template_label: "Legacy Artist Reactivation",
      recipient_email: "user@example.com",
      recipient_name: "Test Artist",
      campaign_name: "Wave 1",
    });
  });

  it("nulls out blank optional fields", () => {
    const p = buildTestEmailPayload({
      templateId: "t",
      templateLabel: "T",
      email: "x@y.co",
      name: "   ",
      campaignName: "",
    });
    expect(p.recipient_name).toBeNull();
    expect(p.campaign_name).toBeNull();
  });
});
