// Sends suspension / reactivation emails to end users.
// Called from the admin dashboard after a suspend_account / reactivate_account RPC.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://muzicalist.com";
const FROM = "Muzicalist <noreply@muzicalist.com>";
const LOGO_URL =
  "https://muzicalist.com/__l5e/assets-v1/4023aaf1-cafa-4e98-b2ad-2daef180891b/muzicalist-logo.png";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam or unwanted content",
  fake_account: "Fake account",
  abuse: "Offensive or abusive behaviour",
  fraud: "Fraud or suspicious activity",
  copyright: "Copyright infringement",
  tos_violation: "Violation of Muzicalist Terms of Service",
  multiple_reports: "Multiple user reports",
  user_request: "Requested by the user",
  other: "Other",
};

const DURATION_LABELS: Record<string, string> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  permanent: "Permanent",
  manual: "Until manually reactivated",
};

function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderEmail(opts: {
  headline: string;
  greeting: string;
  bodyLines: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  preview: string;
}) {
  const paragraphs = opts.bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 18px 0;color:#c9c9cf;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${l}</p>`,
    )
    .join("");
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<tr><td align="center" style="padding:16px 40px 40px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#f5b301" style="border-radius:10px;">
            <a href="${opts.ctaUrl}" target="_blank" style="display:inline-block;background:#f5b301;color:#0b0b0e;text-decoration:none;font-weight:700;font-size:16px;line-height:1;padding:16px 34px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;">${opts.ctaLabel}</a>
          </td></tr></table></td></tr>`
      : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(opts.headline)}</title></head>
<body style="margin:0;padding:0;background:#000;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(opts.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#111114;border:1px solid #1f1f24;border-radius:16px;overflow:hidden;">
<tr><td align="center" style="padding:40px 32px 20px 32px;background:#0b0b0e;">
  <img src="${LOGO_URL}" alt="Muzicalist" width="72" height="72" style="display:block;width:72px;height:72px;border:0;"/>
</td></tr>
<tr><td style="padding:36px 40px 8px 40px;">
  <h1 style="margin:0 0 20px 0;color:#fff;font-size:26px;line-height:1.3;font-weight:700;">${esc(opts.headline)}</h1>
  <p style="margin:0 0 18px 0;color:#fff;font-size:16px;line-height:1.6;font-weight:600;">${esc(opts.greeting)}</p>
  ${paragraphs}
</td></tr>
${cta}
<tr><td align="center" style="padding:24px 40px 36px 40px;border-top:1px solid #1f1f24;">
  <p style="margin:0 0 6px 0;color:#c9c9cf;font-size:14px;font-weight:600;">The Muzicalist Team</p>
  <p style="margin:0;color:#6b6b73;font-size:12px;"><a href="${SITE_URL}" style="color:#6b6b73;text-decoration:none;">muzicalist.com</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const AUTH = req.headers.get("Authorization");

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "email_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only admins may trigger this
    if (!AUTH) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authed = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: AUTH } },
    });
    const { data: userData } = await authed.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      user_id?: string;
      reason?: string;
      other_reason?: string | null;
      duration_key?: string;
      type?: "suspended" | "reactivated";
    };
    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "user_id_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("email, first_name, stage_name")
      .eq("id", body.user_id)
      .maybeSingle();

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: "profile_email_missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = profile.stage_name || profile.first_name || "there";
    let subject = "";
    let html = "";

    if (body.type === "reactivated") {
      subject = "Your Muzicalist account has been reactivated";
      html = renderEmail({
        headline: "Welcome back to Muzicalist",
        greeting: `Hello ${name},`,
        bodyLines: [
          "Your account has been reactivated. You can now log in and continue using the platform.",
          "If you have any questions, contact us at contact@muzicalist.com.",
        ],
        ctaLabel: "Log in",
        ctaUrl: `${SITE_URL}/login`,
        preview: "Your Muzicalist account is active again.",
      });
    } else {
      const reasonLabel = REASON_LABELS[body.reason ?? ""] ?? "Terms of Service violation";
      const durationLabel = DURATION_LABELS[body.duration_key ?? ""] ?? "Until manually reactivated";
      subject = "Your Muzicalist account has been suspended";
      const lines = [
        "We're writing to let you know that your account on Muzicalist has been temporarily suspended.",
        `<strong style="color:#fff;">Reason:</strong> ${esc(reasonLabel)}`,
        `<strong style="color:#fff;">Duration:</strong> ${esc(durationLabel)}`,
      ];
      if (body.other_reason) {
        lines.push(`<strong style="color:#fff;">Details:</strong> ${esc(body.other_reason)}`);
      }
      lines.push(
        "While your account is suspended you will not be able to log in, send messages, post content, book artists, or leave reviews. All your data is preserved.",
        "If you believe this suspension was made in error, please contact us at contact@muzicalist.com.",
      );
      html = renderEmail({
        headline: "Account suspended",
        greeting: `Hello ${name},`,
        bodyLines: lines,
        preview: "Your Muzicalist account has been suspended.",
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [profile.email],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Resend send failed", t);
      return new Response(JSON.stringify({ error: "send_failed", detail: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-suspension-email error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
