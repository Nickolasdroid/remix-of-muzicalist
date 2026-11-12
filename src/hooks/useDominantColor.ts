import { useEffect, useState } from "react";

/** Spotify's grey for artists without a usable photo. */
export const DEFAULT_HEADER_COLOR = "rgb(83, 83, 83)";

// Remembered between visits, so a profile opens straight in its colour
const STORE = "mz_header_colors";
const cache = new Map<string, string>(
  (() => {
    try {
      return Object.entries(JSON.parse(localStorage.getItem(STORE) || "{}")) as [string, string][];
    } catch {
      return [];
    }
  })(),
);
const remember = (url: string, c: string) => {
  cache.set(url, c);
  try {
    const entries = [...cache].slice(-150);
    localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* storage full or blocked: memory only */
  }
};

/**
 * The main colour of a photo, toned so white text stays readable on it (like the colour
 * behind an artist's name on Spotify). Falls back to grey when the photo can't be read.
 */
export function useDominantColor(url?: string | null): string {
  const [color, setColor] = useState(() => (url && cache.get(url)) || DEFAULT_HEADER_COLOR);

  useEffect(() => {
    if (!url) {
      setColor(DEFAULT_HEADER_COLOR);
      return;
    }
    const known = cache.get(url);
    if (known) {
      setColor(known);
      return;
    }
    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        // Average the pixels, giving colourful ones more say than greys, blacks and whites
        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
          const light = (max + min) / 2;
          if (light < 20 || light > 235) continue;
          const w = 1 + ((max - min) / 255) * 6;
          r += pr * w; g += pg * w; b += pb * w; total += w;
        }
        if (!total) return;
        r /= total; g /= total; b /= total;
        // Keep it in a mid-dark range so white text reads well on top
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const k = lum > 110 ? 110 / lum : lum < 60 ? 60 / Math.max(lum, 1) : 1;
        const c = `rgb(${Math.round(Math.min(255, r * k))}, ${Math.round(Math.min(255, g * k))}, ${Math.round(Math.min(255, b * k))})`;
        remember(url, c);
        if (active) setColor(c);
      } catch {
        /* the photo's server doesn't allow reading it: keep the grey */
      }
    };
    img.src = url;
    return () => {
      active = false;
    };
  }, [url]);

  return color;
}
