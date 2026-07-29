import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReportProblemForm from "@/components/ReportProblemForm";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportDialog = ({ open, onOpenChange }: ReportDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-accent/20 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Report</DialogTitle>
        </DialogHeader>
        <ReportProblemForm onSubmitted={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
