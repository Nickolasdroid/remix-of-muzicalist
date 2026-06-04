import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Loader2, ExternalLink, Inbox, Info } from "lucide-react";

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

const statusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === "issued" || s === "paid") {
    return { label: "Paid", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" };
  }
  if (s === "failed") {
    return { label: "Failed", cls: "bg-destructive/15 text-destructive border border-destructive/30" };
  }
  return { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30" };
};

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
        <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Invoices are generated automatically after successful payments and are available for download here.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No invoices available yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Your invoices will appear here automatically after successful payments.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-2 px-2">Invoice</th>
                  <th className="text-left font-medium py-2 px-2">Date</th>
                  <th className="text-left font-medium py-2 px-2">Amount</th>
                  <th className="text-left font-medium py-2 px-2">Status</th>
                  <th className="text-right font-medium py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const date = new Date(r.created_at).toLocaleDateString();
                  const amount = r.amount != null
                    ? `${Number(r.amount).toFixed(2)} ${r.currency?.toUpperCase() ?? ""}`.trim()
                    : "—";
                  const number = r.smartbill_series && r.smartbill_number
                    ? `${r.smartbill_series} ${r.smartbill_number}`
                    : "—";
                  const badge = statusBadge(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium text-foreground">{number}</td>
                      <td className="py-3 px-2 text-muted-foreground">{date}</td>
                      <td className="py-3 px-2 text-foreground">{amount}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {r.status === "failed" && r.error_message && (
                          <p className="text-xs text-destructive mt-1">{r.error_message}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {r.smartbill_url ? (
                          <div className="inline-flex items-center gap-3">
                            <a
                              href={r.smartbill_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </a>
                            <a
                              href={r.smartbill_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="md:hidden divide-y divide-border">
            {rows.map((r) => {
              const date = new Date(r.created_at).toLocaleDateString();
              const amount = r.amount != null
                ? `${Number(r.amount).toFixed(2)} ${r.currency?.toUpperCase() ?? ""}`.trim()
                : "—";
              const number = r.smartbill_series && r.smartbill_number
                ? `${r.smartbill_series} ${r.smartbill_number}`
                : "—";
              const badge = statusBadge(r.status);
              return (
                <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{date} · {amount}</p>
                    <span className={`mt-1 inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  {r.smartbill_url && (
                    <a
                      href={r.smartbill_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-accent hover:underline shrink-0"
                    >
                      <Download className="h-4 w-4" /> PDF
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
