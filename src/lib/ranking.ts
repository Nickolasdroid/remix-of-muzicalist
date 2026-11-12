/*
 * Fair order for "best rated": a single 5★ review shouldn't beat thirty 4.8★ reviews.
 * Every artist starts as if they already had a few average reviews (a Bayesian average,
 * like the big shops use); real reviews then pull the score toward their own rating.
 */
const PRIOR_RATING = 4.0;
const PRIOR_WEIGHT = 3;

export const fairRatingScore = (rating: number | null | undefined, reviewCount: number | null | undefined) => {
  const n = reviewCount ?? 0;
  if (!rating || n <= 0) return 0;
  return (rating * n + PRIOR_RATING * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);
};

/** Who may appear on the home page's "Top rated" shelf. */
export const TOP_RATED_MIN_REVIEWS = 3;
export const TOP_RATED_MIN_RATING = 4.0;
