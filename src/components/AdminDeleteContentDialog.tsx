import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const ADMIN_DELETE_REASONS = [
  "Indecent or sexually explicit content",
  "Hate speech or discrimination",
  "Harassment or bullying",
  "Violence or dangerous behavior",
  "Spam or misleading content",
  "Copyright or intellectual property violation",
  "Scam or fraudulent activity",
  "Illegal activity or regulated goods",
  "Impersonation",
  "Other community guideline violation",
];

interface AdminDeleteContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "post" | "announcement";
  onConfirm: (reason: string) => void | Promise<void>;
}

const AdminDeleteContentDialog = ({
  open,
  onOpenChange,
  contentType,
  onConfirm,
}: AdminDeleteContentDialogProps) => {
  const [reason, setReason] = useState<string>(ADMIN_DELETE_REASONS[0]);
  const [details, setDetails] = useState("");

  const handleConfirm = async () => {
    const finalReason = details.trim() ? `${reason} — ${details.trim()}` : reason;
    await onConfirm(finalReason);
    setReason(ADMIN_DELETE_REASONS[0]);
    setDetails("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {contentType === "post" ? "post" : "announcement"} as admin
          </AlertDialogTitle>
          <AlertDialogDescription>
            Select the reason this content violates platform guidelines. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2 max-h-[50vh] overflow-y-auto">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {ADMIN_DELETE_REASONS.map((r) => (
              <div key={r} className="flex items-start gap-2">
                <RadioGroupItem value={r} id={r} className="mt-0.5" />
                <Label htmlFor={r} className="font-normal cursor-pointer leading-snug">
                  {r}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="admin-delete-details" className="text-sm">
              Additional details (optional)
            </Label>
            <Textarea
              id="admin-delete-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add context about the violation..."
              className="rounded-lg min-h-[80px]"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete content
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminDeleteContentDialog;
