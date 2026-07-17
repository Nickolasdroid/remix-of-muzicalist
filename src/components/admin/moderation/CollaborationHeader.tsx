/**
 * Presence + soft-lock UI for the moderation case workspace.
 *
 * All logic (presence math, lock resolution) lives in
 * `@/lib/moderation/collab` and is unit-tested there. This component only
 * renders and dispatches user intent.
 */
import { AlertTriangle, Eye, LockOpen, ShieldAlert } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { initialsFor, type PresenceMeta } from "@/lib/moderation/collab";
import { cn } from "@/lib/utils";

export interface CollaborationHeaderProps {
  others: PresenceMeta[];
  lockHolder: PresenceMeta | null;
  isReadOnly: boolean;
  hasTakenOver: boolean;
  assignedToOther: { id: string; name: string } | null;
  onTakeOver: () => void;
  onContinueReadOnly: () => void;
}

export function CollaborationHeader({
  others,
  lockHolder,
  isReadOnly,
  hasTakenOver,
  assignedToOther,
  onTakeOver,
  onContinueReadOnly,
}: CollaborationHeaderProps) {
  return (
    <div className="space-y-2">
      {others.length > 0 && <PresenceStrip others={others} />}

      {lockHolder && (
        <SoftLockBanner
          holder={lockHolder}
          isReadOnly={isReadOnly}
          hasTakenOver={hasTakenOver}
          onTakeOver={onTakeOver}
          onContinueReadOnly={onContinueReadOnly}
        />
      )}

      {assignedToOther && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Assigned to <span className="font-medium">{assignedToOther.name}</span>. Coordinate
            before making changes.
          </span>
        </div>
      )}
    </div>
  );
}

function PresenceStrip({ others }: { others: PresenceMeta[] }) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Eye className="h-3 w-3" />
        <span>Viewing this case</span>
        <div className="flex -space-x-2">
          {others.slice(0, 5).map((p) => (
            <Tooltip key={p.user_id}>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border animate-in fade-in zoom-in-50 duration-300">
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.name} /> : null}
                  <AvatarFallback className="text-[9px]">{initialsFor(p.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {p.name}
              </TooltipContent>
            </Tooltip>
          ))}
          {others.length > 5 && (
            <span className="ml-2 self-center rounded-full bg-muted px-1.5 text-[10px]">
              +{others.length - 5}
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function SoftLockBanner({
  holder,
  isReadOnly,
  hasTakenOver,
  onTakeOver,
  onContinueReadOnly,
}: {
  holder: PresenceMeta;
  isReadOnly: boolean;
  hasTakenOver: boolean;
  onTakeOver: () => void;
  onContinueReadOnly: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border px-3 py-2 text-xs animate-in fade-in slide-in-from-top-1",
        isReadOnly
          ? "border-sky-500/40 bg-sky-500/10"
          : "border-emerald-500/40 bg-emerald-500/10",
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          className={cn("h-3.5 w-3.5 shrink-0", isReadOnly ? "text-sky-500" : "text-emerald-500")}
        />
        <span>
          {hasTakenOver ? (
            <>You took over. {holder.name} is now in read-only mode.</>
          ) : (
            <>
              This case is currently being reviewed by{" "}
              <span className="font-medium">{holder.name}</span>.
            </>
          )}
        </span>
      </div>
      {isReadOnly && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={onContinueReadOnly}
          >
            <Eye className="mr-1 h-3 w-3" />
            Continue in read-only
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={onTakeOver}
          >
            <LockOpen className="mr-1 h-3 w-3" />
            Take over review
          </Button>
        </div>
      )}
    </div>
  );
}
