import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Rocket } from "lucide-react";
import { formatDuration } from "@/lib/campaignStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  name: string;
  templateLabel: string;
  fileName: string;
  totalRecipients: number;
  validCount: number;
  invalidCount: number;
  estimatedMs: number;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right break-all">
      {value}
    </span>
  </div>
);

const CampaignConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  name,
  templateLabel,
  fileName,
  totalRecipients,
  validCount,
  invalidCount,
  estimatedMs,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Campaign</DialogTitle>
          <DialogDescription>
            Review the details before starting the campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 px-4 py-1">
          <Row label="Campaign Name" value={name} />
          <Row label="Template" value={templateLabel} />
          <Row label="Uploaded File" value={fileName} />
          <Row label="Total Recipients" value={totalRecipients} />
          <Row
            label="Valid Emails"
            value={<span className="text-emerald-600">{validCount}</span>}
          />
          <Row
            label="Invalid Emails"
            value={
              <span className={invalidCount ? "text-destructive" : ""}>
                {invalidCount}
              </span>
            }
          />
          <Row label="Estimated Sending Time" value={formatDuration(estimatedMs)} />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>This action will send emails to all valid recipients.</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="rounded-lg" onClick={onConfirm}>
            <Rocket className="h-4 w-4 mr-2" />
            Start Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignConfirmDialog;
