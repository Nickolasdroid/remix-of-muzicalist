/**
 * Frontend mirror of the authoritative server-side entitlement logic.
 *
 * The database is the single source of truth:
 *   public.effective_plan(uuid)  -> effective plan from Stripe status
 *   public.plan_limits(text)     -> numeric limits per plan
 *   BEFORE INSERT triggers on posts / announcements / gallery_items / pricing_entries
 *
 * Everything here exists purely so the UI can display the same result without a
 * round-trip. Never treat it as a security boundary.
 */

import type { PlanType } from "@/lib/planLimits";

export interface EntitlementProfileLike {
  plan?: string | null;
  subscription_status?: string | null;
  subscription_current_period_end?: string | null;
}

/** Grace window granted to `past_due` subscriptions after the paid period ends. */
export const PAST_DUE_GRACE_DAYS = 7;

const normalizePlan = (plan?: string | null): PlanType =>
  plan === "Premium" ? "Premium" : plan === "Standard" ? "Standard" : "Free";

/**
 * Resolves the plan an account is actually entitled to right now.
 * Mirrors public.effective_plan():
 *  - active / trialing            -> paid plan
 *  - past_due                     -> paid plan until period end + 7 days
 *  - unpaid/canceled/other        -> Free
 *  - no Stripe status (legacy/manual grants) -> stored plan
 */
export const resolveEffectivePlan = (profile?: EntitlementProfileLike | null): PlanType => {
  const plan = normalizePlan(profile?.plan);
  if (plan === "Free") return "Free";

  const status = profile?.subscription_status;
  if (!status) return plan; // legacy / manually assigned plan

  if (status === "active" || status === "trialing") return plan;

  if (status === "past_due") {
    const endIso = profile?.subscription_current_period_end;
    if (!endIso) return "Free";
    const end = new Date(endIso);
    if (Number.isNaN(end.getTime())) return "Free";
    const graceEnd = end.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() <= graceEnd ? plan : "Free";
  }

  return "Free";
};

/**
 * Turns a database entitlement rejection into a message a user can understand.
 * Returns null when the error is not an entitlement error.
 */
export const mapEntitlementError = (error: unknown): string | null => {
  const message = (error as { message?: string } | null)?.message ?? "";
  if (!message) return null;

  if (message.includes("POST_PLAN_REQUIRED"))
    return "Posts are available with a Standard or Premium plan.";
  if (message.includes("POST_LIMIT_REACHED"))
    return "You've reached your post limit for this billing period.";
  if (message.includes("ANNOUNCEMENT_PLAN_REQUIRED"))
    return "Announcements are available with a Standard or Premium plan.";
  if (message.includes("ANNOUNCEMENT_LIMIT_REACHED"))
    return "You've reached your announcement limit for this billing period.";
  if (message.includes("GALLERY_PLAN_REQUIRED"))
    return "Your current plan doesn't include this type of gallery media.";
  if (message.includes("GALLERY_LIMIT_REACHED"))
    return "You've reached your gallery limit for this plan.";
  if (message.includes("PRICING_PLAN_REQUIRED"))
    return "Estimated pricing is available with a Standard or Premium plan.";
  if (message.includes("PRICING_LIMIT_REACHED"))
    return "You've reached the maximum number of pricing entries for your plan.";

  return null;
};

/** Convenience: friendly entitlement message, falling back to the raw error text. */
export const entitlementErrorMessage = (error: unknown, fallback = "Something went wrong."): string =>
  mapEntitlementError(error) ?? (error as { message?: string } | null)?.message ?? fallback;
