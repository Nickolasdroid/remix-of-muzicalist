import { AlertTriangle } from "lucide-react";

interface OverLimitBannerProps {
  kind: "announcements" | "posts" | "promotions";
  used: number;
  limit: number;
  /** Optional next billing reset date; shown to the user when provided. */
  resetDate?: Date | null;
  className?: string;
}

const LABELS: Record<OverLimitBannerProps["kind"], string> = {
  announcements: "Announcements",
  posts: "Posts",
  promotions: "Promotions",
};

/**
 * Warning shown when a user is over the per-billing-period limit
 * (typically right after a plan downgrade). Existing content is preserved;
 * new creations are paused until the next billing-cycle reset.
 */
export const OverLimitBanner = ({ kind, used, limit, resetDate, className = "" }: OverLimitBannerProps) => {
  if (used <= limit) return null;
  const label = LABELS[kind];
  const formattedReset = resetDate
    ? resetDate.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : null;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm ${className}`}
      role="alert"
    >
      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-medium text-destructive">
          {label}: {used}/{limit} — over your plan limit
        </p>
        <p className="text-muted-foreground">
          Your current subscription allows fewer {label.toLowerCase()} than you've already
          used this period. Existing content stays live, but you can't create new{" "}
          {label.toLowerCase()} until your counter resets at the next billing cycle
          {formattedReset ? ` (${formattedReset})` : ""}.
        </p>
      </div>
    </div>
  );
};

export default OverLimitBanner;
