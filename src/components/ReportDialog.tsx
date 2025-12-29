import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportDialog = ({ open, onOpenChange }: ReportDialogProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please write your report before sending.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Sent!",
      description: "Thank you for your feedback. We'll review it shortly.",
    });

    setMessage("");
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-accent/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or feedback..."
            className="min-h-[150px] bg-background/50 border-accent/20 resize-none"
          />
          
          {file && (
            <p className="text-sm text-muted-foreground">
              Attached: {file.name}
            </p>
          )}
          
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={handleSubmit}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Send report
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-accent/20 hover:bg-accent/10"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach file
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
