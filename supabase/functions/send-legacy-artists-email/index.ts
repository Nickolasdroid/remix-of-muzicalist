// Sends a one-time reactivation email to artists imported from the previous
// MUZICALIST platform. Reuses the exact same branded email design as
// `send-welcome-email` (logo, colors, typography, button, layout, brand
// protection helpers, renderEmail structure).
//
// Input:
//   { "name": "Artist Name", "email": "artist@email.com" }

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

// Deterministic brand-name safeguard for email content (identical to send-welcome-email).
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

function renderEmail(opts: {
  headline: string;
  greeting: string;
  bodyLines: string[];
  ctaLabel: string;
  ctaUrl: string;
  preview: string;
  postCtaHeading?: string;
  postCtaBullets?: string[];
  closingLines?: string[];
}) {
  const {
    headline,
    greeting,
    bodyLines,
    ctaLabel,
    ctaUrl,
    preview,
    postCtaHeading,
    postCtaBullets,
    closingLines,
  } = opts;
  const safeHeadline = protectBrand(headline);
  const safeGreeting = protectBrand(greeting);
  const safePreview = normalizeBrand(preview);
  const paragraphs = bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 18px 0;color:#c9c9cf;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${protectBrand(l)}</p>`
    )
    .join("");

  const postCtaBlock = (postCtaHeading || (postCtaBullets && postCtaBullets.length) || (closingLines && closingLines.length))
    ? `<tr>
              <td style="padding:8px 40px 8px 40px;">
                ${postCtaHeading ? `<p style="margin:0 0 14px 0;color:#ffffff;font-size:16px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;font-weight:600;">${protectBrand(postCtaHeading)}</p>` : ""}
                ${(postCtaBullets && postCtaBullets.length)
                  ? `<ul style="margin:0 0 18px 0;padding:0 0 0 20px;color:#c9c9cf;font-size:16px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">${postCtaBullets
                      .map((b) => `<li style="margin:0 0 6px 0;">${protectBrand(b)}</li>`)
                      .join("")}</ul>`
                  : ""}
                ${(closingLines || [])
                  .map(
                    (l) =>
                      `<p style="margin:0 0 18px 0;color:#c9c9cf;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${protectBrand(l)}</p>`
                  )
                  .join("")}
              </td>
            </tr>`
    : "";

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
              <td align="center" style="padding:16px 40px 24px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#f5b301" style="border-radius:10px;">
                      <a href="${ctaUrl}" target="_blank" style="display:inline-block;background:#f5b301;color:#0b0b0e;text-decoration:none;font-weight:700;font-size:16px;line-height:1;padding:16px 34px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.2px;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${postCtaBlock}
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

    const safeName = escapeHtml(name);

    const subject =
      "Noua versiune MUZICALIST este acum online. Creează-ți profilul de artist.";

    const html = renderEmail({
      preview: "Noua versiune MUZICALIST este acum online.",
      headline: "Noua versiune MUZICALIST este acum online",
      greeting: `Bună, ${safeName},`,
      bodyLines: [
        "Îți mulțumim că ai făcut parte din prima versiune MUZICALIST.",
        "În ultimele luni, MUZICALIST a trecut printr-o reconstrucție completă pentru a susține noile funcționalități, o experiență mai rapidă și dezvoltarea viitoare a platformei.",
        "Din acest motiv, profilurile din versiunea anterioară nu au putut fi transferate automat, fiind necesară crearea unui nou profil de artist.",
        "Înregistrarea durează doar câteva minute.",
      ],
      ctaLabel: "CREEAZĂ-ȚI PROFILUL DE ARTIST",
      ctaUrl: `${SITE_URL}/register/artist`,
      postCtaHeading: "Noua versiune MUZICALIST îți oferă:",
      postCtaBullets: [
        "Profil de artist modern și complet.",
        "Galerie foto și video.",
        "Publicarea de postări și anunțuri.",
        "Calendar pentru primirea cererilor de rezervare.",
        "Vizibilitate în funcție de locație și gen muzical.",
        "Căutare inteligentă cu AI pentru descoperirea artiștilor.",
        "Funcționalități noi care vor continua să fie dezvoltate.",
      ],
      closingLines: [
        "Ne-am bucura să faci parte din nou din comunitatea MUZICALIST.",
        "Dacă ai întrebări sau întâmpini orice problemă, ne poți răspunde direct la acest email.",
      ],
    });

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
