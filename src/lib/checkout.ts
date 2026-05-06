import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRICE_BY_PLAN, type Billing } from "@/lib/stripePrices";

type PaidPlan = "Standard" | "Premium";

export async function startCheckout(opts: {
  plan: PaidPlan;
  billing: Billing;
  successUrl?: string;
  cancelUrl?: string;
  userId?: string;
}): Promise<boolean> {
  const price_id = PRICE_BY_PLAN[opts.plan]?.[opts.billing];
  if (!price_id) {
    toast.error("Invalid plan selection");
    return false;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !opts.userId) {
    toast.error("Please sign in to continue");
    return false;
  }

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      price_id,
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      ...(session ? {} : { user_id: opts.userId }),
    },
  });

  if (error || !data?.url) {
    console.error("create-checkout failed:", error, data);
    toast.error(data?.error || error?.message || "Could not start checkout");
    return false;
  }

  window.location.href = data.url as string;
  return true;
}

export async function openCustomerPortal(returnUrl?: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast.error("Please sign in to continue");
    return false;
  }

  const { data, error } = await supabase.functions.invoke("customer-portal", {
    body: { return_url: returnUrl },
  });

  if (error || !data?.url) {
    console.error("customer-portal failed:", error, data);
    toast.error(data?.error || error?.message || "Could not open billing portal");
    return false;
  }

  window.location.href = data.url as string;
  return true;
}
