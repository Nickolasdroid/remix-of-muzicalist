// Branded HTML renderer for Muzicalist auth emails.
// Mirrors the visual language of the welcome email (dark background,
// gold CTA, Montserrat-safe Arial fallback) so all Muzicalist emails
// feel like they belong to the same product.

const SITE_URL = "https://muzicalist.com";
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
    '<span translate="no" class="notranslate">$1</span>'
  );
}

export function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface AuthEmailOptions {
  headline: string;
  greeting: string;
  bodyLines: string[];
  preview: string;
  // Provide either a CTA button or an OTP code (or both).
  cta?: { label: string; url: string };
  otp?: string;
  // Optional small helper text below the CTA (e.g. "This link expires in 1 hour.")
  footnote?: string;
}

export function renderAuthEmail(opts: AuthEmailOptions): string {
  const { headline, greeting, bodyLines, preview, cta, otp, footnote } = opts;
  const safeHeadline = protectBrand(headline);
  const safeGreeting = protectBrand(greeting);
  const safePreview = normalizeBrand(preview);

  const paragraphs = bodyLines
    .map(
      (l) =>
        `<p style="margin:0 0 18px 0;color:#c9c9cf;font-size:16px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${protectBrand(l)}</p>`
    )
    .join("");

  const ctaBlock = cta
    ? `<tr>
            <td align="center" style="padding:8px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#f5b301" style="border-radius:10px;">
                    <a href="${cta.url}" target="_blank" style="display:inline-block;background:#f5b301;color:#0b0b0e;text-decoration:none;font-weight:700;font-size:16px;line-height:1;padding:16px 34px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.2px;">${escapeHtml(cta.label)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:14px 40px 8px 40px;">
              <p style="margin:0;color:#6b6b73;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;word-break:break-all;">
                Or paste this link into your browser:<br />
                <a href="${cta.url}" target="_blank" style="color:#c9c9cf;text-decoration:underline;">${escapeHtml(cta.url)}</a>
              </p>
            </td>
          </tr>`
    : "";

  const otpBlock = otp
    ? `<tr>
            <td align="center" style="padding:8px 40px 8px 40px;">
              <div style="display:inline-block;background:#0b0b0e;border:1px solid #2a2a30;border-radius:12px;padding:18px 28px;">
                <div style="color:#f5b301;font-family:'Courier New',Courier,monospace;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:8px;">${escapeHtml(otp)}</div>
              </div>
            </td>
          </tr>`
    : "";

  const footnoteBlock = footnote
    ? `<tr>
            <td style="padding:8px 40px 4px 40px;">
              <p style="margin:0;color:#6b6b73;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">${protectBrand(footnote)}</p>
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
            ${ctaBlock}
            ${otpBlock}
            ${footnoteBlock}
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <div style="height:1px;line-height:1px;font-size:0;background:#1f1f24;">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 40px 36px 40px;">
                <p style="margin:0 0 6px 0;color:#c9c9cf;font-size:14px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;font-weight:600;">The <span translate="no" class="notranslate">Muzicalist</span> Team</p>
                <p style="margin:0 0 10px 0;color:#6b6b73;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                  If you didn't request this email, you can safely ignore it.
                </p>
                <p style="margin:0;color:#6b6b73;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                  <a href="${SITE_URL}" translate="no" class="notranslate" style="color:#6b6b73;text-decoration:none;">muzicalist.com</a>
                  &nbsp;·&nbsp;
                  <a href="mailto:contact@muzicalist.com" style="color:#6b6b73;text-decoration:none;">contact@muzicalist.com</a>
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
