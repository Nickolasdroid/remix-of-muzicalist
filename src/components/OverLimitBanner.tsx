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
 * Notice shown when the account has used its full creation allowance for the
 * current billing period. Existing content is never removed — only new
 * creation pauses until the counter resets.
 */
export const OverLimitBanner = ({ kind, used, limit, resetDate, className = "" }: OverLimitBannerProps) => {
  if (used < limit || limit === 0) return null;
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
          {label}: {used}/{limit} used this billing period
        </p>
        <p className="text-muted-foreground">
          You've used your {label.toLowerCase()} allowance for this billing period. All of your
          existing {label.toLowerCase()} stay published — you can create new ones once your
          allowance resets
          {formattedReset ? ` (${formattedReset})` : ""}.
        </p>
      </div>
    </div>
  );
};


export default OverLimitBanner;
