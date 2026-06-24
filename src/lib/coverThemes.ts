// Gradient themes available for artist profile covers when no cover image is set.

export interface CoverTheme {
  id: string;
  label: string;
  gradient: string; // CSS background value
}

export const COVER_THEMES: CoverTheme[] = [
  {
    id: "gold-burgundy",
    label: "Aurora",
    gradient: "linear-gradient(135deg, #D4AF37 0%, #8B1A1A 50%, #1a0a0a 100%)",
  },
  {
    id: "midnight-blue",
    label: "Midnight",
    gradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  },
  {
    id: "sunset",
    label: "Sunset",
    gradient: "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
  },
  {
    id: "violet-dream",
    label: "Violet",
    gradient: "linear-gradient(135deg, #2c003e 0%, #5b1378 50%, #ff61a6 100%)",
  },
  {
    id: "emerald",
    label: "Emerald",
    gradient: "linear-gradient(135deg, #0f3443 0%, #34e89e 100%)",
  },
  {
    id: "peach",
    label: "Peach",
    gradient: "linear-gradient(135deg, #ED4264 0%, #FFEDBC 100%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)",
  },
  {
    id: "fire",
    label: "Fire",
    gradient: "linear-gradient(135deg, #200122 0%, #6f0000 100%)",
  },
  {
    id: "neon",
    label: "Neon",
    gradient: "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
  },
  {
    id: "graphite-gold",
    label: "Graphite",
    gradient: "linear-gradient(135deg, #232526 0%, #414345 60%, #D4AF37 100%)",
  },
];

export const DEFAULT_COVER_GRADIENT =
  "linear-gradient(135deg, hsl(var(--accent) / 0.3) 0%, hsl(var(--card)) 50%, hsl(var(--secondary)) 100%)";

export const getCoverGradient = (themeId?: string | null): string => {
  if (!themeId) return DEFAULT_COVER_GRADIENT;
  const found = COVER_THEMES.find((t) => t.id === themeId);
  return found?.gradient ?? DEFAULT_COVER_GRADIENT;
};
