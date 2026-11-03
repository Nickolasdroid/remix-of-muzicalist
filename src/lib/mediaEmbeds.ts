/**
 * Recognises music/video links in post text so they can be shown as a player.
 * Supported: YouTube (incl. Shorts, YouTube Music), Spotify, SoundCloud.
 */

export type MediaEmbed =
  | { provider: "youtube"; id: string; url: string; start?: number }
  | { provider: "spotify"; kind: "track" | "album" | "playlist" | "episode" | "show" | "artist"; id: string; url: string }
  | { provider: "soundcloud"; url: string };

const LINK = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*(?:youtube\.com|youtu\.be|spotify\.com|soundcloud\.com)\/[^\s<>"']*/gi;

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

const parseStart = (t: string | null): number | undefined => {
  if (!t) return undefined;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return undefined;
  const s = Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
  return s > 0 ? s : undefined;
};

export const parseEmbedUrl = (raw: string): MediaEmbed | null => {
  const cleaned = raw.replace(/[.,;:!?)\]]+$/, "");
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = parts[0];
    return id && YT_ID.test(id) ? { provider: "youtube", id, url: cleaned, start: parseStart(u.searchParams.get("t")) } : null;
  }
  if (host === "youtube.com") {
    let id: string | null = null;
    if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) id = parts[1] ?? null;
    return id && YT_ID.test(id) ? { provider: "youtube", id, url: cleaned, start: parseStart(u.searchParams.get("t")) } : null;
  }
  if (host === "open.spotify.com") {
    const p = parts[0]?.startsWith("intl-") ? parts.slice(1) : parts;
    const id = p[1];
    if (["track", "album", "playlist", "episode", "show", "artist"].includes(p[0]) && id && /^[A-Za-z0-9]{10,40}$/.test(id)) {
      return { provider: "spotify", kind: p[0] as "track", id, url: cleaned };
    }
    return null;
  }
  if (host === "soundcloud.com" && parts.length >= 2 && !["discover", "search", "you", "stream"].includes(parts[0])) {
    return { provider: "soundcloud", url: `https://soundcloud.com/${parts.join("/")}` };
  }
  return null;
};

/** First playable link in the text, if any. */
export const findEmbed = (text?: string | null): MediaEmbed | null => {
  if (!text) return null;
  for (const m of text.matchAll(LINK)) {
    const e = parseEmbedUrl(m[0]);
    if (e) return e;
  }
  return null;
};

export const embedSrc = (e: MediaEmbed, autoplay = false): string => {
  if (e.provider === "youtube") {
    const q = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
    if (autoplay) q.set("autoplay", "1");
    if (e.start) q.set("start", String(e.start));
    return `https://www.youtube-nocookie.com/embed/${e.id}?${q}`;
  }
  if (e.provider === "spotify") return `https://open.spotify.com/embed/${e.kind}/${e.id}?utm_source=muzicalist`;
  return `https://w.soundcloud.com/player/?${new URLSearchParams({ url: e.url, color: "#e5b53a", auto_play: autoplay ? "true" : "false", visual: "false", show_comments: "false", show_teaser: "false" })}`;
};

/** Player height in px for audio embeds (YouTube uses 16:9). */
export const embedHeight = (e: MediaEmbed): number =>
  e.provider === "spotify" ? (e.kind === "track" || e.kind === "episode" ? 152 : 352) : 166;
