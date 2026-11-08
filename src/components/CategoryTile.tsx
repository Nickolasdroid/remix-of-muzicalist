import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import singerImg from "@/assets/singer-silhouette.png";
import instrumentalistImg from "@/assets/instrumentalist-silhouette.png";
import djImg from "@/assets/dj-silhouette.png";
import bandImg from "@/assets/band-silhouette.png";

export type ArtistCategoryValue = "Singer" | "Instrumentalist" | "DJ" | "Band";

/** The four artist types: label key, list page, tile color and silhouette (Spotify "Browse all" style). */
export const CATEGORY_TILES: { value: ArtistCategoryValue; statKey: string; path: string; color: string; img: string }[] = [
  { value: "Singer", statKey: "singers", path: "/categories/Singers", color: "#B3261E", img: singerImg },
  { value: "Instrumentalist", statKey: "instrumentalists", path: "/categories/Instrumentalists", color: "#1E4D8C", img: instrumentalistImg },
  { value: "DJ", statKey: "djs", path: "/categories/DJs", color: "#6A2FB5", img: djImg },
  { value: "Band", statKey: "bands", path: "/categories/Bands", color: "#1F7A5C", img: bandImg },
];

/** A colored category tile: name top left, artist count under it, silhouette tilted in the corner. */
const CategoryTile = ({ tile, href, count }: { tile: (typeof CATEGORY_TILES)[number]; href?: string; count?: number }) => {
  const { t } = useTranslation();
  return (
    <Link
      to={href ?? tile.path}
      className="relative block aspect-[16/10] overflow-hidden rounded-lg p-4 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:p-5"
      style={{ backgroundColor: tile.color }}
    >
      <span className="relative z-10 block text-lg font-bold text-white md:text-2xl">{t(`platformStats.${tile.statKey}`)}</span>
      {count !== undefined && (
        <span className="relative z-10 mt-0.5 block text-sm font-medium text-white/80 tabular-nums">
          {count} <span>{count === 1 ? "artist" : "artists"}</span>
        </span>
      )}
      <img src={tile.img} alt="" loading="lazy" decoding="async" className="absolute -bottom-3 -right-5 h-[78%] rotate-[25deg] object-contain opacity-90" />
    </Link>
  );
};

export default CategoryTile;
