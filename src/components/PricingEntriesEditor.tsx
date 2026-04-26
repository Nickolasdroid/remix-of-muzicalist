import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EVENT_TYPES } from "@/lib/eventTypes";
import { CURRENCIES } from "@/lib/currencies";
import { getCurrencyForCountry } from "@/lib/countryCurrencies";

export interface PricingEntry {
  id: string;
  profile_id: string;
  amount: number;
  currency: string;
  event_type: string;
}

interface Props {
  profileId: string;
  country?: string | null;
  editable: boolean;
  onClose?: () => void;
  isAdding?: boolean;
  onAddingChange?: (v: boolean) => void;
  maxEntries?: number;
  onCountChange?: (count: number) => void;
}

const MAX_AMOUNT = 9999999;

export default function PricingEntriesEditor({ profileId, country, editable, onClose, isAdding: isAddingProp, onAddingChange }: Props) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddingState, setIsAddingState] = useState(false);
  const isAdding = isAddingProp !== undefined ? isAddingProp : isAddingState;
  const setIsAdding = (v: boolean) => {
    if (onAddingChange) onAddingChange(v);
    else setIsAddingState(v);
  };

  const defaultCurrency = getCurrencyForCountry(country || undefined) || "EUR";

  const [newAmount, setNewAmount] = useState<string>("");
  const [newCurrency, setNewCurrency] = useState<string>(defaultCurrency);
  const [newEventType, setNewEventType] = useState<string>("");

  useEffect(() => {
    setNewCurrency(defaultCurrency);
  }, [defaultCurrency]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_entries" as any)
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });
    if (!error && data) setEntries(data as unknown as PricingEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profileId]);

  const addEntry = async () => {
    const amountNum = Number(newAmount);
    if (!newAmount || isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Invalid price", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    if (amountNum > MAX_AMOUNT) {
      toast({ title: "Amount too large", description: `Maximum is ${MAX_AMOUNT.toLocaleString()}.`, variant: "destructive" });
      return;
    }
    if (!newCurrency) {
      toast({ title: "Select currency", variant: "destructive" });
      return;
    }
    if (!newEventType) {
      toast({ title: "Select event type", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("pricing_entries" as any)
      .insert({
        profile_id: profileId,
        amount: amountNum,
        currency: newCurrency,
        event_type: newEventType,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEntries((prev) => [...prev, data as unknown as PricingEntry]);
    setNewAmount("");
    setNewEventType("");
    setIsAdding(false);
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("pricing_entries" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }

  return (
    <div className="space-y-3">
      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/40"
            >
              <div className="text-sm md:text-base">
                <span className="font-semibold text-foreground">{e.event_type}</span>
                <span className="text-muted-foreground"> — </span>
                <span className="font-semibold text-foreground">
                  {Number(e.amount).toLocaleString()} {e.currency}
                </span>
              </div>
              {editable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteEntry(e.id)}
                  aria-label="Delete pricing entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground italic text-sm">No prices added yet</p>
      )}

      {editable && !isAdding && isAddingProp === undefined && (
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="h-3 w-3 mr-1" />
          Add price
        </Button>
      )}

      {editable && isAdding && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_AMOUNT}
              step="1"
              placeholder="Amount"
              value={newAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") return setNewAmount("");
                const n = Number(v);
                if (isNaN(n)) return;
                if (n > MAX_AMOUNT) return setNewAmount(String(MAX_AMOUNT));
                if (n < 0) return setNewAmount("0");
                setNewAmount(v);
              }}
            />
            <Select value={newCurrency} onValueChange={setNewCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newEventType} onValueChange={setNewEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => { await addEntry(); }} disabled={saving}>
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewAmount("");
                setNewEventType("");
                setNewCurrency(defaultCurrency);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PricingEntriesDisplay({ profileId }: { profileId: string }) {
  const [entries, setEntries] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("pricing_entries" as any)
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: true });
      if (data) setEntries(data as unknown as PricingEntry[]);
      setLoading(false);
    })();
  }, [profileId]);

  if (loading) return null;
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">Contact for pricing</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((e) => (
        <Badge
          key={e.id}
          variant="outline"
          className="border-accent/50 text-accent text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1"
        >
          {e.event_type}: {Number(e.amount).toLocaleString()} {e.currency}
        </Badge>
      ))}
    </div>
  );
}
