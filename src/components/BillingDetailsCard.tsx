import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save } from "lucide-react";

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

export default function BillingDetailsCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    if (data.billing_entity_type === "company") {
      if (!data.billing_name.trim() || !data.billing_cui.trim()) {
        toast({ title: "Date incomplete", description: "Pentru persoană juridică sunt necesare denumirea și CUI.", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(data as any)
      .eq("id", session.user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Date salvate", description: "Datele de facturare au fost actualizate." });
  };

  if (loading) return null;

  const isCompany = data.billing_entity_type === "company";

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Date de facturare</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Aceste date vor apărea pe facturile emise automat după fiecare plată.
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
          <Label>{isCompany ? "Denumire firmă" : "Nume complet"}</Label>
          <Input
            value={data.billing_name}
            onChange={(e) => setData({ ...data, billing_name: e.target.value })}
            placeholder={isCompany ? "SC Exemplu SRL" : "Ion Popescu"}
          />
        </div>

        {isCompany && (
          <>
            <div className="space-y-1">
              <Label>CUI / CIF</Label>
              <Input
                value={data.billing_cui}
                onChange={(e) => setData({ ...data, billing_cui: e.target.value })}
                placeholder="RO12345678"
              />
            </div>
            <div className="space-y-1">
              <Label>Nr. Reg. Comerțului</Label>
              <Input
                value={data.billing_reg_com}
                onChange={(e) => setData({ ...data, billing_reg_com: e.target.value })}
                placeholder="J40/123/2020"
              />
            </div>
          </>
        )}

        <div className="space-y-1 md:col-span-2">
          <Label>Adresă</Label>
          <Input
            value={data.billing_address}
            onChange={(e) => setData({ ...data, billing_address: e.target.value })}
            placeholder="Str. Exemplu nr. 1, bl. ..."
          />
        </div>
        <div className="space-y-1">
          <Label>Oraș</Label>
          <Input value={data.billing_city} onChange={(e) => setData({ ...data, billing_city: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Județ</Label>
          <Input value={data.billing_county} onChange={(e) => setData({ ...data, billing_county: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Țară</Label>
          <Input value={data.billing_country} onChange={(e) => setData({ ...data, billing_country: e.target.value })} />
        </div>
      </div>

      {isCompany && (
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label>Plătitor de TVA</Label>
            <p className="text-xs text-muted-foreground">Bifați dacă firma este înregistrată în scopuri de TVA.</p>
          </div>
          <Switch
            checked={data.billing_vat_payer}
            onCheckedChange={(v) => setData({ ...data, billing_vat_payer: !!v })}
          />
        </div>
      )}

      <Button onClick={save} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Se salvează…" : "Salvează"}
      </Button>
    </div>
  );
}
