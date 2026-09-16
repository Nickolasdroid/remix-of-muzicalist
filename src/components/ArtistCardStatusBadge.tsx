import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const NEW_ARTIST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface ArtistCardStatusBadgeProps {
  createdAt?: string | null;
  rating: number | null;
  reviewCount: number;
  className?: string;
}

const ArtistCardStatusBadge = ({ createdAt, rating, reviewCount, className }: ArtistCardStatusBadgeProps) => {
  const { t } = useTranslation();
  const isNew = createdAt
    ? Date.now() - new Date(createdAt).getTime() < NEW_ARTIST_WINDOW_MS
    : false;

  if (rating === null || reviewCount === 0) {
    return (
      <span className={cn("text-xs font-medium text-muted-foreground", className)}>
        {isNew ? t("artistCard.newArtist") : t("artistCard.noReviews")}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 rounded-full border border-border/70 bg-secondary/80 px-1.5 py-1 text-[9px] leading-none whitespace-nowrap sm:gap-1 sm:px-2 sm:text-[11px]",
        className,
      )}
    >
      <Star className="h-3 w-3 shrink-0 fill-accent text-accent" aria-hidden="true" />
      <span className="font-semibold text-accent tabular-nums">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground" aria-hidden="true">·</span>
      <span className="text-foreground/80 tabular-nums">
        {t("artistCard.reviewCount", { count: reviewCount })}
      </span>
    </span>
  );
};

export default ArtistCardStatusBadge;
