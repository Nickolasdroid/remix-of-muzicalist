import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { REPORT_TYPES, submitReport } from "@/lib/reports";

interface Props {
  onSubmitted?: () => void;
  compact?: boolean;
}

/**
 * Shared "Report a Problem" form (type + title + description + attachment).
 * Technical details are collected automatically on submit.
 */
const ReportProblemForm = ({ onSubmitted, compact }: Props) => {
  const { toast } = useToast();
  const [type, setType] = useState<string>("bug");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Please add a short title.", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please write your report before sending.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({ type, title, description: message, file });
      toast({
        title: "Report Sent!",
        description: "Thank you for your feedback. We'll review it shortly.",
      });
      setType("bug");
      setTitle("");
      setMessage("");
      setFile(null);
      onSubmitted?.();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Could not send your report.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="space-y-2">
        <Label htmlFor="report-type">Report Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="report-type" className="h-12 rounded-lg">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-title">Title</Label>
        <Input
          id="report-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Short description of the problem"
          className="h-12 rounded-lg"
        />
      </div>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={4000}
        placeholder="Describe your issue or feedback..."
        className="min-h-[150px] rounded-lg bg-background/50 border-accent/20 resize-none"
      />

      {file && <p className="text-sm text-muted-foreground">Attached: {file.name}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ReportProblemForm;
