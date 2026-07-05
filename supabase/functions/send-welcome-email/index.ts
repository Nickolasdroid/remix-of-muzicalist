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

function renderEmail(opts: {
  headline: string;
  greeting: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  preview: string;
}) {
  const { headline, greeting, bodyLines, ctaLabel, ctaUrl, preview } = opts;
  const paragraphs = bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 16px 0;color:#e5e5e5;font-size:16px;line-height:1.6;">${l}</p>`
    )
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${headline}</title>
  </head>
  <body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0b0b0b;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;text-align:center;">
                <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#f5b301;">MUZICALIST</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:24px;line-height:1.3;font-weight:700;">${headline}</h1>
                <p style="margin:0 0 16px 0;color:#ffffff;font-size:16px;line-height:1.6;">${greeting}</p>
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 32px 32px 32px;">
                <a href="${ctaUrl}" style="display:inline-block;background:#f5b301;color:#000000;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:10px;">${ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;border-top:1px solid #1f1f1f;">
                <p style="margin:20px 0 4px 0;color:#9a9a9a;font-size:14px;">The Muzicalist Team</p>
                <p style="margin:0;color:#5a5a5a;font-size:12px;">
                  <a href="${SITE_URL}" style="color:#5a5a5a;text-decoration:none;">muzicalist.com</a>
                </p>
              </td>
            </tr>
          </table>
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

    // ---- Atomic claim: send at most one email per profile ever ----
    const { data: claimed, error: claimErr } = await admin
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcome_email_sent_at", null)
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
      return new Response(JSON.stringify({ status: "already_sent" }), {
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
          subject,
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
