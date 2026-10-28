import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import EventTypePicker from "@/components/EventTypePicker";
import { CURRENCIES } from "@/lib/currencies";
import { getCurrencyForCountry } from "@/lib/countryCurrencies";
import { cn } from "@/lib/utils";

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
  maxEntries?: number;
  onCountChange?: (count: number) => void;
  /** View mode: opens the editor (shows the "+ Add" chip) */
  onAdd?: () => void;
}

const MAX_AMOUNT = 9999999;

const formatAmount = (n: number, lang: string) =>
  Number(n).toLocaleString(lang.startsWith("ro") ? "ro-RO" : "en-GB", { maximumFractionDigits: 2 });

/** Gold filled tag: "Wedding  3.500 RON" (same look as the announcement price). */
const PriceChip = ({ entry, lang }: { entry: PricingEntry; lang: string }) => (
  <span className="inline-flex items-baseline gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 leading-none">
    <span className="text-[12.5px] font-medium text-accent/80">{entry.event_type}</span>
    <span className="text-[13.5px] font-bold text-accent notranslate tabular-nums" translate="no">
      {formatAmount(entry.amount, lang)} {entry.currency}
    </span>
  </span>
);

export default function PricingEntriesEditor({ profileId, country, editable, maxEntries, onCountChange, onAdd }: Props) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const ro = lang.startsWith("ro");
  const [entries, setEntries] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultCurrency = getCurrencyForCountry(country || undefined) || "EUR";
  const [newAmount, setNewAmount] = useState("");
  const [newCurrency, setNewCurrency] = useState(defaultCurrency);
  const [newEventType, setNewEventType] = useState("");
  const [pickerKey, setPickerKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setNewCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pricing_entries" as any)
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: true });
      if (!alive) return;
      if (!error && data) setEntries(data as unknown as PricingEntry[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [profileId]);

  useEffect(() => {
    onCountChange?.(entries.length);
  }, [entries.length, onCountChange]);

  const atLimit = maxEntries !== undefined && entries.length >= maxEntries;
  const left = maxEntries !== undefined ? Math.max(0, maxEntries - entries.length) : null;

  const resetForm = () => {
    setEditingId(null);
    setNewAmount("");
    setNewEventType("");
    setNewCurrency(defaultCurrency);
    setPickerKey((k) => k + 1);
  };

  const startEdit = (e: PricingEntry) => {
    setEditingId(e.id);
    setNewEventType(e.event_type);
    setNewAmount(Number(e.amount).toLocaleString(ro ? "ro-RO" : "en-GB", { maximumFractionDigits: 0 }));
    setNewCurrency(e.currency);
    setPickerKey((k) => k + 1);
  };

  const saveEntry = async () => {
    if (!editingId && atLimit) {
      toast({ title: "Limit reached", description: `You can save up to ${maxEntries} prices.`, variant: "destructive" });
      return;
    }
    const eventType = newEventType.trim();
    if (!eventType) {
      toast({ title: "Select event type", variant: "destructive" });
      return;
    }
    if (entries.some((e) => e.id !== editingId && e.event_type.toLowerCase() === eventType.toLowerCase())) {
      toast({ title: "You already have a price for this event type", variant: "destructive" });
      return;
    }
    const amountNum = Number(newAmount.replace(/\D/g, ""));
    if (!newAmount || isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Invalid price", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    if (amountNum > MAX_AMOUNT) {
      toast({ title: "Amount too large", description: `Maximum is ${MAX_AMOUNT.toLocaleString()}.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const values = { amount: amountNum, currency: newCurrency, event_type: eventType };
    const { data, error } = editingId
      ? await supabase.from("pricing_entries" as any).update(values).eq("id", editingId).select().single()
      : await supabase
          .from("pricing_entries" as any)
          .insert({ profile_id: profileId, ...values })
          .select()
          .single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const saved = data as unknown as PricingEntry;
    setEntries((prev) => (editingId ? prev.map((x) => (x.id === editingId ? saved : x)) : [...prev, saved]));
    resetForm();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("pricing_entries" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Dashboard section: gold tags + "+ Add"
  if (!editable) {
    return (
      <div className="flex flex-wrap gap-2">
        {entries.map((e) => (
          <PriceChip key={e.id} entry={e} lang={lang} />
        ))}
        {onAdd && !atLimit && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent/50 px-3 py-1.5 text-[13px] font-semibold leading-none text-accent transition-colors hover:bg-accent/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{entries.length ? "Add" : "Add your first price"}</span>
          </button>
        )}
        {!onAdd && entries.length === 0 && <p className="text-muted-foreground italic text-sm">No prices added yet</p>}
      </div>
    );
  }

  // Dialog body: saved prices, then the add form
  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15">
          <DollarSign className="h-5 w-5 text-accent" />
        </div>
        <h2 className="text-lg font-bold">Estimated Prices</h2>
        <p className="text-[13px] leading-snug text-muted-foreground">
          What you usually charge per event type. Organizers see them on your profile.
        </p>
      </div>

      {entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className={cn(
                "flex items-center gap-1 rounded-xl bg-secondary/50 py-1 pr-1 ring-1 ring-transparent transition-colors",
                editingId === e.id && "bg-accent/10 ring-accent/50",
              )}
            >
              <button
                type="button"
                onClick={() => (editingId === e.id ? resetForm() : startEdit(e))}
                className="flex min-w-0 flex-1 items-center gap-2 py-1 pl-3 text-left"
                aria-label="Edit price"
              >
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{e.event_type}</span>
                <span className="shrink-0 text-[14px] font-bold text-accent notranslate tabular-nums" translate="no">
                  {formatAmount(e.amount, lang)} {e.currency}
                </span>
                <Pencil className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteEntry(e.id)}
                aria-label="Delete pricing entry"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!atLimit || editingId ? (
        <div className={cn(entries.length > 0 && "mt-4 border-t border-border pt-1")}>
          {editingId && (
            <p className="mt-3 text-[13px] font-semibold text-accent">Edit price</p>
          )}
          <label className="mb-1.5 mt-3 block text-[13.5px] font-semibold">Event type</label>
          <EventTypePicker
            key={pickerKey}
            value={newEventType}
            onChange={setNewEventType}
            triggerClassName="h-11 rounded-lg bg-background data-[placeholder]:text-muted-foreground"
            otherInputClassName="h-11 rounded-lg"
          />

          <label className="mb-1.5 mt-4 block text-[13.5px] font-semibold">Price</label>
          <div className="flex">
            <Input
              type="text"
              inputMode="numeric"
              placeholder={ro ? "ex. 1.500" : "e.g. 1,500"}
              value={newAmount}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
                setNewAmount(digits ? Number(digits).toLocaleString(ro ? "ro-RO" : "en-GB") : "");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEntry();
              }}
              className="h-11 flex-1 rounded-r-none bg-background text-[15px] tabular-nums notranslate"
              translate="no"
            />
            <Select value={newCurrency} onValueChange={setNewCurrency}>
              <SelectTrigger className="h-11 w-[100px] rounded-l-none border-l-0 bg-background font-semibold notranslate" translate="no">
                <SelectValue>{newCurrency}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="notranslate" translate="no">
                    {c.code} <span className="text-muted-foreground">· {c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="mt-5 h-12 w-full rounded-xl text-[15px] font-bold"
            onClick={saveEntry}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span key={editingId ? "save" : "add"}>{editingId ? "Save changes" : "Add the price"}</span>
            )}
          </Button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="mx-auto mt-2 block text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          ) : left != null && (
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              {entries.length === 0 ? (
                <span key="max">
                  <span>{ro ? "Poți adăuga până la" : "You can add up to"}</span>{" "}
                  <span className="notranslate" translate="no">
                    {maxEntries} {ro ? (maxEntries === 1 ? "preț" : "prețuri") : maxEntries === 1 ? "price" : "prices"}
                  </span>
                </span>
              ) : (
                <span key="left" className="notranslate" translate="no">
                  {ro
                    ? `Mai poți adăuga ${left} ${left === 1 ? "preț" : "prețuri"}`
                    : `You can add ${left} more ${left === 1 ? "price" : "prices"}`}
                </span>
              )}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <span className="notranslate" translate="no">
            {ro
              ? `Ai atins limita de ${maxEntries} prețuri pentru planul tău.`
              : `You reached the limit of ${maxEntries} prices for your plan.`}
          </span>
        </p>
      )}
    </div>
  );
}

export function PricingEntriesDisplay({ profileId }: { profileId: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
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
        <PriceChip key={e.id} entry={e} lang={lang} />
      ))}
    </div>
  );
}
