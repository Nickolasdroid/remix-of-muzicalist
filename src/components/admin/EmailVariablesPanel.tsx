import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Search as SearchIcon, Variable as VariableIcon } from "lucide-react";
import {
  formatToken,
  groupByNamespace,
  loadVariableRegistry,
  NAMESPACE_LABEL,
  type VariableDefinition,
  type VariableNamespace,
} from "@/lib/emailVariables";

type Props = {
  /** Optional selection handler for future autocomplete/insert flows. */
  onSelect?: (variable: VariableDefinition) => void;
  className?: string;
};

const NS_STYLES: Record<VariableNamespace, string> = {
  user: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  artist: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  subscription: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  booking: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  system: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  campaign: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

export const EmailVariablesPanel = ({ onSelect, className }: Props) => {
  const [defs, setDefs] = useState<VariableDefinition[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadVariableRegistry().then((r) => {
      if (!cancelled) setDefs(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!defs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return defs;
    return defs.filter(
      (d) =>
        d.key.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.namespace.toLowerCase().includes(q),
    );
  }, [defs, query]);

  const grouped = useMemo(() => groupByNamespace(filtered), [filtered]);

  const handleCopy = async (v: VariableDefinition) => {
    const token = formatToken(v.key);
    try {
      await navigator.clipboard.writeText(token);
      toast.success(`Copied ${token}`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <Card className={`rounded-lg border-border p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <VariableIcon className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-semibold text-foreground text-sm">Variables</h4>
      </div>

      <div className="relative mb-3">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search variables…"
          className="rounded-lg pl-9 h-10"
        />
      </div>

      {!defs ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6">
          No variables match "{query}".
        </div>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-auto pr-1">
          {(Object.keys(grouped) as VariableNamespace[]).map((ns) => {
            const items = grouped[ns];
            if (!items.length) return null;
            return (
              <div key={ns}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${NS_STYLES[ns]}`}
                  >
                    {NAMESPACE_LABEL[ns]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {items.length} variable{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => onSelect?.(v)}
                      className="w-full flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition px-2.5 py-2 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-foreground truncate">
                            {formatToken(v.key)}
                          </code>
                          {v.required && (
                            <span className="text-[10px] uppercase tracking-wide text-amber-600">
                              required
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {v.description}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(v);
                        }}
                        title="Copy token"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default EmailVariablesPanel;
