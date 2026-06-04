import Stripe from "npm:stripe@17.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PRICE_MAP } from "../_shared/stripePriceMap.ts";

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
    const body = await req.json();
    const {
      email, password, first_name, last_name, stage_name, phone,
      country, county, specialization, experience_level, career_start_year,
      avatar_base64, plan, billing, success_url, cancel_url,
    } = body ?? {};

    if (!email || !password || !plan || !billing) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (plan !== "Standard" && plan !== "Premium") {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find price_id
    const price_id = Object.entries(PRICE_MAP).find(
      ([_, info]) => info.plan === plan && info.billing === billing
    )?.[0];
    if (!price_id) {
      return new Response(JSON.stringify({ error: "No price configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check email not already taken in profiles
    const normalizedEmail = String(email).toLowerCase().trim();
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "Email already registered" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert pending row
    const { data: pending, error: insErr } = await admin
      .from("pending_artist_registrations")
      .insert({
        email: normalizedEmail,
        password_plain: password,
        first_name, last_name, stage_name, phone,
        country, county, specialization, experience_level,
        career_start_year: career_start_year ? Number(career_start_year) : null,
        avatar_base64: avatar_base64 ?? null,
        plan, billing,
      })
      .select("id")
      .single();
    if (insErr || !pending) {
      console.error("pending insert failed:", insErr);
      return new Response(JSON.stringify({ error: "Failed to save pending registration" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") ?? "https://muzicalist.com";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: normalizedEmail,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url ?? `${origin}/login?signup=success&email=${encodeURIComponent(normalizedEmail)}`,
      cancel_url: cancel_url ?? `${origin}/register/artist?checkout=cancelled&pending=${pending.id}`,
      metadata: { type: "artist_signup", pending_id: pending.id },
      subscription_data: { metadata: { type: "artist_signup", pending_id: pending.id } },
      allow_promotion_codes: true,
    });

    // Save session id on pending row
    await admin
      .from("pending_artist_registrations")
      .update({ stripe_session_id: session.id })
      .eq("id", pending.id);

    return new Response(JSON.stringify({ url: session.url, pending_id: pending.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-pending-artist-checkout error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Checkout failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
