import type { Billing } from "@/lib/stripePrices";

/**
 * The paid plan a visitor picked on the Plans page before having an account.
 * Kept in localStorage so it survives email confirmation and Google sign-in;
 * used once, right after the artist profile is saved, to open the payment page.
 */

export type PlanIntent = { plan: "Standard" | "Premium"; billing: Billing; at: number };

const KEY = "mz_plan_intent";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const setPlanIntent = (plan: PlanIntent["plan"], billing: Billing) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ plan, billing, at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
};

export const clearPlanIntent = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

export const peekPlanIntent = (): PlanIntent | null => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!v || (v.plan !== "Standard" && v.plan !== "Premium") || Date.now() - Number(v.at) > MAX_AGE) return null;
    return { plan: v.plan, billing: v.billing === "yearly" ? "yearly" : "monthly", at: Number(v.at) };
  } catch {
    return null;
  }
};

/** Returns the pending choice and forgets it. */
export const takePlanIntent = (): PlanIntent | null => {
  const v = peekPlanIntent();
  clearPlanIntent();
  return v;
};
