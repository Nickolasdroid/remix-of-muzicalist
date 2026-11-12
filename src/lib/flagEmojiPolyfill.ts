/*
 * Windows doesn't draw flag emoji: 🇷🇴 shows up as the letters "RO". When the browser can
 * draw ordinary emoji but not flags, we load a small font that holds only the flags
 * (Twemoji, CC-BY 4.0, via the MIT "country-flag-emoji-polyfill" by TalkJS) and list it
 * first in our font stacks. Its unicode-range covers only flag characters, so all other
 * text keeps its usual font. Phones and Macs already draw flags and load nothing.
 */
export const FLAG_FONT = "Twemoji Country Flags";

const EMOJI_STACK = '"Twemoji Mozilla","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif';

const drawsInColour = (text: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return true;
  ctx.textBaseline = "top";
  ctx.font = `100px ${EMOJI_STACK}`;
  ctx.scale(0.01, 0.01);
  const sample = (fill: string) => {
    ctx.clearRect(0, 0, 100, 100);
    ctx.fillStyle = fill;
    ctx.fillText(text, 0, 0);
    return ctx.getImageData(0, 0, 1, 1).data.join(",");
  };
  const onWhite = sample("#fff");
  const onBlack = sample("#000");
  return onBlack === onWhite && !onBlack.startsWith("0,0,0,");
};

export function polyfillFlagEmoji() {
  try {
    if (typeof window === "undefined") return;
    if (!drawsInColour("\u{1F60A}") || drawsInColour("\u{1F1F7}\u{1F1F4}")) return;
    const style = document.createElement("style");
    style.textContent = `@font-face {
  font-family: "${FLAG_FONT}";
  unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
  src: url("/fonts/TwemojiCountryFlags.woff2") format("woff2");
  font-display: swap;
}`;
    document.head.appendChild(style);
  } catch {
    /* no canvas: leave flags to the system */
  }
}
