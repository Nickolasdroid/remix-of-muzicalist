// Is an artist still free on a day (and in a time interval)? Used by "I'm available" posts.
import { supabase } from "@/integrations/supabase/client";
import { isDayFullyBooked, type TimeSlot } from "@/lib/calendarSlots";

export interface CalendarDay {
  status: string;
  slots: TimeSlot[];
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Same-day overlap; an end at or before the start runs past midnight. */
const overlaps = (s1: string, e1: string, s2: string, e2: string) => {
  const a = toMinutes(s1);
  let b = toMinutes(e1);
  const c = toMinutes(s2);
  let d = toMinutes(e2);
  if (b <= a) b += 24 * 60;
  if (d <= c) d += 24 * 60;
  return a < d && b > c;
};

const isBusy = (s: string) => s === "booked" || s === "busy";
const isBlocked = (s: string) => s === "blocked" || s === "unavailable";

/**
 * "free" when the artist can still take a booking then; "taken" when the day is blocked,
 * fully booked, or (with an interval) a booking overlaps it.
 */
export const availabilityState = (day: CalendarDay | undefined, from?: string | null, until?: string | null): "free" | "taken" => {
  if (!day) return "free";
  if (isBlocked(day.status)) return "taken";
  if (!isBusy(day.status)) return "free";
  if (day.slots.length === 0) return "taken"; // booked for the whole day
  if (from && until) return day.slots.some((s) => overlaps(from, until, s.startTime, s.endTime)) ? "taken" : "free";
  return isDayFullyBooked(day.slots) ? "taken" : "free";
};

/** Days that can't be picked at all for an availability post. */
export const isDayUnpickable = (day: CalendarDay | undefined) =>
  !!day && (isBlocked(day.status) || (isBusy(day.status) && (day.slots.length === 0 || isDayFullyBooked(day.slots))));

/** The booking that overlaps an interval, if any (for a warning in the composer). */
export const clashingSlot = (day: CalendarDay | undefined, from: string, until: string) =>
  day && isBusy(day.status) ? day.slots.find((s) => overlaps(from, until, s.startTime, s.endTime)) ?? null : null;

// One request per artist for every availability post in view (cached for a minute)
const cache = new Map<string, { at: number; data: Promise<Map<string, CalendarDay>> }>();

export const fetchPublicCalendar = (profileId: string): Promise<Map<string, CalendarDay>> => {
  const hit = cache.get(profileId);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;
  const data = (async () => {
    const { data: rows, error } = await (supabase as any).rpc("get_public_calendar", { _profile_id: profileId });
    const map = new Map<string, CalendarDay>();
    if (error) return map;
    for (const r of (rows as { event_date: string; status: string; slots?: TimeSlot[] }[]) || []) {
      map.set(r.event_date, { status: r.status, slots: Array.isArray(r.slots) ? r.slots : [] });
    }
    return map;
  })();
  cache.set(profileId, { at: Date.now(), data });
  return data;
};

/** "18:00–02:00"; "23:59" is stored for midnight. */
export const formatInterval = (from?: string | null, until?: string | null) =>
  from && until ? `${from.slice(0, 5)}–${until.slice(0, 5) === "23:59" ? "00:00" : until.slice(0, 5)}` : null;
