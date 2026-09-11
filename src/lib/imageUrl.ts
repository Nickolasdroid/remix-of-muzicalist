/**
 * Helpers for serving appropriately sized Supabase Storage images.
 *
 * Public storage objects are served from:
 *   /storage/v1/object/public/<bucket>/<path>
 * The image transformation endpoint lives at:
 *   /storage/v1/render/image/public/<bucket>/<path>?width=..&height=..&resize=cover&quality=..
 *
 * Only public storage URLs are rewritten. Any other URL (external, signed,
 * data:, blob:) is returned untouched so viewers/lightboxes keep working.
 */

const PUBLIC_OBJECT_SEGMENT = "/storage/v1/object/public/";
const RENDER_SEGMENT = "/storage/v1/render/image/public/";

export function isPublicStorageUrl(url?: string | null): boolean {
  return !!url && url.includes(PUBLIC_OBJECT_SEGMENT);
}

/**
 * Returns a resized variant of a public storage image.
 * `size` is the CSS pixel size of the rendered box; device pixel ratio is
 * applied (capped at 2) so the result stays sharp on retina screens.
 */
export function getThumbUrl(
  url?: string | null,
  size = 320,
  quality = 72
): string | undefined {
  if (!url) return undefined;
  if (!isPublicStorageUrl(url)) return url;

  const dpr =
    typeof window !== "undefined" && window.devicePixelRatio
      ? Math.min(window.devicePixelRatio, 2)
      : 1;
  const px = Math.round(size * dpr);

  const base = url.replace(PUBLIC_OBJECT_SEGMENT, RENDER_SEGMENT);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${px}&height=${px}&resize=cover&quality=${quality}`;
}

/** srcSet with 1x/2x variants for a square thumbnail box of `size` CSS px. */
export function getThumbSrcSet(url?: string | null, size = 320, quality = 72) {
  if (!url || !isPublicStorageUrl(url)) return undefined;
  const one = getThumbUrlAt(url, size, quality);
  const two = getThumbUrlAt(url, size * 2, quality);
  return `${one} 1x, ${two} 2x`;
}

function getThumbUrlAt(url: string, px: number, quality: number) {
  const base = url.replace(PUBLIC_OBJECT_SEGMENT, RENDER_SEGMENT);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}width=${Math.round(px)}&height=${Math.round(
    px
  )}&resize=cover&quality=${quality}`;
}
