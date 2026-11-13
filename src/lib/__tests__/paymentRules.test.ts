import { describe, expect, it } from "vitest";
import { DEFAULT_ORIGIN, safeOrigin, safeReturnUrl } from "../../../supabase/functions/_shared/safeUrl";
import { shouldDowngradeOnDeleted } from "../../../supabase/functions/_shared/subscriptionRules";

describe("Stripe redirect URLs", () => {
  const fallback = "https://www.muzicalist.com/x";
  it("accepts Muzicalist's own https addresses", () => {
    expect(safeReturnUrl("https://www.muzicalist.com/dashboard?checkout=success", fallback)).toBe(
      "https://www.muzicalist.com/dashboard?checkout=success",
    );
    expect(safeReturnUrl("https://muzicalist.com/plans", fallback)).toBe("https://muzicalist.com/plans");
  });
  it("rejects other sites, look-alike hosts, http and non-URLs", () => {
    for (const bad of ["https://evil.example/pay", "https://www.muzicalist.com.evil.example/", "http://www.muzicalist.com/", "javascript:alert(1)", undefined, 42]) {
      expect(safeReturnUrl(bad, fallback)).toBe(fallback);
    }
  });
  it("falls back to the production origin for unknown origins", () => {
    expect(safeOrigin("https://localhost")).toBe(DEFAULT_ORIGIN);
    expect(safeOrigin(null)).toBe(DEFAULT_ORIGIN);
    expect(safeOrigin("https://muzicalist.com")).toBe("https://muzicalist.com");
  });
});

describe("subscription deleted rule", () => {
  it("downgrades only for the subscription the profile currently has", () => {
    expect(shouldDowngradeOnDeleted("sub_A", "sub_A")).toBe(true);
    expect(shouldDowngradeOnDeleted("sub_B", "sub_A")).toBe(false);
    expect(shouldDowngradeOnDeleted(null, "sub_A")).toBe(true);
  });
});
