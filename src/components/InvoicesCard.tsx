import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Loader2 } from "lucide-react";

interface InvoiceRow {
  id: string;
  created_at: string;
  amount: number | null;
  currency: string | null;
  status: string;
  smartbill_series: string | null;
  smartbill_number: string | null;
  smartbill_url: string | null;
  error_message: string | null;
}

export default function InvoicesCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from("invoices" as any)
        .select("id, created_at, amount, currency, status, smartbill_series, smartbill_number, smartbill_url, error_message")
        .eq("profile_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data as unknown as InvoiceRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Facturile mele</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nu există facturi încă.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const date = new Date(r.created_at).toLocaleDateString();
            const amount = r.amount != null ? `${Number(r.amount).toFixed(2)} ${r.currency ?? ""}` : "—";
            const label =
              r.smartbill_series && r.smartbill_number
                ? `${r.smartbill_series} ${r.smartbill_number}`
                : r.status === "failed"
                ? "Eroare la emitere"
                : "În procesare";
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {date} · {amount}
                    {r.status === "failed" && r.error_message && (
                      <span className="text-destructive"> · {r.error_message}</span>
                    )}
                  </p>
                </div>
                {r.smartbill_url ? (
                  <a
                    href={r.smartbill_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    <Download className="h-4 w-4" /> PDF
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">{r.status}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
