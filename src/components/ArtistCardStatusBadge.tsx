import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ArtistCardStatusBadgeProps {
  createdAt?: string | null;
  rating: number | null;
  reviewCount: number;
  /** Shown instead of review text when the artist has no reviews. */
  specialization?: string | null;
  location?: string | null;
  className?: string;
}

const ArtistCardStatusBadge = ({ rating, reviewCount, className }: ArtistCardStatusBadgeProps) => {
  const { t } = useTranslation();
  const rated = rating !== null && reviewCount > 0;

  return (
    <span className={cn("flex max-w-full items-center gap-1 whitespace-nowrap text-sm leading-tight text-muted-foreground", className)}>
      <Star className={cn("h-3.5 w-3.5 shrink-0", rated && "fill-current")} aria-hidden="true" />
      {rated ? (
        <>
          <span className="font-medium tabular-nums text-foreground/90">{rating!.toFixed(1)}</span>
          <span className="tabular-nums">({t("artistCard.reviewCount", { count: reviewCount })})</span>
        </>
      ) : (
        <span>{t("artistCard.noReviewsYet", "New")}</span>
      )}
    </span>
  );
};

export default ArtistCardStatusBadge;
