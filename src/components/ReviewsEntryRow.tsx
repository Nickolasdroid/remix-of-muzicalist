import { ChevronRight, Star } from "lucide-react";

interface ReviewsEntryRowProps {
  count: number;
  average: string | null;
  onClick: () => void;
}

/** Compact Reviews row shared by the public artist profile and the artist Dashboard. */
const ReviewsEntryRow = ({ count, average, onClick }: ReviewsEntryRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:text-accent"
  >
    <Star className="h-5 w-5 shrink-0 text-accent" />
    <span className="text-lg font-semibold text-foreground">Reviews</span>
    {count > 0 ? (
      <span key={`rv-${count}-${average}`} className="ml-auto truncate text-sm text-muted-foreground tabular-nums">
        <span className="notranslate" translate="no">{average}/5 · {count}</span>{" "}
        <span key={count === 1 ? "one" : "many"}>{count === 1 ? "review" : "reviews"}</span>
      </span>
    ) : (
      <span key="rv-empty" className="ml-auto truncate text-sm text-muted-foreground">No reviews yet</span>
    )}
    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
  </button>
);

export default ReviewsEntryRow;
