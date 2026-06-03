// Retry a failed SmartBill invoice (admin-only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { issueSmartBillInvoice } from "../_shared/smartbill.ts";

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

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Verify admin
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("user_type")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (roleRow?.user_type !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const invoiceId: string = body.invoice_id;
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();
    if (invErr || !inv) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", inv.profile_id)
      .maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let stripeInvoice: any = { amount_paid: Math.round((Number(inv.amount) || 0) * 100), currency: inv.currency, id: inv.stripe_invoice_id };
    if (inv.stripe_invoice_id) {
      try {
        const fetched = await stripe.invoices.retrieve(inv.stripe_invoice_id);
        stripeInvoice = fetched;
      } catch { /* fall back to stored */ }
    }

    const result = await issueSmartBillInvoice(profile as any, stripeInvoice);

    const update: Record<string, unknown> = {
      status: result.ok ? "issued" : "failed",
      error_message: result.error ?? null,
      smartbill_series: result.series ?? inv.smartbill_series,
      smartbill_number: result.number ?? inv.smartbill_number,
      smartbill_url: result.url ?? inv.smartbill_url,
      issued_at: result.ok ? new Date().toISOString() : inv.issued_at,
    };
    await supabase.from("invoices").update(update).eq("id", invoiceId);

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
