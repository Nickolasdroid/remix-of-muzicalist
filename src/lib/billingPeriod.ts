/**
 * Billing-period helpers for usage counters that reset each subscription cycle.
 * Replaces the legacy 30-day rolling cooldown.
 */

export interface BillingProfileLike {
  plan?: string | null;
  billing?: string | null;
  subscription_current_period_end?: string | null;
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Start of the current calendar month (local time). */
const startOfThisMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Returns the start of the user's current billing period.
 * - Free plans / no active subscription: falls back to the start of the current calendar month.
 * - Paid plans: subscription_current_period_end minus 1 month or 1 year (depending on billing).
 *
 * Never returns null so callers always have a usable cutoff.
 */
export const getPeriodStart = (profile?: BillingProfileLike | null): Date => {
  const endIso = profile?.subscription_current_period_end;
  if (!endIso) return startOfThisMonth();

  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return startOfThisMonth();

  const start = new Date(end);
  if (profile?.billing === "yearly") {
    start.setFullYear(start.getFullYear() - 1);
  } else {
    start.setMonth(start.getMonth() - 1);
  }

  // Safety: if Stripe data is stale (period_end is in the past), don't trap
  // the user in a never-resetting window — fall back to start of month.
  if (start.getTime() > Date.now()) {
    return startOfThisMonth();
  }
  return start;
};

/** End of the current billing period (next reset date). */
export const getPeriodEnd = (profile?: BillingProfileLike | null): Date | null => {
  const endIso = profile?.subscription_current_period_end;
  if (!endIso) return null;
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return null;
  return end;
};

/** Convenience: ISO string for the period start, used in Supabase queries. */
export const getPeriodStartIso = (profile?: BillingProfileLike | null): string => {
  return getPeriodStart(profile).toISOString();
};
