// Frontend mirror of Stripe price_id mapping. Keep in sync with
// supabase/functions/_shared/stripePriceMap.ts
export type Plan = "Free" | "Standard" | "Premium";
export type Billing = "monthly" | "yearly";

export const STRIPE_PRICES: Record<string, { plan: Exclude<Plan, "Free">; billing: Billing }> = {
  price_1SXuaaKVhMSJTGUNuogDwKwH: { plan: "Standard", billing: "monthly" },
  price_1SXudaKVhMSJTGUNCFkYZdXC: { plan: "Standard", billing: "yearly" },
  price_1SXue3KVhMSJTGUNUbW6ZWLb: { plan: "Premium", billing: "monthly" },
  price_1SXuekKVhMSJTGUNwnlTSaC8: { plan: "Premium", billing: "yearly" },
};

export const PRICE_BY_PLAN: Record<"Standard" | "Premium", Record<Billing, string>> = {
  Standard: {
    monthly: "price_1SXuaaKVhMSJTGUNuogDwKwH",
    yearly: "price_1SXudaKVhMSJTGUNCFkYZdXC",
  },
  Premium: {
    monthly: "price_1SXue3KVhMSJTGUNUbW6ZWLb",
    yearly: "price_1SXuekKVhMSJTGUNwnlTSaC8",
  },
};

/**
 * Returns the effective plan after considering Stripe subscription_status.
 * Only "active" or "trialing" grant access to paid plan features.
 */
export function getEffectivePlan(plan?: string | null, status?: string | null): Plan {
  if (!plan || plan === "Free") return "Free";
  if (status === "active" || status === "trialing") return plan as Plan;
  return "Free";
}
