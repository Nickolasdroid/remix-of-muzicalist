// Booked time slots of a calendar day, and whether the day still has free hours.

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Every "Time: HH:MM - HH:MM" entry in calendar notes (entries are separated by ---). */
export const parseSlotsFromNotes = (notes: string | null | undefined): TimeSlot[] => {
  if (!notes) return [];
  const slots: TimeSlot[] = [];
  for (const entry of notes.split(/\n\n---\n\n/)) {
    const m = entry.match(/Time:\s*(?:[\w\s,.]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,.]+\s+)?(\d{1,2}:\d{2})/i);
    if (m) slots.push({ startTime: m[1], endTime: m[2] });
  }
  return slots;
};

/**
 * True when the booked slots leave no free time on the day.
 * A busy day without any slot (booked "all day") counts as fully booked.
 * "23:59" means until midnight; an end before the start runs past midnight (only the
 * part on this day counts).
 */
export const isDayFullyBooked = (slots: TimeSlot[], minimumFreeMinutes = 60): boolean => {
  if (slots.length === 0) return true;
  const ranges = slots
    .map((s) => {
      const start = toMinutes(s.startTime);
      let end = s.endTime === "23:59" ? 24 * 60 : toMinutes(s.endTime);
      if (end <= start) end = 24 * 60;
      return [start, end] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);

  // Largest free gap in the day
  let cursor = 0;
  let largestGap = 0;
  for (const [start, end] of ranges) {
    largestGap = Math.max(largestGap, start - cursor);
    cursor = Math.max(cursor, end);
  }
  largestGap = Math.max(largestGap, 24 * 60 - cursor);
  return largestGap < minimumFreeMinutes;
};
