import { ChevronRight, Star } from "lucide-react";

interface ReviewsSummaryProps {
  ratings: number[];
  average: string | null;
  onViewAll?: () => void;
}

/** Overall rating, count and 5→1 star distribution, computed from the loaded reviews. */
const ReviewsSummary = ({ ratings, average, onViewAll }: ReviewsSummaryProps) => {
  const total = ratings.length;
  const counts = [5, 4, 3, 2, 1].map((s) => ({ s, n: ratings.filter((r) => r === s).length }));

  return (
    <div className="mb-4 border-y border-border py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
        <div className="md:w-40 md:shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground tabular-nums">{average}</span>
            <span className="text-base text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-1 flex gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(average)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{total} {total === 1 ? "review" : "reviews"}</p>
        </div>
        <ul className="flex-1 space-y-1.5">
          {counts.map(({ s, n }) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 whitespace-nowrap text-muted-foreground">{s} {s === 1 ? "star" : "stars"}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: total ? `${(n / total) * 100}%` : 0 }} />
              </div>
              <span className="w-6 shrink-0 text-right tabular-nums text-foreground">{n}</span>
            </li>
          ))}
        </ul>
      </div>
      {onViewAll && (
        <button onClick={onViewAll} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          All reviews <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ReviewsSummary;
