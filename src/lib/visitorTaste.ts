/**
 * What a visitor has shown interest in on this device (artist profiles opened,
 * categories browsed), used to order "Recommended artists" on the home page.
 * Kept only in localStorage; nothing is sent to the server.
 */

const KEY = "mz_taste";
const MAX_EVENTS = 40;

interface TasteEvent {
  s?: string | null; // specialization
  c?: string | null; // county
  g?: string[]; // genres
  w: number; // weight
}

const read = (): TasteEvent[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const push = (e: TasteEvent) => {
  try {
    const list = [...read(), e].slice(-MAX_EVENTS);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: no personalization */
  }
};

export const splitGenres = (genres?: string | null): string[] =>
  (genres || "")
    .split(",")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);

/** An artist profile was opened. */
export const recordArtistInterest = (a: { specialization?: string | null; county?: string | null; music_genres?: string | null }) => {
  if (!a.specialization) return;
  push({ s: a.specialization, c: a.county || null, g: splitGenres(a.music_genres), w: 1 });
};

/** A category (Singer / Instrumentalist / DJ / Band) was browsed. */
export const recordCategoryInterest = (specialization: string) => {
  push({ s: specialization, w: 0.5 });
};

export interface Taste {
  spec: Record<string, number>;
  county: Record<string, number>;
  genre: Record<string, number>;
  empty: boolean;
}

export const getTaste = (): Taste => {
  const t: Taste = { spec: {}, county: {}, genre: {}, empty: true };
  const list = read();
  // Newer interest counts more than older interest
  list.forEach((e, i) => {
    const w = e.w * (0.5 + (0.5 * (i + 1)) / list.length);
    if (e.s) t.spec[e.s] = (t.spec[e.s] || 0) + w;
    if (e.c) t.county[e.c] = (t.county[e.c] || 0) + w;
    (e.g || []).forEach((g) => (t.genre[g] = (t.genre[g] || 0) + w));
  });
  t.empty = list.length === 0;
  return t;
};

/** How well an artist matches the visitor's interests (0 = no signal). */
export const tasteScore = (
  t: Taste,
  a: { specialization?: string | null; county?: string | null; music_genres?: string | null },
): number => {
  if (t.empty) return 0;
  let s = 0;
  if (a.specialization) s += (t.spec[a.specialization] || 0) * 3;
  if (a.county) s += (t.county[a.county] || 0) * 2;
  splitGenres(a.music_genres).forEach((g) => (s += t.genre[g] || 0));
  return s;
};
