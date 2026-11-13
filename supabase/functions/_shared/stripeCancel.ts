// Cancels every live Stripe subscription of a customer. Used before an account is deleted,
// so a deleted user is never billed again. The Stripe customer record itself is kept
// (invoices and payments stay available for accounting).
//
// Throws when Stripe is not configured or a cancellation fails: callers must stop and delete
// nothing in that case.

import Stripe from "npm:stripe@17.5.0";

export async function cancelStripeSubscriptions(customerId: string | null | undefined): Promise<number> {
  if (!customerId) return 0;

  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe is not configured");

  const stripe = new Stripe(key, {
    apiVersion: "2024-12-18.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let cancelled = 0;
  for await (const sub of stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 })) {
    if (sub.status === "canceled" || sub.status === "incomplete_expired") continue;
    await stripe.subscriptions.cancel(sub.id);
    cancelled++;
  }
  return cancelled;
}
