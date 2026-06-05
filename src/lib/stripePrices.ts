// Frontend mirror of Stripe price_id mapping. Keep in sync with
// supabase/functions/_shared/stripePriceMap.ts
export type Plan = "Free" | "Standard" | "Premium";
export type Billing = "monthly" | "yearly";

// TEMP TEST: Premium monthly swapped to 1 RON test price (price_1Tf2pvKBZxdkesfhWG5Irf1f).
// Revert price_1Tf2pvKBZxdkesfhWG5Irf1f -> price_1TSEstKBZxdkesfhvBGTOGmP after SmartBill verification.
export const STRIPE_PRICES: Record<string, { plan: Exclude<Plan, "Free">; billing: Billing }> = {
  price_1TSEqwKBZxdkesfhjRUVTm8l: { plan: "Standard", billing: "monthly" },
  price_1TSErCKBZxdkesfhVK7ZAABc: { plan: "Standard", billing: "yearly" },
  price_1Tf2pvKBZxdkesfhWG5Irf1f: { plan: "Premium", billing: "monthly" },
  price_1TSEtLKBZxdkesfho910v66y: { plan: "Premium", billing: "yearly" },
};

export const PRICE_BY_PLAN: Record<"Standard" | "Premium", Record<Billing, string>> = {
  Standard: {
    monthly: "price_1TSEqwKBZxdkesfhjRUVTm8l",
    yearly: "price_1TSErCKBZxdkesfhVK7ZAABc",
  },
  Premium: {
    monthly: "price_1Tf2pvKBZxdkesfhWG5Irf1f",
    yearly: "price_1TSEtLKBZxdkesfho910v66y",
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
