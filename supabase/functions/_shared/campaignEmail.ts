// Shared branded email renderer for admin email campaigns.
// Uses the same visual identity as send-welcome-email / send-legacy-artists-email.

const SITE_URL = "https://muzicalist.com";
export const CAMPAIGN_FROM = "Muzicalist <contact@muzicalist.com>";
const LOGO_URL =
  "https://muzicalist.com/__l5e/assets-v1/4023aaf1-cafa-4e98-b2ad-2daef180891b/muzicalist-logo.png";

const BRAND_REGEX = /\bMusicalist\b/g;
const BRAND_REGEX_UPPER = /\bMUSICALIST\b/g;

export function normalizeBrand(s: string): string {
  return s.replace(BRAND_REGEX_UPPER, "MUZICALIST").replace(BRAND_REGEX, "Muzicalist");
}

function protectBrand(s: string): string {
  return normalizeBrand(s).replace(
    /\b(Muzicalist|MUZICALIST)\b/g,
    '<span translate="no" class="notranslate">$1</span>',
  );
}

export function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function looksLikeHtml(v: string) {
  return /<\/?[a-z][\s\S]*>/i.test(v);
}

function paragraphsFromPlainText(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks
    .map(
      (block) =>
        `<p style="margin:0 0 18px 0;color:#c9c9cf;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${protectBrand(
          escapeHtml(block).replace(/\n/g, "<br/>"),
        )}</p>`,
    )
    .join("");
}

export function renderCampaignEmail(opts: {
  campaignName: string;
  template: string;
  recipientName?: string | null;
}): { subject: string; html: string } {
  const { campaignName, template, recipientName } = opts;
  const safeHeadline = protectBrand(escapeHtml(campaignName));
  const safeGreeting = protectBrand(
    escapeHtml(recipientName?.trim() ? `Bună, ${recipientName.trim()},` : "Bună,"),
  );
  const preview = normalizeBrand(campaignName);

  const bodyHtml = looksLikeHtml(template) ? normalizeBrand(template) : paragraphsFromPlainText(template);

  const html = `<!doctype html>
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
    <div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">${preview}</div>
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
                ${bodyHtml}
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

  return { subject: normalizeBrand(campaignName), html };
}

// Resend-specific delivery has moved to
// supabase/functions/_shared/dispatcher/providers/email.ts.

