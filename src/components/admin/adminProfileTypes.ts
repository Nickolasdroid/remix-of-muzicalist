export interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  stage_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  county: string | null;
  plan: string | null;
  avatar_url: string | null;
  created_at: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  billing: string | null;
  specialization: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
  is_active: boolean | null;
  last_sign_in_at: string | null;
  avg_rating: number | null;
  reviews_count: number | null;
  suspended_until: string | null;
  is_permanent_suspension: boolean | null;
  suspension_reason: string | null;
  active_suspension_id: string | null;
}

export type SuspensionReason =
  | "spam"
  | "fake_account"
  | "abuse"
  | "fraud"
  | "copyright"
  | "tos_violation"
  | "multiple_reports"
  | "user_request"
  | "other";

export const SUSPENSION_REASONS: { value: SuspensionReason; label: string }[] = [
  { value: "spam", label: "Spam or unwanted content" },
  { value: "fake_account", label: "Fake account" },
  { value: "abuse", label: "Offensive or abusive behaviour" },
  { value: "fraud", label: "Fraud or suspicious activity" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "tos_violation", label: "Violation of Muzicalist Terms of Service" },
  { value: "multiple_reports", label: "Multiple user reports" },
  { value: "user_request", label: "Requested by the user" },
  { value: "other", label: "Other" },
];

export type SuspensionDurationKey = "24h" | "7d" | "30d" | "90d" | "permanent" | "manual";

export const SUSPENSION_DURATIONS: { value: SuspensionDurationKey; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "permanent", label: "Permanent" },
  { value: "manual", label: "Until manually reactivated" },
];

export function reasonLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return SUSPENSION_REASONS.find((r) => r.value === value)?.label ?? value;
}

export function durationLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return SUSPENSION_DURATIONS.find((d) => d.value === value)?.label ?? value;
}

export type AccountStatus = "active" | "pending_verification" | "suspended" | "permanently_suspended";

export function getAccountStatus(p: AdminProfile): AccountStatus {
  if (p.is_active === false) {
    return p.is_permanent_suspension ? "permanently_suspended" : "suspended";
  }
  if (p.verification_status === "pending") return "pending_verification";
  return "active";
}
