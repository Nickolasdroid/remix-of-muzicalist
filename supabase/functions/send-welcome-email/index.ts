// Sends a one-time branded welcome email. Invoked only by the internal
// DB trigger `trg_welcome_email` on `public.user_roles` via pg_net, and
// authenticated with a shared secret stored in Supabase Vault.
//
// Any request without a valid `x-welcome-trigger-secret` header is rejected.
// Deduplication is enforced atomically via `profiles.welcome_email_sent_at`.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-welcome-trigger-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://muzicalist.com";
const FROM = "Muzicalist <noreply@muzicalist.com>";
const LOGO_URL =
  "https://muzicalist.com/__l5e/assets-v1/4023aaf1-cafa-4e98-b2ad-2daef180891b/muzicalist-logo.png";

// Deterministic brand-name safeguard for email content.
//
// Scope is intentionally narrow: we ONLY rewrite the single mutation observed
// in production ("Musicalist" / "MUSICALIST") back to the canonical brand
// spelling. Other fuzzy variants and unrelated words are untouched.
//
// `translate="no"` / `class="notranslate"` markers are ALSO added around
// brand mentions in the rendered HTML as a best-effort compatibility hint —
// Google Translate and Gmail's built-in translator honor them, but not every
// mail client / translation engine is guaranteed to respect the attribute.
// The deterministic normalization here is what we can control before delivery.
const BRAND_REGEX = /\bMusicalist\b/g;
const BRAND_REGEX_UPPER = /\bMUSICALIST\b/g;
function normalizeBrand(s: string): string {
  return s.replace(BRAND_REGEX_UPPER, "MUZICALIST").replace(BRAND_REGEX, "Muzicalist");
}
function protectBrand(s: string): string {
  return normalizeBrand(s).replace(
    /\b(Muzicalist|MUZICALIST)\b/g,
    '<span translate="no" class="notranslate">$1</span>'
  );
}

