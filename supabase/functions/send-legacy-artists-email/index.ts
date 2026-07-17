// Premium relaunch/marketing email for legacy MUZICALIST artists.
// Input: { "name": "Artist Name", "email": "artist@email.com" }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://muzicalist.com";
const FROM = "Muzicalist <contact@muzicalist.com>";
const LOGO_URL =
  "https://muzicalist.com/__l5e/assets-v1/4023aaf1-cafa-4e98-b2ad-2daef180891b/muzicalist-logo.png";
const GOLD = "#f5b301";

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
function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Benefit {
  title: string;
  desc: string;
}

const BENEFITS: Benefit[] = [
  { title: "Professional Artist Profile", desc: "A polished page that represents your craft." },
  { title: "More Visibility", desc: "Get discovered by the right audience." },
  { title: "Booking Opportunities", desc: "Receive requests directly from clients." },
  { title: "Photos & Videos Showcase", desc: "Present your work in full quality." },
  { title: "Reviews & Reputation", desc: "Build trust with verified feedback." },
  { title: "Modern Dashboard", desc: "Manage everything from one place." },
];

function renderBenefitsTable(): string {
  // Two-column responsive card grid using tables for Outlook compatibility.
  const rows: string[] = [];
  for (let i = 0; i < BENEFITS.length; i += 2) {
    const left = BENEFITS[i];
    const right = BENEFITS[i + 1];
    rows.push(`
      <tr>
        <td width="50%" valign="top" style="padding:8px;">
          ${renderBenefitCard(left)}
        </td>
        <td width="50%" valign="top" style="padding:8px;">
          ${right ? renderBenefitCard(right) : "&nbsp;"}
        </td>
      </tr>
    `);
  }
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows.join("")}
    </table>
  `;
}

function renderBenefitCard(b: Benefit): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0e12;border:1px solid #1f1f24;border-radius:14px;">
      <tr>
        <td style="padding:20px 20px 18px 20px;">
          <div style="width:34px;height:2px;background:${GOLD};margin:0 0 14px 0;line-height:2px;font-size:0;">&nbsp;</div>
          <p style="margin:0 0 6px 0;color:#ffffff;font-size:14px;line-height:1.35;font-weight:700;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.1px;">${protectBrand(escapeHtml(b.title))}</p>
          <p style="margin:0;color:#8a8a92;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">${protectBrand(escapeHtml(b.desc))}</p>
        </td>
      </tr>
    </table>
  `;
}

function renderEmail(artistName: string): { subject: string; html: string } {
  const safeName = protectBrand(escapeHtml(artistName));
  const subject = normalizeBrand("MUZICALIST is Back — A new era for artists.");
  const preview = normalizeBrand("A completely redesigned platform for artists.");

  const html = `<!doctype html>
<html lang="en" translate="no">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="dark only" />
    <meta name="supported-color-schemes" content="dark only" />
    <meta name="google" content="notranslate" />
    <title>${protectBrand(escapeHtml("MUZICALIST is Back"))}</title>
  </head>
  <body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">
      <tr>
        <td align="center" style="padding:40px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#000000;">

            <!-- Header -->
            <tr>
              <td align="center" style="padding:24px 24px 40px 24px;">
                <img src="${LOGO_URL}" alt="Muzicalist" width="80" height="80" style="display:block;width:80px;height:80px;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>

            <!-- Hero -->
            <tr>
              <td align="center" style="padding:8px 32px 8px 32px;">
                <p style="margin:0 0 14px 0;color:${GOLD};font-size:11px;line-height:1;font-weight:700;font-family:Arial,Helvetica,sans-serif;letter-spacing:3px;text-transform:uppercase;">A New Era</p>
                <h1 style="margin:0 0 18px 0;color:#ffffff;font-size:40px;line-height:1.1;font-weight:800;font-family:Arial,Helvetica,sans-serif;letter-spacing:-0.6px;">
                  <span translate="no" class="notranslate">MUZICALIST</span> is Back.
                </h1>
                <p style="margin:0 auto;max-width:480px;color:#a8a8b0;font-size:16px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                  A completely redesigned platform built to help artists showcase their careers, increase their visibility and connect with more opportunities.
                </p>
              </td>
            </tr>

            <!-- Gold divider -->
            <tr>
              <td align="center" style="padding:36px 32px 36px 32px;">
                <div style="width:56px;height:2px;background:${GOLD};line-height:2px;font-size:0;">&nbsp;</div>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <p style="margin:0 0 14px 0;color:#ffffff;font-size:17px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Hello ${safeName},</p>
                <p style="margin:0 0 14px 0;color:#c9c9cf;font-size:16px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
                  We have completely rebuilt <span translate="no" class="notranslate">MUZICALIST</span> from the ground up.
                </p>
                <p style="margin:0 0 8px 0;color:#c9c9cf;font-size:16px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
                  Discover a faster, more modern platform designed for today's music industry.
                </p>
              </td>
            </tr>

            <!-- Benefits -->
            <tr>
              <td style="padding:40px 24px 8px 24px;">
                <p style="margin:0 0 22px 8px;color:${GOLD};font-size:11px;line-height:1;font-weight:700;font-family:Arial,Helvetica,sans-serif;letter-spacing:3px;text-transform:uppercase;">Benefits for Artists</p>
                ${renderBenefitsTable()}
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:44px 32px 12px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="${GOLD}" style="border-radius:999px;">
                      <a href="${SITE_URL}" target="_blank" style="display:inline-block;background:${GOLD};color:#0b0b0e;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:18px 40px;border-radius:999px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.3px;">Explore the New <span translate="no" class="notranslate" style="color:#0b0b0e;">MUZICALIST</span></a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Secondary text -->
            <tr>
              <td align="center" style="padding:28px 40px 8px 40px;">
                <p style="margin:0 0 8px 0;color:#8a8a92;font-size:13px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">
                  Your previous account can be reactivated using your registered email address.
                </p>
                <p style="margin:0;color:#8a8a92;font-size:13px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">
                  If you no longer remember your password, simply use the password reset option.
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:44px 32px 0 32px;">
                <div style="height:1px;line-height:1px;font-size:0;background:#1f1f24;">&nbsp;</div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:28px 32px 8px 32px;">
                <p style="margin:0 0 10px 0;color:#c9c9cf;font-size:14px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                  Thank you for being part of the <span translate="no" class="notranslate">MUZICALIST</span> community.
                </p>
                <p style="margin:0 0 14px 0;color:#ffffff;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:0.3px;">
                  The <span translate="no" class="notranslate">MUZICALIST</span> Team
                </p>
                <p style="margin:0;color:#6b6b73;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                  <a href="${SITE_URL}" translate="no" class="notranslate" style="color:${GOLD};text-decoration:none;">muzicalist.com</a>
                </p>
              </td>
            </tr>

          </table>
          <div style="height:32px;line-height:32px;font-size:0;">&nbsp;</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
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

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error("Missing email gateway credentials");
      return new Response(JSON.stringify({ error: "email_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
    };
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "invalid_input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = renderEmail(name);

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
          reply_to: "contact@muzicalist.com",
          html,
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Resend send failed", resp.status, text);
      return new Response(
        JSON.stringify({ error: "send_failed", status: resp.status, details: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-legacy-artists-email error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
