/** Media attached to a post: one item (legacy media_url/media_type) or several photos (media jsonb). */
export interface PostMediaItem {
  url: string;
  type: "image" | "video";
}

export const MAX_POST_PHOTOS = 10;

/** Normalises the stored shape into a list; `media` wins over the legacy single columns. */
export const postMediaItems = (row: {
  media?: unknown;
  media_url?: string | null;
  media_type?: string | null;
}): PostMediaItem[] => {
  if (Array.isArray(row.media)) {
    const items = (row.media as unknown[])
      .map((m) => m as { url?: unknown; type?: unknown })
      .filter((m) => typeof m?.url === "string" && m.url)
      .map((m) => ({ url: m.url as string, type: m.type === "video" ? ("video" as const) : ("image" as const) }));
    if (items.length > 0) return items;
  }
  return row.media_url ? [{ url: row.media_url, type: row.media_type === "video" ? "video" : "image" }] : [];
};
