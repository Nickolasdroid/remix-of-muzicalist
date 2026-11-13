// Small pure rules used by the Stripe webhook, kept separate so they can be tested.

/**
 * A "subscription deleted" event may only downgrade the account when it concerns the subscription
 * the profile currently points to. An older, already replaced subscription ending later must not
 * cancel a newer one.
 */
export function shouldDowngradeOnDeleted(
  profileSubscriptionId: string | null | undefined,
  deletedSubscriptionId: string,
): boolean {
  return !profileSubscriptionId || profileSubscriptionId === deletedSubscriptionId;
}

export const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;
