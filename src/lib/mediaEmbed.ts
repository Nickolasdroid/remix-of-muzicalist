/**
 * Media embed helpers for external streaming providers:
 * YouTube, SoundCloud, Spotify.
 *
 * We never re-host the media — only store the public URL the artist provides
 * and convert it to an embed URL at render time. This keeps storage costs
 * close to zero for video/audio portfolio content.
 */

export type EmbedProvider = "youtube" | "soundcloud" | "spotify" | "vimeo" | "direct";

export interface EmbedInfo {
  provider: EmbedProvider;
  /** URL safe to put inside an <iframe src> (or a <video src> for "direct"). */
  embedUrl: string;
  /** Optional thumbnail URL (currently only YouTube and Vimeo expose one easily). */
  thumbnail?: string;
  /** Best aspect ratio for the player. */
  aspect: "video" | "square" | "audio";
  /** Original URL the user pasted. */
  originalUrl: string;
}

const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"];
const SC_HOSTS = ["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com", "on.soundcloud.com"];
const SP_HOSTS = ["open.spotify.com", "spotify.com", "www.spotify.com"];
const VM_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];

function safeUrl(input: string): URL | null {
  try {
    return new URL(input.trim());
  } catch {
    return null;
  }
}

export function detectProvider(url: string): EmbedProvider | null {
  const u = safeUrl(url);
  if (!u) return null;
  const host = u.hostname.toLowerCase();
  if (YT_HOSTS.includes(host)) return "youtube";
  if (SC_HOSTS.includes(host)) return "soundcloud";
  if (SP_HOSTS.includes(host)) return "spotify";
  if (VM_HOSTS.includes(host)) return "vimeo";
  // Anything else we treat as a direct file (mp4/webm/etc.) — including our
  // own Supabase Storage URLs created by legacy uploads.
  return "direct";
}

function youtubeId(u: URL): string | null {
  const host = u.hostname.toLowerCase();
  if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
  if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
  if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
  if (u.pathname.startsWith("/live/")) return u.pathname.split("/")[2] || null;
  return null;
}

function vimeoId(u: URL): string | null {
  const seg = u.pathname.split("/").filter(Boolean);
  if (u.hostname === "player.vimeo.com" && seg[0] === "video") return seg[1] || null;
  // vimeo.com/123456789 or vimeo.com/channels/foo/123456789
  for (let i = seg.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(seg[i])) return seg[i];
  }
  return null;
}

export function getEmbedInfo(url: string): EmbedInfo | null {
  const provider = detectProvider(url);
  if (!provider) return null;
  const u = safeUrl(url);
  if (!u) return null;

  if (provider === "youtube") {
    const id = youtubeId(u);
    if (!id) return null;
    return {
      provider,
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      aspect: "video",
      originalUrl: url,
    };
  }

  if (provider === "vimeo") {
    const id = vimeoId(u);
    if (!id) return null;
    return {
      provider,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      aspect: "video",
      originalUrl: url,
    };
  }

  if (provider === "soundcloud") {
    // SoundCloud's widget accepts the original URL as a parameter.
    const widget = new URL("https://w.soundcloud.com/player/");
    widget.searchParams.set("url", url);
    widget.searchParams.set("color", "#ff5500");
    widget.searchParams.set("auto_play", "false");
    widget.searchParams.set("hide_related", "true");
    widget.searchParams.set("show_comments", "false");
    widget.searchParams.set("show_user", "true");
    widget.searchParams.set("show_reposts", "false");
    widget.searchParams.set("visual", "true");
    return {
      provider,
      embedUrl: widget.toString(),
      aspect: "audio",
      originalUrl: url,
    };
  }

  if (provider === "spotify") {
    // Convert https://open.spotify.com/<type>/<id> -> /embed/<type>/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    // Strip optional locale prefix like /intl-en/
    const start = parts[0]?.startsWith("intl-") ? 1 : 0;
    const type = parts[start];
    const id = parts[start + 1]?.split("?")[0];
    if (!type || !id) return null;
    return {
      provider,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=oembed`,
      aspect: type === "episode" || type === "show" ? "audio" : "audio",
      originalUrl: url,
    };
  }

  // direct file
  return {
    provider: "direct",
    embedUrl: url,
    aspect: "video",
    originalUrl: url,
  };
}

const SUPPORTED_LABEL: Record<EmbedProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  direct: "Direct link",
};

export function providerLabel(p: EmbedProvider): string {
  return SUPPORTED_LABEL[p];
}

/**
 * Returns true when the URL is a valid external embed (YouTube / SoundCloud /
 * Spotify / Vimeo). Used to validate user input.
 */
export function isSupportedEmbed(url: string): boolean {
  const info = getEmbedInfo(url);
  if (!info) return false;
  return info.provider !== "direct";
}
