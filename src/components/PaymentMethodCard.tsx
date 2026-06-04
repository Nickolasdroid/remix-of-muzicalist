import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreditCard, Pencil, Loader2 } from "lucide-react";
import { openCustomerPortal } from "@/lib/checkout";

interface CardInfo {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  funding?: string;
}

const brandLabel = (brand: string) => {
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
    cartes_bancaires: "Cartes Bancaires",
  };
  return map[brand?.toLowerCase()] || (brand ? brand.toUpperCase() : "Card");
};

export default function PaymentMethodCard() {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [hasCustomer, setHasCustomer] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: rows } = await (supabase as any).rpc("get_my_full_profile");
      const profile = Array.isArray(rows) ? rows[0] : rows;
      if (!profile?.stripe_customer_id) { setLoading(false); return; }
      setHasCustomer(true);
      try {
        const { data } = await supabase.functions.invoke("get-payment-method", { body: {} });
        if (data?.payment_method) setCard(data.payment_method as CardInfo);
      } catch (e) {
        console.error("get-payment-method failed", e);
      }
      setLoading(false);
    })();
  }, []);

  const handleUpdate = async () => {
    setOpening(true);
    const ok = await openCustomerPortal(window.location.href);
    if (!ok) setOpening(false);
  };

  if (loading) return null;
  if (!hasCustomer) return null;

  const expLabel = card
    ? `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}`
    : null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold text-foreground">Payment method</h2>
        </div>
      </div>

      {card ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-accent/20 to-accent/5 border border-border/60">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {brandLabel(card.brand)} •••• {card.last4}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expires {expLabel}
                {card.funding ? ` · ${card.funding.charAt(0).toUpperCase()}${card.funding.slice(1)}` : ""}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleUpdate} disabled={opening} className="rounded-lg">
            {opening ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
            {opening ? "Opening…" : "Update card"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 flex-wrap">
          <p className="text-sm text-muted-foreground">No card on file.</p>
          <Button variant="outline" onClick={handleUpdate} disabled={opening} className="rounded-lg">
            {opening ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            {opening ? "Opening…" : "Add payment method"}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        Card details are securely stored by Stripe. Muzicalist never sees your full card number.
      </p>
    </div>
  );
}
