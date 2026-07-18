// send-test-email
// Sends a single preview email using the selected template's ACTIVE version.
// Fetches subject + html_content from email_template_versions, substitutes
// safe demo variables, then delivers through the shared CommunicationDispatcher
// -> ResendEmailProvider. Does NOT create a campaign or write statistics.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
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

function substituteVars(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`,
  );
}

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

  // Fetch the selected template's ACTIVE version so the test email renders
  // the exact template the admin selected, not a hardcoded demo body.
  const { data: tpl, error: tplErr } = await admin
    .from("email_templates")
    .select("id, name, active_version_id")
    .eq("id", templateId)
    .maybeSingle();
  if (tplErr || !tpl) {
    return json({ code: "COMM_TEMPLATE_NOT_FOUND", error: "Template not found" }, 404);
  }
  if (!tpl.active_version_id) {
    return json({
      code: "COMM_TEMPLATE_NOT_FOUND",
      error: "Template has no active published version",
    }, 400);
  }

  const { data: version, error: verErr } = await admin
    .from("email_template_versions")
    .select("subject, html_content, text_content")
    .eq("id", tpl.active_version_id)
    .maybeSingle();
  if (verErr || !version || !version.html_content) {
    return json({
      code: "COMM_TEMPLATE_NOT_FOUND",
      error: "Active template version is missing HTML content",
    }, 400);
  }

  const displayName = recipientName || "Test Artist";
  const vars: Record<string, string> = {
    "artist.stage_name": displayName,
    "artist.name": displayName,
    "system.dashboard_url": "https://muzicalist.com/dashboard",
    "recipient.name": displayName,
    "recipient.email": recipientEmail,
  };

  const subject = substituteVars(version.subject ?? tpl.name ?? "Muzicalist", vars);
  const html = substituteVars(version.html_content, vars);
  const text = version.text_content ? substituteVars(version.text_content, vars) : "";

  const payload: CommunicationPayload = {
    channel: "email",
    subject,
    html,
    text,
    metadata: {
      test_email: true,
      template_id: templateId,
      template_version_id: tpl.active_version_id,
    },
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
