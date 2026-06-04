import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error } = await supabaseAuth.auth.getUser(token);
    if (error || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return new Response(JSON.stringify({ payment_method: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pmId: string | null = null;

    // Prefer subscription's default payment method
    if (profile.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        if (typeof sub.default_payment_method === "string") {
          pmId = sub.default_payment_method;
        } else if (sub.default_payment_method && (sub.default_payment_method as any).id) {
          pmId = (sub.default_payment_method as any).id;
        }
      } catch (_) { /* ignore */ }
    }

    // Fall back to customer's invoice default payment method
    if (!pmId) {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (customer && !(customer as any).deleted) {
        const c = customer as Stripe.Customer;
        const def = c.invoice_settings?.default_payment_method;
        if (typeof def === "string") pmId = def;
        else if (def && (def as any).id) pmId = (def as any).id;
      }
    }

    // Fall back to first card on file
    if (!pmId) {
      const list = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: "card",
        limit: 1,
      });
      if (list.data[0]) pmId = list.data[0].id;
    }

    if (!pmId) {
      return new Response(JSON.stringify({ payment_method: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pm = await stripe.paymentMethods.retrieve(pmId);
    const card = pm.card;
    return new Response(
      JSON.stringify({
        payment_method: card
          ? {
              brand: card.brand,
              last4: card.last4,
              exp_month: card.exp_month,
              exp_year: card.exp_year,
              funding: card.funding,
            }
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-payment-method error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
