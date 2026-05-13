import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type ReportableType = "post" | "announcement" | "profile";

interface ReportContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ReportableType;
  contentId: string | null;
}

const REASONS = [
  "Spam or misleading",
  "Harassment or hate speech",
  "Nudity or sexual content",
  "Violence or dangerous content",
  "Scam or fraud",
  "Intellectual property violation",
  "False information",
  "Other",
];

const ReportContentDialog = ({
  open,
  onOpenChange,
  contentType,
  contentId,
}: ReportContentDialogProps) => {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
  };

  const handleSubmit = async () => {
    if (!contentId) return;
    if (!reason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }
    if (reason === "Other" && !details.trim()) {
      toast({
        title: "Please describe the issue",
        description: "Add a short description so we can review it.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to submit a report.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("content_reports").insert({
        reporter_id: session.user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        details: details.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you. Our team will review it shortly.",
      });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error("Failed to submit report:", e);
      toast({
        title: "Failed to submit report",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong. Your report is anonymous to the author.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem value={r} id={`reason-${r}`} />
                <Label htmlFor={`reason-${r}`} className="cursor-pointer text-sm font-normal">
                  {r}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              reason === "Other"
                ? "Describe the issue (required)"
                : "Add more details (optional)"
            }
            maxLength={1000}
            className="min-h-[100px] resize-none rounded-lg"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportContentDialog;
