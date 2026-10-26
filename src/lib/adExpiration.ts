/**
 * Ad expiration utility.
 * - Standard (text) ads expire after 7 days from the `date` field.
 * - Premium (promotion) ads expire after 15 days from the `date` field.
 * - Opportunities (announcements with a `kind`) carry their own `expires_at` (event day, or 30 days
 *   for collaborations) set by the database, and stop at once when filled or closed.
 * After expiration, ads remain visible only to the owner as history.
 */

type AdLike = {
  date: string;
  is_premium: boolean;
  kind?: string | null;
  status?: string | null;
  expires_at?: string | null;
};

const STANDARD_AD_VALIDITY_DAYS = 7;
const PREMIUM_AD_VALIDITY_DAYS = 15;

export function isAdExpired(ad: AdLike): boolean {
  if (ad.kind && ad.expires_at) {
    return (ad.status || "open") !== "open" || new Date() > new Date(ad.expires_at);
  }
  const adDate = new Date(ad.date);
  const validityDays = ad.is_premium ? PREMIUM_AD_VALIDITY_DAYS : STANDARD_AD_VALIDITY_DAYS;
  const expirationDate = new Date(adDate);
  expirationDate.setDate(expirationDate.getDate() + validityDays);
  return new Date() > expirationDate;
}

export function getAdExpirationDate(ad: AdLike): Date {
  if (ad.kind && ad.expires_at) return new Date(ad.expires_at);
  const adDate = new Date(ad.date);
  const validityDays = ad.is_premium ? PREMIUM_AD_VALIDITY_DAYS : STANDARD_AD_VALIDITY_DAYS;
  const expirationDate = new Date(adDate);
  expirationDate.setDate(expirationDate.getDate() + validityDays);
  return expirationDate;
}

export function getDaysRemaining(ad: AdLike): number {
  const expirationDate = getAdExpirationDate(ad);
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
