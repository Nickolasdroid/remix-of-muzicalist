import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import ManageSubscriptionCard from "@/components/ManageSubscriptionCard";
import PaymentMethodCard from "@/components/PaymentMethodCard";
import BillingDetailsCard from "@/components/BillingDetailsCard";
import InvoicesCard from "@/components/InvoicesCard";

export default function BillingSection() {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [billingComplete, setBillingComplete] = useState(true);
  const [checked, setChecked] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setChecked(true); return; }
    const { data } = await supabase
      .from("profiles")
      .select("plan, stripe_customer_id, billing_entity_type, billing_name, billing_address, billing_city, billing_country, billing_cui")
      .eq("id", session.user.id)
      .maybeSingle();
    if (data) {
      setHasActiveSubscription(!!data.stripe_customer_id && (data.plan || "Free") !== "Free");
      const isCompany = (data as any).billing_entity_type === "company";
      const complete = !!(
        (data as any).billing_name &&
        (data as any).billing_address &&
        (data as any).billing_city &&
        (data as any).billing_country &&
        (!isCompany || (data as any).billing_cui)
      );
      setBillingComplete(complete);
    }
    setChecked(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showWarning = checked && hasActiveSubscription && !billingComplete;

  return (
    <div className="space-y-4">
      {showWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-300">
              Please complete your billing information to receive invoices.
            </p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Invoice generation is paused until your billing details are saved.
            </p>
          </div>
        </div>
      )}
      <ManageSubscriptionCard />
      <BillingDetailsCard onSaved={load} />
      <InvoicesCard />
    </div>
  );
}
