import Stripe from "npm:stripe@17.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const POST_SIGNUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { price_id, success_url, cancel_url, user_id: bodyUserId } = body ?? {};

    if (!price_id || typeof price_id !== "string") {
      return new Response(JSON.stringify({ error: "price_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let userId: string | null = null;
    let email: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseAuth.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        email = userData.user.email ?? null;
      }
    }

    // Fallback: post-signup (no session yet). Validate user_id server-side.
    if (!userId && bodyUserId && typeof bodyUserId === "string") {
      const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(bodyUserId);
      if (uErr || !u?.user) {
        return new Response(JSON.stringify({ error: "Invalid user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const createdAt = new Date(u.user.created_at).getTime();
      if (Date.now() - createdAt > POST_SIGNUP_WINDOW_MS) {
        return new Response(JSON.stringify({ error: "Sign-in required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userId = u.user.id;
      email = u.user.email ?? null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const keyMode = stripeKey.startsWith("sk_live_") ? "live" : stripeKey.startsWith("sk_test_") ? "test" : "unknown";
    console.log(`[create-checkout] user=${userId} mode=${keyMode} price_id=${price_id}`);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;

    // Validate existing customer exists in current Stripe mode; otherwise recreate
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as any).deleted) customerId = null;
      } catch (e: any) {
        if (e?.code === "resource_missing") {
          console.log(`[create-checkout] stale customer ${customerId} not in ${keyMode} mode, recreating`);
          customerId = null;
        } else {
          throw e;
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? email ?? undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    const origin = req.headers.get("origin") ?? "https://muzicalist.com";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url ?? `${origin}/dashboard?checkout=success`,
      cancel_url: cancel_url ?? `${origin}/plans?checkout=cancelled`,
      metadata: { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout error:", err);
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const keyMode = stripeKey.startsWith("sk_live_") ? "live" : stripeKey.startsWith("sk_test_") ? "test" : "unknown";
    let message = err?.message || "Checkout failed";
    if (err?.code === "resource_missing" || /No such price/i.test(message)) {
      message = `Stripe price not found in ${keyMode} mode. The price IDs in stripePriceMap.ts must match your Stripe account (and same mode as STRIPE_SECRET_KEY).`;
    }
    return new Response(JSON.stringify({ error: message, code: err?.code, mode: keyMode }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
