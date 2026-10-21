import { describe, expect, it, vi, afterEach } from "vitest";
import {
  extractTimeInterval,
  formatMoney,
  offerErrorText,
  printBookingConfirmation,
  type BookingOfferFields,
} from "../bookingOffers";

const booking: BookingOfferFields = {
  id: "b1c2d3e4-0000-0000-0000-000000000000",
  profile_id: "artist",
  requester_name: "Ion <Pop>",
  event_date: "2026-11-14",
  event_end_date: "2026-11-15",
  event_type: "Wedding",
  message: "Time: 18:00 - 23:00\nMuzică populară",
  status: "accepted",
  offer_price: "2500.00",
  offer_currency: "RON",
  offer_note: "4 ore, sonorizare inclusă",
  confirmed_at: "2026-10-21T19:00:00Z",
};

describe("bookingOffers helpers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("formats money with the offer currency", () => {
    expect(formatMoney(2500, "RON", "ro")).toMatch(/2\.500\s*RON|2500\s*RON|2\.500\s*lei/i);
    expect(formatMoney("99.5", "EUR", "en")).toContain("99.50");
    expect(formatMoney(null, "RON")).toBe("—");
  });

  it("extracts the time interval from the request message", () => {
    expect(extractTimeInterval(booking.message)).toBe("18:00 - 23:00");
    expect(extractTimeInterval("Hello")).toBeNull();
    expect(extractTimeInterval(null)).toBeNull();
  });

  it("maps database error codes to readable messages", () => {
    expect(offerErrorText({ message: "BOOKING_DATE_PASSED" })).toBe("The event date has already passed.");
    expect(offerErrorText({ message: "boom" })).toBe("Something went wrong. Please try again.");
  });

  it("writes an escaped, Romanian confirmation into a new window", () => {
    let html = "";
    const doc = { open: vi.fn(), write: (h: string) => (html = h), close: vi.fn() };
    vi.stubGlobal("window", { open: vi.fn(() => ({ document: doc })) });

    expect(printBookingConfirmation(booking, "DJ Test", "ro")).toBe(true);
    expect(html).toContain("Confirmare de rezervare");
    expect(html).toContain("B1C2D3E4");
    expect(html).toContain("Ion &lt;Pop&gt;");
    expect(html).not.toContain("Ion <Pop>");
    expect(html).toContain("18:00 - 23:00");
    expect(html).toContain("până la");
    expect(html).toContain("Nu ține loc de contract");
  });

  it("returns false when the pop-up is blocked", () => {
    vi.stubGlobal("window", { open: vi.fn(() => null) });
    expect(printBookingConfirmation(booking, "DJ Test", "en")).toBe(false);
  });
});
