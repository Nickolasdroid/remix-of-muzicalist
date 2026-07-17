import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, FileSpreadsheet, X, Send, Rocket, AlertTriangle, Loader2 } from "lucide-react";
import RecipientsSummary from "@/components/admin/RecipientsSummary";
import CampaignConfirmDialog from "@/components/admin/CampaignConfirmDialog";
import { parseRecipientsFile, type ParsedRecipients } from "@/lib/campaignRecipients";
import { campaignStore, estimateSendingMs } from "@/lib/campaignStore";
import { toast } from "sonner";

const TEMPLATES: Record<string, string> = {
  "legacy-artist-reactivation": "Legacy Artist Reactivation",
};

const AdminNewCampaign = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [recipients, setRecipients] = useState<ParsedRecipients | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetFile = () => {
    setFile(null);
    setRecipients(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const acceptFile = async (f: File | null | undefined) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      toast.error("Unsupported file type. Please upload a .xls or .xlsx file.");
      return;
    }
    setFile(f);
    setRecipients(null);
    setParsing(true);
    try {
      const parsed = await parseRecipientsFile(f);
      setRecipients(parsed);
    } catch (err) {
      console.error(err);
      toast.error("Could not read this file. Make sure it is a valid Excel spreadsheet.");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const hasValid = (recipients?.valid.length ?? 0) > 0;
  const canStart = hasValid && name.trim().length > 0 && !!template;
  const estimatedMs = estimateSendingMs(recipients?.valid.length ?? 0);

  const handleConfirm = () => {
    if (!recipients || !file) return;
    const templateLabel = TEMPLATES[template] ?? template;
    campaignStore.create({
      name: name.trim(),
      templateId: template,
      templateLabel,
      fileName: file.name,
      totalRecipients: recipients.total,
      validCount: recipients.valid.length,
      invalidCount: recipients.invalid.length,
      validRecipients: recipients.valid,
      invalidRecipients: recipients.invalid,
      estimatedDurationMs: estimatedMs,
    });
    setConfirmOpen(false);
    toast.success("Campaign created and set to Pending.");
    navigate("/admin/communications/campaigns");
  };

  return (
    <>
      <Navigation mobileTitle="New Campaign" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <button
            onClick={() => navigate("/admin/communications/campaigns")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </button>

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              New Campaign
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure the campaign details before sending.
            </p>
          </div>

          <Card className="rounded-lg border-border p-5 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-name">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Legacy Reactivation — Wave 1"
                className="rounded-lg h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="rounded-lg h-11">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="legacy-artist-reactivation">
                    Legacy Artist Reactivation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Audience</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Drop your Excel file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: .xls, .xlsx
                </p>
              </div>

              {file && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 mt-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                      {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                        {parsing ? " · Reading spreadsheet…" : recipients ? ` · ${recipients.total} rows detected` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg shrink-0"
                    onClick={resetFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {recipients && (
              <RecipientsSummary data={recipients} />
            )}

            {recipients && !hasValid && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  No valid recipients were found in this file. Please upload a spreadsheet
                  with a <strong>Name</strong> (or NUME) and <strong>Email</strong> column.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="rounded-lg h-11 flex-1"
                disabled
                title="Coming soon"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
              <Button
                className="rounded-lg h-11 flex-1"
                disabled={!canStart}
                title={!hasValid ? "Upload a file with valid recipients" : undefined}
                onClick={() => setConfirmOpen(true)}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Start Campaign
                {hasValid && ` (${recipients!.valid.length})`}
              </Button>
            </div>
          </Card>
        </div>

        {recipients && file && (
          <CampaignConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            onConfirm={handleConfirm}
            name={name.trim()}
            templateLabel={TEMPLATES[template] ?? template}
            fileName={file.name}
            totalRecipients={recipients.total}
            validCount={recipients.valid.length}
            invalidCount={recipients.invalid.length}
            estimatedMs={estimatedMs}
          />
        )}
      </main>
    </>
  );
};

export default AdminNewCampaign;