function renderEmail(opts: {
  headline: string;
  greeting: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  preview: string;
}) {
  const { headline, greeting, bodyLines, ctaLabel, ctaUrl, preview } = opts;
  const safeHeadline = protectBrand(headline);
  const safeGreeting = protectBrand(greeting);
  const safePreview = normalizeBrand(preview); // hidden preheader — no HTML span
  const paragraphs = bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 18px 0;color:#c9c9cf;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${protectBrand(l)}</p>`
    )
    .join("");
  return `<!doctype html>
<html lang="en" translate="no">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark only" />
    <meta name="supported-color-schemes" content="dark only" />
    <meta name="google" content="notranslate" />
    <title>${safeHeadline}</title>
  </head>
  <body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">${safePreview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#111114;border:1px solid #1f1f24;border-radius:16px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:40px 32px 20px 32px;background:#0b0b0e;">
                <img src="${LOGO_URL}" alt="Muzicalist" width="72" height="72" style="display:block;width:72px;height:72px;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;background:#0b0b0e;">
                <div style="height:1px;line-height:1px;font-size:0;background:linear-gradient(to right, rgba(245,179,1,0), rgba(245,179,1,0.35), rgba(245,179,1,0));">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 8px 40px;">
                <h1 style="margin:0 0 20px 0;color:#ffffff;font-size:26px;line-height:1.3;font-weight:700;font-family:Arial,Helvetica,sans-serif;letter-spacing:-0.2px;">${safeHeadline}</h1>
                <p style="margin:0 0 18px 0;color:#ffffff;font-size:16px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;font-weight:600;">${safeGreeting}</p>
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 40px 40px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#f5b301" style="border-radius:10px;">
                      <a href="${ctaUrl}" target="_blank" style="display:inline-block;background:#f5b301;color:#0b0b0e;text-decoration:none;font-weight:700;font-size:16px;line-height:1;padding:16px 34px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.2px;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;">
                <div style="height:1px;line-height:1px;font-size:0;background:#1f1f24;">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 40px 36px 40px;">
                <p style="margin:0 0 6px 0;color:#c9c9cf;font-size:14px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;font-weight:600;">The <span translate="no" class="notranslate">Muzicalist</span> Team</p>
                <p style="margin:0;color:#6b6b73;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                  <a href="${SITE_URL}" translate="no" class="notranslate" style="color:#6b6b73;text-decoration:none;">muzicalist.com</a>
                </p>
              </td>
            </tr>
          </table>
          <div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error("Missing email gateway credentials");
      return new Response(JSON.stringify({ error: "email_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Authenticate the caller against the vault-backed shared secret ----
    const providedSecret = req.headers.get("x-welcome-trigger-secret");
    if (!providedSecret || providedSecret.length < 16) return unauthorized();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: verified, error: verifyErr } = await admin.rpc(
      "verify_welcome_trigger_secret",
      { _secret: providedSecret }
    );
    if (verifyErr) {
      console.error("Secret verify RPC failed:", verifyErr);
      return unauthorized();
    }
    if (verified !== true) return unauthorized();

    // ---- Parse trusted payload (only user_id, and only after auth) ----
    const body = (await req.json().catch(() => ({}))) as { user_id?: string };
    const userId = body.user_id;
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "user_id_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Atomic reservation: mark as sent + increment attempts, only if
    //      not already sent and under the retry cap. This gives at-most-once
    //      per attempt window and self-heals across retries.
    const nowIso = new Date().toISOString();
    const { data: current, error: readErr } = await admin
      .from("profiles")
      .select("welcome_email_attempts")
      .eq("id", userId)
      .maybeSingle();
    if (readErr) {
      console.error("Read attempts error:", readErr);
      return new Response(JSON.stringify({ error: "claim_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const prevAttempts = current?.welcome_email_attempts ?? 0;

    const { data: claimed, error: claimErr } = await admin
      .from("profiles")
      .update({
        welcome_email_sent_at: nowIso,
        welcome_email_attempts: prevAttempts + 1,
        welcome_email_last_attempt_at: nowIso,
      })
      .eq("id", userId)
      .is("welcome_email_sent_at", null)
      .lt("welcome_email_attempts", 5)
      .select("id, email, first_name, stage_name")
      .maybeSingle();

    if (claimErr) {
      console.error("Claim error:", claimErr);
      return new Response(JSON.stringify({ error: "claim_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!claimed) {
      // Either already sent, over the cap, or profile missing. Not retried.
      return new Response(JSON.stringify({ status: "skipped" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("user_type")
      .eq("user_id", userId)
      .maybeSingle();

    const isArtist = (roleRow?.user_type as string) === "artist";
    const email = claimed.email;
    if (!email) {
      console.error("Profile has no email; rolling back claim");
      await admin
        .from("profiles")
        .update({ welcome_email_sent_at: null })
        .eq("id", userId);
      return new Response(JSON.stringify({ error: "no_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject: string;
    let html: string;
    if (isArtist) {
      const name = escapeHtml(
        (claimed.stage_name || claimed.first_name || "there").toString()
      );
      subject = "Your artist profile is now live 🎵";
      html = renderEmail({
        preview: "Your Muzicalist artist profile is live.",
        headline: "Your artist profile is now live",
        greeting: `Hi ${name},`,
        bodyLines: [
          "Welcome to Muzicalist.",
          "Your artist profile has been created and is now part of the Muzicalist artist network.",
          "Complete your profile, add your best photos and videos, share your experience, and make it easier for people to discover and contact you.",
          "Your career deserves to be discovered.",
        ],
        ctaLabel: "Complete Your Profile",
        ctaUrl: `${SITE_URL}/dashboard`,
      });
    } else {
      const name = escapeHtml(
        (claimed.first_name || claimed.stage_name || "there").toString()
      );
      subject = "Welcome to Muzicalist 🎵";
      html = renderEmail({
        preview: "Your Muzicalist account is ready.",
        headline: "Welcome to Muzicalist",
        greeting: `Hi ${name},`,
        bodyLines: [
          "Welcome to Muzicalist.",
          "Your account is ready.",
          "Discover artists, explore their profiles, follow their careers, and find the right artist for your next event.",
          "Start exploring Muzicalist.",
        ],
        ctaLabel: "Discover Artists",
        ctaUrl: `${SITE_URL}/artists`,
      });
    }

    const resp = await fetch(
      "https://connector-gateway.lovable.dev/resend/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: normalizeBrand(subject),
          html,
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Resend send failed", resp.status, text);
      await admin
        .from("profiles")
        .update({ welcome_email_sent_at: null })
        .eq("id", userId);
      return new Response(
        JSON.stringify({ error: "send_failed", status: resp.status }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "sent",
        account_type: isArtist ? "artist" : "user",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-welcome-email error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
