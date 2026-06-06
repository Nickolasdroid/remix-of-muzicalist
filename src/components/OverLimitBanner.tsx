import { AlertTriangle } from "lucide-react";

interface OverLimitBannerProps {
  kind: "announcements" | "posts" | "promotions";
  used: number;
  limit: number;
  className?: string;
}

const LABELS: Record<OverLimitBannerProps["kind"], string> = {
  announcements: "Announcements",
  posts: "Posts",
  promotions: "Promotions",
};

/**
 * Warning shown when a user is over the slot limit for a given resource
 * (typically after a plan downgrade). Existing content is preserved; only
 * new creations are blocked until consumed slots expire after 30 days.
 */
export const OverLimitBanner = ({ kind, used, limit, className = "" }: OverLimitBannerProps) => {
  if (used <= limit) return null;
  const label = LABELS[kind];
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
          Your current subscription allows fewer slots than you are currently using.
          Your existing content remains active, but you cannot create new {label.toLowerCase()}{" "}
          until enough slots are automatically released (30 days after creation).
        </p>
      </div>
    </div>
  );
};

export default OverLimitBanner;
