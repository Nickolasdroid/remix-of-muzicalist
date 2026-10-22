import { describe, expect, it } from "vitest";
import { findSlotClash, resolveBookingEndDate, timeSlotsOverlap } from "@/components/BookingRequestDialog";

const day = new Date(2026, 9, 29);
const f = (startTime: string, endTime: string, endDate: Date | null = null) => ({ startTime, endTime, endDate });

describe("booking request times", () => {
  it("detects overlaps, including slots past midnight", () => {
    expect(timeSlotsOverlap("00:40", "14:10", "03:40", "14:30")).toBe(true);
    expect(timeSlotsOverlap("15:00", "18:00", "03:40", "14:30")).toBe(false);
    expect(timeSlotsOverlap("22:00", "02:00", "23:00", "23:59")).toBe(true);
  });

  it("ends the next day when the end time is before the start time", () => {
    expect(resolveBookingEndDate(day, f("19:00", "05:00")).getDate()).toBe(30);
    expect(resolveBookingEndDate(day, f("10:00", "12:00")).getDate()).toBe(29);
  });

  it("finds the clashing slot, and ignores the next-day part of an overnight request", () => {
    expect(findSlotClash(day, f("00:40", "14:10"), [{ startTime: "03:40", endTime: "14:30" }])).toEqual({ startTime: "03:40", endTime: "14:30" });
    expect(findSlotClash(day, f("20:00", "02:00"), [{ startTime: "00:00", endTime: "05:00" }])).toBeNull();
    expect(findSlotClash(day, f("15:00", "18:00"), [{ startTime: "03:40", endTime: "14:30" }])).toBeNull();
    expect(findSlotClash(day, f("", ""), [{ startTime: "03:40", endTime: "14:30" }])).toBeNull();
  });
});
