import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { verifyCompanyByCui } from "@/lib/companyLookup";

type EntityType = "individual" | "company";

interface BillingFields {
  billing_entity_type: EntityType;
  billing_name: string;
  billing_cui: string;
  billing_reg_com: string;
  billing_address: string;
  billing_city: string;
  billing_county: string;
  billing_country: string;
  billing_vat_payer: boolean;
}

const DEFAULTS: BillingFields = {
  billing_entity_type: "individual",
  billing_name: "",
  billing_cui: "",
  billing_reg_com: "",
  billing_address: "",
  billing_city: "",
  billing_county: "",
  billing_country: "Romania",
  billing_vat_payer: false,
};

interface Props {
  onSaved?: () => void;
}

export default function BillingDetailsCard({ onSaved }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BillingFields, string>>>({});
  const [data, setData] = useState<BillingFields>(DEFAULTS);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("billing_entity_type, billing_name, billing_cui, billing_reg_com, billing_address, billing_city, billing_county, billing_country, billing_vat_payer")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        setData({
          billing_entity_type: ((profile as any).billing_entity_type as EntityType) || "individual",
          billing_name: (profile as any).billing_name || "",
          billing_cui: (profile as any).billing_cui || "",
          billing_reg_com: (profile as any).billing_reg_com || "",
          billing_address: (profile as any).billing_address || "",
          billing_city: (profile as any).billing_city || "",
          billing_county: (profile as any).billing_county || "",
          billing_country: (profile as any).billing_country || "Romania",
          billing_vat_payer: !!(profile as any).billing_vat_payer,
        });
      }
      setLoading(false);
    })();
  }, []);

  const validate = (d: BillingFields): Partial<Record<keyof BillingFields, string>> => {
    const e: Partial<Record<keyof BillingFields, string>> = {};
    if (!d.billing_name.trim()) e.billing_name = "Required";
    if (!d.billing_address.trim()) e.billing_address = "Required";
    if (!d.billing_city.trim()) e.billing_city = "Required";
    if (!d.billing_country.trim()) e.billing_country = "Required";
    if (d.billing_entity_type === "company") {
      if (!d.billing_name.trim()) e.billing_name = "Company name is required";
      if (!d.billing_cui.trim()) e.billing_cui = "CIF / VAT number is required";
    }
    return e;
  };

  const handleVerify = async () => {
    if (!data.billing_cui.trim()) {
      setErrors((p) => ({ ...p, billing_cui: "Enter a CIF to verify" }));
      return;
    }
    setVerifying(true);
    const res = await verifyCompanyByCui(data.billing_cui.trim());
    setVerifying(false);
    if (res.ok && res.data) {
      setData((d) => ({
        ...d,
        billing_name: res.data!.name || d.billing_name,
        billing_reg_com: res.data!.reg_com || d.billing_reg_com,
        billing_address: res.data!.address || d.billing_address,
        billing_city: res.data!.city || d.billing_city,
        billing_county: res.data!.county || d.billing_county,
        billing_country: res.data!.country || d.billing_country,
        billing_vat_payer: res.data!.vat_payer ?? d.billing_vat_payer,
      }));
      toast({ title: "Company verified", description: "Details auto-filled." });
    } else {
      toast({
        title: "Verification unavailable",
        description: res.error || "Try again later.",
      });
    }
  };

  const save = async () => {
    const v = validate(data);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast({
        title: "Missing information",
        description: "Please fill in the required fields.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update(data as any)
      .eq("id", session.user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Billing information updated successfully." });
    setSavedRecently(true);
    onSaved?.();
    setTimeout(() => setSavedRecently(false), 4000);
  };

  if (loading) return null;

  const isCompany = data.billing_entity_type === "company";

  const fieldClass = (k: keyof BillingFields) =>
    errors[k] ? "rounded-lg border-destructive focus-visible:ring-destructive" : "rounded-lg";

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Billing information</h2>
        </div>
        {savedRecently && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        These details will appear on invoices issued automatically after each payment.
      </p>

      <RadioGroup
        value={data.billing_entity_type}
        onValueChange={(v) => setData({ ...data, billing_entity_type: v as EntityType })}
        className="flex gap-6"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="individual" id="bill-individual" />
          <Label htmlFor="bill-individual">Persoană fizică</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="company" id="bill-company" />
          <Label htmlFor="bill-company">Persoană juridică</Label>
        </div>
      </RadioGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>
            {isCompany ? "Company name" : "Full name"} <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.billing_name}
            onChange={(e) => setData({ ...data, billing_name: e.target.value })}
            placeholder={isCompany ? "SC Exemplu SRL" : "Ion Popescu"}
            className={fieldClass("billing_name")}
          />
          {errors.billing_name && <p className="text-xs text-destructive">{errors.billing_name}</p>}
        </div>

        {isCompany && (
          <>
            <div className="space-y-1">
              <Label>
                CIF / VAT number <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={data.billing_cui}
                  onChange={(e) => setData({ ...data, billing_cui: e.target.value })}
                  placeholder="RO12345678"
                  className={fieldClass("billing_cui")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="rounded-lg shrink-0"
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Verify</span>
                </Button>
              </div>
              {errors.billing_cui && <p className="text-xs text-destructive">{errors.billing_cui}</p>}
            </div>
            <div className="space-y-1">
              <Label>Trade register no.</Label>
              <Input
                value={data.billing_reg_com}
                onChange={(e) => setData({ ...data, billing_reg_com: e.target.value })}
                placeholder="J40/123/2020"
                className="rounded-lg"
              />
            </div>
          </>
        )}

        <div className="space-y-1 md:col-span-2">
          <Label>
            Address <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.billing_address}
            onChange={(e) => setData({ ...data, billing_address: e.target.value })}
            placeholder="Str. Exemplu nr. 1, bl. ..."
            className={fieldClass("billing_address")}
          />
          {errors.billing_address && <p className="text-xs text-destructive">{errors.billing_address}</p>}
        </div>
        <div className="space-y-1">
          <Label>
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.billing_city}
            onChange={(e) => setData({ ...data, billing_city: e.target.value })}
            className={fieldClass("billing_city")}
          />
          {errors.billing_city && <p className="text-xs text-destructive">{errors.billing_city}</p>}
        </div>
        <div className="space-y-1">
          <Label>County / Region</Label>
          <Input
            value={data.billing_county}
            onChange={(e) => setData({ ...data, billing_county: e.target.value })}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label>
            Country <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.billing_country}
            onChange={(e) => setData({ ...data, billing_country: e.target.value })}
            className={fieldClass("billing_country")}
          />
        </div>
      </div>

      {isCompany && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label>VAT registered</Label>
            <p className="text-xs text-muted-foreground">Toggle on if the company is registered for VAT.</p>
          </div>
          <Switch
            checked={data.billing_vat_payer}
            onCheckedChange={(v) => setData({ ...data, billing_vat_payer: !!v })}
          />
        </div>
      )}

      <Button onClick={save} disabled={saving} className="rounded-lg">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving…" : "Save billing information"}
      </Button>
    </div>
  );
}
