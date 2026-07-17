import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { errorLabel, type ParsedRecipients } from "@/lib/campaignRecipients";

interface Props {
  data: ParsedRecipients;
}

const Stat = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: "default" | "success" | "danger";
}) => {
  const toneCls =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";
  return (
    <Card className="rounded-lg border-border p-4 flex items-center gap-3">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </div>
    </Card>
  );
};

const RecipientsSummary = ({ data }: Props) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total Recipients" value={data.total} icon={Users} tone="default" />
        <Stat label="Valid Emails" value={data.valid.length} icon={CheckCircle2} tone="success" />
        <Stat label="Invalid Emails" value={data.invalid.length} icon={AlertTriangle} tone="danger" />
      </div>

      {data.invalid.length > 0 && (
        <Card className="rounded-lg border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground">Invalid rows</p>
            <p className="text-xs text-muted-foreground">
              These recipients will be skipped when the campaign runs.
            </p>
          </div>
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invalid.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{r.name || "—"}</TableCell>
                    <TableCell className="text-sm">{r.email || "—"}</TableCell>
                    <TableCell className="text-sm text-destructive">
                      {errorLabel(r.error)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecipientsSummary;
