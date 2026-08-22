/**
 * Unified feed ranking.
 *
 * Muzicalist has ONE feed per content type. A promotion is not a content type
 * and not a guaranteed position — it is an additional ranking signal applied on
 * top of the normal relevance score, so promoted items get mixed naturally into
 * the feed instead of being grouped or pinned at the top.
 *
 * The signal shape below is intentionally open so future ranking factors
 * (interests, genres, location, following, engagement) can be added without
 * another architectural rewrite.
 */

export interface RankingSignals {
  /** Content type — kept as a signal so the ranker can weight types later. */
  type?: string;
  /** ISO timestamp used for the recency component. */
  created_at: string;
  /** Engagement proxy (likes + comments, etc.). Optional. */
  engagement?: number;
  /** Plan / relevance boosts already computed elsewhere. Optional. */
  relevance?: number;
  /** Whether an active promotion is applied to this item. */
  promoted?: boolean;
  /** End of the active promotion, when known. */
  promotedUntil?: string | null;
}

/** Weights are centralised so ranking can be tuned in one place. */
export const RANKING_WEIGHTS = {
  /** Hours after which the recency score halves. */
  recencyHalfLifeHours: 36,
  /** Score contributed by recency at time zero. */
  recencyWeight: 100,
  /** Diminishing-returns weight for engagement. */
  engagementWeight: 8,
  /** Weight for externally computed relevance (e.g. plan priority). */
  relevanceWeight: 6,
  /**
   * Promotion boost. Deliberately moderate: it moves content up, but recent
   * or engaging normal content can still outrank a promoted item.
   */
  promotionBoost: 45,
};

const hoursSince = (iso: string): number => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (Date.now() - t) / 36e5);
};

/** Whether a promotion is currently active for an item. */
export const isPromotionActive = (item: {
  promoted?: boolean;
  promotedUntil?: string | null;
  promoted_until?: string | null;
}): boolean => {
  const until = item.promotedUntil ?? item.promoted_until ?? null;
  if (until) return new Date(until).getTime() > Date.now();
  return !!item.promoted;
};

/**
 * Deterministic feed score. Higher ranks earlier.
 */
export const getFeedScore = (item: RankingSignals): number => {
  const ageHours = hoursSince(item.created_at);
  const recency =
    RANKING_WEIGHTS.recencyWeight *
    Math.pow(0.5, ageHours / RANKING_WEIGHTS.recencyHalfLifeHours);

  const engagement =
    RANKING_WEIGHTS.engagementWeight * Math.log1p(Math.max(0, item.engagement || 0));

  const relevance = RANKING_WEIGHTS.relevanceWeight * (item.relevance || 0);

  const promotion = isPromotionActive(item) ? RANKING_WEIGHTS.promotionBoost : 0;

  return recency + engagement + relevance + promotion;
};

/** Sort comparator for the unified feed (stable-ish, falls back to recency). */
export const compareByFeedScore = (a: RankingSignals, b: RankingSignals): number => {
  const diff = getFeedScore(b) - getFeedScore(a);
  if (Math.abs(diff) > 1e-9) return diff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
};

/** Convenience helper: rank a list of feed items. */
export const rankFeedItems = <T extends RankingSignals>(items: T[]): T[] =>
  [...items].sort(compareByFeedScore);
