// Display helpers for a booking: status chip, date/time line, request message.
import type { BookingOfferFields } from "@/lib/bookingOffers";

export type BookingStatusKey = "pending" | "offered" | "confirmed" | "completed" | "cancelled";

const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const bookingStatusKey = (b: Pick<BookingOfferFields, "status" | "event_date" | "event_end_date">): BookingStatusKey => {
  if (b.status === "pending") return "pending";
  if (b.status === "offered") return "offered";
  if (b.status === "accepted") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseYMD(b.event_end_date || b.event_date) < today ? "completed" : "confirmed";
  }
  return "cancelled";
};

/** English labels — translated by the RO dictionary. */
export const bookingStatusLabel = (k: BookingStatusKey, viewer: "artist" | "requester") => {
  switch (k) {
    case "pending":
      return viewer === "artist" ? "New request" : "Waiting for offer";
    case "offered":
      return viewer === "artist" ? "Offer sent" : "Offer received";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    default:
      return "Cancelled";
  }
};

export type BookingTone = "amber" | "green" | "blue" | "muted";

/**
 * Amber = needs the artist, blue = waiting on the organizer, green = confirmed.
 * Completed and cancelled are closed states, so they stay neutral (never red).
 */
export const bookingStatusTone = (k: BookingStatusKey): BookingTone =>
  k === "pending" ? "amber" : k === "offered" ? "blue" : k === "confirmed" ? "green" : "muted";

/** Status pill colors, shared by the booking cards and the booking details dialog. */
export const BOOKING_TONE_CLASS: Record<BookingTone, string> = {
  amber: "bg-amber-500/15 text-amber-400",
  green: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-sky-500/15 text-sky-400",
  muted: "bg-muted text-muted-foreground",
};

/** Closed bookings (completed / cancelled) sit visually behind the ones that are still open. */
export const isClosedBooking = (k: BookingStatusKey) => k === "completed" || k === "cancelled";

/** Request messages start with "Time: <start> - <end>" — returns the rest. */
export const messageWithoutTime = (message?: string | null) => {
  if (!message) return "";
  if (!message.startsWith("Time:")) return message.trim();
  return message.split("\n").slice(1).join("\n").trim();
};

/** "Time: 30 oct. 2026 19:00 - 31 oct. 2026 05:00" -> { start: "19:00", end: "05:00" } */
export const parseTimes = (message?: string | null): { start: string; end: string } | null => {
  if (!message || !message.startsWith("Time:")) return null;
  const first = message.split("\n")[0];
  const m = first.match(/(\d{1,2}:\d{2})[^\d]*?-\s*.*?(\d{1,2}:\d{2})/);
  return m ? { start: m[1], end: m[2] } : null;
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Date line + time line for the booking.
 * date:   "Vineri, 30 octombrie 2026"
 * time:   "19:00 – 05:00"
 * endsOn: "31 oct." when the event ends on another day (overnight or multi-day)
 */
export const formatBookingWhen = (
  b: Pick<BookingOfferFields, "event_date" | "event_end_date" | "message">,
  lang = "ro"
) => {
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";
  const start = parseYMD(b.event_date);
  const date = capitalize(
    start.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );
  const times = parseTimes(b.message);
  let end: Date | null = null;
  if (b.event_end_date && b.event_end_date !== b.event_date) {
    end = parseYMD(b.event_end_date);
  } else if (times && toMinutes(times.end) <= toMinutes(times.start)) {
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  }
  return {
    date,
    time: times ? `${times.start} – ${times.end}` : null,
    endsOn: end ? end.toLocaleDateString(locale, { day: "numeric", month: "short" }) : null,
  };
};

const PREVIEW_ORDER: Record<BookingStatusKey, number> = { pending: 0, offered: 1, confirmed: 2, completed: 3, cancelled: 4 };

/**
 * Dashboard preview order: requests waiting for the artist first, then open offers and
 * confirmed events (soonest first), then closed ones (most recent first).
 */
export const sortBookingsForPreview = <T extends Pick<BookingOfferFields, "status" | "event_date" | "event_end_date">>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    const ka = bookingStatusKey(a);
    const kb = bookingStatusKey(b);
    if (PREVIEW_ORDER[ka] !== PREVIEW_ORDER[kb]) return PREVIEW_ORDER[ka] - PREVIEW_ORDER[kb];
    const cmp = a.event_date.localeCompare(b.event_date);
    return isClosedBooking(ka) ? -cmp : cmp;
  });
