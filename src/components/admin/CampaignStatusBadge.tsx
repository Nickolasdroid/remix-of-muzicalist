import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { CampaignStatus } from "@/lib/campaignStore";

const MAP: Record<
  CampaignStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
    icon: Clock,
  },
  sending: {
    label: "Sending",
    className:
      "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/10",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className:
      "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10",
    icon: XCircle,
  },
};

const CampaignStatusBadge = ({ status }: { status: CampaignStatus }) => {
  const cfg = MAP[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`rounded-full gap-1 font-medium ${cfg.className}`}
    >
      <Icon className={`h-3 w-3 ${status === "sending" ? "animate-spin" : ""}`} />
      {cfg.label}
    </Badge>
  );
};

export default CampaignStatusBadge;
