import { describe, expect, it } from "vitest";
import {
  buildOpportunityTitle,
  formatOpportunityBudget,
  formatPlace,
  isOpportunityOpen,
  myAvailabilityFor,
  opportunityErrorText,
  parseRomanianPlace,
} from "@/lib/opportunities";
import { isAdExpired } from "@/lib/adExpiration";

describe("buildOpportunityTitle", () => {
  it("builds a Romanian event title", () => {
    expect(
      buildOpportunityTitle({ kind: "gig", seeking: "DJ", eventType: "Wedding", city: "Florești", county: "Cluj" }, "ro"),
    ).toBe("DJ pentru nuntă în Florești");
  });

  it("uses the county when there is no town, and keeps acronyms", () => {
    expect(buildOpportunityTitle({ kind: "gig", seeking: "Band", eventType: "TV / Film Production", county: "Iași" }, "ro")).toBe(
      "Formație pentru producție TV / Film în Iași",
    );
    expect(buildOpportunityTitle({ kind: "gig", seeking: "Band", eventType: "TV / Film Production", county: "Iași" }, "en")).toBe(
      "Band for a TV / Film Production in Iași",
    );
    expect(buildOpportunityTitle({ kind: "gig", seeking: "Band", eventType: "18th Birthday", county: "Iași" }, "ro")).toBe(
      "Formație pentru majorat în Iași",
    );
  });

  it("uses the instrument for instrumentalists and free-text event types as typed", () => {
    expect(
      buildOpportunityTitle(
        { kind: "gig", seeking: "Instrumentalist", roleDetail: "Saxofonist", eventType: "Aniversarea firmei", county: "Cluj" },
        "ro",
      ),
    ).toBe("Saxofonist pentru aniversarea firmei în Cluj");
  });

  it("builds an English event title", () => {
    expect(buildOpportunityTitle({ kind: "gig", seeking: "DJ", eventType: "Wedding", city: "Florești", county: "Cluj" }, "en")).toBe(
      "DJ for a wedding in Florești",
    );
  });

  it("builds collaboration titles", () => {
    expect(
      buildOpportunityTitle(
        { kind: "collab", seeking: "Instrumentalist", roleDetail: "Tobe", collabType: "one_event", eventOn: "2026-11-14", county: "Cluj" },
        "ro",
      ),
    ).toBe("Tobe pentru un eveniment, 14 nov. · Cluj");
    expect(buildOpportunityTitle({ kind: "collab", seeking: "Singer", collabType: "permanent", eventOn: "2026-11-14" }, "ro")).toBe(
      "Solist vocal permanent în trupă",
    );
  });

  it("is empty until something is chosen", () => {
    expect(buildOpportunityTitle({ kind: "gig", seeking: null }, "ro")).toBe("");
  });
});

describe("places", () => {
  it("parses the location picker label", () => {
    expect(parseRomanianPlace("Florești, Cluj, Romania")).toEqual({ city: "Florești", county: "Cluj" });
    expect(parseRomanianPlace("București, Romania")).toEqual({ city: null, county: "București" });
    expect(parseRomanianPlace("Cluj-Napoca, Județul Cluj")).toEqual({ city: "Cluj-Napoca", county: "Cluj" });
    expect(parseRomanianPlace("")).toEqual({ city: null, county: null });
  });

  it("formats without repeating", () => {
    expect(formatPlace("Florești", "Cluj")).toBe("Florești, Cluj");
    expect(formatPlace(null, "Cluj")).toBe("Cluj");
    expect(formatPlace("București", "București")).toBe("București");
  });
});

describe("formatOpportunityBudget", () => {
  it("formats ranges and open ends", () => {
    expect(formatOpportunityBudget({ budget_mode: "range", budget_min: 1000, budget_max: 1800, budget_currency: "RON" }, "ro")).toBe(
      "1000 – 1800 RON".replace("1000", (1000).toLocaleString("ro-RO")).replace("1800", (1800).toLocaleString("ro-RO")),
    );
    expect(formatOpportunityBudget({ budget_mode: "range", budget_min: 400, budget_currency: "EUR" }, "ro")).toBe("de la 400 EUR");
    expect(formatOpportunityBudget({ budget_mode: "range", budget_max: "500" }, "en")).toBe("up to 500 RON");
    expect(formatOpportunityBudget({ budget_mode: "range", budget_min: 500, budget_max: 500 }, "en")).toBe("500 RON");
  });

  it("handles negotiable and none", () => {
    expect(formatOpportunityBudget({ budget_mode: "negotiable" }, "ro")).toBe("Negociabil");
    expect(formatOpportunityBudget({ budget_mode: "none" }, "ro")).toBeNull();
    expect(formatOpportunityBudget({}, "ro")).toBeNull();
  });
});

describe("open / expired", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  it("is open until expiry and while status is open", () => {
    expect(isOpportunityOpen({ kind: "gig", status: "open", expires_at: "2026-11-15T00:00:00Z" }, now)).toBe(true);
    expect(isOpportunityOpen({ kind: "gig", status: "filled", expires_at: "2026-11-15T00:00:00Z" }, now)).toBe(false);
    expect(isOpportunityOpen({ kind: "gig", status: "open", expires_at: "2026-10-15T00:00:00Z" }, now)).toBe(false);
    expect(isOpportunityOpen({ kind: null }, now)).toBe(false);
  });

  it("isAdExpired uses expires_at and status for opportunities, the old rule otherwise", () => {
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const longAgo = "2020-01-01";
    expect(isAdExpired({ date: longAgo, is_premium: false, kind: "gig", status: "open", expires_at: future })).toBe(false);
    expect(isAdExpired({ date: longAgo, is_premium: false, kind: "gig", status: "closed", expires_at: future })).toBe(true);
    expect(isAdExpired({ date: longAgo, is_premium: false })).toBe(true);
  });
});

describe("myAvailabilityFor", () => {
  it("reads the artist's own day", () => {
    expect(myAvailabilityFor(null, [], false, "19:00", "03:00")).toBe("available");
    expect(myAvailabilityFor({ status: "blocked" }, [], false)).toBe("blocked");
    expect(myAvailabilityFor({ status: "busy" }, [], true)).toBe("busy");
    const slots = [{ startTime: "12:00", endTime: "15:00" }];
    expect(myAvailabilityFor({ status: "busy" }, slots, false)).toBe("partial");
    expect(myAvailabilityFor({ status: "busy" }, slots, false, "19:00", "03:00")).toBe("available");
    expect(myAvailabilityFor({ status: "busy" }, slots, false, "14:00", "18:00")).toBe("clash");
    // Overnight event only counts its part on this day
    expect(myAvailabilityFor({ status: "busy" }, [{ startTime: "00:00", endTime: "02:00" }], false, "22:00", "03:00")).toBe("available");
  });
});

describe("opportunityErrorText", () => {
  it("maps database codes, longest match first", () => {
    expect(opportunityErrorText({ message: "USER_ANNOUNCEMENT_LIMIT_REACHED" })).toMatch(/5 open announcements/);
    expect(opportunityErrorText({ message: "ANNOUNCEMENT_LIMIT_REACHED" })).toMatch(/all the announcements/);
    expect(opportunityErrorText({ message: "OPPORTUNITY_CLOSED" })).toMatch(/no longer taking offers/);
    expect(opportunityErrorText({ message: "boom" })).toBeNull();
  });
});
