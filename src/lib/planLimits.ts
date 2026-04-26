/**
 * Plan-based feature limits and utilities.
 */

export type PlanType = 'Free' | 'Standard' | 'Premium';

/** Returns a numeric priority for sorting (higher = shown first) */
export const getPlanPriority = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 3;
    case 'Standard': return 2;
    default: return 1;
  }
};

/** Sort comparator: Premium first, then Standard, then Free */
export const sortByPlanPriority = <T extends { plan?: string | null }>(a: T, b: T): number => {
  return getPlanPriority(b.plan) - getPlanPriority(a.plan);
};

export const getPlan = (plan?: string | null): PlanType => {
  if (plan === 'Premium') return 'Premium';
  if (plan === 'Standard') return 'Standard';
  return 'Free';
};

export const isFree = (plan?: string | null): boolean => getPlan(plan) === 'Free';
export const isStandard = (plan?: string | null): boolean => getPlan(plan) === 'Standard';
export const isPremium = (plan?: string | null): boolean => getPlan(plan) === 'Premium';

/** Gallery limits */
export const getImageLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 15;
    case 'Standard': return 10;
    default: return 5;
  }
};

export const getVideoLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 5;
    case 'Standard': return 3;
    default: return 0; // Free cannot upload videos
  }
};

/** Posts limits (per month) */
export const getPostLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 30;
    case 'Standard': return 15;
    default: return 0; // Free cannot post
  }
};

/** Ad limits */
export const getAdLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 10;
    case 'Standard': return 5;
    default: return 0; // Free cannot post ads
  }
};

/** Promotion limits */
export const getPromotionLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 5;
    case 'Standard': return 2;
    default: return 0; // Free cannot post promotions
  }
};

/** Social media link limit */
export const getSocialLinkLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 5; // all 5 platforms
    case 'Standard': return 5; // all visible
    default: return 1; // Free: only 1 visible
  }
};

/** Review visibility limit (null = unlimited) */
export const getReviewDisplayLimit = (plan?: string | null): number | null => {
  switch (getPlan(plan)) {
    case 'Premium': return null; // unlimited
    case 'Standard': return null; // unlimited
    default: return 3; // Free: only 3 most recent
  }
};

/** Whether the plan can set estimated pricing */
export const canSetEstimatedPrice = (plan?: string | null): boolean => {
  return getPlan(plan) !== 'Free';
};

/** Maximum number of estimated pricing entries an artist can save */
export const getEstimatedPriceLimit = (plan?: string | null): number => {
  switch (getPlan(plan)) {
    case 'Premium': return 3;
    case 'Standard': return 3;
    default: return 0;
  }
};

/** Whether the plan can post (posts, ads, promotions) */
export const canPost = (plan?: string | null): boolean => {
  return getPlan(plan) !== 'Free';
};

/** Whether the plan supports time interval bookings */
export const canUseTimeIntervals = (plan?: string | null): boolean => {
  return getPlan(plan) === 'Premium';
};

/**
 * Get the first N social links that have values, respecting plan limit.
 * Returns an array of { platform, url, icon } objects.
 */
export const getVisibleSocialLinks = (
  profile: {
    facebook_url?: string | null;
    instagram_url?: string | null;
    youtube_url?: string | null;
    tiktok_url?: string | null;
    spotify_url?: string | null;
  },
  plan?: string | null
): { platform: string; url: string }[] => {
  const limit = getSocialLinkLimit(plan);
  const allLinks: { platform: string; url: string }[] = [];

  if (profile.facebook_url) allLinks.push({ platform: 'facebook', url: profile.facebook_url });
  if (profile.instagram_url) allLinks.push({ platform: 'instagram', url: profile.instagram_url });
  if (profile.youtube_url) allLinks.push({ platform: 'youtube', url: profile.youtube_url });
  if (profile.tiktok_url) allLinks.push({ platform: 'tiktok', url: profile.tiktok_url });
  if (profile.spotify_url) allLinks.push({ platform: 'spotify', url: profile.spotify_url });

  return allLinks.slice(0, limit);
};

/**
 * Count how many social links are currently filled.
 */
export const countFilledSocialLinks = (formData: {
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  spotifyUrl?: string;
}): number => {
  let count = 0;
  if (formData.facebookUrl) count++;
  if (formData.instagramUrl) count++;
  if (formData.youtubeUrl) count++;
  if (formData.tiktokUrl) count++;
  if (formData.spotifyUrl) count++;
  return count;
};
