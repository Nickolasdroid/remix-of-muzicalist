import { Star, MessageSquare } from "lucide-react";

const NEW_ARTIST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface ArtistCardStatusBadgeProps {
  createdAt?: string | null;
  rating: number | null;
  reviewCount: number;
}

/**
 * Unified status badge displayed in the artist card info area.
 * - ≤30 days since registration: "New artist"
 * - >30 days with reviews: star + avg rating + (count)
 * - >30 days without reviews: "No reviews"
 */
const ArtistCardStatusBadge = ({ createdAt, rating, reviewCount }: ArtistCardStatusBadgeProps) => {
  const isNew = createdAt
    ? Date.now() - new Date(createdAt).getTime() < NEW_ARTIST_WINDOW_MS
    : false;

  if (isNew) {
    return (
      <span className="text-xs font-medium text-accent/80">
        New artist
      </span>
    );
  }

  if (rating !== null && reviewCount > 0) {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-accent fill-accent" />
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">
        No reviews
      </span>
    </div>
  );
};

export default ArtistCardStatusBadge;
