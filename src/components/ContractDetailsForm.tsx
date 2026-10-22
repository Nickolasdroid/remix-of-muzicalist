import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ContractDetails, ENTITY_TYPE_OPTIONS, EntityType, isCompany } from "@/lib/contracts";

export interface ContractDetailsFormHandle {
  /** Validates and saves. Returns true on success. */
  save: () => Promise<boolean>;
}

interface ContractDetailsFormProps {
  /** Show the built-in Save button (Settings). The accept dialog saves through the ref instead. */
  showSaveButton?: boolean;
  /** Organizer flow: fewer fields (no IBAN / VAT), address required */
  variant?: "artist" | "organizer";
  onSaved?: () => void;
}

const EMPTY: ContractDetails = {
  entity_type: "individual",
  legal_name: "",
  cui: "",
  reg_com: "",
  address: "",
  city: "",
  county: "",
  country: "",
  representative: "",
  vat_payer: false,
  iban: "",
  bank: "",
};

const clean = (s?: string | null) => {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
};

/**
 * Private contract details (individual / PFA / II / SRL). Only the owner can read them;
 * they are copied into a contract only when a booking is confirmed.
 */
const ContractDetailsForm = forwardRef<ContractDetailsFormHandle, ContractDetailsFormProps>(
  ({ showSaveButton = false, variant = "artist", onSaved }, ref) => {
    const { toast } = useToast();
    const [form, setForm] = useState<ContractDetails>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
      let cancelled = false;
      (async () => {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) {
          setLoading(false);
          return;
        }
        const { data } = await (supabase as any)
          .from("contract_profiles")
          .select("entity_type, legal_name, cui, reg_com, address, city, county, country, representative, vat_payer, iban, bank")
          .eq("user_id", uid)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setForm({ ...EMPTY, ...data });
        } else {
          // Pre-fill from the public profile
          const { data: p } = await supabase
            .from("profiles")
            .select("first_name, last_name, county, country")
            .eq("id", uid)
            .maybeSingle();
          if (!cancelled && p) {
            setForm((f) => ({
              ...f,
              legal_name: [p.first_name, p.last_name].filter(Boolean).join(" "),
              county: p.county || "",
              country: p.country || "",
            }));
          }
        }
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    const company = isCompany(form.entity_type);
    const set = <K extends keyof ContractDetails>(k: K, val: ContractDetails[K]) => {
      setForm((f) => ({ ...f, [k]: val }));
      setErrors((e) => ({ ...e, [k]: false }));
    };

    const save = async (): Promise<boolean> => {
      const nextErrors: Record<string, boolean> = {};
      if ((form.legal_name || "").trim().length < 2) nextErrors.legal_name = true;
      if (!clean(form.address)) nextErrors.address = true;
      if (company && !clean(form.cui)) nextErrors.cui = true;
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        toast({
          title: "Some details are missing",
          description: "Please fill in the highlighted fields.",
          variant: "destructive",
        });
        return false;
      }

      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setSaving(false);
        return false;
      }
      const row = {
        user_id: uid,
        entity_type: form.entity_type,
        legal_name: form.legal_name.trim(),
        cui: company ? clean(form.cui)?.toUpperCase() ?? null : null,
        reg_com: company ? clean(form.reg_com)?.toUpperCase() ?? null : null,
        address: clean(form.address),
        city: clean(form.city),
        county: clean(form.county),
        country: clean(form.country),
        representative: form.entity_type === "srl" || form.entity_type === "other_company" ? clean(form.representative) : null,
        vat_payer: company ? !!form.vat_payer : false,
        iban: variant === "artist" ? clean(form.iban)?.replace(/\s+/g, "").toUpperCase() ?? null : null,
        bank: variant === "artist" ? clean(form.bank) : null,
      };
      const { error } = await (supabase as any).from("contract_profiles").upsert(row, { onConflict: "user_id" });
      setSaving(false);
      if (error) {
        toast({ title: "Could not save", description: "Please check the details and try again.", variant: "destructive" });
        return false;
      }
      if (showSaveButton) toast({ title: "Contract details saved" });
      onSaved?.();
      return true;
    };

    useImperativeHandle(ref, () => ({ save }));

    if (loading) {
      return (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const err = (k: string) => (errors[k] ? "border-destructive focus-visible:ring-destructive" : "");

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Only you can see these details. They are added to a contract only when a booking is confirmed, and only
            the other party of that booking can see that contract.
          </span>
        </div>

        <div className="space-y-1.5">
          <Label>{variant === "artist" ? "I issue contracts as" : "I book as"}</Label>
          <Select value={form.entity_type} onValueChange={(val) => set("entity_type", val as EntityType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPE_OPTIONS.filter((o) => variant === "artist" || ["individual", "srl", "other_company", "pfa"].includes(o.value)).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cd-name">{company ? "Company name" : "Full name"}</Label>
          <Input
            id="cd-name"
            className={err("legal_name")}
            value={form.legal_name}
            maxLength={200}
            placeholder={company ? "e.g. Pop Andrei PFA" : "e.g. Andrei Pop"}
            onChange={(e) => set("legal_name", e.target.value)}
          />
        </div>

        {company && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cd-cui">Tax ID (CUI)</Label>
              <Input id="cd-cui" className={err("cui")} value={form.cui || ""} maxLength={20} placeholder="RO12345678" onChange={(e) => set("cui", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cd-reg">Trade Register no.</Label>
              <Input id="cd-reg" value={form.reg_com || ""} maxLength={40} placeholder="F12/345/2020" onChange={(e) => set("reg_com", e.target.value)} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="cd-address">{company ? "Registered address" : "Address"}</Label>
          <Input
            id="cd-address"
            className={err("address")}
            value={form.address || ""}
            maxLength={300}
            placeholder="Street, number, building, apartment"
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cd-city">City</Label>
            <Input id="cd-city" value={form.city || ""} maxLength={100} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cd-county">County</Label>
            <Input id="cd-county" value={form.county || ""} maxLength={100} onChange={(e) => set("county", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cd-country">Country</Label>
            <Input id="cd-country" value={form.country || ""} maxLength={100} onChange={(e) => set("country", e.target.value)} />
          </div>
        </div>

        {(form.entity_type === "srl" || form.entity_type === "other_company") && (
          <div className="space-y-1.5">
            <Label htmlFor="cd-rep">Legal representative</Label>
            <Input id="cd-rep" value={form.representative || ""} maxLength={150} placeholder="Name, position (e.g. Administrator)" onChange={(e) => set("representative", e.target.value)} />
          </div>
        )}

        {variant === "artist" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cd-iban">IBAN (optional)</Label>
              <Input id="cd-iban" value={form.iban || ""} maxLength={40} placeholder="RO49 AAAA 1B31 0075 9384 0000" onChange={(e) => set("iban", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cd-bank">Bank (optional)</Label>
              <Input id="cd-bank" value={form.bank || ""} maxLength={100} onChange={(e) => set("bank", e.target.value)} />
            </div>
          </div>
        )}

        {company && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
            <Label htmlFor="cd-vat" className="font-normal">Registered for VAT</Label>
            <Switch id="cd-vat" checked={!!form.vat_payer} onCheckedChange={(val) => set("vat_payer", val)} />
          </div>
        )}

        {showSaveButton && (
          <Button onClick={save} disabled={saving} className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save contract details
          </Button>
        )}
      </div>
    );
  }
);

ContractDetailsForm.displayName = "ContractDetailsForm";

export default ContractDetailsForm;
