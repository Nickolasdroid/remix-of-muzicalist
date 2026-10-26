// Opportunities: structured announcements.
//   gig    - "Looking for an artist for an event" (organizers and artists). Artists answer with a priced offer.
//   collab - "Looking for a collaborator" (artists only). Answered by message.
// Validation, expiry and quotas live in the database (validate_opportunity, enforce_announcement_quota,
// send_announcement_offer); these helpers only build, format and explain.

import { eventTypeRo, isKnownEventType } from "@/lib/eventTypes";

export type OpportunityKind = "gig" | "collab";
export type OpportunitySeeking = "DJ" | "Band" | "Singer" | "Instrumentalist" | "MC";
export type CollabType = "one_event" | "replacement" | "permanent";
export type BudgetMode = "range" | "negotiable" | "none";
export type OpportunityStatus = "open" | "filled" | "closed";

/** What an organizer can look for. MC is only offered for collaborations. */
export const GIG_SEEKING: OpportunitySeeking[] = ["DJ", "Band", "Singer", "Instrumentalist"];
export const COLLAB_SEEKING: OpportunitySeeking[] = ["DJ", "Singer", "Instrumentalist", "MC"];
export const COLLAB_TYPES: CollabType[] = ["one_event", "replacement", "permanent"];

/** English UI labels (translated by the RO dictionary on screen). */
export const SEEKING_LABEL: Record<OpportunitySeeking, string> = {
  DJ: "DJ",
  Band: "Band",
  Singer: "Singer",
  Instrumentalist: "Instrumentalist",
  MC: "MC / Host",
};

export const COLLAB_TYPE_LABEL: Record<CollabType, string> = {
  one_event: "One event",
  replacement: "Stand-in",
  permanent: "Join the band",
};

const SEEKING_RO: Record<OpportunitySeeking, string> = {
  DJ: "DJ",
  Band: "Formație",
  Singer: "Solist vocal",
  Instrumentalist: "Instrumentist",
  MC: "MC / Prezentator",
};

/** Romanian/English label by language, for text stored with the announcement (the title). */
export const seekingLabel = (s: OpportunitySeeking, lang: string) => (isRo(lang) ? SEEKING_RO[s] : SEEKING_LABEL[s]);

const isRo = (lang: string) => (lang || "ro").toLowerCase().startsWith("ro");

/** "Nuntă" -> "nuntă" mid-sentence; keeps acronyms like "TV / Film" as they are. */
const lowerFirst = (s: string) =>
  s.length > 1 && s[1] === s[1].toLowerCase() && s[1] !== s[1].toUpperCase() ? s[0].toLowerCase() + s.slice(1) : s;

const shortDate = (ymd: string, lang: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isRo(lang) ? "ro-RO" : "en-GB", { day: "numeric", month: "short" });
};

export interface OpportunityTitleInput {
  kind: OpportunityKind;
  seeking: OpportunitySeeking | null;
  roleDetail?: string | null;
  eventType?: string | null;
  city?: string | null;
  county?: string | null;
  eventOn?: string | null;
  collabType?: CollabType | null;
}

/**
 * Suggested title, in the language the author writes in. The author can edit it.
 *   gig:    "DJ pentru nuntă în Florești" / "DJ for a wedding in Florești"
 *   collab: "Tobe pentru un eveniment, 14 nov." / "Drums for one event, 14 Nov"
 */
