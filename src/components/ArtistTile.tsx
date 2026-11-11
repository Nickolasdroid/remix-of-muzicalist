import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import PlanBadge from "@/components/PlanBadge";
import ArtistCardStatusBadge from "@/components/ArtistCardStatusBadge";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";
import { getCountryFlag } from "@/lib/countryFlags";
import { useReveal } from "@/hooks/useReveal";

interface ArtistTileProps {
  id: string;
  stageName: string;
  imageUrl?: string | null;
  plan?: string | null;
  specialization?: string | null;
  county?: string | null;
  country?: string | null;
  rating: number | null;
  reviewCount: number;
  /** Drawn over the photo, top left (e.g. available / booked on the searched date) */
  overlay?: ReactNode;
}

/**
 * One artist in a grid, Spotify style: no box, the photo, the name and grey details;
 * the whole tile lights up on hover.
 */
const ArtistTile = ({ id, stageName, imageUrl, plan, specialization, county, country, rating, reviewCount, overlay }: ArtistTileProps) => {
  const flag = country ? getCountryFlag(country) : "";
  // Fades and rises in the first time it scrolls into view
  const reveal = useReveal<HTMLDivElement>();
  return (
    <div ref={reveal.ref} className={reveal.className} style={reveal.style}>
    <Link
      to={`/artist/${id}`}
      className="group block rounded-md p-2 transition-colors hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none md:p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-secondary shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        <PlanBadge plan={plan} />
        {imageUrl ? (
          <img src={getThumbUrl(imageUrl, 320)} alt={stageName} width={320} height={320} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {overlay}
      </div>
      <h3 className="mt-2.5 truncate text-base font-medium text-foreground notranslate" data-user-content="true" data-no-translate="true" translate="no">
        {stageName}
      </h3>
      {(specialization || county) && (
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          <span>{translateSpecialization(specialization)}</span>
          {county ? (
            <>
              <span>{specialization ? ", " : ""}</span>
              <span className="notranslate" translate="no">{county}</span>
            </>
          ) : null}
          {flag ? <span className="notranslate" translate="no"> {flag}</span> : null}
        </p>
      )}
      <ArtistCardStatusBadge rating={rating} reviewCount={reviewCount} className="mt-1" />
    </Link>
    </div>
  );
};

export default ArtistTile;
