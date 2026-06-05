// Admin-only: issue a synthetic SmartBill invoice for a given profile,
// bypassing Stripe entirely. Used to verify SmartBill credentials + payload
// shape end-to-end without charging a real card.
//
// By default the SmartBill invoice is created as a DRAFT (isDraft=true) so
// it does NOT become a fiscal document. Pass { draft: false } only when you
// want a real fiscal invoice.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { issueSmartBillInvoice } from "../_shared/smartbill.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Monkey-patch the smartbill module via env: we override isDraft by wrapping
// the fetch with a small adapter below.
const SMARTBILL_API_BASE = "https://ws.smartbill.ro/SBORO/api";

function basicAuth(u: string, t: string) {
  return "Basic " + btoa(`${u}:${t}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("user_type")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (roleRow?.user_type !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* default */ }

  const profileId: string = body.profile_id ?? userData.user.id;
  const amount: number = typeof body.amount === "number" ? body.amount : 1; // RON
  const currency: string = (body.currency ?? "RON").toString();
  const draft: boolean = body.draft !== false; // default TRUE — no fiscal side-effects

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (pErr || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found", profile_id: profileId }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("[smartbill-test-issue] profile", profileId, "amount", amount, "draft", draft);

  if (!draft) {
    // Real fiscal invoice — delegate to shared helper.
    const result = await issueSmartBillInvoice(profile as any, {
      id: `TEST-${Date.now()}`,
      amount_paid: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      number: `TEST-${Date.now()}`,
    });
    return new Response(JSON.stringify({ mode: "fiscal", profile_id: profileId, result }), {
      status: result.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Draft mode — replicate the payload locally with isDraft=true.
  const username = Deno.env.get("SMARTBILL_USERNAME");
  const token = Deno.env.get("SMARTBILL_API_TOKEN");
  const cif = Deno.env.get("SMARTBILL_CIF");
  const series = Deno.env.get("SMARTBILL_SERIES");
  const vatPayer = (Deno.env.get("SMARTBILL_VAT_PAYER") ?? "false").toLowerCase() === "true";
  if (!username || !token || !cif || !series) {
    return new Response(JSON.stringify({ error: "SmartBill credentials not fully configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isCompany = (profile.billing_entity_type ?? "individual") === "company";
  const clientName =
    profile.billing_name?.trim() ||
    (isCompany ? profile.stage_name ?? "" : `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()) ||
    profile.email || "Client";

  const client: Record<string, unknown> = {
    name: clientName,
    email: profile.email ?? undefined,
    address: profile.billing_address ?? "",
    city: profile.billing_city ?? "",
    county: profile.billing_county ?? profile.county ?? "",
    country: profile.billing_country ?? profile.country ?? "Romania",
    saveToDb: false,
  };
  if (isCompany) {
    client.vatCode = profile.billing_cui ?? "";
    client.regCom = profile.billing_reg_com ?? "";
    client.isTaxPayer = !!profile.billing_vat_payer;
  } else {
    client.isTaxPayer = false;
  }

  const planLabel = profile.plan ?? "Standard";
  const billingLabel = profile.billing === "yearly" ? "anual" : "lunar";
  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    companyVatCode: cif,
    client,
    issueDate: today,
    seriesName: series,
    isDraft: true,
    dueDate: today,
    mentions: "TEST draft — Muzicalist smartbill-test-issue",
    observations: "Draft generated for SmartBill integration verification. Not a fiscal document.",
    products: [{
      name: `[TEST] Abonament Muzicalist ${planLabel} (${billingLabel})`,
      code: `MUZ-TEST-${planLabel.toUpperCase()}`,
      isService: true,
      measuringUnitName: "buc",
      currency: currency.toUpperCase(),
      quantity: 1,
      price: amount,
      isTaxIncluded: vatPayer,
      taxName: vatPayer ? "Normala" : "SDD",
      taxPercentage: vatPayer ? 19 : 0,
      saveToDb: false,
    }],
    sendEmail: false,
  };

  console.log("[smartbill-test-issue] DRAFT payload:", JSON.stringify(payload));

  try {
    const res = await fetch(`${SMARTBILL_API_BASE}/invoice`, {
      method: "POST",
      headers: {
        Authorization: basicAuth(username, token),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log("[smartbill-test-issue] response", res.status, text);
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* not json */ }

    const ok = res.ok && !(json && json.errorText);
    return new Response(JSON.stringify({
      mode: "draft",
      profile_id: profileId,
      http_status: res.status,
      smartbill_ok: ok,
      smartbill_response: json ?? text,
      payload_sent: payload,
    }), {
      status: ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[smartbill-test-issue] exception", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
