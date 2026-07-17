import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { COMM_ERROR_MESSAGES, type CommErrorCode } from "@/lib/communicationErrors";
import { isValidTestEmail } from "@/lib/testEmail";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateLabel: string;
  campaignName?: string;
}

export default function TestEmailDialog({
  open,
  onOpenChange,
  templateId,
  templateLabel,
  campaignName,
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const emailValid = isValidTestEmail(email);
  const canSend = emailValid && !sending && !!templateId;

  const reset = () => {
    setEmail("");
    setName("");
    setSending(false);
  };

  const handleClose = (next: boolean) => {
    if (sending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: {
          template_id: templateId,
          template_label: templateLabel,
          recipient_email: email.trim().toLowerCase(),
          recipient_name: name.trim() || null,
          campaign_name: campaignName?.trim() || null,
        },
      });

      if (error) {
        let detail = error.message;
        let code: CommErrorCode | undefined;
        if (error instanceof FunctionsHttpError) {
          try {
            const parsed = await error.context.json();
            code = parsed?.code as CommErrorCode | undefined;
            detail = parsed?.error ?? detail;
          } catch {
            /* ignore parse failure */
          }
        }
        const mapped = code && COMM_ERROR_MESSAGES[code] ? COMM_ERROR_MESSAGES[code] : detail;
        toast.error(mapped || "Failed to send test email.");
        return;
      }

      if (!data?.success) {
        toast.error("Failed to send test email.");
        return;
      }

      toast.success("Test email sent successfully.");
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("send-test-email invoke failed:", err);
      toast.error("Failed to send test email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Preview <span className="font-medium text-foreground">{templateLabel}</span> by
            sending a single email. This does not create a campaign or affect statistics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="test-email">
              Test recipient email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="test-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={sending}
              className="rounded-lg h-11"
            />
            {email && !emailValid && (
              <p className="text-xs text-destructive">Please enter a valid email address.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="test-name">Recipient name (optional)</Label>
            <Input
              id="test-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Test Artist"
              disabled={sending}
              className="rounded-lg h-11"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => handleClose(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg"
            onClick={handleSend}
            disabled={!canSend}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
