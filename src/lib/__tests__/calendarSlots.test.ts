import { describe, expect, it } from "vitest";
import { isDayFullyBooked, parseSlotsFromNotes } from "../calendarSlots";

describe("calendarSlots", () => {
  it("parses every Time line from calendar notes", () => {
    const notes = "Time: 19:00 - 23:59\nBooked by: A\n(Day 1 of 2)\n\n---\n\nTime: 10:00 - 12:00\nBooked by: B";
    expect(parseSlotsFromNotes(notes)).toEqual([
      { startTime: "19:00", endTime: "23:59" },
      { startTime: "10:00", endTime: "12:00" },
    ]);
    expect(parseSlotsFromNotes(null)).toEqual([]);
  });

  it("treats a day with free hours as partially booked", () => {
    expect(isDayFullyBooked([{ startTime: "00:00", endTime: "05:00" }])).toBe(false); // morning after an overnight event
    expect(isDayFullyBooked([{ startTime: "19:00", endTime: "23:59" }])).toBe(false);
  });

  it("treats a covered day (or a busy day without hours) as fully booked", () => {
    expect(isDayFullyBooked([{ startTime: "00:00", endTime: "23:59" }])).toBe(true); // middle day of a festival
    expect(isDayFullyBooked([])).toBe(true);
    expect(isDayFullyBooked([{ startTime: "00:00", endTime: "12:00" }, { startTime: "12:30", endTime: "23:59" }])).toBe(true);
  });
});
