import { describe, expect, it } from "vitest";
import { bookingStatusKey, bookingStatusLabel, formatBookingWhen, messageWithoutTime, parseTimes } from "../bookingDisplay";

describe("bookingDisplay", () => {
  const msg = "Time: 30 oct. 2026 19:00 - 31 oct. 2026 05:00\nO sa fie in Alba";

  it("parses times from the request message, including dates in between", () => {
    expect(parseTimes(msg)).toEqual({ start: "19:00", end: "05:00" });
    expect(parseTimes("Time: 18:00 - 23:00")).toEqual({ start: "18:00", end: "23:00" });
    expect(parseTimes("Salut")).toBeNull();
  });

  it("strips the time line from the message", () => {
    expect(messageWithoutTime(msg)).toBe("O sa fie in Alba");
    expect(messageWithoutTime("Doar text")).toBe("Doar text");
    expect(messageWithoutTime(null)).toBe("");
  });

  it("formats an overnight event once, with the end day", () => {
    const w = formatBookingWhen({ event_date: "2026-10-30", event_end_date: null, message: msg }, "ro");
    expect(w.date).toBe("Vineri, 30 octombrie 2026");
    expect(w.time).toBe("19:00 – 05:00");
    expect(w.endsOn).toMatch(/31 oct/);
  });

  it("has no end day for a same-day event", () => {
    const w = formatBookingWhen({ event_date: "2026-10-30", event_end_date: null, message: "Time: 18:00 - 23:00" }, "en");
    expect(w.endsOn).toBeNull();
  });

  it("maps statuses per viewer", () => {
    expect(bookingStatusLabel(bookingStatusKey({ status: "pending", event_date: "2099-01-01" }), "artist")).toBe("New request");
    expect(bookingStatusLabel(bookingStatusKey({ status: "offered", event_date: "2099-01-01" }), "requester")).toBe("Offer received");
    expect(bookingStatusKey({ status: "accepted", event_date: "2000-01-01" })).toBe("completed");
    expect(bookingStatusKey({ status: "accepted", event_date: "2099-01-01" })).toBe("confirmed");
    expect(bookingStatusKey({ status: "rejected", event_date: "2099-01-01" })).toBe("cancelled");
  });
});
