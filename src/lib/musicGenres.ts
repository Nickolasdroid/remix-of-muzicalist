// ---------------------------------------------------------------------------
// Music genres — canonical values + dedicated localization layer.
//
// WHY THIS EXISTS
// The generic UI localization pipeline (static RO dictionary + AI DOM
// translator) translates words by their everyday meaning. That is correct for
// interface copy, but WRONG for music genre names: "Country" became "Țară",
// "Folk" -> "Popor", "Trap" -> "Capcană", "House" -> "Casă", etc.
//
// Music genres are proper nouns of a musical taxonomy. They get:
//   - a canonical English identifier (what is stored in the database — never
//     changed, so existing artist data keeps working), and
//   - an OPTIONAL, intentional per-language label. When no intentional label
//     exists for a language, the canonical English name is displayed as-is.
//
// The generic translator must never touch these strings.
// ---------------------------------------------------------------------------

/** Canonical genre identifiers, ordered by expected popularity first. */
export const PRIORITY_GENRES = [
  "Pop", "Rock", "Jazz", "Manele", "Traditional", "Blues", "Disco", "Hip-Hop",
  "Electronic", "House", "R&B", "Latin", "Trap", "Reggaeton", "Folk", "Country",
] as const;

export const OTHER_GENRES = [
  "Afrobeat", "Amapiano", "Bachata", "Baile Funk", "Bhangra", "Bolero",
  "Bossa Nova", "Cajun", "Calypso", "Celtic", "Chanson", "Classical", "Cumbia",
  "Dance", "Dancehall", "Drill", "Drum and Bass", "Dub", "Dubstep",
  "Easy Listening", "EDM", "Ethno", "Fado", "Flamenco", "Funk", "Garage",
  "Gospel", "Grime", "Grunge", "Highlife", "Indie", "J-Pop", "K-Pop", "Kizomba",
  "Klezmer", "Kompa", "Lo-fi", "Mariachi", "Merengue", "Metal", "Motown",
  "New Wave", "Opera", "Party Music", "Polka", "Progressive Rock", "Punk",
  "Qawwali", "Ranchera", "Reggae", "Rumba", "Salsa", "Samba", "Schlager",
  "Semba", "Ska", "Soca", "Soul", "Synthwave", "Tango", "Techno", "Trance",
  "Turbo-Folk", "Vallenato", "Zouk",
] as const;

/** Single source of truth for every selectable genre. */
export const MUSIC_GENRES: string[] = [
  ...PRIORITY_GENRES,
  ...OTHER_GENRES.filter((g) => !(PRIORITY_GENRES as readonly string[]).includes(g)),
];

export const MAX_GENRES = 5;

/**
 * Intentional genre localizations, keyed by base language code.
 * ONLY add an entry when the localized form is the name actually used by
 * musicians in that language. Anything missing falls back to the canonical
 * English name — that is the desired behaviour, not a gap.
 */
export const GENRE_LOCALIZATIONS: Record<string, Record<string, string>> = {
  ro: {
    // Genres with a real, established Romanian name:
    Classical: "Muzică clasică",
    Traditional: "Muzică populară",
    "Easy Listening": "Muzică de ascultat",
    "Party Music": "Muzică de petrecere",
    Opera: "Operă",
    Celtic: "Celtic",
    // Everything else (Country, Folk, House, Trap, Dance, Garage, Soul,
    // Drill, Dub, Grime, Metal, Punk, Ska...) intentionally stays canonical.
  },
};

const CANONICAL_BY_LOWER = new Map(MUSIC_GENRES.map((g) => [g.toLowerCase(), g]));

/** True when the given text is one of our canonical genre names. */
export const isMusicGenre = (text: string): boolean =>
  CANONICAL_BY_LOWER.has((text || "").trim().toLowerCase());

/** Normalizes any stored value back to its canonical spelling (data-safe). */
export const canonicalGenre = (text: string): string =>
  CANONICAL_BY_LOWER.get((text || "").trim().toLowerCase()) || (text || "").trim();

const baseLang = (lang: string | null | undefined) => (lang || "en").split("-")[0].toLowerCase();

/**
 * Localized display label for a genre.
 * Returns the intentional translation when one is defined for the language,
 * otherwise the canonical English name. NEVER a generic word translation.
 */
export const translateGenre = (genre: string, lang: string): string => {
  const canonical = canonicalGenre(genre);
  if (!canonical) return "";
  return GENRE_LOCALIZATIONS[baseLang(lang)]?.[canonical] || canonical;
};

/** Localizes a comma-separated genre string (the DB storage format). */
export const translateGenreList = (value: string | null | undefined, lang: string): string =>
  (value || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => translateGenre(g, lang))
    .join(", ");

/**
 * Hook used by the generic i18n pipeline: given an arbitrary UI string,
 * returns the genre-aware label when the string is a genre, else undefined
 * (meaning: let the normal translator handle it).
 */
export const getGenreTranslation = (text: string, lang: string): string | undefined => {
  const trimmed = (text || "").trim();
  if (!isMusicGenre(trimmed)) return undefined;
  return translateGenre(trimmed, lang);
};
