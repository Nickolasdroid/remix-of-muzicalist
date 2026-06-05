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
  "price_1TSEqwKBZxdkesfhjRUVTm8l": { plan: "Standard", billing: "monthly" },
  "price_1TSErCKBZxdkesfhVK7ZAABc": { plan: "Standard", billing: "yearly" },
  // Premium — monthly TEMP-swapped to 1 RON test price (revert to price_1TSEstKBZxdkesfhvBGTOGmP after SmartBill verification)
  "price_1Tf2pvKBZxdkesfhWG5Irf1f": { plan: "Premium", billing: "monthly" },
  "price_1TSEtLKBZxdkesfho910v66y": { plan: "Premium", billing: "yearly" },
};

export function getPlanFromPriceId(priceId: string | null | undefined): PlanInfo | null {
  if (!priceId) return null;
  return PRICE_MAP[priceId] ?? null;
}

export const ALL_PRICE_IDS = Object.keys(PRICE_MAP);
