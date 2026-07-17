import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileEdit,
  Ban,
} from "lucide-react";

export type DbCampaignStatus =
  | "Draft"
  | "Pending"
  | "Sending"
  | "Completed"
  | "CompletedWithErrors"
  | "Failed"
  | "Cancelled";

const MAP: Record<
  DbCampaignStatus,
  { label: string; className: string; icon: typeof Clock; spin?: boolean }
> = {
  Draft: {
    label: "Draft",
    className:
      "bg-muted text-muted-foreground border-border hover:bg-muted",
    icon: FileEdit,
  },
  Pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
    icon: Clock,
  },
  Sending: {
    label: "Sending",
    className:
      "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/10",
    icon: Loader2,
    spin: true,
  },
  Completed: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10",
    icon: CheckCircle2,
  },
  CompletedWithErrors: {
    label: "Completed with errors",
    className:
      "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10",
    icon: AlertTriangle,
  },
  Failed: {
    label: "Failed",
    className:
      "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10",
    icon: XCircle,
  },
  Cancelled: {
    label: "Cancelled",
    className:
      "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10",
    icon: Ban,
  },
};

const CampaignDbStatusBadge = ({ status }: { status: string | null | undefined }) => {
  const key = (status ?? "Draft") as DbCampaignStatus;
  const cfg = MAP[key] ?? MAP.Draft;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`rounded-full gap-1 font-medium whitespace-nowrap ${cfg.className}`}
    >
      <Icon className={`h-3 w-3 ${cfg.spin ? "animate-spin" : ""}`} />
      {cfg.label}
    </Badge>
  );
};

export default CampaignDbStatusBadge;