export const buildOpportunityTitle = (o: OpportunityTitleInput, lang = "ro"): string => {
  if (!o.seeking) return "";
  const ro = isRo(lang);
  const role = (o.roleDetail || "").trim() || seekingLabel(o.seeking, lang);
  const place = (o.city || "").trim() || (o.county || "").trim();

  if (o.kind === "gig") {
    const type = (o.eventType || "").trim();
    let title = role;
    if (type) {
      const typeText = ro ? eventTypeRo(type) : type;
      if (ro) title += ` pentru ${lowerFirst(typeText)}`;
      else title += ` for ${isKnownEventType(type) ? `a ${lowerFirst(typeText)}` : typeText}`;
    }
    if (place) title += ro ? ` în ${place}` : ` in ${place}`;
    return title.slice(0, 120);
  }

  const date = o.eventOn ? shortDate(o.eventOn, lang) : "";
  let title = role;
  switch (o.collabType) {
    case "replacement":
      title += ro ? " pentru o înlocuire" : " for a stand-in";
      break;
    case "permanent":
      title += ro ? " permanent în trupă" : " to join the band";
      break;
    default:
      title += ro ? " pentru un eveniment" : " for one event";
  }
  if (date && o.collabType !== "permanent") title += `, ${date}`;
  if (place) title += ro ? ` · ${place}` : ` · ${place}`;
  return title.slice(0, 120);
};

/** "Florești, Cluj, Romania" (LocationAutocomplete label) -> { city, county } */
export const parseRomanianPlace = (label: string): { city: string | null; county: string | null } => {
  const parts = label
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 1 && /^(romania|românia)$/i.test(parts[parts.length - 1])) parts.pop();
  const clean = (s: string) => s.replace(/^jude[țţt]ul\s+/i, "").replace(/\s+county$/i, "").trim();
  if (parts.length === 0) return { city: null, county: null };
  if (parts.length === 1) return { city: null, county: clean(parts[0]) };
  const city = parts[0];
  const county = clean(parts[1]);
  return { city: city === county ? null : city, county };
};

/** "Florești, Cluj" / "Cluj" */
export const formatPlace = (city?: string | null, county?: string | null) =>
  [city, county].map((s) => (s || "").trim()).filter((s, i, arr) => s && arr.indexOf(s) === i).join(", ");

export interface OpportunityBudget {
  budget_mode?: BudgetMode | string | null;
  budget_min?: number | string | null;
  budget_max?: number | string | null;
  budget_currency?: string | null;
}

const fmtAmount = (n: number, lang: string) =>
  new Intl.NumberFormat(isRo(lang) ? "ro-RO" : "en-GB", { maximumFractionDigits: 0 }).format(n);

/**
 * "1.000 – 1.800 RON", "de la 1.000 RON" / "from 1,000 RON", "până la 1.800 RON" / "up to 1,800 RON",
 * "Negociabil" / "Negotiable", or null when there is no budget.
 */
export const formatOpportunityBudget = (b: OpportunityBudget, lang = "ro"): string | null => {
  const ro = isRo(lang);
  if (b.budget_mode === "negotiable") return ro ? "Negociabil" : "Negotiable";
  if (b.budget_mode !== "range") return null;
  const cur = b.budget_currency || "RON";
  const min = b.budget_min != null && b.budget_min !== "" ? Number(b.budget_min) : null;
  const max = b.budget_max != null && b.budget_max !== "" ? Number(b.budget_max) : null;
  if (min != null && max != null) {
    return min === max ? `${fmtAmount(min, lang)} ${cur}` : `${fmtAmount(min, lang)} – ${fmtAmount(max, lang)} ${cur}`;
  }
  if (min != null) return ro ? `de la ${fmtAmount(min, lang)} ${cur}` : `from ${fmtAmount(min, lang)} ${cur}`;
  if (max != null) return ro ? `până la ${fmtAmount(max, lang)} ${cur}` : `up to ${fmtAmount(max, lang)} ${cur}`;
  return null;
};

export interface OpportunityRow {
  kind?: OpportunityKind | string | null;
  status?: OpportunityStatus | string | null;
  expires_at?: string | null;
}

export const isOpportunity = (a: OpportunityRow) => a.kind === "gig" || a.kind === "collab";

/** Still taking answers: open and not past its expiry. */
export const isOpportunityOpen = (a: OpportunityRow, now = new Date()) =>
  isOpportunity(a) && (a.status || "open") === "open" && (!a.expires_at || new Date(a.expires_at) > now);

