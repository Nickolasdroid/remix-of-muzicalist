import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProfile } from "./adminProfileTypes";
import { durationLabel, reasonLabel } from "./adminProfileTypes";

interface HistoryRow {
  id: string;
  user_id: string;
  reason: string;
  other_reason: string | null;
  duration_key: string;
  suspended_until: string | null;
  is_permanent: boolean;
  notify_user: boolean;
  internal_notes: string | null;
  is_active: boolean;
  created_at: string;
  reactivated_at: string | null;
  admin_name: string | null;
  reactivator_name: string | null;
}

interface Props {
  target: AdminProfile | null;
  onOpenChange: (open: boolean) => void;
}

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : "—");

export function SuspensionHistoryDialog({ target, onOpenChange }: Props) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).rpc("get_account_suspension_history", {
        _user_id: target.id,
      });
      if (!cancelled) {
        setRows((data as HistoryRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suspension History</DialogTitle>
          <DialogDescription>
            Full audit log of every suspension applied to this account.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No suspension history for this account.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-card p-3 text-sm space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{reasonLabel(r.reason)}</span>
                  <Badge
                    variant="outline"
                    className={
                      r.is_active
                        ? "rounded-lg border-orange-500/30 bg-orange-500/15 text-orange-500"
                        : "rounded-lg border-emerald-500/30 bg-emerald-500/15 text-emerald-500"
                    }
                  >
                    {r.is_active ? "Currently active" : "Ended"}
                  </Badge>
                </div>
                {r.other_reason && (
                  <p className="text-muted-foreground italic">"{r.other_reason}"</p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Suspended at:</span>
                  <span>{fmt(r.created_at)}</span>
                  <span className="text-muted-foreground">By admin:</span>
                  <span>{r.admin_name ?? "—"}</span>
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{durationLabel(r.duration_key)}</span>
                  <span className="text-muted-foreground">Ends at:</span>
                  <span>{r.is_permanent ? "Permanent" : fmt(r.suspended_until)}</span>
                  <span className="text-muted-foreground">Reactivated at:</span>
                  <span>{fmt(r.reactivated_at)}</span>
                  <span className="text-muted-foreground">Reactivated by:</span>
                  <span>{r.reactivator_name ?? "—"}</span>
                </div>
                {r.internal_notes && (
                  <div className="mt-2 rounded-md border border-border/70 bg-muted/40 p-2 text-xs">
                    <p className="text-muted-foreground uppercase tracking-wide font-medium mb-1">
                      Internal notes
                    </p>
                    <p className="whitespace-pre-wrap">{r.internal_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
