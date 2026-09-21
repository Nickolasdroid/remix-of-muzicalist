export const ARTIST_CATEGORIES = ["Singer", "Instrumentalist", "DJ", "Band"] as const;

export type ArtistCategory = (typeof ARTIST_CATEGORIES)[number];