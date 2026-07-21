import { Star } from "lucide-react";

const NEW_ARTIST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface ArtistCardStatusBadgeProps {
  createdAt?: string | null;
  rating: number | null;
  reviewCount: number;
}

const ArtistCardStatusBadge = ({ createdAt, rating, reviewCount }: ArtistCardStatusBadgeProps) => {
  const isNew = createdAt
    ? Date.now() - new Date(createdAt).getTime() < NEW_ARTIST_WINDOW_MS
    : false;

  if (isNew && reviewCount === 0) {
    return (
      <span className="text-xs font-medium text-accent/80">
        New artist
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 text-accent fill-accent" />
      <span className="text-sm font-medium text-muted-foreground">
        {rating !== null && reviewCount > 0 ? `${rating.toFixed(1)} (${reviewCount})` : "0"}
      </span>
    </div>
  );
};

export default ArtistCardStatusBadge;
