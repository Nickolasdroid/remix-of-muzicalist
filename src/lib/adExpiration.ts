/**
 * Ad expiration utility.
 * - Standard (text) ads expire after 15 days from the `date` field.
 * - Premium (promotion) ads expire after 30 days from the `date` field.
 * After expiration, ads remain visible only to the owner as history.
 */

const STANDARD_AD_VALIDITY_DAYS = 15;
const PREMIUM_AD_VALIDITY_DAYS = 30;

export function isAdExpired(ad: { date: string; is_premium: boolean }): boolean {
  const adDate = new Date(ad.date);
  const validityDays = ad.is_premium ? PREMIUM_AD_VALIDITY_DAYS : STANDARD_AD_VALIDITY_DAYS;
  const expirationDate = new Date(adDate);
  expirationDate.setDate(expirationDate.getDate() + validityDays);
  return new Date() > expirationDate;
}

export function getAdExpirationDate(ad: { date: string; is_premium: boolean }): Date {
  const adDate = new Date(ad.date);
  const validityDays = ad.is_premium ? PREMIUM_AD_VALIDITY_DAYS : STANDARD_AD_VALIDITY_DAYS;
  const expirationDate = new Date(adDate);
  expirationDate.setDate(expirationDate.getDate() + validityDays);
  return expirationDate;
}

export function getDaysRemaining(ad: { date: string; is_premium: boolean }): number {
  const expirationDate = getAdExpirationDate(ad);
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