/** Whole days until a new-style announcement expires (0 when it has). */
export const opportunityDaysLeft = (a: OpportunityRow, now = new Date()) => {
  if (!a.expires_at) return 0;
  return Math.max(0, Math.ceil((new Date(a.expires_at).getTime() - now.getTime()) / 86_400_000));
};

const ERROR_TEXT: Record<string, string> = {
  OPPORTUNITY_TITLE_REQUIRED: "Add a title of at least 3 characters.",
  OPPORTUNITY_FIELDS_REQUIRED: "Fill in the required fields.",
  OPPORTUNITY_DATE_PASSED: "The event date has already passed.",
  OPPORTUNITY_BUDGET_INVALID: "The minimum budget can't be higher than the maximum.",
  OPPORTUNITY_COLLAB_ARTISTS_ONLY: "Only artists can look for collaborators.",
  USER_ANNOUNCEMENT_GIG_ONLY: "Only artists can look for collaborators.",
  USER_ANNOUNCEMENT_TEXT_ONLY: "Announcements from organizers can't include photos or videos.",
  USER_ANNOUNCEMENT_LIMIT_REACHED: "You already have 5 open announcements. Close one or wait for an event to pass.",
  ANNOUNCEMENT_PLAN_REQUIRED: "Announcements are available on the Standard and Premium plans.",
  ANNOUNCEMENT_LIMIT_REACHED: "You have used all the announcements in your plan for this period.",
  OPPORTUNITY_ARTISTS_ONLY: "Only artists can send offers.",
  OPPORTUNITY_NOT_FOUND: "This announcement could not be found.",
  OPPORTUNITY_OWN: "You can't send an offer to your own announcement.",
  OPPORTUNITY_CLOSED: "This announcement is no longer taking offers.",
  OPPORTUNITY_ALREADY_ANSWERED: "You have already answered this announcement.",
};

/** Maps a database error to a user-facing English sentence (translated by the RO dictionary). */
export const opportunityErrorText = (error: unknown): string | null => {
  const msg = (error as { message?: string } | null)?.message ?? "";
  const code = Object.keys(ERROR_TEXT)
    .sort((a, b) => b.length - a.length)
    .find((k) => msg.includes(k));
  return code ? ERROR_TEXT[code] : null;
};

/** Max open event announcements an organizer can have at the same time (enforced by the database). */
export const ORGANIZER_OPEN_LIMIT = 5;

export type MyAvailability = "available" | "partial" | "clash" | "busy" | "blocked";

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (s1: string, e1: string, s2: string, e2: string) => {
  const a1 = toMin(s1);
  let b1 = toMin(e1);
  const a2 = toMin(s2);
  let b2 = toMin(e2);
  if (b1 <= a1) b1 += 24 * 60;
  if (b2 <= a2) b2 += 24 * 60;
  return a1 < b2 && b1 > a2;
};

/**
 * The artist's own calendar for the event day, compared with the announcement:
 *   blocked - the artist marked the day unavailable
 *   busy    - booked the whole day
 *   clash   - booked at the announced time
 *   partial - some hours booked, no time given in the announcement
 *   available
 */
export const myAvailabilityFor = (
  day: { status?: string | null; notes?: string | null } | null | undefined,
  slots: { startTime: string; endTime: string }[],
  fullyBooked: boolean,
  startTime?: string | null,
  endTime?: string | null,
): MyAvailability => {
  if (!day) return "available";
  if (day.status === "blocked" || day.status === "unavailable") return "blocked";
  if (day.status !== "busy" && day.status !== "booked") return "available";
  if (fullyBooked) return "busy";
  if (startTime && endTime) {
    // Only the part of the event on this day can clash with this day's bookings
    const end = toMin(endTime) <= toMin(startTime) ? "23:59" : endTime;
    return slots.some((s) => overlaps(startTime, end, s.startTime, s.endTime)) ? "clash" : "available";
  }
  return "partial";
};
