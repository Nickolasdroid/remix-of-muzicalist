import { COLLAB_STATUS_SHORT, isOpenToCollabs, type CollabStatus } from "@/lib/collabStatus";
import { cn } from "@/lib/utils";

/** Small status under the specialization: green when open to collaborations, grey when not. */
const CollabStatusChip = ({ status, className }: { status: CollabStatus; className?: string }) => (
  <span
    className={cn(
      "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      isOpenToCollabs(status) ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground",
      className,
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {COLLAB_STATUS_SHORT[status]}
  </span>
);

export default CollabStatusChip;
