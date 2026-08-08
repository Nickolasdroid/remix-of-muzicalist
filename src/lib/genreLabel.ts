import { getCurrentLanguage } from "@/i18n";
import { translateGenre, translateGenreList } from "@/lib/musicGenres";

/**
 * Display label for a music genre in the active language.
 * Uses the dedicated genre localization table — never the generic UI
 * translator (which would render "Country" as "Țară").
 */
export const genreLabel = (genre: string | null | undefined): string =>
  genre ? translateGenre(genre, getCurrentLanguage?.() || "en") : "";

/** Display label for a comma-separated genre list (DB storage format). */
export const genreListLabel = (value: string | null | undefined): string =>
  translateGenreList(value, getCurrentLanguage?.() || "en");
