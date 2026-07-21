import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountStatus, AdminProfile } from "./adminProfileTypes";
import { getAccountStatus } from "./adminProfileTypes";

const STATUS_MAP: Record<AccountStatus, { label: string; className: string; dot: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  pending_verification: {
    label: "Pending Verification",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    dot: "bg-amber-500",
  },
  suspended: {
    label: "Suspended",
    className: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    dot: "bg-orange-500",
  },
  permanently_suspended: {
    label: "Permanently Suspended",
    className: "bg-red-500/15 text-red-500 border-red-500/30",
    dot: "bg-red-500",
  },
};

export function AccountStatusBadge({ profile }: { profile: AdminProfile }) {
  const status = getAccountStatus(profile);
  const cfg = STATUS_MAP[status];
  return (
    <Badge variant="outline" className={cn("rounded-lg border font-medium", cfg.className)}>
      <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}
