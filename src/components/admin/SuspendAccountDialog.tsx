import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AdminProfile, SuspensionDurationKey, SuspensionReason } from "./adminProfileTypes";
import { SUSPENSION_DURATIONS, SUSPENSION_REASONS } from "./adminProfileTypes";

interface Props {
  target: AdminProfile | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SuspendAccountDialog({ target, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [reason, setReason] = useState<SuspensionReason>("spam");
  const [otherReason, setOtherReason] = useState("");
  const [duration, setDuration] = useState<SuspensionDurationKey>("manual");
  const [notify, setNotify] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = !!target;

  useEffect(() => {
    if (open) {
      setStep("form");
      setReason("spam");
      setOtherReason("");
      setDuration("manual");
      setNotify(true);
      setNotes("");
    }
  }, [open]);

  const isValid =
    !!reason && (reason !== "other" || otherReason.trim().length > 0) && !!duration;

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("suspend_account", {
      _user_id: target.id,
      _reason: reason,
      _other_reason: reason === "other" ? otherReason.trim() : null,
      _duration_key: duration,
      _notify_user: notify,
      _internal_notes: notes.trim() || null,
    });
    if (error) {
      setSubmitting(false);
      toast({
        title: "Suspension failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (notify) {
      try {
        await supabase.functions.invoke("send-suspension-email", {
          body: {
            user_id: target.id,
            reason,
            other_reason: reason === "other" ? otherReason.trim() : null,
            duration_key: duration,
            type: "suspended",
          },
        });
      } catch (e) {
        console.warn("Suspension email failed", e);
      }
    }

    setSubmitting(false);
    toast({ title: "Account suspended" });
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Suspend Account</DialogTitle>
              <DialogDescription>
                Suspending an account will temporarily disable access to Muzicalist
                without deleting any data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Select value={reason} onValueChange={(v) => setReason(v as SuspensionReason)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {SUSPENSION_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reason === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="other-reason">
                    Describe the reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="other-reason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="rounded-lg"
                    rows={3}
                    placeholder="Explain the specific reason for this suspension..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Suspension Duration</Label>
                <Select
                  value={duration}
                  onValueChange={(v) => setDuration(v as SuspensionDurationKey)}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {SUSPENSION_DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <Checkbox
                  id="notify"
                  checked={notify}
                  onCheckedChange={(v) => setNotify(!!v)}
                  className="mt-0.5"
                />
                <Label htmlFor="notify" className="text-sm font-normal cursor-pointer leading-relaxed">
                  Send email notification informing the user their account has been
                  suspended (includes the reason but not internal notes).
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal admin notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-lg"
                  rows={3}
                  placeholder="Only visible to administrators. Never shown to the user."
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-lg"
                disabled={!isValid}
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Are you sure you want to suspend this account?
              </DialogTitle>
              <DialogDescription>
                Suspended accounts will no longer be able to use the platform until the
                suspension expires or an administrator reactivates them.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Account:</span>{" "}
                <span className="font-medium">
                  {target?.stage_name ||
                    `${target?.first_name ?? ""} ${target?.last_name ?? ""}`.trim() ||
                    target?.email}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Reason:</span>{" "}
                {SUSPENSION_REASONS.find((r) => r.value === reason)?.label}
              </p>
              <p>
                <span className="text-muted-foreground">Duration:</span>{" "}
                {SUSPENSION_DURATIONS.find((d) => d.value === duration)?.label}
              </p>
              <p>
                <span className="text-muted-foreground">Notify user:</span>{" "}
                {notify ? "Yes" : "No"}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-lg"
                disabled={submitting}
                onClick={() => setStep("form")}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={submitting}
                onClick={handleConfirm}
              >
                {submitting ? "Suspending…" : "Suspend Account"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ReactivateProps {
  target: AdminProfile | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReactivateAccountDialog({ target, onOpenChange, onSuccess }: ReactivateProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("reactivate_account", {
      _user_id: target.id,
    });

    if (error) {
      setSubmitting(false);
      toast({
        title: "Reactivation failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase.functions.invoke("send-suspension-email", {
        body: { user_id: target.id, type: "reactivated" },
      });
    } catch (e) {
      console.warn("Reactivation email failed", e);
    }

    setSubmitting(false);
    toast({ title: "Account reactivated" });
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle>Reactivate Account</DialogTitle>
          <DialogDescription>
            This will immediately restore access to Muzicalist for this account.
            The user will be able to log in and use the platform again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-lg"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Reactivating…" : "Reactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
