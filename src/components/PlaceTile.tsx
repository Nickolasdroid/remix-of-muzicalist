import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** A country or region in a grid: icon or flag, name, and how many artists are there. */
const PlaceTile = ({ to, icon, name, count, highlight }: { to: string; icon: ReactNode; name: string; count: number; highlight?: ReactNode }) => (
  <Link
    to={to}
    className="flex min-w-0 items-center gap-3 rounded-lg bg-foreground/[0.05] p-3 transition-colors hover:bg-foreground/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:p-4"
  >
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-foreground/[0.07]">{icon}</span>
    <span className="min-w-0">
      <span className="block truncate text-[15px] font-bold text-foreground">{name}</span>
      <span className="block truncate text-sm text-muted-foreground">
        <span className="tabular-nums notranslate" translate="no">{count}</span>{" "}
        <span key={count === 1 ? "one" : "many"}>{count === 1 ? "artist" : "artists"}</span>
        {highlight}
      </span>
    </span>
  </Link>
);

export default PlaceTile;
