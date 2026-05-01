// Single source of truth: Stripe price_id -> internal plan + billing
// Update these IDs to match your Stripe Dashboard prices.
export type Plan = "Standard" | "Premium";
export type Billing = "monthly" | "yearly";

export interface PlanInfo {
  plan: Plan;
  billing: Billing;
}

export const PRICE_MAP: Record<string, PlanInfo> = {
  // Standard
  "price_1SXuaaKVhMSJTGUNuogDwKwH": { plan: "Standard", billing: "monthly" },
  "price_1SXudaKVhMSJTGUNCFkYZdXC": { plan: "Standard", billing: "yearly" },
  // Premium
  "price_1SXue3KVhMSJTGUNUbW6ZWLb": { plan: "Premium", billing: "monthly" },
  "price_1SXuekKVhMSJTGUNwnlTSaC8": { plan: "Premium", billing: "yearly" },
};

export function getPlanFromPriceId(priceId: string | null | undefined): PlanInfo | null {
  if (!priceId) return null;
  return PRICE_MAP[priceId] ?? null;
}

export const ALL_PRICE_IDS = Object.keys(PRICE_MAP);
