// send-test-email
// Sends a single preview email using the exact same pipeline as
// send-email-campaign: renderCampaignEmail -> CommunicationDispatcher ->
// ResendEmailProvider. Does NOT create a campaign or write any campaign
// statistics. Admin-only.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { renderCampaignEmail } from "../_shared/campaignEmail.ts";
import {
  buildDefaultDispatcher,
  CommunicationPayload,
} from "../_shared/dispatcher/index.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  template_id?: string;
  template_label?: string;
  recipient_email?: string;
  recipient_name?: string | null;
  campaign_name?: string;
}

// Safe demo body used when no explicit template body is provided.
// Values follow the "existing renderer fallback" contract — any unknown
// {{token}} is preserved verbatim by src/lib/templateRenderer.ts.
const DEMO_BODY = `Bună {{artist.name}},

Acesta este un email de test trimis din panoul MUZICALIST pentru a previzualiza template-ul selectat.

Poți gestiona contul tău de artist accesând {{system.dashboard_url}}.

Dacă ai primit acest mesaj din greșeală, îl poți ignora în siguranță.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ code: "COMM_PERMISSION_DENIED", error: "Unauthorized" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return json({ code: "COMM_PERMISSION_DENIED", error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdminData, error: isAdminError } = await admin.rpc("is_admin", {
    _user_id: userId,
  });
  if (isAdminError || !isAdminData) {
    return json({ code: "COMM_PERMISSION_DENIED", error: "Admin access required" }, 403);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ code: "COMM_INVALID_VARIABLE", error: "Invalid JSON body" }, 400);
  }

  const recipientEmail = body.recipient_email?.trim().toLowerCase() ?? "";
  const recipientName = body.recipient_name?.trim() || null;
  const templateId = body.template_id?.trim();
  const templateLabel = body.template_label?.trim() || templateId || "Test Email";

  if (!templateId) {
    return json({ code: "COMM_TEMPLATE_NOT_FOUND", error: "template_id is required" }, 400);
  }
  if (!recipientEmail || !EMAIL_RE.test(recipientEmail)) {
    return json({
      code: "COMM_RECIPIENT_INVALID",
      error: "A valid recipient_email is required",
    }, 400);
  }

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return json({ code: "COMM_CONFIG_MISSING", error: "Email gateway not configured" }, 500);
  }

  // Communication Pipeline stage — same renderer used by campaigns.
  const { subject, html } = renderCampaignEmail({
    campaignName: `[TEST] ${body.campaign_name?.trim() || templateLabel}`,
    template: DEMO_BODY
      .replace(/\{\{artist\.name\}\}/g, recipientName || "Test Artist")
      .replace(/\{\{system\.dashboard_url\}\}/g, "https://muzicalist.com"),
    recipientName,
  });

  const payload: CommunicationPayload = {
    channel: "email",
    subject,
    html,
    text: "",
    metadata: { test_email: true, template_id: templateId },
  };

  const dispatcher = buildDefaultDispatcher({
    lovableApiKey: LOVABLE_API_KEY,
    resendApiKey: RESEND_API_KEY,
  });

  const result = await dispatcher.dispatch({
    channel: "email",
    recipient: { email: recipientEmail, name: recipientName },
    payload,
  });

  if (!result.success) {
    return json({
      code: "COMM_DELIVERY_FAILED",
      error: result.error ?? "Delivery failed",
      provider: result.provider,
    }, 502);
  }

  return json({
    success: true,
    message_id: result.message_id,
    provider: result.provider,
  });
});
